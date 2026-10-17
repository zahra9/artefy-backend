const { model, Schema } = require('mongoose');

const saleSchema = new Schema({
  active: { type: Boolean },
  price: {
    type: Number,
    required: false,
    default: 0,
  },
  cryptoPrice: {
    type: Number,
    required: false,
    default: 0,
  },
  orderID: {
    type: String,
    default: '',
  },
  captureID: {
    type: String,
    default: '',
  },
  txnHash: {
    type: String,
    default: '',
  },
  sold: {
    type: Boolean,
    default: false,
  },
  processing: {
    type: Boolean,
    default: false,
  },
  lootCrateId: {
    type: Schema.Types.ObjectId,
    ref: 'LootCrate',
  },
});
const auctionBidObj = new Schema({
  type: { type: String },
  price: {
    type: Number,
    default: 0,
  },
  date: { type: Date },

  bidderId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const auctionSchema = new Schema({
  tokenId: {
    type: Number,
    required: true,
  },
  startingBidPrice: {
    type: Number,
    required: true,
  },
  startingBidPriceUSD: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
  endTime: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
    default: new Date(),
  },
});

const marketplaceSchema = new Schema({
  active: {
    type: Boolean,
    required: false,
    default: false,
  },
  price: {
    type: Number,
    required: false,
    default: 0,
  },
  cryptoPrice: {
    type: Number,
    required: false,
    default: 0,
  },
  itemId: {
    type: Number,
    required: false,
    default: 0,
  },
  lastSaleDate: {
    type: Date,
    required: false,
  },
});

const mintSchema = new Schema(
  {
    paintingID: {
      type: Schema.Types.ObjectId,
      ref: 'Painting',
    },
    theme:{
      type: Schema.Types.ObjectId,
      ref: 'Collection',
    },
    pastBuyers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    currentBuyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: false,
      default: 0,
    },
    cryptoPrice: {
      type: Number,
      required: false,
      default: 0,
    },
    tokenId: {
      type: String,
      required: true,
    },
    artPieceNumber: {
      type: String,
      required: true,
    },
    num: {
      type: Number,
      required: true,
    },
	  paintingFrom:{type: String},
    sale: saleSchema,
	  crateID:{
		  type: Schema.Types.ObjectId,
		  ref: 'LootCrate',
	  },
    marketplace: marketplaceSchema,
    auctionBidHistory: [auctionBidObj],
    currentAuctionBid: auctionBidObj,
    auction: auctionSchema,
  },
  { timestamps: true },
);
const Mint = model('Mint', mintSchema);
module.exports = Mint;
