const LootCrateTransfer = require('../../models/lootCrateTransfer.model');

const getByCrateId = async (id) => {
  const lootCrateTransferByCrateId = await LootCrateTransfer.find({lootCrateId: id});
  return lootCrateTransferByCrateId;
};

const getByStatus = async (status) => {
  const lootCrateTransferByStatus = await LootCrateTransfer.find({status: status});
  return lootCrateTransferByStatus;
};

const addMaticLootCrateTransfer = async (data) => {
  const nft = new LootCrateTransfer(data);
  await nft.save();
  return nft;
};

const getTransactionByHash = async (txnHash) => {
  return LootCrateTransfer.findOne({ txnHash }).exec();
};

const getTransactionByPaymentId = async (paymentId) => {
  return LootCrateTransfer.findOne({ paymentId }).exec();
};

const updateStatus = async (_id, update) => {
  return LootCrateTransfer.updateOne({ _id }, update);
};

const updatedRefundStatus = async (_id, refundStatus) => {
  return LootCrateTransfer.updateOne({ _id }, { refundStatus });
};

const updateValidTransfer = async (_id, orderId) => {
  return LootCrateTransfer.updateOne(
    { _id, status: 'pending' },
    { status: 'valid', orderId },
  );
};

const updateSuccess = async (_id, lootCrateId = '') => {
  return updateStatus(_id, { status: 'success', lootCrateId });
};

const updateFailure = async (_id, message = '') => {
  return updateStatus(_id, { status: 'failed', message });
};

const getPendingTransactionOfStripeAndPaypal = async () => {
  return LootCrateTransfer.find({
    $or: [{ orderType: 'stripe' }, { orderType: 'paypal' }],
    status: 'pending',
  });
};

module.exports = {
  getByCrateId,
  getByStatus,
  addMaticLootCrateTransfer,
  getTransactionByHash,
  updateStatus,
  updateValidTransfer,
  updateSuccess,
  updateFailure,
  getTransactionByPaymentId,
  updatedRefundStatus,
  getPendingTransactionOfStripeAndPaypal,
};
