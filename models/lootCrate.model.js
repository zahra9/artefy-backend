const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lootCrateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    numberOfNfts: {
      type: Number,
      required: true,
    },
    cryptoPrice: {
      type: String,
      required: true,
    },
    lootCrateContainerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'LootCrateCollection',
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    maticDifference: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const LootCrate = mongoose.model('LootCrate', lootCrateSchema);
module.exports = LootCrate;
