const Web3 = require('web3');

const {
  AuctionProxyAddress,
  OatProxyAddress,
  infuraURLs,
} = require('../../configs/config');
const {
  _abiAuctionImplementation,
  _oatImplementation,
} = require('../../abi/contractABIs');
const Provider = require('@truffle/hdwallet-provider');

const getWeb3 = () => {
  const provider = new Provider(
    process.env.ADMIN_WALLET_PRIVATE_KEY,
    infuraURLs[0],
  );
  const web3Instance = new Web3(provider);
  return web3Instance;
};

const getAuctionContract = (web3) => {
  const oatAuctionContract = new web3.eth.Contract(
    _abiAuctionImplementation,
    AuctionProxyAddress,
  );
  return oatAuctionContract;
};

const getOATContract = (web3) => {
  const oatImplementation = new web3.eth.Contract(
    _oatImplementation,
    OatProxyAddress,
  );
  return oatImplementation;
};

const createAuction = async ({
  mintTokenId,
  startingBidPrice,
  startingBidPriceCents,
  startTime,
  buyNowPrice,
  buyNowPriceCents,
  auctionDuration,
}) => {
  try {
    const web3 = getWeb3();
    const contract = getAuctionContract(web3);
    const account = await web3.eth.getAccounts();
    const startingBidPriceInWei = await web3.utils.toWei(startingBidPrice);
    const buyNowPriceInWei = await web3.utils.toWei(buyNowPrice);

    console.log('startingBidPriceInWei', startingBidPriceInWei);

    const createdAuction = await contract.methods
      .createAuction(
        mintTokenId,
        startingBidPriceInWei,
        startingBidPriceCents,
        startTime,
        buyNowPriceInWei,
        buyNowPriceCents,
        auctionDuration,
        account[0],
      )
      .send({ from: account[0] });
    return createdAuction;
  } catch (e) {
    console.log(e);
    return e.message;
  }
};

const approveNft = async (to, nftTokenId) => {
  try {
    const web3 = getWeb3();
    const contract = getOATContract(web3);
    const accounts = await web3.eth.getAccounts();
    const approved = await contract.methods
      .approve(to, nftTokenId)
      .send({ from: accounts[0] });
    return approved;
  } catch (e) {
    console.log('Error while approval ====>', e);
    return e.message;
  }
};

module.exports = { createAuction, approveNft };
