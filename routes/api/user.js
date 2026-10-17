const router = require('express').Router();
const controller = require('../../controllers/user');
const { verifyCaptcha } = require('../../controllers/recaptcha');
const { userAuth } = require('../../middlewares/auth');
const {
  registerValidations,
  loginValidations,
  walletsValidations,
  validateWalletAddress,
  validator,
} = require('../../middlewares/validations');

// API to register
router.post(
  '/register',
  verifyCaptcha,
  registerValidations,
  validator,
  walletsValidations,
  controller.register,
);

// API to login
router.post('/login', loginValidations, validator, controller.login);

// Get User for nonce login
router.post('/nonce', controller.getUserNonceByWalletAddress);

// API to Authenticate
router.post('/auth', [userAuth], controller.auth);

// // API to buy mint
// router.post('/buy', controller.buyMint)

// API to fetch secondary sale mints
router.get('/secondaryMint', [userAuth], controller.getSecondaryMint);

// API to put user mint on sale
router.post('/sale', [userAuth], controller.putMintOnSale);

// API to get user paintings
router.get('/paintings', [userAuth], controller.getUserPaintings);

// API to get user details
router.get('/details', [userAuth], controller.getUserDetails);
// API to get user details
router.get('/walletSync', [userAuth], controller.getUserWalletSync);

// API to validate 2fa
router.post('/validate2fa', [userAuth], controller.validate2fa);

// API for email verification
router.post('/verifyEmail', controller.verifyEmail);

// API for user update
router.put('/updateUser', [userAuth], controller.updateUser);

// API for active2fa
router.post('/active2fa', [userAuth], controller.active2fa);

// API for send verification email
router.get('/verificationEmail', [userAuth], controller.sendVerificationEmail);

// API for send 2fa email
router.post('/resend2FAEmail', controller.resend2FAEmail);

// API for checking if user verified
router.get('/checkUserVerified', [userAuth], controller.checkUserVerified);

router.get('/userMints', controller.userMints);

router.get('/valid/coupon', [userAuth], controller.getUserValidCoupon);

router.get('/mints', [userAuth], controller.mints);

router.get(
  '/mints/paintings',
  [userAuth],
  controller.getUserMintsPaintingDetails,
);

router.get(
  '/mints/paintings/raw',
  [userAuth],
  controller.getUserMintsPaintingDetailsWithPaintingV2,
);

router.get('/mints/:id', [userAuth], controller.getMintById);

// API to get user paintings
router.get('/getlistedPaintings', [userAuth], controller.getlistedPaintings);

router.get('/painting/details', controller.paintingDetails);

router.get('/transaction/history/:userWalletAddress', validateWalletAddress, controller.transactionHistory);


module.exports = router;
