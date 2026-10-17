/* ----------------------------------- */
/* Module dependencies and env setup */
/* ----------------------------------- */
require('dotenv').config();
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const database = require('./services/database');
// const cronJobs = require('./services/cronJobs');
const swaggerDocument = require('./configs/swagger.json');

/* ----------------------------------- */
/* Initializing Express App */
/* ----------------------------------- */
const app = express();
const isDev = process.env.NODE_ENV === 'development';

app.enable('etag');
app.disable('x-powered-by');
app.set('json spaces', isDev ? 2 : 0);

/* ----------------------------------- */
/* Initiating Database connection */
/* ----------------------------------- */
database.connect();
// cronJobs.init();

/* ----------------------------------- */
/* Registering required middlewares */
/* ----------------------------------- */
// Request/Response patchers / Functionality enhancers
app.use(require('./middlewares/sentry-request-handler'));
app.use(require('./middlewares/compression'));
// app.use(require('./middlewares/cookie-parser'));
app.use(require('./middlewares/payhook-parser'));
app.use(require('./middlewares/body-parser'));

// Security related middlewares
app.use(require('./middlewares/nocache'));
app.use(require('./middlewares/helmet'));
app.use(require('./middlewares/cors-handler'));

// TODO: Enable CSRF handling
// app.use(require('./middlewares/csrf-handler'));
// app.use(require('../../../middlewares/csp-handler'));

// Client related middlewares
app.use(require('./middlewares/favicon'));
app.use(require('./middlewares/robots'));

// Server/API related middlewares
app.use(require('./middlewares/api-headers'));
app.use(require('./middlewares/ip-handler'));
app.use(require('./middlewares/access-log'));

// Server/API binding routes
// app.use('/files', express.static(path.join(__dirname, 'files')))
app.use('/file', express.static(path.join(__dirname, 'compressedFiles')));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/', /* require('./middlewares/valid-referer'), */ require('./routes/api'));

// Error handling related middlewares
// app.use(require('./middlewares/err-handler-sentry'));
// app.use(require('./middlewares/err-handler-404'));
// app.use(require('./middlewares/err-handler-log'));
// app.use(require('./middlewares/err-handler-response'));

/* ----------------------------------- */
/* Initialising server on given port */
/* ----------------------------------- */
const port = process.env.PORT || 5000;
app.listen(port, async () => {
  console.log('Server is running on port:' + port);
  // res.send('Server is running on port:' + port);

});

module.exports = {app};
