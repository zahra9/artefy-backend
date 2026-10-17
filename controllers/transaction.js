const jwt = require('jsonwebtoken');
const payPalClient = require('../services/paypal');
const database = require('../services/database');
const paypal = require('@paypal/checkout-server-sdk');
const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');
const {sendPaymentSuccessEmail} = require('./payment');
const { sendNft } = require('../services/stripe/nftTransfer');
const { getMintsForLootCrate } = require('../utils/helpers');
/**
 * Create Order
 *
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {ObjectId} req.params.paintingId - paintingId
 */
const createOrder = async ({ user, params, body }, res) => {
  try {
    const { id } = params;
    const { id: userId } = user;
    const { amount, type, couponId } = body;
    // 1. Call PayPal to set up a transaction
    const request = new paypal.orders.OrdersCreateRequest();
    const orderData = { userId };
    if (type === 'lootCrate') {
      orderData.lootCrateId = id;
    } else {
      orderData.paintingId = id;
    }
    const descriptionData = JSON.stringify(orderData);
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: descriptionData,
          amount: {
            currency_code: 'USD',
            value: amount,
          },
        },
      ],
    });

    const order = await payPalClient.client().execute(request);
    const lootCratedMints = await getMintsForLootCrate(
      id,
      order.result.id,
      user.id,
      'paypal',
      couponId,
    );
    if (!lootCratedMints) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: true,
        message: 'Crates are not available.',
      });
    }
    // 2. Return a successful response to the client with the order ID
    return res.status(HTTP_STATUS_CODE.OK).json({ orderID: order.result.id });
  } catch (error) {
    // 3. Handle any errors from the call
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

/**
 * Order Capture Request
 *
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {object} req.body - orderID
 * @param {ObjectId} req.params.mintId - mintId
 */
const orderCaptureRequest = async (req, res) => {
  try {
    // 1. Get the order ID from the request body
    const { orderID, couponId } = req.body;
    const { id } = req.params;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    // Call API with your client and get a response for your call
    await payPalClient.client().execute(request);
    // If call returns body in response, you can get the deserialized version from the result attribute of the response.
    const lootCrate = await database.lootCrate.getLootCrateById(id);
    await database.lootCrateContainer.updateAvailableCrateByContainerId(
      lootCrate.lootCrateContainerId,
      -1,
    );
    
    if (couponId) {
      await database.coupon.updateCouponStatus(couponId, { status: 'used' });
    }
    // 5. Return a successful response to the client
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      orderID,
    });
  } catch (error) {
    // 6. Handle any errors from the call
    console.log('orderCaptureRequest error =', error);
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

/**
 * Capture Transaction
 *
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {object} req.body - tokenId, orderID
 * @param {ObjectId} req.params.mintId - mintId
 */
const captureTransaction = async (req, res) => {
  try {
    // 1. Get the order ID from the request body
    const { orderID } = req.body;
    const { mintId } = req.params;
    const token = req.header('x-auth-token');
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const mint = await database.transaction.fetchMint(mintId);

    if (mint.sale.active === false) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
    }

    // 2. Call PayPal to capture the order
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await payPalClient.client().execute(request);

    // 3. Save the capture ID to your database. Implement logic to save capture to your database for future reference.
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    await database.transaction.saveCaptureId(mintId, captureID);

    // 4. Update the db
    await database.transaction.buyMint(mintId, user.id, mint.currentBuyer);

    // 5. Return a successful response to the client
    return res.status(HTTP_STATUS_CODE.OK).json({ message: 'Sold Success' });
  } catch (error) {
    // 6. Handle any errors from the call
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

/**
 * Verify Transaction
 *
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {ObjectId} req.params.mintId - mintId
 */
const verifyTransaction = async (req, res) => {
  try {
    const { mintId } = req.params;
    // 1. Get the order ID using mintId received from the frontend.
    const mint = await database.transaction.fetchMint(mintId);

    // 2. Call PayPal to get the transaction details
    const request = new paypal.orders.OrdersGetRequest(mint.sale.orderID);

    const order = await payPalClient.client().execute(request);

    // 3. Validate the transaction details are as expected
    if (
      parseFloat(order.result.purchase_units[0].amount.value) !==
        parseFloat(mint.sale.price) ||
      order.result.purchase_units[0].payments.captures[0].id !==
        mint.sale.captureID
    ) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json({ message: 'Verification Failed' });
    }

    // 4. Return a successful response to the client
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Verification Success' });
  } catch (error) {
    // 5. Handle any errors from the call
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

/**
 * Release Mint: Called by admin after successul purchase via Paypal
 * - sets processing false
 */
const releaseMint = async (req, res) => {
  try {
    const { mintId } = req.params;
    const { userId } = req.body;

    // 1. Get the order ID using mintId received from the frontend.
    const mint = await database.transaction.fetchMint(mintId);

    // 2. Update the db
    await database.transaction.buyMint(
      mintId,
      userId,
      mint.currentBuyer,
      false,
    );

    // 3. Return a successful response to the client
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Verification Success' });
  } catch (error) {
    // 4. Handle any errors from the call
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

/**
 * Buy user mint
 *
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {objectId} userId - UserId
 * @param {objectId} mintId - mintId
 */
const buyMint = async (req, res) => {
  try {
    const { mintId } = req.params;
    let tokenId;

    const token = req.header('x-auth-token');
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (mintId) {
      // eslint-disable-next-line no-unused-vars
      tokenId = await database.mint.getTokenIdByMintId(mintId).tokenId;
    }

    const mint = await database.transaction.fetchMint(mintId);

    if (mint === null) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.INVALID_REQUEST);
    }

    database.transaction
      .buyMint(mint._id, user.id, mint.currentBuyer)
      .then(async (nft) => {
        if (!nft) {
          // TODO: send failure email}
          await sendPaymentSuccessEmail(user.id, mint._id);
        }
      })
      .catch((error) => {
        console.error('error in buyMint', error);
      });
    return res.status(HTTP_STATUS_CODE.OK).json({ message: 'Mint bought' });
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

const metamaskTransactions = async (req, res) => {
  const { mintId, transactionHash } = req.body;
  const { id } = req.user;
  try {
    await sendNft(id, mintId, {
      id: transactionHash,
      txnHash: transactionHash,
    });
    return res.json({
      success: true,
      data: {
        txnHash: transactionHash,
        message: 'Your NFT will be processed Soon',
      },
    });
  } catch (error) {
    console.error('error in metamaskTransactions', error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};
/**
 * Get All user transactions
 *
 * @param {request} - request Object
 * @param {response} - response Object
 */
const getAllTransactions = async (request, response) => {
  try {
    const { id } = request.user;
    const user = await database.user.getUserById(id);

    // CHECK IF USER EXISTS
    if (!user) {
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    const transactions = await database.transaction.getUserTransactions(
      user.transactionHistory,
    );
    return response.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      success: true,
      message: error,
    });
  }
};

const lootCrateOrderCaptureRequest = async (req, res) => {
  try {
    const { orderID } = req.body;
    const paypalRequest = new paypal.orders.OrdersCaptureRequest(orderID);
    paypalRequest.requestBody({});
    await payPalClient.client().execute(paypalRequest);

    return res.status(HTTP_STATUS_CODE.OK).json(orderID);
  } catch (error) {
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REQUEST_NOT_PROCESSED);
  }
};

module.exports = {
  buyMint,
  createOrder,
  orderCaptureRequest,
  verifyTransaction,
  captureTransaction,
  releaseMint,
  getAllTransactions,
  metamaskTransactions,
  lootCrateOrderCaptureRequest,
};
