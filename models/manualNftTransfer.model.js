const { model, Schema } = require('mongoose');

const manualNftTransfer = new Schema(
  {
    txnHash: {
      type: String,
      required: true,
      unique: true,
    },
    tokenId: {
      type: String,
      default: '',
    },
    cryptoPrice: {
      type: String,
      required: true,
    },
    userWalletAddress: {
      type: String,
      required: true,
    },
    artefyWalletAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sucess', 'failed'],
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

const giveAway = model('manualNftTransfer', manualNftTransfer);
module.exports = giveAway;
