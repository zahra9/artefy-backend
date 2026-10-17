const jwt = require('jsonwebtoken');
const Admin = require('../../models/admin.model');

/**
 * Fetch Admin from DB
 *
 * @param {string} email Admins Email
 */
const getAdminByEmail = async (email) => {
  return Admin.findOne({ email });
};

/**
 * Fetch Admin from DB
 *
 * @param {string} userId Admins DB id
 */
const getAdminById = async (userId) => {
  return Admin.findById(userId);
};

/**
 * Store admin in DB
 *
 * @param {object} admin Admin Object
 */
const addAdmin = async (admin) => {
  const newUser = new Admin(admin);
  return newUser.save();
};

/**
 * Fetch Admin from DB
 *
 * @param {string} token Token
 */
const verifyToken = async (token) => {
  //   Verify Token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role === 'admin') {
    return true;
  }
  return false;
};

module.exports = {
  getAdminByEmail,
  getAdminById,
  addAdmin,
  verifyToken,
};
