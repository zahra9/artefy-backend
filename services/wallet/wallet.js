const Web3 = require('web3');
const userDatabase = require('../database/user');
const OATImplementation = require('../contracts/interfaceOATImplementation');
const Mint = require('../../models/mint.model');
const Painting = require('../../models/painting.model');
const { infuraURLs } = require('../../configs/config.js');

const Provider = require('@truffle/hdwallet-provider');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const provider = new Provider(
  process.env.ADMIN_WALLET_PRIVATE_KEY,
  infuraURLs[0],
);
const nonceTracker = new NonceSubprovider();
provider.engine.addProvider(nonceTracker);
const web3 = new Web3(provider);

// let web3 = new Web3(process.env.POLYGON_MAINNET);

// if (process.env.ENV === 'DEVELOPMENT') {
//   web3 = new Web3(process.env.POLYGON_TESTNET);
// }

const createWallet = async (passPhrase) => {
  const account = web3.eth.accounts.create(web3.utils.randomHex(32));
  const wallet = web3.eth.accounts.wallet.add(account);
  const keystore = wallet.encrypt(passPhrase);

  return {
    wallet: wallet,
    keystore: keystore,
  };
};

const retrieveWalletCredentialsByKeystore = async (keystore, passPhrase) => {
  const walletObject = web3.eth.accounts.wallet.decrypt([keystore], passPhrase);

  return {
    address: walletObject[0].address,
    privateKey: walletObject[0].privateKey,
  };
};

const retrieveWalletByKeystore = async (keystore, passPhrase) => {
  const walletObject = web3.eth.accounts.wallet.decrypt([keystore], passPhrase);

  return walletObject;
};

const retrieveAllWallets = async () => {};

const retrieveWalletBalance = async (address) => {
  const balance = await web3.eth.getBalance(address);
  return Web3.utils.fromWei(balance, 'ether');
};

const retrieveNFTs = async () => {};

const transferFunds = async (transactionObj, passPharse) => {
  const { from, to, value } = transactionObj;

  const transactionData = await web3.eth.sendTransaction(
    {
      to: to,
      from: from,
      gas: '210000',
      value: web3.utils.toWei(value, 'ether'),
    },
    passPharse,
  );

  return transactionData;
};

const transferNFT = async () => {};

const callContract = async () => {};

const getTransactionStatus = async () => {};

const getGasPrice = async () => {
  const gasPrice = await web3.eth.getGasPrice();
  return gasPrice;
};

const importWallet = async (privateKey) => {
  return web3.eth.accounts.privateKeyToAccount(privateKey);
};

const getNonce = async () => {
  const wallet = await importWallet(process.env.ADMIN_WALLET_PRIVATE_KEY);
  const nonce = await web3.eth.getTransactionCount(wallet.address);
  return nonce;
};

const resubmitTransaction = async () => {};

const exportWallet = async () => {};

const updateWalletPin = async () => {};

const walletSync = async (user) => {
  try {
    const paintingIds = {};
    const paintings = await Painting.find();
    paintings.forEach((x) => (paintingIds[x._id] = true));
    const contract = OATImplementation.getContract();
    const tokens = await contract.methods
      .getHolderTokenIds(user.walletAddress)
      .call();
    console.log('tokens ======', tokens);
    await Mint.updateMany(
      { tokenId: { $in: tokens }, currentBuyer: { $ne: user._id } },
      { $set: { currentBuyer: user._id } },
    );
    const mints = await Mint.find({ tokenId: { $in: tokens } });

    user.mints = mints
      .filter((mint) => {
        if (!paintingIds[mint.paintingID.toString()]) {
          console.log(mint.paintingID, 'Painting not found');
          return false;
        }
        return mint;
      })
      .map((mint) => mint._id);
    return userDatabase.updateUser(user._id, user);
  } catch (error) {
    console.error('Wallet Sync Error===>', error);
    return false;
  }
};

module.exports = {
  createWallet,
  retrieveWalletCredentialsByKeystore,
  retrieveAllWallets,
  retrieveWalletByKeystore,
  retrieveWalletBalance,
  retrieveNFTs,
  transferFunds,
  transferNFT,
  callContract,
  getTransactionStatus,
  getGasPrice,
  resubmitTransaction,
  importWallet,
  exportWallet,
  updateWalletPin,
  getNonce,
  walletSync,
};
