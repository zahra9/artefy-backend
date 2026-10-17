const Web3 = require('web3');
const paypal = require('@paypal/checkout-server-sdk');
const stripe = require('stripe')(process.env.STRIPE_SK);
const Moment = require('moment');
const Painting = require('../models/painting.model');
const {
  getAvailableMintsByArrayIds,
  updateMintActiveStatus,
} = require('../services/database/painting');
const payPalClient = require('../services/paypal');
const walletService = require('../services/wallet/wallet');
const OATinterface = require('../services/contracts/interfaceOATImplementation');
const ENV_ENUM = {
  TEST: 'testing',
  PROD: 'production',
  LOCAL: 'local',
  DEV: 'development',
};
const database = require('../services/database');
const adminWallet = require('../services/adminWallet');
const sendgrid = require('../services/sendgrid');
const Provider = require('@truffle/hdwallet-provider');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const {
  infuraURLs,
  MarketplaceProxyAddress,
  AdminWalletAddress,
} = require('../configs/config');

const isEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const arraySplitter = (arr, size, out) => {
  out = out || [];
  if (!arr.length) return out;
  out.push(arr.slice(0, size));
  return arraySplitter(arr.slice(size), size, out);
};

const getWallet = (privateKey) => {
  return walletService.importWallet(privateKey);
};

const isTokenAvailableForTransfer = async (tokenId) => {
  const wallet = await getWallet(process.env.ADMIN_WALLET_PRIVATE_KEY);
  const ERC721contract = OATinterface.getContract();
  const tokenOwner = await ERC721contract.methods
    .ownerOf(tokenId)
    .call({ from: wallet.address });
  if (wallet.address.toUpperCase() === tokenOwner.toUpperCase()) return true;

  return false;
};

const getRandomPaintingMintsById = async (id) => {
  const painting = await Painting.findOne({ _id: id }, 'mints');
  console.log('Available mints ====', id, painting.mints.length);

  if (painting && painting.mints && painting.mints.length > 0) {
    const mints = await getAvailableMintsByArrayIds(painting.mints);
    let selectedMint;
    let loopLength = 0;
    while (loopLength < mints.length) {
      const mintPicked = mints[Math.floor(Math.random() * mints.length)];
      const adminMint = await isTokenAvailableForTransfer(mintPicked.tokenId);
      if (!adminMint) {
        await updateMintActiveStatus(mintPicked.id, false);
      } else {
        selectedMint = mintPicked;
        break;
      }
      loopLength = +1;
    }

    return selectedMint;
  }
  return false;
};

// get paypal order detail
const paypalOrderDetail = async (orderId) => {
  try {
    const request = new paypal.orders.OrdersGetRequest(orderId);
    const order = await payPalClient.client().execute(request);
    return order;
  } catch (error) {
    return false;
  }
};

const refundPayments = async (paymentId, amount, origin) => {
  if (origin === 'stripe') {
    try {
      const refund = await stripe.refunds.create({ payment_intent: paymentId });
      console.log(`stripe refund ======`, refund);
    } catch (e) {
      // Avoid rethrowing error if refund already processed
      if (e?.raw?.code !== 'charge_already_refunded') {
        throw e;
      }
    }
  } else if (origin === 'paypal') {
    const data = {
      amount: {
        total: amount,
        currency: 'USD',
      },
    };
    payPalClient.paypalRestClient.sale.refund(
      paymentId,
      data,
      (error, refund) => {
        if (error) {
          console.error('paypal refund error ======', error);
        } else {
          console.log('paypal refund ======', refund);
        }
      },
    );
  } else {
    console.error(
      `Matic refund isn't developed yet`,
      paymentId,
      amount,
      origin,
    );
  }
};

const web3Instance = () => {
  const provider = new Provider(
    process.env.ADMIN_WALLET_PRIVATE_KEY,
    infuraURLs[0],
  );
  const nonceTracker = new NonceSubprovider();
  provider.engine.addProvider(nonceTracker);
  const web3 = new Web3(provider);
  return web3 ;
};

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const getAvailableMintsByPaintingIds = async (ids, numberOfNfts) => {
  const mints = await database.mint.getMintsByPaintingIds(ids);
  const selectedMints = [];
  let loopLength = 0;
  while (loopLength < numberOfNfts) {
    if (mints.length < numberOfNfts) return false;
    const randomIndex = Math.floor(Math.random() * mints.length);
    const mintPicked = mints[randomIndex];
    const alreadyPicked = selectedMints.find(
      (mint) => mint.tokenId === mintPicked.tokenId,
    );
    console.log('alreadyPicked ======', alreadyPicked);
    if (!alreadyPicked) {
      const adminMint = await isTokenAvailableForTransfer(mintPicked.tokenId);
      if (!adminMint) {
        mints.splice(randomIndex, 1);
        await updateMintActiveStatus(mintPicked.id, false);
      } else {
        await database.mint.updateMintProcessing(mintPicked.tokenId, true);
        selectedMints.push({ tokenId: mintPicked.tokenId });
        loopLength += 1;
      }
    }
  }
  await selectedMints.map(async (mint) => {
    await database.mint.updateMintProcessing(mint.tokenId, true);
  });
  return selectedMints;
};

const getMintsForLootCrate = async (
  lootCrateId,
  paymentId,
  userId,
  type,
  couponId,
) => {
  const lootCrate = await database.lootCrate.getLootCrateById(lootCrateId);
  const { numberOfNfts, lootCrateContainerId } = lootCrate;
  const { paintings } = lootCrateContainerId;
  const tokens = await getAvailableMintsByPaintingIds(paintings, numberOfNfts);
  const user = await database.user.getUserById(userId);
  const couponData = await database.coupon.getCouponById(couponId);
  const wallet = await adminWallet.getWallet(
    process.env.ADMIN_WALLET_PRIVATE_KEY,
  );
  if (!tokens) return false;
  const lootCrateData = {
    paymentId,
    userId,
    lootCrateId: lootCrateId,
    cryptoPrice: couponData ? couponData.cryptoPrice : lootCrate.cryptoPrice,
    orderType: type,
    tokens,
    price: couponData ? couponData.price : lootCrate.price,
    status: 'pending',
    message: 'will be transfer',
    userWalletAddress: user.walletAddress.toLowerCase(),
    artefyWalletAddress: wallet.address.toLowerCase(),
    couponId,
  };
  return database.lootCrateTransfer.addMaticLootCrateTransfer(lootCrateData);
};

const sendLootCratePaymentSuccessEmail = async (
  userId,
  lootCrateId,
  totalPayment,
) => {
  const { email } = await database.user.getUserById(userId);
  const lootCrate = await database.lootCrate.getLootCrateById(lootCrateId);
  const { numberOfNfts, lootCrateContainerId } = lootCrate;
  const { name } = lootCrateContainerId;
  const dateTime = new Moment(new Date()).format('MMM DD, YYYY');
  const price = totalPayment;
  const data = {
    email,
    numberOfNfts: numberOfNfts,
    price,
    lootCrateCollectionName: `${name.toUpperCase()} CRATE COLLECTION` || '',
    dateTime,
  };
  await sendgrid.lootCratePaymentConfirmation(data);
};

const sendLootCratePaymentUnSuccessEmail = async (
  userId,
  lootCrateId,
  totalPayment,
) => {
  const { email } = await database.user.getUserById(userId);
  const lootCrate = await database.lootCrate.getLootCrateById(lootCrateId);
  const { numberOfNfts, lootCrateContainerId } = lootCrate;
  const { name } = lootCrateContainerId;
  const dateTime = new Moment(new Date()).format('MMM DD, YYYY');
  const price = totalPayment;
  const data = {
    email,
    numberOfNfts: numberOfNfts,
    price,
    lootCrateCollectionName: `${name.toUpperCase()} CRATE COLLECTION` || '',
    dateTime,
  };
  await sendgrid.lootCratePaymentUnSuccessfullConfirmation(data);
};

const POLYGON_API_URL = (polygonURL, contractAddress, userAddress) =>
  `${polygonURL}/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${userAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=6HMKNSANTDE585MA3J3TH2HJCE3SMIUNPR`;

const getPrice = (data) =>
  data.cryptoPrice > 0 ? `${data?.cryptoPrice} MATIC` : `${data?.price} USD`;

const getTransactionTypeAndPrice = (
  from,
  to,
  userWalletAddress,
  sale,
  marketplace,
) => {
  let data = {};
  if (MarketplaceProxyAddress?.toLowerCase() === from?.toLowerCase() && userWalletAddress?.toLowerCase() === to?.toLowerCase()) {
    data = { type: 'From Marketplace', price: getPrice(marketplace) };
  } else if (MarketplaceProxyAddress?.toLowerCase() === to?.toLowerCase() && userWalletAddress?.toLowerCase() === from?.toLowerCase()) {
    data = { type: 'To Marketplace', price: getPrice(marketplace) };
  } else if (AdminWalletAddress?.toLowerCase() === from?.toLowerCase() && userWalletAddress?.toLowerCase() === to?.toLowerCase()) {
    data = { type: 'From Drop/Crate', price: getPrice(sale) };
  } else if (MarketplaceProxyAddress?.toLowerCase() !== to?.toLowerCase() && userWalletAddress?.toLowerCase() === from?.toLowerCase()) {
    data = { type: 'Transfer', price: 'N/A' };
  } else {
    data = { type: 'N/A', price: getPrice(sale) };
  }
  return data;
};

module.exports = {
  isEmail,
  arraySplitter,
  getRandomPaintingMintsById,
  paypalOrderDetail,
  refundPayments,
  web3Instance,
  isJson,
  ENV_ENUM,
  getMintsForLootCrate,
  sendLootCratePaymentSuccessEmail,
  sendLootCratePaymentUnSuccessEmail,
  getAvailableMintsByPaintingIds,
  POLYGON_API_URL,
  getTransactionTypeAndPrice,
};
