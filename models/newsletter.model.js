const { model, Schema } = require('mongoose');

const validEmailRe = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const validateEmail = function(email) {
  return validEmailRe.test(email);
};

const newsLetter = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
  },
  {timestamps: true},
);

const NewsLetter = model('Newsletter', newsLetter);
module.exports = NewsLetter;
