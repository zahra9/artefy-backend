const router = require('express').Router();
const controller = require('../../controllers/mint');
const { userAuth } = require('../../middlewares/auth');

router.get('/available-count/:id', [userAuth], controller.getPaintingAvailableMintCount);
router.get('/loot-crate-transfer/:paymentId', [userAuth], controller.getLootCrateTransferMints);

module.exports = router;
