const cron = require('node-cron');
const artist = require('../database/artist');
const adminWallet = require('../adminWallet/index');
const ipfs = require('../ipfs/ipfs');
const lock = require('./lock');
const { ObjectId } = require('mongoose').Types;

const IPFS_IMAGE_HASH = 'QmTX9NGd9iiN8mTW8S5Jdw4eC72MMMBrAiJWtNxem2ytoi';
const MINTS_UP_TO_TOKEN_ID = 10000;
const MINT_NAME = 'EverScapes Green Patron Badge';

const ARTIST_ID = '617b9e8410845cbf466be30e';
const PAINTING_ID = '617f82ecd6ec79ff99a89200';
const WORLD_NAME = 'EverScapes';

const PINATA_GATEWAY = 'https://artefy_gateway.mypinata.cloud/ipfs/';

const log = (message, ...params) => {
  console.log(`[MintPatronBadges] ${message}`, ...params);
};

const mintPatronBadges = async () => {
  cron.schedule('*/10 * * * * * *', async () => {
    const lastMinted = await adminWallet.getTotalSupply();
    try {
      const locked = await lock(__filename, async () => {
        log('LAST MINTED : ', lastMinted);
        if (lastMinted >= MINTS_UP_TO_TOKEN_ID) {
          log('Cron JOB ENDED: MINTS COMPLETED');
          return;
        }
        log(`Starting Patron Badge Jobs`);
        const wallet = await adminWallet.getWallet(
          process.env.ADMIN_WALLET_PRIVATE_KEY,
        );

        const hashArray = [];
        const ipfsArray = [];
        const mints = [];
        let ipfsHash;
        const toBeMintedNext = lastMinted + 1;

        for (
          let i = toBeMintedNext;
          i < 3 + toBeMintedNext && i <= MINTS_UP_TO_TOKEN_ID;
          i += 1
        ) {
          ipfsHash = await ipfs.pinJSONtoIPFS({
            name: `${MINT_NAME} No: #${i}`,
            artist: 'EverScapes',
            year: '2021',
            description:
              'This extremely limited edition NFT gives you exclusive access to special drops and secret offers. Only available to early subscribers, it’s your key to an expanded EverScapes experience.',
            rarity: 'Special',
            fractionalOwnership: false,
            allowStaking: false,
            image: PINATA_GATEWAY + IPFS_IMAGE_HASH,
            file: null,
            amimation_url: PINATA_GATEWAY + IPFS_IMAGE_HASH,
            created_at: Date.now(),
          });

          hashArray.push(ipfsHash);
          ipfsArray.push(PINATA_GATEWAY + ipfsHash);
        }

        const saleDetialsObj = {
          ipfsArray,
          hashArray,
          userAddress: wallet.address,
          privateKey: wallet.privateKey,
        };

        const response = await adminWallet.issueBatchToken(saleDetialsObj);

        const mintedLength = response.events.Transfer.length;

        for (let i = 0; i < mintedLength; i += 1) {
          const currentMintTokenId =
            response.events.Transfer[i].returnValues.tokenId;
          mints.push({
            name: `${MINT_NAME} #` + currentMintTokenId,
            tokenId: currentMintTokenId,
            timestamp: Date.now(),
            sale: { price: 0, active: true },
            paintingID: ObjectId(PAINTING_ID),
          });
        }

        await artist.addMintsToPainting(
          mints,
          ARTIST_ID,
          PAINTING_ID,
          WORLD_NAME,
        );
        log(JSON.stringify(mints));
      });

      if (locked === 'locked') {
        console.warn('Lockfile still locked, delaying...');
      }
    } catch (e) {
      console.error(e);
    }
  });
};

module.exports = { mintPatronBadges };
