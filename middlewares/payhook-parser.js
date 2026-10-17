const express = require('express');

module.exports = express.json({
  // We need the raw body to verify webhook signatures.
  // Let's compute it only when hitting the Stripe or PayPal webhook endpoint.
  verify: function(req, res, buf) {
    if (req.originalUrl.startsWith('/payment/webhook/stripe')) {
      req.headers.referer = 'stripe';
      req.rawBody = buf.toString();
    }

    if (req.originalUrl.startsWith('/payment/webhook/paypal')) {
      req.headers.referer = 'paypal';
      req.rawBody = buf.toString();
    }
  },
});
