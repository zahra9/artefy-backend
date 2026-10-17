const router = require('express').Router();
const controller = require('../../controllers/world');
const adminAuth = require('../../middlewares/auth');
const paramsVerification = require('../../middlewares/paramsVerification');

// Tested: API to create a world
router.post('/', [adminAuth.adminAuth], controller.createWorld);

// Tested: API to edit a world
router.put(
  '/:worldId',
  [adminAuth.adminAuth],
  [paramsVerification.worldId],
  controller.updateWorld,
);

// Tested: API to get solo nfts
router.get(
  '/:worldId/solo',
  [paramsVerification.worldId],
  controller.getSoloNFTs,
);

// Tested: API to get all the world
router.get('/', controller.getWorld);

// API to delete a world
router.delete(
  '/:worldId',
  [adminAuth.adminAuth],
  [paramsVerification.worldId],
  controller.deleteWorld,
);

// Tested: API to filter and get paintings by world
router.get('/filterPaintings', controller.filterPaintings);

// Tested: API to add collections
router.post(
  '/:worldId/collection',
  [adminAuth.adminAuth],
  [paramsVerification.worldId],
  controller.postCollection,
);

// Tested: API to delete collections
router.delete(
  '/:worldId/collection',
  [adminAuth.adminAuth],
  [paramsVerification.worldId],
  controller.deleteCollection,
);

// Tested: API to update a collection
router.put(
  '/:worldId/collection/:collectionId',
  [adminAuth.adminAuth],
  [paramsVerification.worldId],
  [paramsVerification.collectionId],
  controller.updateCollection,
);

// API to get all collections
router.get('/getCollections', controller.getAllCollections);

// Tested: API to get collections, queryParams - collectionId to get details of a specific collection
router.get(
  '/:worldId/collection',
  [paramsVerification.worldId],
  controller.getCollection,
);

// Tested: API to add/remove paintings, artists to/from a collection
router.put(
  '/:collectionId/update',
  [adminAuth.adminAuth],
  [paramsVerification.collectionId],
  controller.updateTheCollection,
);

// API to get collection paintings
router.get(
  '/:collectionId/paintings',
  [paramsVerification.collectionId],
  controller.getPaintings,
);

// Tested: API to get collection paintings, queryParams - paintingId to get details of a specific painting
router.get(
  '/:worldId/collection/:collectionId/painting',
  [paramsVerification.worldId],
  [paramsVerification.collectionId],
  controller.getCollectionPainting,
);

// Tested: API to add mint to painting inside collection
router.put(
  '/:worldId/mint/collection/:collectionId/painting/:paintingId',
  [adminAuth.adminAuth],
  [paramsVerification.worldId],
  [paramsVerification.paintingId],
  [paramsVerification.collectionId],
  controller.addMintToCollectionPainting,
);

module.exports = router;
