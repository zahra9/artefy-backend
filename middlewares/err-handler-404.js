const path = require('path');
// eslint-disable-next-line node/no-missing-require
const { PathNotFoundError } = require('../services/errors');

module.exports = (_req, _res, _next) => {
  const acceptsJson = `${_req.get('content-type')}`.indexOf('json') > 0;

  if (_req.xhr || acceptsJson) {
    _next(new PathNotFoundError());
  } else {
    const index = path.resolve(process.env.BASE_PATH, 'client', 'web', 'dist', 'index.html');
    _res.set('Content-Type', 'text/html').sendFile(index);
  }
};
