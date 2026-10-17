/* no stacktraces leaked to user */
// eslint-disable-next-line node/no-missing-require
const csp = require('helmet-csp');

module.exports = function(_app) {
  _app.use(
    csp({
      directives: {
        defaultSrc: ['*'],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'revbits.com',
          'www.revbits.com',
          'www.google.com',
          'www.gstatic.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'revbits.com', 'www.revbits.com', 'fonts.googleapis.com'],
        imgSrc: ["'self'", 'revbits.com', 'www.revbits.com'],
        reportUri: '/report-violation',
        objectSrc: ["'self'"],
      },
      allowOrigin: ["'https://www.revbits.com'"],
      reportOnly: false,
      setAllHeaders: false,
      disableAndroid: false,
      browserSniff: true,
    }),
  );
};
