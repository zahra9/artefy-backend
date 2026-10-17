const Coupon = require('../../models/coupon.model');

const getUserValidCoupon = async (userId) => {
  return Coupon.findOne({ userId, status: 'valid' });
};

const updateCouponStatus = async (_id, update) => {
  return Coupon.updateOne({ _id }, update);
};

const getCouponById = async (_id) => {
  return Coupon.findOne({ _id });
};

module.exports = {
  getUserValidCoupon,
  updateCouponStatus,
  getCouponById,
};
