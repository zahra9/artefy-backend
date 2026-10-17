const { contactUs, contactUsReply } = require('../services/sendgrid');

const contact = async (req, res) => {
  const { user, body, subject } = req.body;
  if (!user || !body || !subject) {
    return res.status(400).json({ success: false, message: 'Params missing' });
  }
  if (!user.email || !user.firstName || !user.lastName) {
    return res.status(400).json({ success: false, message: 'Params missing' });
  }

  const contactUsReplySubject = 'Your message has been delivered';
  const contactUsReplyEmail = `We'll reach out to you soon with your queries. \n\nThis is an auto-generated email, please don't reply to this email`;
  contactUs(user, subject, body);
  contactUsReply(user.email, contactUsReplyEmail, contactUsReplySubject);
  return res.status(200).json({
    success: true,
    message: 'Your message is received. We will get back to you soon.',
  });
};

module.exports = { contact };
