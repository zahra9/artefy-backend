const cron = require('node-cron');
const lock = require('./lock');
const { getAdminWalletTransaction } = require('../adminWallet/index');
const {
  updateValidTransfer,
  updateFailure,
  // getTransactionByHash,
  addMaticLootCrateTransfer,
  getTransactionByPaymentId,
} = require('../database/lootCrateTransfer');
const {
  getLootCrateById,
  getLootCrateByPrice,
} = require('../database/lootCrate');
const LootCrateTransferQueue = require('../queue/loot-crate-transfer-queue');
const { getUserByWalletAddress } = require('../database/user');
const { getCouponById, updateCouponStatus } = require('../database/coupon');
const {updateAvailableCrateByContainerId} = require('../database/lootCrateContainer');
const {
  web3Instance,
  sendLootCratePaymentSuccessEmail,
  getAvailableMintsByPaintingIds,
} = require('../../utils/helpers');
const log = (message, ...params) => {
  console.log(`[Matic Loot NFT Process] ${message}`, ...params);
};

const page = 1;
const offset = 200;
const web3 = web3Instance();

//  @ali.iqbal Please add comment here :)

const initMaticLootCrateTransfer = async () => {
  cron.schedule('*/30 * * * * * *', async () => {
    try {
      const locked = await lock(__filename, async () => {
        const adminTransactions = await getAdminWalletTransaction(page, offset);
        log('adminTransactions length', { length: adminTransactions.length });
        adminTransactions.map(async (tx) => {
          const transaction = await getTransactionByPaymentId(tx.hash);
          const amount = web3.utils.fromWei(tx.value);
          if (!transaction) {
            try {
              const inputData = web3.utils.hexToAscii(tx.input);
              let user = {};

              // eslint-disable-next-line prefer-const
              let [type, userId, lootCrateId, couponId] = inputData.split('|');

              if (type !== 'lootCrate') {
                const txUser = await getUserByWalletAddress(tx.from);
                const lootCrateByPrice = await getLootCrateByPrice(amount);
                if (!txUser || !lootCrateByPrice) return false;
                type = 'lootCrate';
                userId = txUser._id;
                lootCrateId = lootCrateByPrice._id.toString();
              }

              if (!lootCrateId || lootCrateId.length !== 24) return false;
              if (!userId || userId === 'undefined') {
                user = await getUserByWalletAddress(tx.from);
                if (!user) return false;
              }
              const couponData = await getCouponById(couponId);

              const lootCrate = await getLootCrateById(lootCrateId);
              const cryptoPrice = couponData
                ? couponData.cryptoPrice
                : lootCrate.cryptoPrice;
              const isCorrectAmount = cryptoPrice === amount;
              const { numberOfNfts, lootCrateContainerId } = lootCrate;
              const { paintings } = lootCrateContainerId;
              const tokens = await getAvailableMintsByPaintingIds(
                paintings,
                numberOfNfts,
              );

              if (!tokens) {
                const lootCrateData = {
                  paymentId: tx.hash.toLowerCase(),
                  userId: user._id || userId,
                  lootCrateId: lootCrateId,
                  cryptoPrice: cryptoPrice,
                  status: 'failed',
                  orderType: 'matic',
                  message: `Mints are not available for lootCrate ${lootCrateId} userAddress ${tx.from}`,
                  userWalletAddress: tx.from.toLowerCase(),
                  artefyWalletAddress: tx.to.toLowerCase(),
                };
                return addMaticLootCrateTransfer(lootCrateData);
              }
              const updatedAvailableCrates =
                await updateAvailableCrateByContainerId(
                  lootCrateContainerId,
                  -1,
                );
              console.log(
                'Decrement MaticLootCrateTransfer ===========> ',
                updatedAvailableCrates,
              );
              const lootCrateData = {
                paymentId: tx.hash.toLowerCase(),
                userId: user._id || userId,
                lootCrateId: lootCrateId,
                tokens,
                orderType: 'matic',
                cryptoPrice: couponData
                  ? couponData.cryptoPrice
                  : lootCrate.cryptoPrice,
                status: isCorrectAmount ? 'pending' : 'failed',
                message: isCorrectAmount
                  ? 'Your NFTs will be transferred Soon'
                  : `Artefy price not matched ${amount}`,
                userWalletAddress: tx.from.toLowerCase(),
                artefyWalletAddress: tx.to.toLowerCase(),
                couponId,
              };
              await updateCouponStatus(couponId, { status: 'used' });
              return addMaticLootCrateTransfer(lootCrateData);
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
          log('Adding transaction into the queue ===', transaction);
          const lootCrate = await getLootCrateById(transaction.lootCrateId);

          transaction.tokens.forEach(async (token) => {
            await LootCrateTransferQueue.add(
              {
                lootCrateId: lootCrate._id,
                userId: transaction.userId,
                orderId: transaction.paymentId,
                origin: 'MATIC',
                paymentAmount: transaction.cryptoPrice,
                paymentEvent: transaction,
                paymentId: transaction.paymentId,
                tokenId: token.tokenId,
              },
              `${transaction.paymentId}-${token.tokenId}`,
            );
          });
          await sendLootCratePaymentSuccessEmail(
            transaction.userId,
            lootCrate._id,
            `${transaction.cryptoPrice} MATIC`,
          );
          return updateValidTransfer(transaction._id, transaction.paymentId);
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

module.exports = { initMaticLootCrateTransfer };
