const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');
const newsLetterService = require('../services/newsletter/newsletter');
const { isEmail } = require('../utils/helpers');

const addEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !isEmail(email))
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

    const response = await newsLetterService.addEmail(email);
    if (response === false) {
      return res
        .status(HTTP_STATUS_CODE.CONFLICT)
        .json({ message: 'Email already exists' });
    }

    return res
      .status(HTTP_STATUS_CODE.CREATED)
      .json({ message: 'Email sent please confirm your subscription' });
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.EMAIL_SET_FAIL);
  }
};

module.exports = { addEmail };
