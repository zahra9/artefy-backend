const router = require('express').Router();
const controller = require('../../controllers/recaptcha.js');

router.post('/verify', controller.verifyCaptcha);

module.exports = router;
