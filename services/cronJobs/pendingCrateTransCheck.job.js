const moment = require('moment');
const cron = require('node-cron');
const database = require('../database');
const stripe = require('stripe')(process.env.STRIPE_SK);
const { paypalOrderDetail } = require('../../utils/helpers');
// */10 * * * * * *
// '* */2 * * *
const initLootTransProcessing = async () => {
  cron.schedule('* */2 * * *', async () => {
    try {
      const data =
        await database.lootCrateTransfer.getPendingTransactionOfStripeAndPaypal();
      data.map(async (trans) => {
        const currentData = moment(new Date());
        const duration = moment.duration(currentData.diff(trans.updatedAt));
        const minsDiff = duration.asMinutes();
        if (minsDiff < 60) return false;
        let paymentData;
        if (trans.orderType === 'stripe')
          paymentData = await stripe.paymentIntents.retrieve(trans.paymentId);
        if (trans.orderType === 'paypal')
          paymentData = await paypalOrderDetail(trans.paymentId);

        if (
          paymentData.status === 'canceled' ||
          paymentData.status === 'requires_payment_method' ||
          paymentData.status === 'CREATED'
        ) {
          await database.lootCrateTransfer.updateStatus(trans._id, {
            status: 'failed',
            message: 'Payment was not completed',
          });
          trans.tokens.forEach(async (token) => {
            await database.mint.updateMintProcessing(token.tokenId, false);
          });
          const lootCrate = await database.lootCrate.getLootCrateById(
            trans.lootCrateId,
          );
          if (trans.orderType === 'stripe')
            await database.lootCrateContainer.updateAvailableCrateByContainerId(
              lootCrate.lootCrateContainerId,
              +1,
            );
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

module.exports = { initLootTransProcessing };
