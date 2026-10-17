const router = require('express').Router();
const controller = require('../../controllers/lootCrateContainer');

// router.get('/collection/all', controller.getAllLootCrateCollection);
router.get('/:slug', controller.getLootCrateCollectionBySlug);
// router.post('/create', controller.createLootCrateCollection);
// router.post('/create-many', controller.createCrateLootCollections);

module.exports = router;
