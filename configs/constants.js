// ERROR MESSAGES
const ERROR_MESSAGE = {
  WALLET_CREATE_FAIL: 'Wallet Creation Failed',
  WALLET_NOT_FOUND: 'Could Not Find Requested Wallet',
  FUNDS_TRANSFER_FAIL: 'Fund Transfer Failed',
  TRANSACTION_FAIL: 'Fund Transfer Failed',
  REGISTRATION_FAIL: 'Registration Failed',
  AUTH_FAIL: 'Authentication Failed',
  LOGIN_FAIL: 'Login Failed',
  ADMIN_ALREADY_EXIST: 'Admin already exists',
  USER_EMAIL_ALREADY_EXIST: 'User already exists with this email',
  METAMASKADDRESS_ALREADY_EXIST: `An account with this meta mask address already exists`,
  ACCOUNT_DOES_NOT_EXIST: `Account does not exist in our database please sign up`,
  ARKANE_ALREADY_EXIST: `An account with this arkane address already exists`,
  USER_NAME_ALREADY_EXIST: 'User already exists with this username',
  ADMIN_NOT_EXIST: "Admin doesn't exist",
  INVALID_SECRET: 'The secret is invalid',
  EMAIL_PASSWORD_INCORRECT: 'Email or Password is Incorrect',
  REQUIRED_PARAMETERS_MISSING: 'Required parameters are missing',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  REQUIRE_TOKEN: 'No token available, authorization denied!',
  INVALID_TOKEN: 'Invalid Token, authorization denied',
  INVALID_ID: 'Invalid id provided',
  INVALID_ARTIST: 'Artist id Invalid',
  INVALID_ARTIST_NAME: 'Artist name Invalid',
  INVALID_COLLECTION: 'Collection id Invalid',
  INVALID_MINT: 'Mint id Invalid',
  INVALID_PAINTING: 'Painting is Invalid',
  PAINTING_SALE_ERROR: 'Painting could not be placed for sale',
  UPLOAD_FAILED: 'File upload failed',
  REQUEST_NOT_PROCESSED: 'Request was not processed, try again later',
  MINT_NOT_FOUND: 'Invalid mint provided',
  MINT_ALREADY_ON_SALE: 'Mint already on sale',
  MINT_NOT_OWNED_BY_USER: 'Invalid user',
  MINT_ALREADY_ON_MARKETPLACE: 'Mint already listed on marketplace',
  WORLD_CREATE_FAILED: 'World creation failed',
  WORLD_GET_FAILED: 'World get failed',
  WORLD_UPDATE_FAILED: 'World update failed',
  PAINTING_FILTER_FAILED: 'Paintings could not be filtered',
  ARTIST_NOT_FOUND: 'Artist not present in the world',
  WORLD_DELETE_FAILED: 'World delete Failed',
  INVALID_REQUEST: 'Request not supported',
  USER_NOT_EXIST: 'User does not exist, Please Sign up.',
  INVALID_WORLD: 'Invalid world present',
  INVALID_2FA: 'Code is invalid or expired',
  INVALID_EMAIL_VERIFY_LINK: 'This link is already used or invalid',
  PAYMENT_FAILED: 'Payment failed',
  IPFS_UPLOAD_FAIL: 'IPFS upload failed',
  UPDATE_USER_FAILED: 'Update failed',
  EMAIL_2FA_ACTIVATED: 'Email 2fa activated',
  EMAIL_2FA_DEACTIVATED: 'Email 2fa deactivated',
  AUTHENTICATOR_2FA_ACTIVATED: 'Authenticator app 2fa activated',
  AUTHENTICATOR_2FA_DEACTIVATED: 'Authenticator app 2fa deactivated',
  EMAIL_SET_FAIL: 'Email could not be added to newsletter',
  SEND_EMAIL_VERIFICATION_FAILED: 'Sending verification email failed',
  INVALID_EMAIL: `Please provide a valid email address`,
  BAD_SIGNATURE:
    'The Nonce you signed was outdated, please refresh and try again',
  PAINTING_NOT_EXIST: 'Painting dost not exist please contact support',
  LISTING_TO_MARKETPLACE_FAILED: 'Listing to marketplace failed',
  PAINTING_ID_IS_REQUIRED: 'paintingId is required',
  PAINTING_NOT_FOUND: 'Painting not found',
  WALLET_ADDRESS_NOT_FOUND: 'User wallet address not found',
};

// HTTP STATUS CODES
const HTTP_STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOW: 405,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
};

// Address of Contracts
const CONTRACT_ADDRESSES = {
  POLYGON_OAT_NFT_Address: '0xd6146a4d98266aAc502A5C87Ff56C458197e4380',
  POLYGON_OAT_NFT_SALE_ADDRESS: '0x603AbfAaF6D0086Ac522B8DEC5Db07675b622761',
};

const CHUNK_SIZE_OF_USERS = 5;
const CURRENCY = 'usd';


const FRONTEND_BASE_URL = `https://${process.env.BASE_URL}`;


const STRIPE_EVENTS = {
  checkoutSessionAsyncPaymentFailed: `checkout.session.async_payment_failed`,
  checkoutSessionAsyncPaymentSuccess: `checkout.session.async_payment_succeeded`,
  checkoutSessionExpired: `checkout.session.expired`,
  checkoutSessionCompleted: `checkout.session.completed`,
};

const PAYPAL_EVENTS = {
  checkoutOrderApproved: 'CHECKOUT.ORDER.APPROVED',
  paymentCaptureCompleted: 'PAYMENT.CAPTURE.COMPLETED',
};

const PAINTINGS_RARITY = {
  Unique: 40, // 1
  Legendary: 35, // 2-10
  Extraordinary: 30, // 11-50
  Masterpiece: 25, // 51-100
  Classic: 20, // 101-250
  Rare: 15, // 251-500
  Limited: 10, // 501-999
  Common: 5, // 1000+
  Special: 4,
};

module.exports = {
  ERROR_MESSAGE,
  HTTP_STATUS_CODE,
  CONTRACT_ADDRESSES,
  CHUNK_SIZE_OF_USERS,
  CURRENCY,
  FRONTEND_BASE_URL,
  STRIPE_EVENTS,
  PAYPAL_EVENTS,
  PAINTINGS_RARITY,
};
