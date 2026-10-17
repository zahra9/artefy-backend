// import mints from '../database/painting';
const database = require('../database/painting');
const mintDatabase = require('../database/mint');
const adminWallet = require('../adminWallet/index');
const { isTokenAvailableForTransfer } = require('../adminWallet/index');

const mintPainting = async () => {
  try {
  
    const PAINTING_ID = '61687f8bebe3159f2ac99ca3';
    const mintIds = [];
    const wallet = await adminWallet.getWallet(
      process.env.ADMIN_WALLET_PRIVATE_KEY,
    );

   
    const avaliableTokenIds = await adminWallet.getAdminTokenBalance(wallet);

    avaliableTokenIds.forEach(async (id) => {
      const tokenAvailability = await isTokenAvailableForTransfer(id);
      if (tokenAvailability) return false;
      const mint = await mintDatabase.makeMintAvailableForSale(id);
      if (mint) return false;
      mintIds.push(mint._id);
      return true;
    });
    

    // now push mint Array in paintings

    const paintingExist = await database.dropPagePainting(PAINTING_ID);

    if (!paintingExist) return;
    await database.addMintsToPainting(PAINTING_ID, mintIds);

  } catch (error) {
    console.error('error in mintPainting', error);
  }
};

module.exports = { mintPainting };
