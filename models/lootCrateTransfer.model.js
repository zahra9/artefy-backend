const { model, Schema } = require('mongoose');

const tokensSchema = new Schema({
  tokenId: { type: String },
  mintId: {
    type: Schema.Types.ObjectId,
    ref: 'Mint',
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
});

const lootCrateTransferSchema = new Schema(
  {
    orderId: {type: String},
    paymentId: {type:String},
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    lootCrateId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'LootCrate',
    },
    tokens: [tokensSchema],
    cryptoPrice: { type: String },
    price: {type: String},
    userWalletAddress: {
      type: String,
      required: true,
    },
    orderType: {
      type: String,
      enum: ['matic', 'paypal', 'stripe'],
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
  { timestamps: true },
);

const LootCrateTransfer = model('LootCrateTransfer', lootCrateTransferSchema);
module.exports = LootCrateTransfer;
