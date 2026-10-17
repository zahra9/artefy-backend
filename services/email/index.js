const nodemailer = require('nodemailer');
const { readFileSync } = require('fs');
const { FRONTEND_BASE_URL } = require('../../configs/constants');
const transporter = nodemailer.createTransport({
  pool: true,
  host: 'smtp.titan.email',
  port: 587,
  secure: false,
  auth: {
    user: 'no-reply@artefy.io',
    pass: 'BFNRLY334',
  },
});

const accountConfirmation = async (to, username, code) => {
  const baseURL = FRONTEND_BASE_URL;

  const verificationLink = `${baseURL}/verify-email/${code}/${to}`;
  let html = await readFileSync(
    `${process.env.PWD}/services/email/templates/emailVerification.html`,
  ).toString();
  html = html.replace('verificationLink', verificationLink);

  const mailOptions = {
    from: 'no-reply@artefy.io', // sender address
    name: 'Artefy',
    to, // list of receivers
    subject: 'Confirm Account', // Subject line
    html,
  };
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
};

const contactUs = async (user, body, subject) => {
  const mailOptions = {
    from: 'no-reply@artefy.io', // sender address
    name: 'Artefy',
    to: 'hello@artefy.io', // list of receivers
    subject, // Subject line
    html: `<h3>${user.firstName} ${user.lastName} with this address ${user.email} has sent the following message</h3><br/><br/><p>${body}</p>`,
  };
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
};

const contactUsReply = async (to, body, subject) => {
  const mailOptions = {
    from: 'no-reply@artefy.io', // sender address
    name: 'Artefy',
    to, // list of receivers
    subject, // Subject line
    html: `<p>${body}</p>`,
  };
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
};

const twoFACode = async (to, code) => {
  let html = await readFileSync(
    `${process.env.PWD}/services/email/templates/2faCode.html`,
  ).toString();
  html = html.replace('2FACODE', code);

  const mailOptions = {
    from: 'no-reply@artefy.io', // sender address
    name: 'Artefy',
    to, // list of receivers
    subject: 'Login 2FA Code', // Subject line
    html,
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
};

const purchaseConfirmation = (to) => {
  const mailOptions = {
    from: 'no-reply@artefy.io', // sender address
    name: 'Artefy',
    to: to, // list of receivers
    subject: 'Purchase Confirmed', // Subject line
    html: '<h1>this is a test mail.</h1>', // plain text body
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
};

const purchaseCancelation = (to) => {
  const mailOptions = {
    from: 'no-reply@artefy.io', // sender address
    name: 'Artefy',
    to: to, // list of receivers
    subject: 'Purchase canceled', // Subject line
    html: '<h1>this is a test mail.</h1>', // plain text body
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
};

module.exports = {
  accountConfirmation,
  twoFACode,
  purchaseConfirmation,
  purchaseCancelation,
  contactUs,
  contactUsReply,
};
