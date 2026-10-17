const { model, Schema } = require('mongoose');

// keep blockchain and backend in sync.
const couponSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    code: {
      type: Schema.Types.String,
      defualt: '',
    },
    status: {
      type: Schema.Types.String,
      enum: ['valid', 'used'],
    },
    price: {
      type: Schema.Types.String,
      defualt: '1',
    },
    cryptoPrice: {
      type: Schema.Types.String,
      defualt: '0.5',
    },
  },
  { timestamps: true },
);

const Coupon = model('Coupon', couponSchema);
module.exports = Coupon;
