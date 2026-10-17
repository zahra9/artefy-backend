const walletService = require('../wallet/wallet');
const OATinterface = require('../contracts/interfaceOATImplementation');
const OATSaleinterface = require('../contracts/interfaceOATSaleImplementation');
const axios = require('axios');

const getWallet = (privateKey) => {
  return walletService.importWallet(privateKey);
};

const getAdminTokenBalance = (wallet) => {
  return OATinterface.getHolderTokenIds(wallet);
};

const approveTransaction = (saleDetialsObj) => {
  return OATinterface.approveForNFTTransfer(saleDetialsObj);
};

const transferNFT = (wallet, sendTo, tokenId) => {
  return OATinterface.transferNFT(wallet, sendTo, tokenId);
};

const issueBatchToken = (saleDetialsObj) => {
  return OATinterface.issueBatchToken(saleDetialsObj);
};

const getTokenURI = (saleDetialsObj) => {
  return OATinterface.getTokenURI(saleDetialsObj);
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

const getTotalSupply = async () => {
  const wallet = await getWallet(process.env.ADMIN_WALLET_PRIVATE_KEY);
  const ERC721contract = OATinterface.getContract();
  const tokenSupply = await await ERC721contract.methods
    .totalSupply()
    .call({ from: wallet.address });
  return parseInt(tokenSupply, 10);
};

const setContractStatus = async (Active) => {
  const wallet = getWallet(process.env.ADMIN_PRIVATE_KEY);

  OATSaleinterface.setContractStatus(wallet, Active);
};

const setSaleActiveForNFT = async (nftId, price) => {
  const wallet = await getWallet(process.env.ADMIN_WALLET_PRIVATE_KEY);
  const ERC721contract = OATinterface.getContract();
  const tokenOwner = await ERC721contract.methods
    .ownerOf(nftId)
    .call({ from: wallet.address });

  const salesObj = {
    nftId,
    price,
    userAddress: tokenOwner,
    privateKey: wallet.privateKey,
  };
  return OATSaleinterface.sellMyArtwork(salesObj);
};

const getAdminWalletTransaction = async (page, offset) => {
  const wallet = await getWallet(process.env.ADMIN_WALLET_PRIVATE_KEY);
  const apiKey = process.env.POLYGON_API_KEY;
  console.log(apiKey);
  const polygonApi =
    process.env.ENV === 'DEVELOPMENT'
      ? process.env.POLYGON_TESTNET_API
      : process.env.POLYGON_MAINNET_API;
  const adminTransactionsAPI = `${polygonApi}&address=${wallet.address}&page=${page}&offset=${offset}&sort=desc&apikey=${apiKey}`;
  const transactionData = await axios.get(adminTransactionsAPI);
  return transactionData.data.result;
};

module.exports = {
  getWallet,
  getTokenURI,
  issueBatchToken,
  approveTransaction,
  transferNFT,
  getAdminTokenBalance,
  isTokenAvailableForTransfer,
  setContractStatus,
  getTotalSupply,
  setSaleActiveForNFT,
  getAdminWalletTransaction,
};
