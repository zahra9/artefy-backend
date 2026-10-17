const router = require('express').Router();
const controller = require('../../controllers/admin');
const middleware = require('../../middlewares/auth');

// API to register
router.post('/register', controller.register);
// API to login
router.post('/login', controller.login);
// API to authenticatte token
router.post('/auth', [middleware.adminAuth], controller.auth);

module.exports = router;
