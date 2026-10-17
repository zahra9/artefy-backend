const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { ObjectId } = require('mongoose').Types;
const axios = require('axios');
const crypt = require('../utils/crypt');
const { isEmail, POLYGON_API_URL, getTransactionTypeAndPrice } = require('../utils/helpers');
const sendgrid = require('../services/sendgrid');
const database = require('../services/database');
const LootCrateCollections = require('../models/lootCrateContainer.model');
const Drop = require('../models/drop.model');
const Mint = require('../models/mint.model');
const {
  ERROR_MESSAGE,
  HTTP_STATUS_CODE,
} = require('../configs/constants');
const { getEditionDetails } = require('./common/helper');
const ethUtil = require('ethereumjs-util');
const { web3Instance } = require('../utils/helpers');
const { walletSync } = require('../services/wallet/wallet');
const { OatProxyAddress, PolygonScanURL } = require('../configs/config');
/**
 * Regsiter User
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const register = async (request, response) => {
  try {
    const { username, email, walletAddress, walletType } = request.body;

    // ------- Last Registered User with Same Ip should be created at more than  12 hours ago -------//
    const usersWithSameIp = await database.user.getUsersByIP(request.ipAddress);
    if (usersWithSameIp && usersWithSameIp.length >= 3) {
      const lastRegisterTimeElapsed =
        new Date().getHours() -
        new Date(
          usersWithSameIp[usersWithSameIp.length - 1].createdAt,
        ).getHours();

      if (
        lastRegisterTimeElapsed > 12 && // condition to match User created time is greater than 12
        process.env.ENV !== 'DEVELOPMENT'
      ) {
        return response.status(401).json({
          success: false,
          message: 'Too many requests',
        });
      }
    }

    const secret = speakeasy.generateSecret({ name: 'Artefy' });
    const verificationCode = Math.floor(Math.random() * 100000 + 100);

    const user = {
      email,
      secret,
      username,
      verificationCode,
      verified: false,
      walletAddress,
      walletType,
      ipAddress: request.ipAddress,
    };

    const newUser = await database.user.addUser(user);

    // JWT
    const jws = jwt.sign(
      { id: newUser._id, role: 'user' },
      process.env.JWT_SECRET,
    );

    const data = {
      success: true,
      message: 'A verification link has been sent to your email.',
      token: jws,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: walletAddress,
        walletType: walletType,
        generated: false,
        qrcodeURL: secret.otpauth_url,
        verified: false,
      },
    };

    await sendgrid.accountConfirmation(user.email, verificationCode);

    return response.status(HTTP_STATUS_CODE.CREATED).json(data);
  } catch (error) {
    console.error('Registration Failed: ', error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error);
  }
};

const getUserNonceByWalletAddress = async (request, response) => {
  const { walletAddress } = request.body;

  const user = await database.user.getUserByWalletAddress(walletAddress);
  if (!user)
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json(ERROR_MESSAGE.USER_NOT_EXIST);

  if (!user.nonce) {
    user.nonce = Math.floor(Math.random() * 1000000);
    await user.save();
  }

  return response
    .status(HTTP_STATUS_CODE.OK)
    .json({ success: true, data: { nonce: user.nonce } });
};

/**
 * Login User
 *
 * @param request
 * @param response
 */
const login = async (request, response) => {
  try {
    const { walletAddress, signature } = request.body;
    let user = {};
    if (!walletAddress) {
      return response
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .send({ success: true, message: ERROR_MESSAGE.WALLET_ADDRESS_FAILED });
    }
    user = await database.user.getUserByWalletAddress(walletAddress);
    if (!user)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.ACCOUNT_DOES_NOT_EXIST);

    const msg = `I am signing my one-time nonce for artefy.io: ${user.nonce}`;
  
    const hexMsg = web3Instance().utils.stringToHex(msg);
    const msgBuffer = ethUtil.toBuffer(hexMsg);
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    if (!signature) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.BAD_SIGNATURE);
    }
    const signatureBuffer = ethUtil.toBuffer(signature);
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s,
    );
    

    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);
    const token = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET,
    );
    const data = {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        address: user.arkaneWalletAddress,
        generated: true,
        verified: user.verified,
        walletAddress: user?.walletAddress,
        walletType: user?.walletType,
      },
    };
    if (address.toLowerCase() === walletAddress.toLowerCase()) {
      user.nonce = Math.floor(Math.random() * 1000000);
      user.lastLoginIpAddress = request.ipAddress;
      user.lastLoginTime = Date.now();
      user.save();
      return response
        .status(HTTP_STATUS_CODE.CREATED)
        .json({ success: true, message: 'Successfully logged in', data });
    }
    return response
      .status(HTTP_STATUS_CODE.UNAUTHORIZED)
      .send({ success: true, message: 'Signature verification failed' });
  } catch (err) {
    console.error('Login Failed: ', err);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .send({ success: false, message: ERROR_MESSAGE.LOGIN_FAIL });
  }
};

/**
 * Authenticate User
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const auth = async (request, response) => {
  try {
    const { id } = request.user;

    // @todo - move to middleware
    const user = await database.user.getUserById(id, {
      email: 1,
      _id: 0,
      blockchain: 1,
    });

    const jws = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET,
    );

    let data;
    if (user.artefyAddress) {
      data = {
        token: jws,
        user: {
          username: user.username,
          email: user.email,
          address: user.artefyAddress,
          generated: true,
          verified: user.verified,
          walletAddress: user.artefyAddress,
        },
      };
    } else {
      data = {
        token: jws,
        user: {
          username: user.username,
          email: user.email,
          address: user?.streetAddressLine1,
          generated: false,
          verified: user.verified,
          walletAddress: user.walletAddress,
        },
      };
    }

    if (user) return response.status(HTTP_STATUS_CODE.OK).json(data);

    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json(ERROR_MESSAGE.USER_NOT_EXIST);
  } catch (error) {
    console.error('Authentication Failed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.AUTH_FAIL);
  }
};

/**
 * Export Private Key
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const exportPrivateKey = async (request, response) => {
  try {
    const { id } = request.user;
    const { password } = request.body;

    // @todo - move to middleware
    const user = await database.user.getUserById(id);
    if (!user)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.USER_NOT_EXIST);

    // VERIFY PASSWORD
    if (!crypt.compareHash(password, user.password))
      return response
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .json(ERROR_MESSAGE.EMAIL_PASSWORD_INCORRECT);

    // DECRYPT PRIVATE KEY USING PASSWORD
    const encryptedPrivateKey = user.keys.encryptedPrivateKey;
    const privateKey = crypt.decrypt(encryptedPrivateKey, password);

    // SUCCESS
    const data = { privateKey };

    return response.status(HTTP_STATUS_CODE.OK).json(data);
  } catch (error) {
    console.error('Failed to export private key: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LOGIN_FAIL);
  }
};

/**
 * Get mints for secondary sale
 *
 * @param {request} - request Object
 * @param {response} - response Object
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 * @param {string} request.query.search - Search Text
 */
const getSecondaryMint = async (request, response) => {
  try {
    if (
      request.query.search === undefined ||
      request.query.numberOfRows === undefined ||
      request.query.page === undefined
    ) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    let mints = await database.user.searchMints(request.query.search);

    // get only active for sale mints
    mints = mints.filter(
      (m) => m.sale.active === true && m.currentBuyer !== '',
    );
    mints.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      return 0;
    });

    return response.json({
      mints: mints.slice(
        parseInt(request.query.page, 10) *
          parseInt(request.query.numberOfRows, 10),
        parseInt(request.query.page, 10) *
          parseInt(request.query.numberOfRows, 10) +
          parseInt(request.query.numberOfRows, 10),
      ),
      Total: mints.length,
    });
  } catch (error) {
    console.error('Mints could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Put mints for sale of a user
 *
 * @param {request} - request Object
 * @param {response} - response Object
 */
const putMintOnSale = async (request, response) => {
  try {
    const { mintId, address } = request.body;
    if (!ObjectId.isValid(mintId)) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.INVALID_MINT);
    }

    if (!address) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    const mint = (await database.mint.getMintById(mintId))[0];
    if (!mint) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.MINT_NOT_FOUND);
    }

    if (mint.sale.active) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.MINT_ALREADY_ON_SALE);
    }
    if (mint.currentBuyer.address !== address) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.MINT_NOT_OWNED_BY_USER);
    }

    await database.mint.putMintOnSale(mintId);
    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Mint put on sale success' });
  } catch (error) {
    console.error('Mints could not be placed on sale: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Get User Details
 *
 * @param {request} - request Object
 * @param {response} - response Object
 * @param {string} request.params.userId - userId
 */
const getUserDetails = async (request, response) => {
  try {
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const userDetails = await database.user.getUserById(userId);
    if (!userDetails) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.USER_NOT_EXIST);
    }

    const res = {
      _id: userDetails._id,
      username: userDetails.username,
      email: userDetails.email,
      firstName: userDetails.firstName || '',
      lastName: userDetails.lastName || '',
      fullName: userDetails.fullName || '',
      country: userDetails.country || '',
      state: userDetails.state || '',
      streetAddressLine1: userDetails.streetAddressLine1 || '',
      streetAddressLine2: userDetails.streetAddressLine2 || '',
      suburb: userDetails.suburb || '',
      zipCode: userDetails.zipCode || '',
      recoveryEmail: userDetails.recoveryEmail || '',
      email2fa: userDetails.email2fa || false,
      auth2fa: userDetails.auth2fa || false,
      walletAddress: userDetails.walletAddress,
      walletType: userDetails.walletType,
      generated: false,
    };
    // await walletSync(userDetails); // Sync Wallet Assets For User.

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, data: res });
  } catch (error) {
    console.error('User details could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};
const getUserWalletSync = async (request, response) => {
  try {
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const userDetails = await database.user.getUserById(userId);
    if (!userDetails) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.USER_NOT_EXIST);
    }

    await walletSync(userDetails); // Sync Wallet Assets For User.
    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, data: {} });
  } catch (error) {
    console.error('User details could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Get user paintings
 *
 * @param {request} - request Object
 * @param {response} - response Object
 * @param {string} request.params.userId - userId
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 */
const getUserPaintings = async (request, response) => {
  try {
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const userDetails = await database.user.getUserById(userId);

    if (!userDetails) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.USER_NOT_EXIST);
    }

    const userMints = await database.user.getUserPaintings(userId);
    const count = {
      nftCount: userMints.mints.length,
      artistCount: [],
      collectionCount: [],
    };

    if (!count.nftCount) {
      return response
        .status(HTTP_STATUS_CODE.OK)
        .json({ paintings: [], count });
    }

    return response.json({
      paintings: userMints.mints,
      count,
    });
  } catch (error) {
    console.error('User paintings could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Validate 2FA
 *
 * @param {request} - request Object
 * @param {response} - response Object
 */
const validate2fa = async (request, response) => {
  try {
    const token = request.header('x-auth-token');
    const { twoFACode, login: _login } = request.body;
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const user = await database.user.getUserById(userId);
    if (!user) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.USER_NOT_EXIST);
    }

    const res = {};
    const validated = speakeasy.totp.verify({
      secret: user.secret.base32,
      encoding: 'base32',
      token: twoFACode,
      window: 2,
    });
    if (validated) {
      if (_login === false) {
        await database.user.updateUser(userId, { auth2fa: true });
      }

      let data;
      if (user.artefyAddress) {
        data = {
          token,
          user: {
            username: user.username,
            email: user.email,
            address: user.artefyAddress,
            generated: true,
            verified: user.verified,
            walletAddress: user.artefyAddress,
          },
        };
      } else {
        data = {
          token,
          user: {
            username: user.username,
            email: user.email,
            address: user.streetAddressLine1,
            generated: false,
            verified: user.verified,
            walletAddress: user.walletAddress,
          },
        };
      }

      res.validated = true;
      res.success = true;
      res.message = 'Code is valid';
      res.data = data;
      return response.status(HTTP_STATUS_CODE.OK).json(res);
    }
    res.validated = false;
    res.success = false;
    res.message = ERROR_MESSAGE.INVALID_2FA;
    return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json(res);
  } catch (error) {
    console.error('User could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Get user paintings
 *
 * @param {request} - request Object
 * @param {response} - response Object
 */
const verifyEmail = async (request, response) => {
  try {
    const { email, code } = request.body;
    if (!email || !code) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    // CHECK IF USER EXISTS
    const user = await database.user.getUserByEmail(email);
    if (!user) {
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    // CHECK IF CODE MATCHES.
    let res = {};
    if (code !== user.verificationCode) {
      res.success = false;
      res.message = ERROR_MESSAGE.INVALID_EMAIL_VERIFY_LINK;
      return response.status(HTTP_STATUS_CODE.CONFLICT).json(res);
    }

    await database.user.verifyEmail(user._id);

    await sendgrid.congratsSignup(user.email);
    // JWT
    const jws = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET,
    );

    res = {
      success: true,
      message: 'Email is verified',
      token: jws,
    };
    return response.status(HTTP_STATUS_CODE.OK).json(res);
  } catch (error) {
    console.error('User could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Update User
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const updateUser = async (request, response) => {
  try {
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const {
      username,
      email,
      firstName,
      lastName,
      country,
      state,
      streetAddressLine1,
      streetAddressLine2,
      suburb,
      zipCode,
      recoveryEmail,
      fullName,
    } = request.body;

    // Check email or username provided
    if (!email || !username) {
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING,
      });
    }

    // Check if user does exist in the database
    const user = await database.user.getUserById(userId);
    if (!user) {
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    // TODO: We need a way to verify if user is authorised to make this hcange
    // Previously we were asking user to give the password, that is no more the case
    const updatedUserData = {
      username: username || user.username,
      email: email || user.email,
      firstName: firstName || user.firstName,
      fullName: fullName || user.fullName,
      lastName: lastName || user.lastName,
      country: country || user.country,
      state: state || user.state,
      streetAddressLine1: streetAddressLine1 || user.streetAddressLine1,
      streetAddressLine2: streetAddressLine2 || user.streetAddressLine2,
      suburb: suburb || user.suburb,
      zipCode: zipCode || user.zipCode,
      recoveryEmail: recoveryEmail,
    };
    await database.user.updateUser(userId, updatedUserData);
    const updatedUser = await database.user.getUserById(userId);

    const data = {
      success: true,
      message: 'User updated',
      user: updatedUser,
    };
    return response.status(HTTP_STATUS_CODE.CREATED).json(data);
  } catch (error) {
    console.error('Update User failed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json({ success: false, message: ERROR_MESSAGE.UPDATE_USER_FAILED });
  }
};

/**
 * Update User
 *
 * @param {req} - Request Object
 * @param {res} - Response Object
 */
const active2fa = async (req, res) => {
  try {
    const { id } = req.user;
    const { active, service } = req.body;

    // CHECK IF active available
    if (
      typeof active !== 'boolean' ||
      (service !== 'email' && service !== 'auth')
    ) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING,
      });
    }

    // CHECK IF USER EXISTS
    const user = await database.user.getUserById(id);
    if (!user) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    if (service === 'email') {
      await database.user.updateUser(id, { email2fa: active });
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: active
          ? ERROR_MESSAGE.EMAIL_2FA_ACTIVATED
          : ERROR_MESSAGE.EMAIL_2FA_DEACTIVATED,
      });
    }
    if (active === false) {
      await database.user.updateUser(id, { auth2fa: active });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: active
        ? ERROR_MESSAGE.AUTHENTICATOR_2FA_ACTIVATED
        : ERROR_MESSAGE.AUTHENTICATOR_2FA_DEACTIVATED,
      qrcodeURL: user.secret.otpauth_url,
    });
  } catch (error) {
    console.error('Email 2fa could not be activated: ', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
    });
  }
};

/**
 * Send verification email
 *
 * @param {req} - Request Object
 * @param {res} - Response Object
 */
const sendVerificationEmail = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await database.user.getUserById(id);
    if (!user) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    const verificationCode = Math.floor(Math.random() * 10000 + 100);
    await database.user.updateUser(id, { verificationCode });
    await sendgrid.accountConfirmation(user.email, verificationCode);

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Sending verification email failed: ', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: ERROR_MESSAGE.SEND_EMAIL_VERIFICATION_FAILED,
    });
  }
};

const resend2FAEmail = async ({ body }, res) => {
  try {
    const { username } = body;
    if (!username) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: 'Missing required parama',
      });
    }

    let user = {};
    if (isEmail(username)) {
      user = await database.user.getUserByEmail(username);
    } else {
      user = await database.user.getUserByUsername(username);
    }

    if (!user) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    const twoFACode = speakeasy.totp({
      secret: user.secret.base32,
      encoding: 'base32',
    });
    await sendgrid.twoFACode(user.email, twoFACode);
    return res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      message: 'A new 2fa code is sent to your email address',
    });
  } catch (error) {
    console.error('Sending 2fa email failed: ', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Sending 2fa email failed',
    });
  }
};

const checkUserVerified = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await database.user.getUserById(id);
    if (!user) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.USER_NOT_EXIST,
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: `User is ${user.verified ? 'verified' : 'unverified'}`,
      data: { verified: user.verified },
    });
  } catch (error) {
    console.error('Checking user verified error ', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Checking user verified failed',
    });
  }
};

const userMints = async (req, res) => {
  try {
    const users = await database.user.getAllUsers();
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: `User with mints are fetched`,
      data: { users: users },
    });
  } catch (error) {
    console.error(error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Checking user with mints failed',
    });
  }
};

/**
 * Get this user's mints
 *
 * @param {req} - Request Object
 * @param {res} - Response Object
 */
const mints = async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    const _mints = await database.user.getUsersMints(
      jwt.verify(token, process.env.JWT_SECRET).id,
    );

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: `User's mints fetched`,
      data: { _mints },
    });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: "Getting user's mints failed",
    });
  }
};

const getUserValidCoupon = async (req, res) => {
  try {
    const { id } = req.user;
    const coupon = await database.coupon.getUserValidCoupon(id);
    if (!coupon) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: 'No coupon available',
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.log('error =====', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: "Getting user's coupon failed",
    });
  }
};

const getUserMintsPaintingDetails = async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    const paintingDetails = await database.user.getUserMintsArray(
      jwt.verify(token, process.env.JWT_SECRET).id,
    );
    if (!paintingDetails.length) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User's paintings not found",
      });
    }
    const paintings = await Promise.all(
      paintingDetails.map(async (painting) => {
        const { name, tokenId, num, paintingID } = painting;
        const { theme, ...restPainting } = paintingID;
        const isFromCrate = await LootCrateCollections.find({paintings: { $in: [paintingID._id] }});
        if (isFromCrate.length > 0) {
          return {
            name,
            tokenId,
            num,
            ...restPainting,
            paintingFrom: 'Crate',
            collection: theme?.name || 'N/A',
          };
        }
        const isFromDrop = await Drop.find({paintings: { $in: [paintingID._id] }});
        if (isFromDrop.length > 0) {
          return {
            name,
            tokenId,
            num,
            ...restPainting,
            paintingFrom: 'Drops',
            collection: theme?.name || 'N/A',
          };
        }

        return {
          name,
          tokenId,
          num,
          ...restPainting,
          paintingFrom: 'N/A',
          collection: theme?.name || 'N/A',
        };
      }),
    );
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "User's paintings found",
      paintings,
    });
  } catch (err) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: `Failed to fetch user mints`,
    });
  }
};

const getUserMintsPaintingDetailsWithPaintingV2 = async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    const paintingDetails = await database.user.getUserMintsArrayV2(
      jwt.verify(token, process.env.JWT_SECRET).id,
    );
    if (!paintingDetails.length) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User's paintings not found",
      });
    }
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "User's paintings found",
      paintingDetails,
    });
  } catch (err) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Failed to fetch user mints',
    });
  }
};

const getlistedPaintings = async (request, response) => {
  try {
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const userDetails = await database.user.getUserById(userId);

    if (!userDetails) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.USER_NOT_EXIST);
    }

    const userListedMints = await database.mint.getUserListedMintsPaintings(
      userId,
    );

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ paintings: userListedMints });
  } catch (err) {
    console.log(err);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: "Getting user's listed mints failed",
    });
  }
};

const getMintById = async (request, response) => {
  try {
    const mintId = request.params.id;
    const mint = await database.mint.getMintById(mintId);
    if (!mint) {
      return response.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User's mint not found",
      });
    }
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "User's mint found",
      mint,
    });
  } catch (err) {
    console.log(err);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: "Getting user's  mints failed",
    });
  }
};
const paintingDetails = async (request, response) => {
  const {mintId} = request.query;
  try{
    const detail = await database.mint.getPaintingDetail(mintId);
    const ownedMint = await database.mint.getOwnMints(detail.paintingID._id);
    const editionOverviewDetails = await getEditionDetails(
      ownedMint,
    );
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "User's mint found",
      detail,
      ownedMint,
      editionOverview: editionOverviewDetails,
    });
  }catch ( e ) {
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: "error while fecthing NFT Detail",
    });
  }
};

const transactionHistory = async (req, res) => {
  try {
    const { params: { userWalletAddress } } = req;
    const mintSelectedOpts = 'tokenId sale paintingID paintingFrom marketplace';
    const paintingPopulateObject = {
      path: 'paintingID',
      select: { name: 1, previewImage: 1, previewUrl: 1, dropDate: 1, dropEndDate: 1, maticPrice: 1, saleType: 1 },
    };
    // Get: Polgonscan result
    const { data: { result } } = await axios.get(POLYGON_API_URL(PolygonScanURL, OatProxyAddress, userWalletAddress));

    const tokenIds = result?.map(({ tokenID }) => tokenID);

    const mintsData = await Mint.find({ tokenId: { $in: tokenIds } })
      .lean()
      .select(mintSelectedOpts)
      .populate(paintingPopulateObject);
    
    const transactionsData = result?.map(({ timeStamp, hash, from, to, tokenID }) => {
      const { sale, paintingID, marketplace, paintingFrom } = mintsData.find((mintObj) => mintObj?.tokenId === tokenID);
      const { name, previewImage, previewUrl, dropDate, dropEndDate, maticPrice, saleType } = paintingID;
      const transaction = {
        transactionId: hash,
        timeStamp,
        paintingFrom,
        name,
        dropDate,
        saleType,
        maticPrice,
        dropEndDate,
        ...(getTransactionTypeAndPrice(from, to, userWalletAddress, sale, marketplace)),
        previewUrl: previewImage || previewUrl,
      };
      return transaction;
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'User transactions',
      data: transactionsData,
    });
  } catch (error) {
    console.log({ error });
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'error while fecthing transation history',
    });
  }
};

module.exports = {
  register,
  userMints,
  login,
  auth,
  exportPrivateKey,
  getUserDetails,
  getSecondaryMint,
  putMintOnSale,
  getUserPaintings,
  validate2fa,
  verifyEmail,
  updateUser,
  active2fa,
  sendVerificationEmail,
  resend2FAEmail,
  checkUserVerified,
  getUserNonceByWalletAddress,
  mints,
  getUserMintsPaintingDetails,
  getUserMintsPaintingDetailsWithPaintingV2,
  getUserValidCoupon,
  getlistedPaintings,
  getUserWalletSync,
  getMintById,
  paintingDetails,
  transactionHistory,
};
