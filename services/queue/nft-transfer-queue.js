const Moment = require('moment');
const Queue = require('./queue');
const nftQueue = Queue.getQuById('nft_transfer');
const database = require('../database');
const { sendNFT } = require('../stripe/nftTransfer');
const sendgrid = require('../sendgrid');
const logger = require('../../utils/logger');
const {updateFailure} = require('../database/maticNftTransfer.service.js');

const {
  getRandomPaintingMintsById,
  refundPayments,
} = require('../../utils/helpers');

const sendNFTTransferEmail = async (
  userId,
  paintingId,
  totalPayment,
  success,
) => {
  const { email } = await database.user.getUserById(userId);
  const painting = await database.painting.getPaintingById(paintingId);
  const artist = await database.artist.getArtistById(painting?.artist);
  const collection = await database.painting.getCollectionByPaintingId(
    painting?._id,
  );
  const dateTime = new Moment(new Date()).format('MMM DD, YYYY hh:mm A');
  const assetName = painting?.name;
  const artistName = artist?.name;
  const price = `${painting?.price} | MATIC ${painting?.cryptoPrice}`;
  const data = {
    email,
    assetName,
    artistName,
    price,
    collection: collection?.name || '',
    dateTime,
  };

  // For failed NFTs we keep sending failed emails
  // Need to fix it properly
  if (await success) {
    await sendgrid.paymentConfirmation(data);
  } else {
    // sendgrid.NFTTransferFailed(data);
  }
};

const NftQueue = {
  async run(job) {
    // You can get here
    // job.id;
    // job.data;
    // job.origin; // ['Stripe', 'Paypal', 'Manual']

    // ---------- Job Processor Flow ---------- //
    // Check if order already processed, return Success
    // If not, then pick a random MintId against paintingId
    // Run sendNFT && sendPaymentSuccessEmail
    // Update mint db with orderId, txnHash, sold: true, active: false
    // If no NFT available, then issue refund and sendNFTUnSuccessEmail
    // If any error occurs in sendNFT, then throw error, bull will handle retry
    const {
      origin,
      userId,
      orderId,
      paymentId,
      paintingId,
      paymentEvent,
      paymentAmount,
    } = job.data.data;

    logger.info(`orderId ====== ${orderId}`);
    const orderExist = await database.painting.checkOrderExist(orderId);

    if (orderExist) {
      if (origin === 'MATIC')
        await updateFailure(
          paymentEvent._id,
          `order already process ${orderExist._id}`,
        );

      return true;
    }

    if (origin === 'MATIC') {
      if (job.attemptsMade === 99) {
        await updateFailure(paymentEvent._id, 'nft send error');
        return false;
      }

      paymentEvent.id = orderId;
    }
    logger.info(`PaymentEvent ====`, paymentEvent);

    const mint = await getRandomPaintingMintsById(paintingId);
    logger.info(`Picked Mint ======`, mint);

    if (!mint) {
      await refundPayments(paymentId, paymentAmount, origin);
      // sending unSuccess email to user
      return sendNFTTransferEmail(userId, paintingId, paymentAmount, false);
    }

    const nftSent = await sendNFT(userId, mint.tokenId, paymentAmount, origin, paymentEvent);
    if (nftSent) {
      // sending success email to user
      return sendNFTTransferEmail(userId, paintingId, paymentAmount, true);
    }

    logger.error(`NFT ${mint.tokenId} send error in the queue`);
    throw new Error('Error in transaction');
  },

  async add(data, jobId) {
    return nftQueue.add('nft-transfer', { data }, { jobId });
  },
};

nftQueue.process('nft-transfer', 1, NftQueue.run.bind(NftQueue));

module.exports = NftQueue;
