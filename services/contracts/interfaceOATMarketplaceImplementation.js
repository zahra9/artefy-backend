const Web3 = require('web3');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');

const { MarketplaceProxyAddress, infuraURLs } = require('../../configs/config');
const {
  _abiMarketplaceImplementation,
  _abiMarketplaceItemListedEvent,
  _abiMarketplaceItemSoldEvent,
} = require('../../abi/contractABIs');
const Provider = require('@truffle/hdwallet-provider');

const getWeb3 = () => {
  const provider = new Provider(
    process.env.ADMIN_WALLET_PRIVATE_KEY,
    infuraURLs[0],
  );
  const nonceTracker = new NonceSubprovider();
  provider.engine.addProvider(nonceTracker);
  const web3Instance = new Web3(provider);
  return web3Instance;
};

const getMarketplaceContract = (web3) => {
  const oatMarketPlaceContract = new web3.eth.Contract(
    _abiMarketplaceImplementation,
    MarketplaceProxyAddress,
  );
  return oatMarketPlaceContract;
};

const fetchTransactionFromTxnHash = async (txnHash, abi, logIndex) => {
  try {
    let txnEvent;
    let txnTopics;
    const web3 = getWeb3();
    await web3.eth.getTransactionReceipt(txnHash, (error, result) => {
      if (error) {
        console.error('err: ', error);
        return false;
      }
      const log = result.logs[logIndex];
      const Event = web3.eth.abi.decodeLog(abi, log.data, log.topics.slice(1));
      txnEvent = Event;
      txnTopics = log.topics.slice(1);
      return true;
    });
    return { txnEvent, txnTopics };
  } catch (error) {
    console.error('error: ', error);
    return error.message;
  }
};

const unlistNftOnMarketplace = async ({ tokenId, itemId, nftOwner }) => {
  try {
    const web3 = getWeb3();
    const contract = getMarketplaceContract(web3);
    const account = await web3.eth.getAccounts();

    const estimateGas = await contract.methods
      .unlistNft(tokenId, itemId, nftOwner)
      .estimateGas({ from: account[0] });
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(account[0], 'latest');
    const unlistedNft = await contract.methods
      .unlistNft(tokenId, itemId, nftOwner)
      .send({ from: account[0], gas: estimateGas, gasPrice, nonce });

    return unlistedNft;
  } catch (error) {
    return error.message;
  }
};

const sellNftFiat = async ({ mintTokenId, itemId, buyer }) => {
  try {
    const web3 = getWeb3();
    const contract = getMarketplaceContract(web3);

    const account = await web3.eth.getAccounts();
   

    const soldNft = await contract.methods
      .sellItemFiat(mintTokenId, itemId, buyer)
      .send({ from: account[0] });
   
    return soldNft;
  } catch (error) {
    console.error(error.message);
    return error.message;
  }
};

const setNftPrice = async ({ amount, itemId, tokenId, commission }) => {
  try {
    const web3 = getWeb3();
    const contract = getMarketplaceContract(web3);
    const account = await web3.eth.getAccounts();

    const amountWei = await web3.utils.toWei(amount.toString());
    const commissionWei = BigInt(
      await web3.utils.toWei((amount * (commission / 100)).toString()),
    );
    const nonce = await web3.eth.getTransactionCount(account[0], 'latest');
    const estimateGas = await contract.methods
      .setPrice(amountWei, itemId, tokenId, commissionWei)
      .estimateGas({ from: account[0] });
    const gasPrice = await web3.eth.getGasPrice();
    const updatedPrice = await contract.methods
      .setPrice(amountWei, itemId, tokenId, commissionWei)
      .send({ from: account[0], gas: estimateGas, gasPrice: gasPrice, nonce });
    return updatedPrice;
  } catch (error) {
    console.error(error.message);
    return error.message;
  }
};

const getListNftTransaction = async (txnHash) => {
  try {
    const { txnEvent: transactionEvent } = await fetchTransactionFromTxnHash(
      txnHash,
      _abiMarketplaceItemListedEvent,
      2,
    );
    const web3 = getWeb3();
    const price = await web3.utils.fromWei(transactionEvent.price);
    return {
      itemindex: transactionEvent.itemindex,
      nftowner: transactionEvent.nftowner,
      tokenId: transactionEvent.tokenId,
      price,
    };
  } catch (error) {
    console.error(error.message);
    return error.message;
  }
};

const getSellItemTransaction = async (txnHash) => {
  try {
    return await fetchTransactionFromTxnHash(
      txnHash,
      _abiMarketplaceItemSoldEvent,
      3,
    );
  } catch (error) {
    console.error(error.message);
    return error.message;
  }
};

const getMaticPrice = (value) => {
  const web3 = getWeb3();
  const maticPrice = web3.utils.fromWei(value);
  return maticPrice;
};

module.exports = {
  unlistNftOnMarketplace,
  sellNftFiat,
  setNftPrice,
  getListNftTransaction,
  getSellItemTransaction,
  getMaticPrice,
};
