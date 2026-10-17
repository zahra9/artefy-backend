const MaticNftTransfer = require('../../models/maticNftTransfer.model');

const getTransactionByHash = async (txnHash) => {
  return MaticNftTransfer.findOne({ txnHash }).exec();
};

const getTransactionByTokenId = async (tokenId) => {
  return MaticNftTransfer.findOne({ tokenId, status: 'pending' }).exec();
};

const addMaticNftTransfer = async (data) => {
  const nft = new MaticNftTransfer(data);
  await nft.save();
  return nft;
};

const updateStatus = async (_id, update) => {
  return MaticNftTransfer.updateOne({ _id }, update);
};

const updateValidTransfer = async (_id) => {
  return MaticNftTransfer.updateOne(
    { _id, status: 'pending' },
    { status: 'valid' },
  );
};

const updateSuccess = async (_id, tokenId = '') => {
  return updateStatus(_id, { status: 'success', tokenId });
};

const updateFailure = async (_id, message = '') => {
  return updateStatus(_id, { status: 'failed', message });
};

module.exports = {
  updateValidTransfer,
  updateStatus,
  updateSuccess,
  updateFailure,
  addMaticNftTransfer,
  getTransactionByHash,
  getTransactionByTokenId,
};
