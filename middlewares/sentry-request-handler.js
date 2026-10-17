const Sentry = require('@sentry/node');
let router = require('express').Router();

if (process.env.SENTRY_DSN) {
  router = Sentry.Handlers.requestHandler();
}

module.exports = router;
