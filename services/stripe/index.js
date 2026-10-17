const stripe = require('stripe')(process.env.STRIPE_SK);
const { user } = require('../database');
const {
  HTTP_STATUS_CODE,
  CURRENCY,
  FRONTEND_BASE_URL,
} = require('../../configs/constants');

const constructEvent = (eventData) => {
  const { rawBody, signature, key } = eventData;
  return stripe.webhooks.constructEvent(rawBody, signature, key);
};

const createCustomer = (email, name) => {
  return stripe.customers.create({ email, name });
};

const createPaymentMethod = async (userId, data, customer) => {
  // eslint-disable-next-line camelcase
  const { number, exp_month, exp_year, cvc } = data;

  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      number,
      // eslint-disable-next-line camelcase
      exp_month,
      // eslint-disable-next-line camelcase
      exp_year,
      cvc,
    },
  });
  await stripe.paymentMethods.attach(paymentMethod.id, { customer });
  await user.saveStripeDetails(userId, customer, paymentMethod.id);
  return { custID: customer, pmID: paymentMethod.id };
};

const setupCustomerStripe = async (stripeSetupParams, response) => {
  try {
    const { id, cardData, email, username } = stripeSetupParams;
    const stripeCustomer = await createCustomer(email, username);
    const stripeData = await createPaymentMethod(
      id,
      cardData,
      stripeCustomer.id,
    );
    return {
      custID: stripeData.custID,
      pmID: stripeData.pmID,
    };
  } catch (error) {
    response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: error.message,
    });
    return 'Error';
  }
};

const chargePayment = async (chargePaymentData, response) => {
  try {
    const { pmId, amount, currency, customer, email } = chargePaymentData;
    await stripe.paymentIntents.create({
      amount: amount * 100,
      currency,
      customer: customer,
      payment_method: pmId,
      off_session: true,
      confirm: true,
      receipt_email: email,
    });
    return response.status(HTTP_STATUS_CODE.OK).json({ message: 'success' });
  } catch (error) {
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: error.message,
    });
  }
};

const createCheckoutSession = (checkoutParams) => {
  const {
    userId,
    stripeCustomerId,
    email,
    paintingId,
    price,
    quantity,
    productName,
    page,
  } = checkoutParams;
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    cancel_url: `${FRONTEND_BASE_URL}${page}?paymentMessage=cancel&paintingId=${paintingId}`,
    success_url: `${FRONTEND_BASE_URL}${page}?paymentMessage=success&paintingId=${paintingId}`,
    mode: 'payment',
    client_reference_id: userId,
    customer: stripeCustomerId,
    customer_email: email,
    metadata: { paintingId },
    line_items: [
      {
        price_data: {
          currency: CURRENCY,
          unit_amount: price,
          product_data: { name: productName },
        },
        quantity,
      },
    ],
  });
};

const createLootCrateCheckoutSession = async (checkoutParams) => {
  const {
    userId,
    stripeCustomerId,
    email,
    crateName,
    lootCrateId,
    price,
    redirectPage,
    couponId,
  } = checkoutParams;
  
  const metaData = { lootCrateId };
  if (couponId) {
    metaData.couponId = couponId;
  }
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    cancel_url: `${FRONTEND_BASE_URL}${redirectPage}?paymentMessage=cancel&lootCrateId=${lootCrateId}`,
    success_url: `${FRONTEND_BASE_URL}${redirectPage}?paymentMessage=success&lootCrateId=${lootCrateId}`,
    mode: 'payment',
    client_reference_id: userId,
    customer: stripeCustomerId,
    customer_email: email,
    metadata: metaData,
    line_items: [
      {
        price_data: {
          currency: CURRENCY,
          unit_amount: price,
          product_data: { name: crateName },
        },
        quantity: 1,
      },
    ],
  });
};

module.exports = {
  constructEvent,
  setupCustomerStripe,
  chargePayment,
  createCheckoutSession,
  createLootCrateCheckoutSession,
};
