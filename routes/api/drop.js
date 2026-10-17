const router = require('express').Router();
const controller = require('../../controllers/drop');
const { adminAuth } = require('../../middlewares/auth');
const verification = require('../../middlewares/verification');
const paramsVerification = require('../../middlewares/paramsVerification');
// Use [adminAuth.adminAuth] as a middleware for protected routes

// API to post Drops
router.post('/', [adminAuth], [verification.worldId], controller.publishDrop);

// API to update a Drop
router.put(
  '/:dropId',
  [adminAuth],
  [paramsVerification.dropId],
  controller.updateDrop,
);

// API to get drops
router.get('/', controller.getDrops);

// API to add paintings, artists to a drop
router.put(
  '/:dropId/update',
  [adminAuth],
  [paramsVerification.dropId],
  controller.updateTheDrop,
);

// API to get drop paintings
router.get(
  '/:slug/latest-paintings',
  controller.getDropPaintings,
);
router.get(
  '/:dropId/paintings',
  [paramsVerification.dropId],
  controller.getPaintings,
);
// API to get the latest drop details
router.get('/latest', controller.getLatestDrop);

// Drop Painings Stats
router.get('/stats/:slug', controller.getDropStats);

module.exports = router;
