// eslint-disable-next-line node/no-missing-require
const { BaseError } = require('../services/errors');
const logger = require('../utils/logger');

module.exports = (_err, _req, _res, _next) => {
  _err.statusCode = _err.statusCode || 500;

  // Log only if error is not intentionally thrown
  if (!(_err instanceof BaseError)) {
    if (_err.statusCode >= 500) {
      logger.error(_err);
    } else {
      logger.warn(_err.message);
    }
  }

  _next(_err);
};
