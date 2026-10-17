const cron = require('node-cron');

const lock = require('./lock');
const userModel = require('../database/user');
const { walletSync } = require('../wallet/wallet');

const log = (message, ...params) => {
  console.log(`[User Wallet Sync] ${message}`, ...params);
};

const syncUserWallets = async () => {
  cron.schedule('* */60 * * * *', async () => {
    try {
      const locked = await lock(__filename, async () => {
        const allUsers = await userModel.getAllUsers();
        if (!allUsers) {
          log(`Did not found any User`);
          return false;
        }
        allUsers.forEach(async (user) => {
          console.log('user =========', user);
          const output = await walletSync(user);
          if (!output) {
            log(`${user._id} Wallet Sync was unsuccessful ${user.walletAddress}`);
          } else {
            log(`${user._id} Wallet Synced successfully ${user.walletAddress}`);
          }
        });
        return true;
      });
      if (locked === 'locked') {
        console.warn('Lockfile still locked, delaying...');
      }
      return true;
    } catch (err) {
      console.error(err);
      return err;
    }
  });
};

module.exports = { syncUserWallets };
