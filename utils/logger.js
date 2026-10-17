const winston = require('winston');
const cluster = require('cluster');
const Sentry = require('@sentry/node');

const { DEBUG_NAMESPACE } = process.env;

const consoleOptions = {
  label: DEBUG_NAMESPACE,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => {
      const message = info.message instanceof Error ? info.message.stack : info.message;
      const meta = info.meta ? ` Meta: ${JSON.stringify(info.meta, null, 2)}` : '';
      const thread = cluster.isMaster ? 'master' : `Worker:${cluster.worker.id}`;
      return `[${info.timestamp}][${thread}][${info.level}] ${message} ${meta}`;
    }),
  ),
};

const transports = [new winston.transports.Console(consoleOptions)];
const exceptionHandlers = [new winston.transports.Console(consoleOptions)];

const logger = winston.createLogger({
  exitOnError: false,
  transports: transports,
  level: process.env.LOG_LEVEL,
  exceptionHandlers: exceptionHandlers,
});

// Temporary workaround for exceptions
logger.error = (_err, _meta) => {
  logger.log('error', _err, { meta: _meta });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(_err);
  }
};

logger.info = (_msg, _meta) => logger.log('info', _msg, { meta: _meta });
logger.warn = (_msg, _meta) => logger.log('warn', _msg, { meta: _meta });
logger.debug = (_msg, _meta) => logger.log('debug', _msg, { meta: _meta });

module.exports = logger;
