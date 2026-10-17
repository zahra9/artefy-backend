const router = require('express').Router();
const controller = require('../../controllers/artist');
const adminAuth = require('../../middlewares/auth');
const verification = require('../../middlewares/verification');
const paramsVerification = require('../../middlewares/paramsVerification');
// Use [adminAuth.adminAuth] as a middleware for protected routes

// Tested: API to post Artists
router.post('/', [adminAuth.adminAuth], controller.publishArtist);

// Tested: API to get Artists, queryParams - artistId to get details of Artist
router.get('/', controller.getArtist);

// Tested: API to update an artist
router.put(
  '/:artistId',
  [adminAuth.adminAuth],
  [paramsVerification.artistId],
  controller.updateArtist,
);

// Caution: Not to be used with the minter currently. | API to delete an artist
router.delete(
  '/:artistId',
  [adminAuth.adminAuth],
  [paramsVerification.artistId],
  controller.deleteArtist,
);

// Tested: API to put painting
router.put(
  '/:artistId/painting',
  [adminAuth.adminAuth],
  [paramsVerification.artistId],
  controller.putPainting,
);

// API to update a painting
router.put(
  '/:artistId/painting/:paintingId',
  [adminAuth.adminAuth],
  [paramsVerification.artistId],
  [paramsVerification.paintingId],
  controller.updatePainting,
);

// Tested: API to delete paintings
router.delete(
  '/:artistId/painting',
  [adminAuth.adminAuth],
  [paramsVerification.artistId],
  controller.deletePaintings,
);

// Tested: API to get artist paintings, queryParams - paintingId to get details of a specific painting
router.get(
  '/:artistId/painting',
  [paramsVerification.artistId],
  controller.getArtistPainting,
);

// Tested: API to get mints of a painting, queryParams - mintId to get details of a specific mint
router.get('/mint', controller.getMints);

// API to get paintings
router.get('/:worldId', controller.getWorldPainting);

// Tested: API to add mint to painting
router.put(
  '/:artistId/mint/painting/:paintingId',
  [adminAuth.adminAuth],
  [paramsVerification.artistId],
  [paramsVerification.paintingId],
  controller.addMintToPainting,
);

// Tested: API to handle req for mintUpdate
router.put(
  '/:paintingId/mint',
  [adminAuth.adminAuth],
  [paramsVerification.paintingId],
  controller.putMintDetails,
);

// Tested: API to get mints of a painting, queryParams - mintId to get details of a specific mint
router.get('/mint', [verification.paintingId], controller.getMints);

module.exports = router;
