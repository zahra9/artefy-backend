const { model, Schema } = require('mongoose');

const maticNftTransfer = new Schema(
  {
    txnHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    paintingId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    tokenId: {
      type: String,
      default: '',
      // unique: true,
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
      enum: ['pending', 'valid', 'success', 'failed'],
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
  },
  {timestamps: true},
);

const giveAway = model('maticNftTransfer', maticNftTransfer);
module.exports = giveAway;
