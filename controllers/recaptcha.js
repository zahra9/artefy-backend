const axios = require('axios');

const RECAPTCHA_SERVER_KEY = process.env.RECAPTCHA_SERVER_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_KEY = process.env.RECAPTCHA_SECRET;
const environment = process.env.ENV;
const { ENV_ENUM } = require('../utils/helpers');

const verifyCaptcha = async (req, res, next) => {
  try {
    const { humanKey } = req.body;
    if(humanKey === RECAPTCHA_KEY && environment === ENV_ENUM.TEST) return next();
    const body = `secret=${RECAPTCHA_SERVER_KEY}&response=${humanKey}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    };

    const {data: { success: isCaptchaVaid }} = await axios.post(RECAPTCHA_VERIFY_URL, body, headers);

    if (req.path === '/verify' && isCaptchaVaid) {
      return res.status(200).json({ success: true });
    }

    if (isCaptchaVaid) return next();

    return res.status(401).json({
      success: false,
      message: 'False recaptcha',
    });
  } catch (error) {
    console.error('Error in verifying recaptcha', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

module.exports = {verifyCaptcha};
