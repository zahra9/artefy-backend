const cron = require('node-cron');

const lock = require('./lock');
const { sendNFT } = require('../stripe/nftTransfer');
const { sendPaymentSuccessEmail } = require('../../controllers/payment');
const manualNftTransfer = require('../database/manualNftTransfer.service');
const userModel = require('../database/user');
const paintingModel = require('../database/painting');
const { getRandomPaintingMintsById } = require('../../utils/helpers');

const walletToPaintingHash = {
  '0x5cad41d9e5352c1d1afa891c872e820b0da76ec9': {
    paintingId: '616e6d2911530700143ffb88',
    cryptoPrice: '131',
    name: 'Artefy - FD - Dark Kingdom',
  },
  '0xac0517e4892f294a5f136cd9bdeab9303223eee0': {
    paintingId: '616e6f5011530700143ffbbd',
    cryptoPrice: '65',
    name: 'Artefy - FD - Taarna',
  },
  '0x21b7135088be361808dd3604b09726ddb9624d1b': {
    paintingId: '616cee5f0e75020014314160',
    cryptoPrice: '131',
    name: 'Artefy - FD - Dragonland',
  },
  '0x77cc5473b04cfa8f21793ec65680b7ef3545af24': {
    paintingId: '616f49e07bbf690014ed15ca',
    cryptoPrice: '65',
    name: 'Artefy - FD - Vencido',
  },
  '0xa43447d8136b5e579e0895dc5d19a7eb22bdb298': {
    paintingId: '616cf0de0e750200143141a1',
    cryptoPrice: '49',
    name: 'Artefy - FD - Jumping Waves',
  },
  '0xd1b003c552f865a88f4f3765d224aea979f297e5': {
    paintingId: '616fb1c2f9b380001439ac6c',
    cryptoPrice: '16',
    name: 'Artefy - FD - Ninth Wave',
  },

  '0xf28600639976c22f224eaa3b78d88caa8271da45': {
    paintingId: '6151e2aa6778f67f35687b1e',
    cryptoPrice: '0.01',
    name: 'Artefy - GA - Red Patron Badge',
  },
  '0xa73472ebc3fde89ab9d92b2f8a1b43eb7d313b76': {
    paintingId: '61687f8bebe3159f2ac99ca3',
    cryptoPrice: '0.02',
    name: 'Artefy - GA - Green Patron Badge',
  },
  '0xdcb6b47a0fca46b88b29334692a350bbba3088c6': {
    paintingId: '6155151105e64b00147a782a',
    cryptoPrice: '0.03',
    name: 'Artefy - GA - FF Lenticular',
  },
  '0x8e8f033b41c7a90d3fb974659f313a1b427ce93c': {
    paintingId: '615e6c24800cba00130c7e0f',
    cryptoPrice: '0.04',
    name: 'Artefy - GA - Jimis-X Death Dealer',
  },

  '0x0f8ea367c70fb46ba472ddee920182d089040115': {
    paintingId: '617f9b75d023e700135762a7',
    cryptoPrice: '50',
    name: 'Artefy - HD - Vampire Bride',
  },
  '6180f96176f63f0013924e98': {
    paintingId: '6180f96176f63f0013924e98',
    cryptoPrice: '50',
    name: 'Artefy - HD - Vampire Bride: Platinum Edition',
  },

  '0xc40fff83edfc884c2b3dc5e8bf81ce7fb807024a': {
    paintingId: '617f990cd023e7001357623f',
    cryptoPrice: '75',
    name: 'Artefy - HD - Count Dracula',
  },
  '6180ec8d4019750014c221a3': {
    paintingId: '6180ec8d4019750014c221a3',
    cryptoPrice: '75',
    name: 'Artefy - HD - Count Dracula: Platinum Edition',
  },

  '0xf8b4ee40a2f12060b96d9ba87c038d9a9c3a229c': {
    paintingId: '617f9d1dd023e700135762d2',
    cryptoPrice: '75',
    name: 'Artefy - HD - Blood Lust',
  },
  '0x8bde1ea0c27f839ed4a12e6f72b3d0eaa2e88dca': {
    paintingId: '617f9e6ed023e700135762f5',
    cryptoPrice: '39',
    name: 'Artefy - HD - Kelpie',
  },
  '0xf1e59bcd446a7700c1eecf6a5aea3af156a3baaf': {
    paintingId: '618377b315cee10013a3329f',
    cryptoPrice: '100',
    name: 'Artefy - HD - The Rise',
  },

  12: {
    paintingId: '618af83cd389901607ed7263',
    cryptoPrice: '12',
    name: 'Silver Warrior Green Medallion',
  },
  59: {
    paintingId: '618af646d389901607ed723f',
    cryptoPrice: '59',
    name: 'Silver Warrior Blue Medallion',
  },
  147: {
    paintingId: '618af473d389901607ed721d',
    cryptoPrice: '147',
    name: 'Silver Warrior Bronze Medallion',
  },
  294: {
    paintingId: '618af29ed389901607ed71f3',
    cryptoPrice: '294',
    name: 'Silver Warrior Silver Medallion',
  },
  588: {
    paintingId: '618aedb9d389901607ed71c2',
    cryptoPrice: '588',
    name: 'Silver Warrior Gold Medallion',
  },

  44: {
    paintingId: '618dd84fd389901607ed78f0',
    cryptoPrice: '44',
    name: 'RICHARD HESCOX The Pacifist',
  },
  78: {
    paintingId: '619351e3d389901607ed7d9a',
    cryptoPrice: '78',
    name: 'RICHARD HESCOX Battlestar Galactica',
  },
  62: {
    paintingId: '61949e40d389901607ed7f38',
    cryptoPrice: '62',
    name: 'RICHARD HESCOX Piloto 300',
  },
  109: {
    paintingId: '6193466cd389901607ed7d46',
    cryptoPrice: '109',
    name: 'RICHARD HESCOX Future World',
  },

  '619c6100d389901607ed8b53': {
    paintingId: '619c6100d389901607ed8b53',
    cryptoPrice: '0.05',
    name: 'Silver Warrior - Jimis X Poster',
  },
  '619c5ffbd389901607ed8b47': {
    paintingId: '619c5ffbd389901607ed8b47',
    cryptoPrice: '0.06',
    name: 'Silver Warrior Lenticular',
  },

  '61b8339cdffa1600151db549': {
    paintingId: '61b8339cdffa1600151db549',
    cryptoPrice: '0.07',
    name: 'The Ninth Wave: Platinum Edition',
  },

  '61b72889dffa1600151d9661': {
    paintingId: '61b72889dffa1600151d9661',
    cryptoPrice: '0.08',
    name: 'Taarna',
  },
  '61b85be6dffa1600151dccb7': {
    paintingId: '61b85be6dffa1600151dccb7',
    cryptoPrice: '0.09',
    name: 'Cold Dead War: Attack',
  },

  '61b9c298dffa1600151e4e23': {
    paintingId: '61b9c298dffa1600151e4e23',
    cryptoPrice: '48',
    name: 'Beyond Kuiper',
  },
  '61bace63dffa1600151e4f95': {
    paintingId: '61bace63dffa1600151e4f95',
    cryptoPrice: '48',
    name: 'Vasator & Crunch',
  },

  '61b0486adffa1600151a2cfa': {
    paintingId: '61b0486adffa1600151a2cfa',
    cryptoPrice: '0',
    name: 'Night of the Living Dead Tribute',
  },
  '61687f8bebe3159f2ac99ca3': {
    paintingId: '61687f8bebe3159f2ac99ca3',
    cryptoPrice: '0',
    name: 'EverScapes Green Patron Badge',
  },
  '61af09c9dffa1600151a268e': {
    paintingId: '61af09c9dffa1600151a268e',
    cryptoPrice: '0',
    name: 'Helen Jones Cover',
  },
  '61b00bc9dffa1600151a2a77': {
    paintingId: '61b00bc9dffa1600151a2a77',
    cryptoPrice: '0',
    name: 'Test Monkey',
  },
  '61973af2d389901607ed8441': {
    paintingId: '61973af2d389901607ed8441',
    cryptoPrice: '0',
    name: 'Combined Character Concepts',
  },
  '61971e85d389901607ed8381': {
    paintingId: '61971e85d389901607ed8381',
    cryptoPrice: '0',
    name: 'Dr. Helen Jones Cover',
  },
  '619712d1d389901607ed830d': {
    paintingId: '619712d1d389901607ed830d',
    cryptoPrice: '0',
    name: 'Issue 1: Variant - Signed',
  },
  '61bc894aef60deeb89b2fe83': {
    paintingId: '61bc894aef60deeb89b2fe83',
    cryptoPrice: '0',
    name: 'Dark Wing',
  },
  '61bad53edffa1600151e4fbb': {
    paintingId: '61bad53edffa1600151e4fbb',
    cryptoPrice: '0',
    name: 'A Darker God',
  },
  '619716e5d389901607ed8319': {
    paintingId: '619716e5d389901607ed8319',
    cryptoPrice: '0',
    name: 'Issue 1: 2nd Printing',
  },
  '61f209c30dd91de045339552': {
    paintingId: '61f209c30dd91de045339552',
    cryptoPrice: '94',
    name: 'A New Friend',
  },
  '61e8ebb917a1cdd9b4985fe7': {
    paintingId: '61e8ebb917a1cdd9b4985fe7',
    cryptoPrice: '94',
    name: 'Golden Evil',
  },
  '62563fe97dc9faabcdfab00e': {
    paintingId: '62563fe97dc9faabcdfab00e',
    cryptoPrice: '69',
    name: 'Moon Maid Blue Medallion',
  },
  '62563b5d7dc9faabcdfaaf84': {
    paintingId: '62563b5d7dc9faabcdfaaf84',
    cryptoPrice: '382',
    name: 'Moon Maid Silver Medallion',
  },
  '62563c1f7dc9faabcdfaafa5': {
    paintingId: '62563c1f7dc9faabcdfaafa5',
    cryptoPrice: '764',
    name: 'Moon Maid Gold Medallion',
  },
};

const log = (message, ...params) => {
  console.log(`[Manual NFT Process] ${message}`, ...params);
};

const initManualNftTransfer = async () => {
  cron.schedule('*/10 * * * * * *', async () => {
    try {
      const locked = await lock(__filename, async () => {
        const latest10 = await manualNftTransfer.getLatestManualNftTransfers();

        if (latest10.length === 0) {
          log(`${latest10.length} transactions found`);
          return false;
        }

        // eslint-disable-next-line no-restricted-syntax, no-unreachable-loop
        for (const txn of latest10) {
          log(`${new Date().now} : txn ${txn._id}`);

          const orderExist = await paintingModel.checkOrderExist(txn.txnHash);

          if (orderExist) {
            const user = await userModel.getUserByMintId(
              orderExist._id.toString(),
            );
            await manualNftTransfer.updateSuccess(
              txn._id,
              orderExist.tokenId,
              `txn already sent to wallet: ${user.walletAddress}`,
            );
            log(`txn ${txn.txnHash} already processed`, orderExist);
            return false;
          }

          // find user wallet address
          const user = await userModel.getUserByWalletAddress(
            txn.userWalletAddress,
          );
          if (!user) {
            await manualNftTransfer.updateFailure(
              txn._id,
              'User Wallet Not Attached to Artefy.io',
            );
            log(
              `${txn.userWalletAddress} does not match our any our users wallet addresses`,
            );
            return false;
          }

          const { paintingId, cryptoPrice, name } =
            walletToPaintingHash[txn.artefyWalletAddress.toLowerCase()];

          const mint = await getRandomPaintingMintsById(paintingId);
          if (!mint) {
            log(
              `${txn._id}: ${paintingId} No mint available against given panting`,
            );
            await manualNftTransfer.updateFailure(
              txn._id,
              `${paintingId}: No mint available against given panting`,
            );
            return false;
          }

          if (cryptoPrice !== txn.cryptoPrice) {
            log(
              `${txn._id}: ${paintingId} payment transfered is not same as painting amount`,
            );
            await manualNftTransfer.updateFailure(
              txn._id,
              `${paintingId}: payment transfered is not same as painting amount`,
            );
            return false;
          }

          const nftSent = await sendNFT(
            user._id,
            mint.tokenId,
            cryptoPrice,
            'MATIC',
            { id: txn.txnHash },
          );

          if (nftSent) {
            await manualNftTransfer.updateSuccess(txn._id, mint.tokenId);
            await sendPaymentSuccessEmail(
              user._id,
              paintingId,
              `${cryptoPrice} MATIC`,
            );
            log(`${txn._id}: ${paintingId} : ${name} Transfer Sucessfull`);
            return true;
          }

          return false;
        }
        return false;
      });
      if (locked === 'locked') {
        console.warn('Lockfile still locked, delaying...');
      }
    } catch (err) {
      console.error(err);
      return err;
    }
    return false;
  });
};

module.exports = { initManualNftTransfer };
