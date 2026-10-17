module.exports = (_req, _res, _next) => {
  const acceptsJson = `${_req.get('content-type')}`.indexOf('json') > 0;

  if (_req.xhr || acceptsJson) {
    _req.acceptsJson = true;
    _res.set({ 'Content-Type': 'application/json; charset=utf-8' });
  }
  _next();
};
