const geoip = require('geoip-lite');
const localhost = '127.0.0.1';

// Indonesia, Bangladesh and Nigeria
const blockedCountries = ['ID', 'BD', 'NG'];
const blockedIPAddresses = ['103.143.98.115'];

const dotIP = (_ip) => {
  if (!_ip) {
    return '';
  }

  if (_ip === '::1') {
    return localhost;
  }

  const found = _ip.match(/\d+\.\d+\.\d+\.\d+/i);
  return found && found.length ? found[0] : _ip.split(',')[0];
};

const isValidIp = (ip) => {
  const validIpRegx = new RegExp(
    [
      '\\b(?!(10|172\\.(1[6-9]|2[0-9]|3[0-2])|192\\.168|127\\.))',
      '(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\\.)',
      '{3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\\b',
    ].join(''),
    'g',
  );
  return !!ip.match(validIpRegx);
};

const ipToGeo = (ip) => {
  const resp = geoip.lookup(ip);
  return resp;
};

const isCountryBlocked = (ip) => {
  const { country } = ipToGeo(ip) || {};
  const isBlocked =
    blockedCountries.includes(country) || blockedIPAddresses.includes(ip);
  console.log('===> isBlocked', ip, country, isBlocked);
  return isBlocked;
};

module.exports = { dotIP, isValidIp, ipToGeo, isCountryBlocked };
