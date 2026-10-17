const database = require('../database');

const { mintPainting } = require('./mintPainting.job');
const { mintLenticulars } = require('./mintLenticulars.job');
const { mintPatronBadges } = require('./mintPatronBadges.job');
const { initMintProcessing } = require('./mintProcessing.job');
const { initManualNftTransfer } = require('../cronJobs/manualNftTransfer.job');
const { initMaticNftTransfer } = require('../cronJobs/maticNftTransfer.job');
const { initLootTransProcessing } = require('./pendingCrateTransCheck.job');
const { initMaticLootCrateTransfer } = require('./maticLootCrateTransfer.job');
const init = () => {
  return database.connect().then(() => {
    mintPainting();
    mintLenticulars();
    mintPatronBadges();
    initMintProcessing();
    initManualNftTransfer();
    initMaticNftTransfer();
    initMaticLootCrateTransfer();
    initLootTransProcessing();
  });
};
module.exports = { init };
