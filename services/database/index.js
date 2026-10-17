const mongoose = require('mongoose');

const drop = require('./drop');
const admin = require('./admin');
const artist = require('./artist');
const user = require('./user');
const world = require('./world');
const painting = require('./painting');
const transaction = require('./transaction');
const failedTransfer = require('./failedTransfer');
const mint = require('./mint');
const maticNftTransfer = require('./maticNftTransfer.service');
const lootCrateTransfer = require('./lootCrateTransfer');
const lootCrate = require('./lootCrate');
const lootCrateContainer = require('./lootCrateContainer');
const coupon = require('./coupon');

let $connection = false;

const connect = () => {
  // If connection is already established
  if ($connection) {
    return $connection;
  }

  const mongoUri = process.env.PERSISTENT_DB;
  $connection = mongoose
    .connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log('MongoDB connection established successfully!');
    })
    .catch((error) => {
      console.log('MongoDB connection failed with error: ', error);
    });

  return $connection;
};

module.exports = {
  connect,
  admin,
  artist,
  user,
  world,
  drop,
  transaction,
  failedTransfer,
  painting,
  maticNftTransfer,
  lootCrateContainer,
  lootCrate,
  mint,
  lootCrateTransfer,
  coupon,
};
