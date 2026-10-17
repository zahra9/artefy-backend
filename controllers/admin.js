const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');
const database = require('../services/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Authenticate User
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const auth = async (request, response) => {
  try {
    const { id } = request.user;

    // Check if token is present
    if (!id)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRE_TOKEN);

    if (await database.admin.getAdminById(id)) {
      return response.status(HTTP_STATUS_CODE.OK).json('verified');
    }

    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json(ERROR_MESSAGE.INVALID_TOKEN);
  } catch (error) {
    console.error('Authentication Failed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.AUTH_FAIL);
  }
};

/**
 * Regsiter Admin
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const register = async (request, response) => {
  try {
    const { email, password, name, secret } = request.body;
    // CHECK IF DATA IS PROVIDED
    if (!email || !password || !name || !secret)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    // CHECK SECRET
    if (secret !== process.env.ADMIN_SECRET)
      return response
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .json(ERROR_MESSAGE.INVALID_SECRET);
    // CHECK IF USER EXISTS
    if (await database.admin.getAdminByEmail(email))
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.ADMIN_ALREADY_EXIST);
    // GENERATE HASH
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    // CREATE ADMIN
    // route only for admins
    const admin = { email, password: passwordHash, name, role: 'admin' };
    const newAdmin = await database.admin.addAdmin(admin);
    // JWT
    const jws = jwt.sign(
      { id: newAdmin._id, role: newAdmin.role },
      process.env.JWT_SECRET,
    );
    // SUCCESS
    const data = {
      token: jws,
      admin: {
        email: newAdmin.email,
        name: newAdmin.name,
      },
    };
    return response.status(HTTP_STATUS_CODE.CREATED).json(data);
  } catch (error) {
    console.error('Registration Failed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Login Admin
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const login = async (request, response) => {
  try {
    const { email, password } = request.body;
    // CHECK IF DATA IS PROVIDED
    if (!email || !password)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    // CHECK IF USER EXISTS
    const admin = await database.admin.getAdminByEmail(email);
    if (!admin)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.ADMIN_NOT_EXIST);
    // VERIFY PASSWORD
    if (!(await bcrypt.compare(password, admin.password)))
      return response
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .json(ERROR_MESSAGE.EMAIL_PASSWORD_INCORRECT);
    // JWT
    const jws = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
    );
    // SUCCESS
    const data = {
      token: jws,
      admin: {
        email: admin.email,
        name: admin.name,
      },
    };
    return response.status(HTTP_STATUS_CODE.CREATED).json(data);
  } catch (error) {
    console.error('Login Failed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LOGIN_FAIL);
  }
};

module.exports = {
  register,
  login,
  auth,
};
