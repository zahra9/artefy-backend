const Web3 = require('web3');
const adminWallet = require('../adminWallet/index.js');
const database = require('../database');
const OATinterface = require('../contracts/interfaceOATImplementation');

let web3 = new Web3(process.env.POLYGON_MAINNET);

if (process.env.ENV === 'DEVELOPMENT') {
  web3 = new Web3(process.env.POLYGON_TESTNET);
}

const transactNFT = async (from, sendTo, tokenId) => {
  const ERC721contract = OATinterface.getContract();
  const estimateGas = await ERC721contract.methods
    .safeTransferFrom(from, sendTo, tokenId)
    .estimateGas({ from: from, to: sendTo });
  const gasPrice = await web3.eth.getGasPrice();

  return ERC721contract.methods.safeTransferFrom(from, sendTo, tokenId).send({
    from: from,
    gas: estimateGas,
    gasPrice: parseInt(gasPrice * 1.4, 10),
  });
};

/**
 *
 * @param {USERID} userId
 * @param {NFTID} nftId
 * @param {{id: String, txnHash?: string}} paymentTypeData
 * @returns {any | error}
 */
const sendNFT = async (
  userId,
  nftId,
  totalAmount,
  origin,
  paymentTypeData = {},
  lootCrateId = null,
) => {
  const user = await database.user.getUserById(userId);
  console.log('getMintsByTokenIds ====', nftId);

  const mint = await database.mint.getMintsByTokenIds([nftId]);
  try {
    const wallet = await adminWallet.getWallet(
      process.env.ADMIN_WALLET_PRIVATE_KEY,
    );
    console.log('admin wallet ======', wallet);
    const saleObj = {
      to: user.walletAddress,
      nftId,
      userAddress: wallet.address,
      privateKey: wallet.privateKey,
    };
    const approved = await adminWallet.approveTransaction(saleObj);
    console.log('approved =====>', approved);
    const sentBadge = await transactNFT(
      wallet.address,
      user.walletAddress,
      nftId,
    );

    console.log('sentBadge =====>', sentBadge);
    await database.user.addMintsToUser(userId, [mint[0]._id]);
    const cryptoPrice = origin === 'MATIC' ? totalAmount : 0;
    const price = origin !== 'MATIC' ? totalAmount : 0;
    const mintUpdated = await database.painting.updateSingleMintByTokenId(
      nftId,
      sentBadge.transactionHash,
      paymentTypeData.id,
      cryptoPrice,
      price,
      lootCrateId,
    );
    console.log('mintAdded ====>', mintUpdated);
    return mintUpdated?.ok;
  } catch (error) {
    console.error('Error while sendingNFT ===>', error);

    return false;
  }
};

module.exports = { sendNFT };
