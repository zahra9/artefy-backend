// const Moment = require('moment');
const Queue = require('./queue');
const lootCrateQueue = Queue.getQuById('loot_crate_transfer');
const database = require('../database');
const { sendNFT } = require('../stripe/nftTransfer');
// const sendgrid = require('../sendgrid');
const logger = require('../../utils/logger');
const { updateFailure } = require('../database/lootCrateTransfer');
const LootCrateQueue = {
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
      tokenId,
      origin,
      userId,
      orderId,
      lootCrateId,
      paymentEvent,
      paymentAmount,
    } = job.data.data;

    const orderExist = await database.mint.getMintByTokenAndOrderId(
      tokenId,
      orderId,
    );

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
        await updateFailure(paymentEvent._id, 'lootCrate send error');
        return false;
      }

      paymentEvent.id = orderId;
    }
    logger.info(`PaymentEvent ====`, paymentEvent);
    const nftSent = await sendNFT(userId, tokenId, paymentAmount, origin, paymentEvent, lootCrateId);

    if (!nftSent) {
      logger.error(
        `LootCrate ${lootCrateId} token ${tokenId} send error in the queue`,
      );
      throw new Error('Error in transaction');
    }

    return nftSent;
  },

  async add(data, jobId) {
    return lootCrateQueue.add('loot-crate-transfer', { data }, { jobId });
  },
};

lootCrateQueue.process(
  'loot-crate-transfer',
  1,
  LootCrateQueue.run.bind(LootCrateQueue),
);

module.exports = LootCrateQueue;
