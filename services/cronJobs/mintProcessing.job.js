const moment = require('moment');
const cron = require('node-cron');
const database = require('../database');

const initMintProcessing = async () => {
  cron.schedule('* */2 * * *', async () => {
    try {
      const mints = await database.mint.getMintByProcessingStatus(true);
      mints.map(async (mint) => {
        const currentData = moment(new Date());
        const duration = moment.duration(currentData.diff(mint.updatedAt));
        const minsDiff = duration.asMinutes();
        if (minsDiff < 60) return false;

        const maticTransaction =
          await database.maticNftTransfer.getTransactionByTokenId(mint.tokenId);
        if (!maticTransaction) {
          await database.mint.updateMintProcessing(mint.tokenId, false);
        }

        return true;
      });
      return true;
    } catch (err) {
      console.error(err);
      return err;
    }
  });
};

module.exports = { initMintProcessing };
