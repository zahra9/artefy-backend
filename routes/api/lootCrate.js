const router = require('express').Router();
const controller = require('../../controllers/lootCrate');
const { userAuth } = require('../../middlewares/auth');

// API to get loot crate container by ID
router.get('/:id', userAuth, controller.getLootCrateById);

router.get('/setMintsForSale/:id', userAuth, controller.setMintsForSale);

// router.post('/create', controller.createLootContainer);
// router.post('/create-many', controller.createManyLootCrateContainers);
// router.get('/crates/all', controller.getAllCrateContainer);
module.exports = router;
