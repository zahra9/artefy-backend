const { model, Schema } = require('mongoose');

const failedTransferSchema = new Schema(
  {
    to: {
      type: String,
      required: true,
    },
    nftId: {
      type: String,
      required: true,
    },
    mintId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Mint',
    },
  },
  {timestamps: true},
);

const FailedTransfer = model('FailedTransfer', failedTransferSchema);
module.exports = FailedTransfer;
