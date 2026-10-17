const cors = require('cors');

// const allowedHeaders = [
//   'Content-Type',
//   'X-XSRF-TOKEN',
//   'Authorization',
//   'JwtAuth',
// ];

const origins = [
  process.env.HOME_URL,
  process.env.CIP_APP_URL,
  process.env.HOME_URL + ':' + process.env.HTTP_PORT,
  process.env.HOME_URL + ':' + process.env.HTTPS_PORT,
  process.env.HOME_URL + ':' + process.env.SOCKET_HTTP_PORT,
];

if (process.env.NODE_ENV === 'development') {
  origins.push(process.env.HOME_URL + ':4200');
}

// const options = {
//   origin: origins,
//   credentials: true,
//   exposedHeaders: false,
//   preflightContinue: false,
//   optionsSuccessStatus: 204,
//   methods: ['GET', 'POST'],
//   allowedHeaders: allowedHeaders,
// };

// TODO: Enable CORS with options
// module.exports = cors(options);

module.exports = cors();
