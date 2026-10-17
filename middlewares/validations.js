const { body, param, validationResult, query } = require('express-validator');
const { ObjectId } = require('mongoose').Types;
const database = require('../services/database');

const validator = (req, res, next) => {
  const errors = validationResult(req).array();
  const nestedErrors = errors[errors.length - 1];
  if (nestedErrors && nestedErrors.nestedErrors) {
    errors.pop();
    nestedErrors.nestedErrors.forEach((error) => {
      errors.push(error);
    });
  }
  if (errors.length > 0) {
    let message = errors[0].msg;
    const errorParam = errors[0].param;
    console.log('errors', errors);
    if (errors[0].nestedErrors) message = errors[0].nestedErrors[0].msg;
    return res.status(400).json(message + ' ' + errorParam ?? errorParam);
  }
  return next();
};

const registerValidations = [
  body('username')
    .isString()
    .isLength({ min: 3 })
    .custom(async (username) => {
      const user = await database.user.getUserByUsername(username);
      if (user) throw new Error('This Username is already in use');
      return false;
    }),
  body('email').isEmail(),
  body('email')
    .isLength({ max: 255 })
    .custom(async (email) => {
      const user = await database.user.getUserByEmail(email);
      if (user) throw new Error('This Email is already in use');
      return false;
    }),
];

const walletsValidations = async (req, res, next) => {
  const { walletAddress } = req.body;
  let user;
  if (!walletAddress || walletAddress.length !== 42) {
    return res.status(400).json('Please provide a valid Wallet Address');
  }
  if (typeof walletAddress === 'string' && walletAddress.length === 42) {
    user = await database.user.getUserByWalletAddress(walletAddress);
    if (user) {
      return res
        .status(400)
        .json('User already exists with this Wallet Address');
    }
  }

  return next();
};

const validateWalletAddress = (req, res, next) => {
  const { params: { userWalletAddress } } = req;
  if (!userWalletAddress || userWalletAddress?.length !== 42) {
    return res.status(400).json('Please provide a valid Wallet Address');
  }
  return next();
};

const loginValidations = [
  body('walletAddress', 'Invalid wallet address')
    .isString()
    .isLength({ min: 42, max: 42 }),
  body('walletType', 'Invalid wallet type').custom((walletType) => {
    if (walletType !== 'venly' && walletType !== 'metamask') {
      throw new Error('Wrong wallet type');
    }
    return true;
  }),
];

const stripeCheckoutValidations = [
  body('tokenId').isString().isLength({ min: 1 }),
  body('quantity')
    .isNumeric()
    .isLength({ min: 1, max: 2 })
    .custom((value) => value !== 0),
  body('productName').isString().isLength({ min: 1 }),
  body('page').isString().isLength({ min: 1 }),
];

const getPaintingByIdValidations = [
  param('id').custom((value) => ObjectId.isValid(value)),
];

const updateNFTAfterTransactionValidations = [
  body('success').isBoolean(),
  body('tokenId').isString(),
];

const getLootCrateContainerByIdValidations = [
  param('id').custom((value) => {
    if (!ObjectId.isValid(value)) {
      throw new Error('Invalid loot crate container id');
    }
    return true;
  }),
];
const addMintToMarketPlaceValidations = [
  body('mintId').custom((value) => ObjectId.isValid(value)),
  body('price')
    .isDecimal()
    .custom((value) => value > 0),
  body('itemId')
    .isNumeric()
    .custom((value) => value >= 0),
];

const removeMintToMarketPlaceValidations = [
  body('mintId').custom((value) => ObjectId.isValid(value)),
  body('tokenId').isNumeric(),
  body('itemId').isNumeric(),
];

const updateMintToMarketPlaceValidations = [
  body('mintId').custom((value) => ObjectId.isValid(value)),
  body('itemId').isNumeric(),
  body('tokenId').isNumeric(),
  body('price')
    .isDecimal()
    .custom((value) => value > 0),
  body('commission')
    .isDecimal()
    .custom((value) => value > 0),
];

const marketPlacePaintingsDetailsValidations = [
  query('paintingId').custom((value) => ObjectId.isValid(value)),
];

const marketPlaceCreateAuctionValidations = [
  body('mintId').custom((value) => ObjectId.isValid(value)),
  body('buyNow').isBoolean(),
  body('startingBidPrice')
    .isNumeric()
    .custom((value) => value > 0),
  body('auctionDuration')
    .isNumeric()
    .custom((value) => value > 0),
];
const marketplaceSellNftValidations = [
  body('mintId').custom((value) => ObjectId.isValid(value)),
];

const marketplaceAssureNftPriceValidations = [
  body('mintId').custom((value) => ObjectId.isValid(value)),
  body('commission')
    .isNumeric()
    .custom((value) => value > 0),
];

module.exports = {
  validator,
  registerValidations,
  walletsValidations,
  validateWalletAddress,
  loginValidations,
  stripeCheckoutValidations,
  getPaintingByIdValidations,
  updateNFTAfterTransactionValidations,
  getLootCrateContainerByIdValidations,
  addMintToMarketPlaceValidations,
  marketPlacePaintingsDetailsValidations,
  marketPlaceCreateAuctionValidations,
  removeMintToMarketPlaceValidations,
  updateMintToMarketPlaceValidations,
  marketplaceSellNftValidations,
  marketplaceAssureNftPriceValidations,
};
