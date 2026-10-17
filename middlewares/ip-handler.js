const { dotIP, isCountryBlocked } = require('../utils/ip');

module.exports = (_req, _res, _next) => {
  _req.ipAddress = dotIP(
    _req.get('x-forwarded-for') || _req.connection.remoteAddress,
  );

  if (isCountryBlocked(_req.ipAddress)) {
    return _res.status(503).json('Unavailable!');
  }

  return _next();
};
