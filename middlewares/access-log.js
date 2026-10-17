const morgan = require('morgan');
const logger = require('../utils/logger');
const myStream = {
  write(text) {
    logger.info(text);
  },
};

module.exports = morgan('tiny', { stream: myStream });
