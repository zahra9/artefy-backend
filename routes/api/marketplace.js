const router = require('express').Router();
const { userAuth } = require('../../middlewares/auth');
const controller = require('../../controllers/marketplace');

const {
  validator,
  addMintToMarketPlaceValidations,
  marketPlacePaintingsDetailsValidations,
  marketPlaceCreateAuctionValidations,
  removeMintToMarketPlaceValidations,
  updateMintToMarketPlaceValidations,
  marketplaceSellNftValidations,
  marketplaceAssureNftPriceValidations,
} = require('../../middlewares/validations');

router.post(
  '/addMint',
  userAuth,
  addMintToMarketPlaceValidations,
  validator,
  controller.addMint,
);

router.post(
  '/unlistNft',
  userAuth,
  removeMintToMarketPlaceValidations,
  validator,
  controller.unlistNft,
);

router.post(
  '/updateMintPrice',
  userAuth,
  updateMintToMarketPlaceValidations,
  validator,
  controller.updateMintPrice,
);

router.get(
  '/getPaintingDetails',
  marketPlacePaintingsDetailsValidations,
  validator,
  controller.getPaintingDetails,
);
router.post('/addBid', controller.addBid);

router.get(
  '/getPaintingEditionsOverview',
  marketPlacePaintingsDetailsValidations,
  validator,
  controller.getAllEditionsOverview,
);
router.get('/getBid', validator, controller.getBid);

router.get('/', controller.getPaintings);
router.get('/sortedPaintings', controller.getSortedPaintings);
router.get('/getFilters', controller.getFilters);
router.get('/getNftsOfPainting/:paintingId', controller.getNftsOfPainting);
router.post(
  '/createDropAuction',
  userAuth,
  marketPlaceCreateAuctionValidations,
  validator,
  controller.createDropAuction,
);
router.post('/approveNftForBuy', controller.approveNftForBuyNow);
router.post('/buyNow', controller.buyNow);

router.post(
  '/sellNft',
  userAuth,
  marketplaceSellNftValidations,
  validator,
  controller.sellNft,
);

router.post(
  '/assureMintPrice',
  userAuth,
  marketplaceAssureNftPriceValidations,
  validator,
  controller.assureMintPrice,
);

router.post('/syncMarketplacePaintings', controller.paintingSyncService);

module.exports = router;
