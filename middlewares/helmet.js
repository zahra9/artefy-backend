const helmet = require('helmet');

module.exports = [
  helmet(),
  helmet.xssFilter({ setOnOldIE: true }),
  helmet.referrerPolicy({ policy: 'same-origin' }),
];
