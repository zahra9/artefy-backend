const cron = require('node-cron');
const mintDatabase = require('../database/mint');
const artist = require('../database/artist');
const adminWallet = require('../adminWallet/index');
const ipfs = require('../ipfs/ipfs');
const lock = require('./lock');
const { ObjectId } = require('mongoose').Types;
const imageHash = 'QmPV3TQMQFz5Yt6BQJZZesYdewEoovgbYsUG844xUrmKWX';

const mintLenticulars = async () => {
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const locked = await lock(__filename, async () => {
        let lastMinted = await mintDatabase.getLastMintedTokenInDB();
        console.log('LAST MINTED : ', lastMinted.tokenId);
        if (parseInt(lastMinted.tokenId, 10) >= 2500) {
          console.log('Cron JOB ENDED');
          return;
        }
        console.log(`Starting Frazetta Frenzy Lenticular Minting Jobs`);
        const wallet = await adminWallet.getWallet(
          process.env.ADMIN_WALLET_PRIVATE_KEY,
        );

        let hashArray = [];
        let ipfsArray = [];
        let mints = [];
        let ipfsHash;
        let toBeMintedNext = parseInt(lastMinted.tokenId,10) + 1;

        for (let i = toBeMintedNext; i < 3 + toBeMintedNext && i < 2500; i+=1) {
          ipfsHash = await ipfs.pinJSONtoIPFS({
            name: 'Frazetta Frenzy Lenticular No: #' + i,
            artist: 'FRANK FRAZETTA',
            year: '2021',
            description:"A tribute to the master of fantasy, Frank Frazetta, by the incredible Jimis X",
            rarity: 'Rare',
            fractionalOwnership: false,
            allowStaking: false,
            image: 'https://gateway.pinata.cloud/ipfs/' + imageHash,
            file: null,
            amimation_url: 'https://gateway.pinata.cloud/ipfs/' + imageHash,
            created_at: Date.now(),
          });

          hashArray.push(ipfsHash);
          ipfsArray.push('https://gateway.pinata.cloud/ipfs/' + ipfsHash);
        }

        const saleDetialsObj = {
          ipfsArray,
          hashArray,
          userAddress: wallet.address,
          privateKey: wallet.privateKey,
        };

        const response = await adminWallet.issueBatchToken(saleDetialsObj);

        const mintedLength = response.events.Transfer.length;

        for (let i = 0; i < mintedLength; i+=1) {
          const currentMintTokenId =
            response.events.Transfer[i].returnValues.tokenId;
          mints.push({
            name: 'Frazetta Frenzy Lenticular #' + currentMintTokenId,
            tokenId: currentMintTokenId,
            timestamp: Date.now(),
            sale: { price: 0, active: false },
            paintingID:ObjectId(process.env.PAINTING_ID_FRANK),
          });
        }

        await artist.addMintsToPainting(
          mints,
          process.env.ARTIST_ID_FRANK,
          process.env.PAINTING_ID_FRANK,
          process.env.WORLD_NAME,
        );

        console.log(mints);
        ipfsArray = [];
        hashArray = [];
        mints = [];
        lastMinted = await mintDatabase.getLastMintedTokenInDB();
        toBeMintedNext = parseInt(lastMinted.tokenId,10) + 1;
      });
      if (locked === 'locked') {
        console.warn('Lockfile still locked, delaying...');
      }
    } catch (e) {
      console.log(e);
    }
  });
};

module.exports = {mintLenticulars};
