const router = require('express').Router();
const controller = require('../../controllers/newsletter');

// API to create Wallet
router.post(
  '/addEmail',
  controller.addEmail,
);

module.exports = router;
