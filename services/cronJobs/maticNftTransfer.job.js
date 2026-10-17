const cron = require('node-cron');
const lock = require('./lock');
const { getAdminWalletTransaction } = require('../adminWallet/index');
const {
  updateValidTransfer,
  updateFailure,
  addMaticNftTransfer,
  getTransactionByHash,
} = require('../database/maticNftTransfer.service.js');
const { getPaintingById } = require('../database/painting');
const NftQueue = require('../queue/nft-transfer-queue');
const { getUserByWalletAddress } = require('../database/user');
const { web3Instance } = require('../../utils/helpers');
const log = (message, ...params) => {
  console.log(`[Matic NFT Process] ${message}`, ...params);
};

const page = 1;
const offset = 1000;
const web3 = web3Instance();

const initMaticNftTransfer = async () => {
  cron.schedule('*/10 * * * * * *', async () => {
    try {
      const locked = await lock(__filename, async () => {
        const adminTransactions = await getAdminWalletTransaction(page, offset);
        log('adminTransactions length', { length: adminTransactions.length });
        adminTransactions.map(async (tx) => {
          const transaction = await getTransactionByHash(tx.hash);
          const amount = web3.utils.fromWei(tx.value);
          if (!transaction) {
            try {
              const inputData = web3.utils.hexToAscii(tx.input);
              let user = {};

              const [userId, paintingId] = inputData.split('|');
              if (userId === 'lootCrate') return false;
              if (!paintingId || paintingId.length !== 24) return false;
              if (!userId || userId === 'undefined') {
                user = await getUserByWalletAddress(tx.from);
                if (!user) return false;
              }

              const painting = await getPaintingById(paintingId);
              const isCorrectAmount = painting.cryptoPrice === amount;

              const nftData = {
                txnHash: tx.hash.toLowerCase(),
                cryptoPrice: amount,
                userId: user._id || userId,
                paintingId,
                status: isCorrectAmount ? 'pending' : 'failed',
                message: isCorrectAmount
                  ? 'Will be transfer'
                  : `Artefy price not matched ${amount}`,
                userWalletAddress: tx.from.toLowerCase(),
                artefyWalletAddress: tx.to.toLowerCase(),
              };
              return addMaticNftTransfer(nftData);
            } catch (e) {
              console.log(e);
              return false;
            }
          }

          // If transaction is already processed
          if (transaction.status !== 'pending') return false;

          if (transaction.userWalletAddress !== tx.from.toLowerCase()) {
            log(`User address not matched ${tx.from}`);
            return updateFailure(
              transaction._id,
              `User address not matched ${tx.from}`,
            );
          }

          if (transaction.artefyWalletAddress !== tx.to.toLowerCase()) {
            log(`Artefy address not matched ${tx.to}`);
            return updateFailure(
              transaction._id,
              `Artefy address not matched ${tx.to}`,
            );
          }

          if (transaction.cryptoPrice !== amount) {
            log(`Artefy price not matched ${amount}`);
            return updateFailure(
              transaction._id,
              `Artefy price not matched ${amount}`,
            );
          }

          // Adding order into NFT send Queue
          log('putting transaction into the queue ===', transaction.txnHash);
          await NftQueue.add(
            {
              userId: transaction.userId,
              orderId: transaction.txnHash,
              origin: 'MATIC',
              paymentAmount: transaction.cryptoPrice,
              paymentEvent: transaction,
              paymentId: transaction.txnHash,
              paintingId: transaction.paintingId,
            },
            transaction.txnHash,
          );

          return updateValidTransfer(
            transaction._id,
            `Artefy address not matched ${amount}`,
          );
        });

        return true;
      });
      if (locked === 'locked') {
        console.warn('Lockfile still locked, delaying...');
      }
      return true;
    } catch (err) {
      console.error(err);
      return err;
    }
  });
};

module.exports = { initMaticNftTransfer };
