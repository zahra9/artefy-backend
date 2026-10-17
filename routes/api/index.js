const router = require('express').Router();

router.use('/upload', require('./upload'));
router.use('/admin', require('./admin'));
router.use('/user', require('./user'));
router.use('/world', require('./world'));
router.use('/drop', require('./drop'));
router.use('/artist', require('./artist'));
router.use('/transact', require('./transaction'));
router.use('/contact', require('./contact'));
router.use('/ipfs', require('./ipfs'));
router.use('/payment', require('./payment'));
router.use('/newsletter', require('./newsletter'));
router.use('/painting', require('./painting'));
router.use('/recaptcha', require('./recaptcha'));
router.use('/mint', require('./mint'));
router.use('/export', require('./exportData'));
// router.use('/loot-crate', require('./lootCrate'));
// router.use('/crate', require('./lootCrateContainer'));
router.use('/marketplace', require('./marketplace'));

module.exports = router;
