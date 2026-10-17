const FailedTransfer = require('../../models/failedTransfer.model');

const add = async (failedQueueObj) => {
  const newFailedObj = new FailedTransfer(failedQueueObj);
  return newFailedObj.save();
};

module.exports = {add};
