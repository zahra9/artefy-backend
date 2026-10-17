const router = require('express').Router();
const controller = require('../../controllers/painting');
const { userAuth } = require('../../middlewares/auth');

const {
  validator,
  getPaintingByIdValidations,
  updateNFTAfterTransactionValidations,
} = require('../../middlewares/validations');

// API to get paintings by ID
router.get(
  '/:id',
  userAuth,
  getPaintingByIdValidations,
  validator,
  controller.getPaintingById,
);

router.get(
  '/setNFTForSale/:id',
  userAuth,
  getPaintingByIdValidations,
  validator,
  controller.setNFTForSale,
);

router.post(
  '/updateNFTAfterTransaction',
  updateNFTAfterTransactionValidations,
  validator,
  userAuth,
  controller.updateNFTAfterTransaction,
);

module.exports = router;
