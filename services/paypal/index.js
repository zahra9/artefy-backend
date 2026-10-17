const checkoutNodeJsdk = require('@paypal/checkout-server-sdk');
const paypal = require('paypal-rest-sdk');

const clientId =
  process.env.ENV === 'DEVELOPMENT'
    ? process.env.PAYPAL_SAND_BOX_CLIENT_ID
    : process.env.PAYPAL_CLIENT_ID;
const clientSecret =
  process.env.ENV === 'DEVELOPMENT'
    ? process.env.PAYPAL_SAND_BOX_CLIENT_SECRET
    : process.env.PAYPAL_CLIENT_SECRET;

const mode = process.env.ENV === 'DEVELOPMENT' ? 'sandbox' : 'live';
paypal.configure({
  mode: mode, // sandbox or live
  client_id: clientId,
  client_secret: clientSecret,
});

/**
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment.
 */
const environment = () => {
  if (process.env.ENV === 'DEVELOPMENT') {
    return new checkoutNodeJsdk.core.SandboxEnvironment(clientId, clientSecret);
  }
  return new checkoutNodeJsdk.core.LiveEnvironment(clientId, clientSecret);
};
/**
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
const client = () => {
  return new checkoutNodeJsdk.core.PayPalHttpClient(environment());
};

module.exports = { client, paypalRestClient: paypal };
