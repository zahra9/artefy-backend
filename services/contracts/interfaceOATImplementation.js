const Web3 = require('web3');
const { OatProxyAddress } = require('../../configs/config');
const { _oatImplementation } = require('../../abi/contractABIs');

let web3 = new Web3(process.env.POLYGON_MAINNET);
let oatContract = new web3.eth.Contract(_oatImplementation, OatProxyAddress);

if (process.env.ENV === 'DEVELOPMENT') {
  web3 = new Web3(process.env.POLYGON_TESTNET);
  oatContract = new web3.eth.Contract(_oatImplementation, OatProxyAddress);
}

const getContract = () => {
  return oatContract;
};

const approveForNFTTransfer = async (saleDetialsObj) => {
  const { to, nftId, userAddress, privateKey } = saleDetialsObj;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const estimateGas = await oatContract.methods
    .approve(to, nftId)
    .estimateGas({ to, from: userAddress });
  const gasPrice = await web3.eth.getGasPrice();

 
  return oatContract.methods.approve(to, nftId).send({
    to,
    from: userAddress,
    gas: estimateGas,
    gasPrice: parseInt(gasPrice * 1.4, 10),
  });
};

const issueBatchToken = async (saleDetialsObj) => {
  const { ipfsArray, hashArray, userAddress, privateKey } = saleDetialsObj;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
 

  const tx = await oatContract.methods
    .issueBatch(userAddress, hashArray, ipfsArray)
    .send({
      from: userAddress,
      gas: process.env.GAS_FEE_ISSUE_BATCH_TOKEN,
    });
  return tx;
};

const getTokenURI = async (saleDetialsObj) => {
  const { nftId, userAddress, privateKey } = saleDetialsObj;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const block = await web3.eth.getBlock('latest', false);
 
  const tx = await oatContract.methods.tokenURI(nftId).call({
    from: userAddress,

    gasLimit: block.gasLimit,
  });
  return tx;
};

const getHolderTokenIds = async (wallet) => {
  const { address, privateKey } = wallet;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const tx = await oatContract.methods
    .getHolderTokenIds(address)
    .call({ from: address, gas: process.env.GAS_FEE_GET_HOLDER_TOKENID });
  return tx;
};

const transferNFT = async (wallet, sendTo, tokenId) => {
  const ERC721contract = getContract();

  return ERC721contract.methods
    .safeTransferFrom(wallet.address, sendTo, tokenId)
    .send({
      from: wallet.address,
      gas: process.env.GAS_FEE_SEND_GIVEAWAY_BADGE,
    })
    .then((data) => {
      console.log(data);
    });
};

module.exports = {
  issueBatchToken,
  approveForNFTTransfer,
  getHolderTokenIds,
  getContract,
  getTokenURI,
  transferNFT,
  web3,
};
