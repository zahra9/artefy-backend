const axios = require('axios');
const NewsLetter = require('../../models/newsletter.model');

const getEmail = async (email) => {
  const userEmail = await NewsLetter.findOne({ email });
  return userEmail;
};

const addEmail = async (email) => {
  try {
    const mailChimpUrl = process.env.MAIL_CHIMP_URL;
    const mailChimpAudienceId = process.env.MAIL_CHIMP_AUDIENCE_ID;
    const mailChimpApi = process.env.MAIL_CHIMP_API;
    const res = await axios.post(
      `${mailChimpUrl}${mailChimpAudienceId}/members`,
      {
        email_address: email,
        status: 'pending',
      },
      {
        headers: {
          Authorization: `auth ${mailChimpApi}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return res;
  } catch (error) {
    if (error.response?.data?.title !== 'Member Exists') {
      console.error(error);
    }
    return false;
  }
};

module.exports = {
  getEmail,
  addEmail,
};
