const router = require('express').Router();
const { contact } = require('../../controllers/contact');

router.post('/', contact);

module.exports = router;
