const Mint = require('../../models/mint.model');
const User = require('../../models/user.model');
const Transaction = require('../../models/transaction.model');

/**
 * Save Transaction
 *
 * @param {ObjectId} mintId
 * @param {String} orderId
 */
const saveTransaction = async (mintId, orderId) => {
  try {
    return Mint.updateOne(
      {_id: mintId},
      {'sale.orderID': orderId},
    );
  } catch (err) {
    console.error(err);
    return err;
  }
};

/**
 * Save CaptureId
 *
 * @param {ObjectId} mintId
 * @param {String} captureId
 */
const saveCaptureId = async (mintId, captureId) => {
  try {
    return Mint.updateOne(
      {_id: mintId},
      {'sale.captureID': captureId},
    );
  } catch (err) {
    console.error(err);
    return err;
  }
};

/**
 * Fetch Mint
 *
 * @param {ObjectId} MintId
 */
const fetchMint = async (mintId) => {
  try {
    return Mint.findOne({ _id: mintId });
  } catch (err) {
    console.error(err);
    return err;
  }
};

/**
 * Update user
 *
 * @param {ObjectId} mintId
 * @param {ObjectId} userId
 * @param {String} currentBuyer
 */
const buyMint = async (mintId, userId, currentBuyer) => {
  try {
    if (currentBuyer) {
      await Mint.updateOne(
        {_id: mintId},
        {
          currentBuyer: userId,
          'sale.sold': true,
          'sale.active': false,
          $addToSet: {pastBuyers: currentBuyer},
        },
      );
      await User.updateOne(
        {_id: currentBuyer},
        {$pull: {mints: mintId}},
      );
    } else {
      await Mint.updateOne(
        {_id: mintId},
        {
          currentBuyer: userId,
          'sale.sold': true,
          'sale.active': false,
        },
      );
    }

    return User.updateOne(
      {_id: userId},
      {$addToSet: {mints: mintId}},
    );
  } catch (err) {
    console.error(err);
    return err;
  }
};

const getUserTransactions = async (transactionHistory) => {
  return Transaction.find({ _id: transactionHistory });
};

const addTransaction = async (userId, transaction) => {
  const trans = await Transaction.create(transaction);
  await User.updateOne(
    { _id: userId },
    { $addToSet: { transactionHistory: trans._id } },
  );
  return trans;
};

const getMintByTokenId = async (tokenId) => {
  return Mint.findOne({ tokenId });
};

module.exports = {
  saveTransaction,
  saveCaptureId,
  fetchMint,
  buyMint,
  getUserTransactions,
  addTransaction,
  getMintByTokenId,
};
