const csurf = require('csurf');
// eslint-disable-next-line node/no-missing-require
const { BadCsrfError } = require('../services/errors');

const excludedAgents = ['ARTEFY-REST-API'];

module.exports = (_req, _res, _next) => {
  if (excludedAgents.indexOf(_req.get('User-Agent')) === -1 && !_req.body.JWT_TOKEN && !_req.body.encryptedString) {
    const csrf = csurf({ cookie: true });
    return csrf(_req, _res, (_err) => {
      _res.cookie('XSRF-TOKEN', _req.csrfToken());

      if (_err) {
        const error = _err.code === 'EBADCSRFTOKEN' ? new BadCsrfError() : _err;
        _next(error);
      } else {
        _next();
      }
    });
  }

  return _next();
};
