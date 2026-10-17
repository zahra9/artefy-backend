const ManualNftTransfer = require('../../models/manualNftTransfer.model');

const getLatestManualNftTransfers = async (noOfRecords = 10) => {
  return ManualNftTransfer.find({ status: 'pending' })
    .sort({createdAt: -1})
    .limit(noOfRecords)
    .exec();
};

const updateStatus = async (_id, update) => {
  return ManualNftTransfer.updateOne({ _id }, update);
};

const updateSuccess = async (_id, tokenId = '', message = '') => {
  return updateStatus(_id, { status: 'success', tokenId, message });
};

const updateFailure = async (_id, message = '') => {
  return updateStatus(_id, { status: 'failed', message });
};

module.exports = {
  getLatestManualNftTransfers,
  updateStatus,
  updateSuccess,
  updateFailure,
};
