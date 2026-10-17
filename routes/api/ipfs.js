const router = require('express').Router();
const { adminAuth } = require('../../middlewares/auth');
const controller = require('../../controllers/ipfs');

router.post('/pinFileToIPFS', [adminAuth], controller.pinFileToIPFS);
router.post('/pinJSONtoIPFS', [adminAuth], controller.pinJSONtoIPFS);

module.exports = router;
