const router = require('express').Router();

module.exports = router.get('/robots.txt', function(_req, _res) {
  _res.type('text/plain');
  _res.send('User-agent: *\nDisallow: /');
});
