const sgMail = require('@sendgrid/mail');
const {
  SENDGRID_API_KEY,
  ACCOUNT_CONFIRMATION_EMAIL_ID,
  TWOFA_CODE_EMAIL_ID,
  CONTACT_US_REPLY_EMAIL_ID,
  CONGRATS_EMAIL_ID,
  PAYMENT_CONFIRMATION_EMAIL_ID,
  NFT_TRANSFER_FAILED_EMAIL_ID,
  FRONTEND_BASE_URL,
  ARTEFY_SEND_EMAIL,
  ARTEFY_RECEIVE_EMAIL,
  ARTEFY_EMAIL_SENDER_NAME,
  DEFAULT_MSG,
  MARKETPLACE_PURCHASED_NFT,
  MARKETPLACE_SOLD_NFT,
} = require('./constants');
sgMail.setApiKey(SENDGRID_API_KEY);

const accountConfirmation = async (to, code) => {
  const subject = 'Confirm Account';
  const verificationLink = `${FRONTEND_BASE_URL}/verify-email/${code}/${to}`;
  const msg = DEFAULT_MSG;
  msg.templateId = ACCOUNT_CONFIRMATION_EMAIL_ID;
  msg.personalizations[0].to[0].email = to;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    verificationLink,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending confirm account email', error.response.body);
  }
};

const contactUs = async (user, subject, body) => {
  const msg = {
    to: ARTEFY_RECEIVE_EMAIL,
    from: {
      email: ARTEFY_SEND_EMAIL,
      name: ARTEFY_EMAIL_SENDER_NAME,
    }, // Change to your verified sender
    subject,
    text: 'and easy to do anywhere, even with Node.js',
    html: `<h3>${user.firstName} ${user.lastName} with this address ${user.email} has sent the following message</h3><br/><br/><p>${body}</p>`,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending contact us email', error.response.body);
  }
};

// const rawEmailForLogs = async (user, transaction, mint, paymentTypeData, success) => {
//   return false;
//   /*
//   const msg = {
//     // to: ['furqan@invozone.com', 'sheraz@invozone.com', 'safi.ullah@invozone.com'],
//     to: ['ali.iqbal@invozone.com'],
//     from: {
//       email: ARTEFY_SEND_EMAIL,
//       name: ARTEFY_EMAIL_SENDER_NAME,
//     },
//     subject: 'NFT transferred raw email logs',
//     text: `NFT transferred ${success}`,
//     html: `<h2>NFT transferred ${success}</h2>
//           <h3>User: User detail: </h3>${JSON.stringify(user)}
//           <p><h3>Transaction Detail:</h3> ${JSON.stringify(transaction)}</p>
//           <p><h3>Mint Detail:</h3> ${JSON.stringify(mint)}</p>
//           <p><h3>Payment Data:</h3> ${JSON.stringify(paymentTypeData)}</p>`,
//   };
//   try {
//     await sgMail.send(msg);
//   } catch (error) {
//     console.log('Error sending rawEmailForLogs email', error.response.body);
//   } */
// };

const contactUsReply = async (to) => {
  const subject = 'Your message has been delivered';
  const msg = DEFAULT_MSG;
  msg.templateId = CONTACT_US_REPLY_EMAIL_ID;
  msg.personalizations[0].to[0].email = to;
  msg.personalizations[0].dynamic_template_data = { subject };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log('Error sending contact us reply email', error.response.body);
  }
};

const twoFACode = async (to, _twoFACode) => {
  const subject = 'Login 2FA Code';
  const msg = DEFAULT_MSG;
  msg.templateId = TWOFA_CODE_EMAIL_ID;
  msg.personalizations[0].to[0].email = to;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    _twoFACode,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log('Error sending twoFA Code email', error.response.body);
  }
};

const congratsSignup = async (to) => {
  const subject = 'Congratulations';
  const msg = DEFAULT_MSG;
  msg.templateId = CONGRATS_EMAIL_ID;
  msg.personalizations[0].to[0].email = to;
  msg.personalizations[0].dynamic_template_data = { subject };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log('Error sending congratulations email', error.response.body);
  }
};

const lootCratePaymentConfirmation = async (data) => {
  const { numberOfNfts, price, lootCrateCollectionName, dateTime, email } =
    data;
  const msg = DEFAULT_MSG;
  const subject = 'Payment Confirmation';
  msg.templateId = process.env.LOOT_CRATE_SUCCESS_EMAIL_ID;
  msg.personalizations[0].to[0].email = email;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    numberOfNfts,
    lootCrateCollectionName,
    price,
    dateTime,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(
      'Error while sending payment confirmation email',
      error.response.body,
    );
  }
};

const lootCratePaymentUnSuccessfullConfirmation = async (data) => {
  const { numberOfNfts, price, lootCrateCollectionName, dateTime, email } =
    data;
  const msg = DEFAULT_MSG;
  const subject = 'Payment Confirmation';
  msg.templateId = process.env.LOOT_CRATE_UNSUCCESS_EMAIL_ID;
  msg.personalizations[0].to[0].email = email;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    numberOfNfts,
    lootCrateCollectionName,
    price,
    dateTime,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(
      'Error while sending payment confirmation email',
      error.response.body,
    );
  }
};

const paymentConfirmation = async (data) => {
  const { email, assetName, artistName, price, collection, dateTime } = data;
  const msg = DEFAULT_MSG;
  const subject = 'Payment Confirmation';
  msg.templateId = PAYMENT_CONFIRMATION_EMAIL_ID;
  msg.personalizations[0].to[0].email = email;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    assetName,
    artistName,
    price,
    collection,
    dateTime,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(
      'Error while sending payment confirmation email',
      error.response.body,
    );
  }
};

const NFTTransferFailed = async (data) => {
  const { email, assetName, artistName, price, collection, dateTime } = data;
  const msg = DEFAULT_MSG;
  const subject = 'NFT Transfer Failed';
  msg.templateId = NFT_TRANSFER_FAILED_EMAIL_ID;
  msg.personalizations[0].to[0].email = email;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    assetName,
    artistName,
    price,
    collection,
    dateTime,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.log(
      'Error while sending payment confirmation email',
      error.response.body,
    );
  }
};

const marketplaceListAndUnlistConfirmation = async (
  data,
  tamplateId,
  subject,
) => {
  const { email, name, num, tokenId } = data;
  const date = Date();
  const msg = DEFAULT_MSG;
  msg.templateId = tamplateId;
  msg.personalizations[0].to[0].email = email;
  msg.personalizations[0].dynamic_template_data = {
    subject,
    name,
    num,
    tokenId,
    date,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.log(
      'Error while sending payment confirmation emai',
      err.response.body,
    );
  }
};

const marketplacePurchasedConfirmationEmail = async (data) => {
  const {
    email: currentBuyer,
    name,
    num,
    tokenId,
    currentBuyer: currentSellerInfo,
    marketplace,
  } = data;
  const { email: currentSeller, walletAddress } = currentSellerInfo;
  const { price, cryptoPrice } = marketplace;
  const date = Date();
  const purchasedMsg = DEFAULT_MSG;
  const subjectPurchased = 'NFT Purchased Confirmation';
  purchasedMsg.templateId = MARKETPLACE_PURCHASED_NFT;
  purchasedMsg.personalizations[0].to[0].email = currentBuyer;
  purchasedMsg.personalizations[0].dynamic_template_data = {
    subjectPurchased,
    name,
    num,
    tokenId,
    currentSeller,
    walletAddress,
    price,
    cryptoPrice,
    date,
  };
  try {
    await sgMail.send(purchasedMsg);
  } catch (err) {
    console.log(
      'Error while sending payment confirmation emai',
      err.response.body,
    );
  }
};

const marketplaceSoldConfirmationEmail = async (data) => {
  const {
    email: currentBuyer,
    name,
    num,
    tokenId,
    currentBuyer: currentSellerInfo,
    marketplace,
  } = data;
  const { email: currentSeller, walletAddress } = currentSellerInfo;
  const { price, cryptoPrice } = marketplace;
  const date = Date();

  const soldMsg = DEFAULT_MSG;
  const subjectSold = 'NFT Sold Confirmation';
  soldMsg.templateId = MARKETPLACE_SOLD_NFT;
  soldMsg.personalizations[0].to[0].email = currentSeller;
  soldMsg.personalizations[0].dynamic_template_data = {
    subjectSold,
    currentBuyer,
    name,
    num,
    tokenId,
    walletAddress,
    price,
    cryptoPrice,
    date,
  };
  try {
    await sgMail.send(soldMsg);
  } catch (err) {
    console.log(
      'Error while sending payment confirmation emai',
      err.response.body,
    );
  }
};

const marketplaceSalePurchaseEmailConfirmation = async (data) => {
  try {
    await marketplacePurchasedConfirmationEmail(data);
    await marketplaceSoldConfirmationEmail(data);
  } catch (err) {
    console.log('error ', err);
  }
};

module.exports = {
  accountConfirmation,
  contactUsReply,
  contactUs,
  congratsSignup,
  twoFACode,
  paymentConfirmation,
  NFTTransferFailed,
  lootCratePaymentConfirmation,
  lootCratePaymentUnSuccessfullConfirmation,
  marketplaceSalePurchaseEmailConfirmation,
  marketplaceListAndUnlistConfirmation,
};
