const router = require('express').Router();
const basicAuth = require('express-basic-auth');
const controller = require('../../controllers/exportData');

router.use(
  basicAuth({
    challenge: true,
    users: { exporter: 'all-silvers' },
  }),
);

router.get('/sw-medallion-sales', controller.exportSWMedallionSales);

module.exports = router;
