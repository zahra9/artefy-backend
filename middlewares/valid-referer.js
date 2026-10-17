const { FRONTEND_BASE_URL } = require('../configs/constants');

const refererCondition = (referer) => {
  return (
    referer &&
    (referer.includes(FRONTEND_BASE_URL) ||
      referer.includes('artefy.io') ||
      referer.includes('stripe') ||
      referer.includes('paypal'))
  );
};

module.exports = (req, res, next) => {
  console.log('Request refered By =>', req.headers.referer);
  if (req.ipAddress === '127.0.0.1') return next();

  if (refererCondition(req.headers.referer)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Not allowed',
  });
};
