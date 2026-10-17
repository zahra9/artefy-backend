const router = require('express').Router();

router.get('/favicon.ico', (_req, _res) => _res.end(false));

module.exports = router;
