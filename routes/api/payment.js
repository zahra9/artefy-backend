const router = require('express').Router();

const controller = require('../../controllers/payment');
const { userAuth } = require('../../middlewares/auth');

// TODO: Fix the endpoint pay to maje like others
router.post('/pay', [userAuth], controller.pay);
router.post('/matic/checkout', [userAuth], controller.maticCheckout);
router.post('/stripe/checkout', [userAuth], controller.stripeCheckout);
router.post('/matic/loot-crate/checkout', [userAuth], controller.maticLootCrateCheckout);
router.post(
  '/loot-crate/stripe/checkout',
  [userAuth],
  controller.lootCrateStripeCheckout,
);
router.post('/webhook/stripe', controller.stripePaymentHook);
router.post('/webhook/paypal', controller.paypalPaymentHook);

module.exports = router;
