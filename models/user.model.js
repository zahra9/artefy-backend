const { model, Schema } = require('mongoose');

const validateEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const validateEmail = (email) => {
  return validateEmailRe.test(email);
};

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [
        validateEmailRe,
        'Please fill a valid email address',
      ],
    },
    nonce: {
      allowNull: false,
      type: Schema.Types.Number,
      defaultValue: () => Math.floor(Math.random() * 1000000), // Initialize with a random nonce
    },
    ipAddress: { type: String },
    fullName: { type: String },
    country: { type: String },
    state: { type: String },
    streetAddressLine1: { type: String },
    streetAddressLine2: { type: String },
    suburb: { type: String },
    zipCode: { type: String },
    blockchain: { encryptedPrivateKey: { type: String } },
    walletAddress: { type: String },
    walletType: { type:String },
    keys: {
      publicKey: { type: String },
      encryptedPrivateKey: {
        iv: { type: String },
        content: { type: String },
      },
    },
    keystore: { type: Object },
    passPharse: { type: String },
    secret: { type: Object },
    verificationCode: { type: String },
    verified: { type: Boolean },
    mints: [{ type: Schema.Types.ObjectId, ref: 'Mint' }],
    email2fa: { type: Boolean, default: false },
    auth2fa: { type: Boolean, default: false },
    lastLoginIpAddress: { type: String },
    lastLoginTime: { type: Date },
  },
  { timestamps: true },
);

const User = model('User', userSchema);
module.exports = User;
