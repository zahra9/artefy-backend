const router = require('express').Router();
const { adminAuth, userAuth } = require('../../middlewares/auth');
const controller = require('../../controllers/transaction');
const paramsVerification = require('../../middlewares/paramsVerification');

// Endpoint to create an order for painting
router.post('/:id/createOrder', [userAuth], controller.createOrder);

// Endpoint to get, verify, and save orderID
router.post(
  '/:id/orderCaptureRequest',
  [userAuth],
  controller.orderCaptureRequest,
);

// Endpoint to post and save the captureID
router.post(
  '/:mintId/captureTransaction',
  [userAuth],
  [paramsVerification.mintId],
  controller.captureTransaction,
);

// API to verify a transaction
router.get(
  '/:mintId/verifyTransaction',
  [adminAuth],
  [paramsVerification.mintId],
  controller.verifyTransaction,
);

// API to let user buy a mint
router.put(
  '/user/:mintId',
  [userAuth],
  [paramsVerification.mintId],
  controller.buyMint,
);

// API to get all transactions by user
router.get('/', [userAuth], controller.getAllTransactions);

module.exports = router;
