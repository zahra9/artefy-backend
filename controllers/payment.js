const Moment = require('moment');
const {
  ERROR_MESSAGE,
  HTTP_STATUS_CODE,
  PAYPAL_EVENTS,
  STRIPE_EVENTS,
} = require('../configs/constants');
const database = require('../services/database');
const sendgrid = require('../services/sendgrid');
const NftQueue = require('../services/queue/nft-transfer-queue');
const LootCrateQueue = require('../services/queue/loot-crate-transfer-queue');
const { paypalRestClient } = require('../services/paypal');
const maticNftTransfer = require('../services/database/maticNftTransfer.service');
const { paypalOrderDetail } = require('../utils/helpers');
const adminWallet = require('../services/adminWallet');
const {
  setupCustomerStripe,
  chargePayment,
  createCheckoutSession,
  constructEvent,
  createLootCrateCheckoutSession,
} = require('../services/stripe');
const { sendLootCratePaymentSuccessEmail } = require('../utils/helpers');
const { getMintsForLootCrate } = require('../utils/helpers');

const { PAYPAL_WEBHOOK_ID } = process.env;

const sendPaymentSuccessEmail = async (userId, paintingID, totalPayment) => {
  const { email } = await database.user.getUserById(userId);
  const painting = await database.painting.getPaintingById(paintingID);
  const artist = await database.artist.getArtistById(painting.artist);
  const collection = await database.painting.getCollectionByPaintingId(
    painting._id,
  );
  const dateTime = new Moment(new Date()).format('MMM DD, YYYY hh:mm A');
  const assetName = painting?.name || '';
  const artistName = artist?.name || '';
  const price = totalPayment;
  const data = {
    email,
    assetName,
    artistName,
    price,
    collection: collection.name || '',
    dateTime,
  };
  await sendgrid.paymentConfirmation(data);
};

const sendNFTUnSuccessEmail = async (userId, paintingId, totalPayment) => {
  const { email } = await database.user.getUserById(userId);
  const painting = await database.painting.getPaintingById(paintingId);
  const artist = await database.artist.getArtistById(painting.artist);
  const collection = await database.painting.getCollectionByPaintingId(
    painting._id,
  );
  const dateTime = new Moment(new Date()).format('MMM DD, YYYY hh:mm A');
  const assetName = painting?.name;
  const artistName = artist?.name;
  const price = totalPayment;
 
  const data = {
    email,
    assetName,
    artistName,
    price,
    collection: collection?.name || '',
    dateTime,
  };
  await sendgrid.NFTTransferFailed(data);
};

const pay = async (req, res) => {
  try {
    const { id } = req.user;
    const { amount, currency, cardNumber, expMonth, expYear, cvc } = req.body;
    const user = await database.user.getUserById(id);
    // Check if customer registered on stripe
    let { stripeCustomerId, stripePaymentMethodId } = user;
    if (!stripeCustomerId) {
      const stripeSetupParams = {
        id,
        email: user.email,
        username: user.username,
        cardData: {
          number: cardNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc,
        },
      };
      const stripeCustomerData = await setupCustomerStripe(
        stripeSetupParams,
        res,
      );
      // If Card number is incorrect return
      if (stripeCustomerData === 'Error') {
        return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
          success: false,
          message: 'Card number is incorrect',
        });
      }
      stripeCustomerId = stripeCustomerData.custID;
      stripePaymentMethodId = stripeCustomerData.pmID;
    }

    // Charge Payment
    const chargePaymentData = {
      pmId: stripePaymentMethodId,
      amount,
      currency,
      customer: stripeCustomerId,
      email: user.email,
    };
    const check = await chargePayment(chargePaymentData);
    // If Insufficient balance return
    if (check === 'Error') {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Payment is done',
    });
  } catch (error) {
    console.error('Payment Failed: ', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: ERROR_MESSAGE.PAYMENT_FAILED,
    });
  }
};

const stripeCheckout = async (req, res) => {
  try {
    const { id } = req.user;
    const { quantity, productName, page, paintingId, price } = req.body;
    console.log('StripeCheckout req.body ======', req.body, paintingId);

    const user = await database.user.getUserById(id);
    const { stripeCustomerId, email } = user;
    const checkoutParams = {
      userId: id,
      stripeCustomerId,
      email,
      paintingId,
      quantity,
      price,
      productName,
      page,
    };

    const session = await createCheckoutSession(checkoutParams);
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error while creating stripe checkout session', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

const lootCrateQueueHandler = async (
  tokens,
  userId,
  paymentId,
  origin,
  event,
  totalAmount,
  lootCrateId,
) => {
  tokens.forEach((token) => {
    LootCrateQueue.add(
      {
        tokenId: token.tokenId,
        userId,
        paymentId,
        lootCrateId,
        origin: origin.toUpperCase(),
        orderId: event.id,
        paymentEvent: event,
        paymentAmount: origin === 'stripe' ? totalAmount / 100 : totalAmount,
      },
      `${event.id}-${token.tokenId}`,
    );
  });

  return false;
};

const stripePaymentHook = async (req, res) => {
  // ---------- Webhook Controller Flow ---------- //
  // Check if order already processed, return OK/200
  // Check if event type is payment success - then continue
  // If not, then validte the origin of event
  // Push this job into queue, with id, data, and origin
  // Return 400 to Paypal and Stripe to get retries

  try {
    // Verifying Strip signature.
    const signature = req.headers['stripe-signature'];
    const eventData = {
      rawBody: req.rawBody,
      signature,
      key: process.env.WEBHOOK_STRIPE_PAYMENT_STATUS_KEY,
    };
    const event = await constructEvent(eventData);
  

    if (!event.type || event.type !== STRIPE_EVENTS.checkoutSessionCompleted) {
     
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Webhook successful',
      });
    }

    const { paintingId, lootCrateId, couponId } = event.data.object.metadata;
    const { client_reference_id: userId } = event.data.object;
    const paymentId = event.data.object.payment_intent;
    const totalAmount = event.data.object.amount_total;

    if (lootCrateId) {
      const crateTransferDetail =
        await database.lootCrateTransfer.getTransactionByPaymentId(paymentId);

      if (!crateTransferDetail || crateTransferDetail?.status !== 'pending') {
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true });
      }

      if (
        crateTransferDetail.orderId &&
        crateTransferDetail.orderId === event.id
      ) {
      
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true });
      }
     
      lootCrateQueueHandler(
        crateTransferDetail.tokens,
        userId,
        paymentId,
        'stripe',
        event,
        totalAmount,
        lootCrateId,
      );
      if (couponId) {
        await database.coupon.updateCouponStatus(couponId, { status: 'used' });
      }

      await database.lootCrateTransfer.updateValidTransfer(
        crateTransferDetail._id,
        event.id,
      );
      await sendLootCratePaymentSuccessEmail(
        userId,
        lootCrateId,
        `$ ${totalAmount / 100}`,
      );
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false });
    }

    // if orderId already exist in mint table
    const orderExist = await database.painting.checkOrderExist(event.id);
    if (orderExist) {
     
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Webhook successful',
      });
    }

    NftQueue.add(
      {
        userId,
        paymentId,
        paintingId,
        origin: 'stripe',
        orderId: event.id,
        paymentEvent: event,
        paymentAmount: totalAmount / 100,
      },
      event.id,
    );
    // Just so we get another try to make sure we don't loose this webhook
    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false });
  } catch (error) {
    console.error('error =====', error);
    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
      success: false,
      message: 'Webhook failed',
    });
  }
};

const verifyPaypalEvent = async (headers, body) => {
  return new Promise((response, reject) => {
    // eslint-disable-next-line no-promise-executor-return
    return paypalRestClient.notification.webhookEvent.verify(
      headers,
      body,
      PAYPAL_WEBHOOK_ID,
      (error, result) => {
        if (error) return reject(error);
        body.verification_status = result.verification_status;
        return response(body);
      },
    );
  });
};

const paypalPaymentHook = async (req, res) => {
  try {
    // If we got eny other event other then Payment Capture Completed then return OK.
    if (
      !req.body.event_type ||
      req.body.event_type !== PAYPAL_EVENTS.paymentCaptureCompleted
    ) {
     
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Webhook successful',
      });
    }

    // verifying paypal event with webhook id
    const event = await verifyPaypalEvent(req.headers, req.body);
   

    // If we got eny other event other than Payment Capture Completed or paypal verification failed  then return OK.
    if (
      event.verification_status !== 'SUCCESS' ||
      event.event_type !== PAYPAL_EVENTS.paymentCaptureCompleted
    ) {
     
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Webhook successful',
      });
    }

    // fetching the details of the order
    const orderDetail = await paypalOrderDetail(
      event.resource?.supplementary_data?.related_ids?.order_id,
    );
   

    // Checking if order has already refunded then return OK to webhook.
    if (
      !orderDetail ||
      orderDetail?.result?.purchase_units[0].payments?.captures[0]?.status ===
        'REFUNDED'
    ) {
     
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Webhook successful',
      });
    }

    // destructing detail object from orderDetail object
    const orderId = event.id;
    const { description } = orderDetail.result.purchase_units[0];
    const { userId, paintingId, lootCrateId } = JSON.parse(description);
    // Adding order into NFT send Queue
    if (lootCrateId) {
      const crateTransferDetail =
        await database.lootCrateTransfer.getTransactionByPaymentId(
          orderDetail.result.id,
        );
      if (!crateTransferDetail || crateTransferDetail?.status !== 'pending') {
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true });
      }
      if (
        crateTransferDetail.orderId &&
        crateTransferDetail.orderId === orderId
      ) {
       
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true });
      }

     
      lootCrateQueueHandler(
        crateTransferDetail.tokens,
        userId,
        event.resource.id,
        'paypal',
        event,
        orderDetail?.result?.purchase_units[0]?.amount?.value,
        lootCrateId,
      );
      await database.lootCrateTransfer.updateValidTransfer(
        crateTransferDetail._id,
        orderId,
      );
      await sendLootCratePaymentSuccessEmail(
        userId,
        lootCrateId,
        `$ ${orderDetail?.result?.purchase_units[0]?.amount?.value}`,
      );
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false });
    }
    // if orderId already exist in mint table
    const orderExist = await database.painting.checkOrderExist(event.id);

    // If order already exist then return OK to webhook
    if (orderExist) {
     
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Webhook successful',
      });
    }
  
    NftQueue.add(
      {
        userId,
        orderId,
        paintingId,
        paymentEvent: event,
        origin: 'paypal',
        paymentAmount: orderDetail?.result?.purchase_units[0]?.amount?.value,
        paymentId: event.resource.id,
      },
      orderDetail.result.id,
    );

    // Returning 400 to webhook for first time to avoid webhook timeout issue.
    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false });
  } catch (error) {
    console.error('Error in paypal webhook', error);
    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

const maticLootCrateCheckout = async (req, res) => {
  console.log(req.body);
  const { paymentEvent, lootCrateId, tokens, couponId } = req.body;
  const { id } = req.user;
  const crateTransferDetail =
    await database.lootCrateTransfer.getTransactionByPaymentId(
      paymentEvent.transactionHash,
    );
  if (crateTransferDetail) {
 
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: false,
      message: `maticLootCrateCheckout ${paymentEvent.transactionHash} already exists`,
    });
  }

  const user = await database.user.getUserById(id);
  const wallet = await adminWallet.getWallet(
    process.env.ADMIN_WALLET_PRIVATE_KEY,
  );
  const lootCrate = await database.lootCrate.getLootCrateById(lootCrateId);
  const couponData = await database.coupon.getCouponById(couponId);
  const lootCrateData = {
    paymentId: paymentEvent.transactionHash.toLowerCase(),
    userId: id,
    lootCrateId: lootCrateId,
    tokens,
    cryptoPrice: couponData ? couponData.cryptoPrice : lootCrate.cryptoPrice,
    orderType: 'matic',
    status: 'pending',
    message: 'Will be transfer',
    // eslint-disable-next-line no-unsafe-optional-chaining
    userWalletAddress: (user?.walletAddress).toLowerCase(),
    artefyWalletAddress: wallet.address.toLowerCase(),
    couponId,
  };

  const data = await database.lootCrateTransfer.addMaticLootCrateTransfer(
    lootCrateData,
  );

  try {
    tokens.forEach(async (token) => {
      await database.mint.updateMintFromCrate(token.tokenId, lootCrateId);
    });
  } catch (error) {
    console.log(error);
  }

  await database.lootCrateContainer.updateAvailableCrateByContainerId(
    lootCrate.lootCrateContainerId,
    -1,
  );
  if (data) {
    await database.coupon.updateCouponStatus(couponId, { status: 'used' });
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: `Your cate is now Processed`,
    });
  }
  return res.status(HTTP_STATUS_CODE.OK).json({
    success: false,
    message: `Failed to process your crate, Please contact support`,
  });
};

const maticCheckout = async (req, res) => {
  try {
    console.log(req.body);
    const { paymentEvent, nftId, paintingID } = req.body;
    const { id } = req.user;
    const orderExist = await database.painting.checkOrderExist(
      paymentEvent.transactionHash,
    );
    if (orderExist) {
      console.log(
        `maticCheckout ${paymentEvent.transactionHash} already exists`,
      );
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: false,
        message: `maticCheckout ${paymentEvent.transactionHash} already exists`,
      });
    }
    const user = await database.user.getUserById(id);
    const wallet = await adminWallet.getWallet(
      process.env.ADMIN_WALLET_PRIVATE_KEY,
    );
    const painting = await database.painting.getPaintingById(paintingID);
    const nftData = {
      txnHash: paymentEvent.transactionHash.toLowerCase(),
      userId: id,
      paintingId: paintingID,
      tokenId: nftId,
      cryptoPrice: painting.cryptoPrice,
      status: 'pending',
      message: 'Will be transfer',
      // eslint-disable-next-line no-unsafe-optional-chaining
      userWalletAddress: (user?.walletAddress).toLowerCase(),
      artefyWalletAddress: wallet.address.toLowerCase(),
    };
    const data = await maticNftTransfer.addMaticNftTransfer(nftData);
  
    if (data) {
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: `Your NFT is now Processed`,
      });
    }
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: false,
      message: `Failed to process your NFT, Please contact support`,
    });
  } catch (error) {
    console.log('error ', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: `Internal server error`,
    });
  }
};

const lootCrateStripeCheckout = async (req, res) => {
  try {
    const { id } = req.user;
    const { crateName, lootCrateId, price, page, couponId } = req.body;
    const user = await database.user.getUserById(id);
    const { stripeCustomerId, email } = user;
    const checkoutParams = {
      userId: id,
      stripeCustomerId,
      email,
      crateName,
      lootCrateId,
      price,
      redirectPage: page,
    };

    if (couponId) {
      checkoutParams.couponId = couponId;
    }
    const session = await createLootCrateCheckoutSession(checkoutParams);
    const mintsAvailable = await getMintsForLootCrate(
      lootCrateId,
      session.payment_intent,
      req.user.id,
      'stripe',
      couponId,
    );
    if (!mintsAvailable) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        data: 'Crates are not available',
      });
    }
    const lootCrate = await database.lootCrate.getLootCrateById(lootCrateId);
    await database.lootCrateContainer.updateAvailableCrateByContainerId(
      lootCrate.lootCrateContainerId,
      -1,
    );
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error while creating stripe checkout session', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

module.exports = {
  pay,
  stripeCheckout,
  stripePaymentHook,
  paypalPaymentHook,
  sendPaymentSuccessEmail,
  sendNFTUnSuccessEmail,
  maticCheckout,
  lootCrateStripeCheckout,
  maticLootCrateCheckout,
};
