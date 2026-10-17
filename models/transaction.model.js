const { model, Schema } = require('mongoose');

const transactionSchema = new Schema(
  {
    transactionHash: {
      type: String,
      required: true,
      unique: true,
    },
    nftId: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
  },
  {timestamps: true},
);

const Transaction = model('Transaction', transactionSchema);
module.exports = Transaction;
