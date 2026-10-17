const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const CRYPTOCONFIG = require('../configs/crypto.json');
const algorithm = CRYPTOCONFIG.CIPHER_ALGORITHM;
const iv = crypto.randomBytes(CRYPTOCONFIG.RANDOM_BYTE_SIZE);

/**
 * Encrypt Text
 *
 * @param {string} text -  Text to be Encrypted
 * @param {string} secretKey -  Secret Key used for Encryption
 * @returns {object}
 * */
const encrypt = (text, secretKey) => {
  const key = crypto
    .createHash(CRYPTOCONFIG.ENC_HASH_ALGORITHM)
    .update(String(secretKey))
    .digest(CRYPTOCONFIG.ENC_DIGEST_ENCODING)
    .substr(0, 32);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString(CRYPTOCONFIG.GENERAL_BUFFER_ENCODING),
    content: encrypted.toString(CRYPTOCONFIG.GENERAL_BUFFER_ENCODING),
  };
};

/**
 * Encrypt Text - Public Key Encryption
 *
 * @param {string} text -  Text to be Encrypted
 * @param {string} publicKey -  Public Key used for Encryption
 * @returns {object}
 * */
const publicEncrypt = (text, publicKey) => {
  return crypto
    .publicEncrypt({ key: publicKey }, Buffer.from(text, 'utf-8'))
    .toString('base64');
};

/**
 * Decrypt Text
 *
 * @param {object} encrypted -  Encrypted Data Object
 * @param {string} secretKey -  Secret Key used for Decryption
 * @returns {string}
 * */
const decrypt = (encrypted, secretKey) => {
  const key = crypto
    .createHash(CRYPTOCONFIG.ENC_HASH_ALGORITHM)
    .update(String(secretKey))
    .digest(CRYPTOCONFIG.ENC_DIGEST_ENCODING)
    .substr(0, 32);
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encrypted.iv, CRYPTOCONFIG.GENERAL_BUFFER_ENCODING),
  );
  const decrpyted = Buffer.concat([
    decipher.update(
      Buffer.from(encrypted.content, CRYPTOCONFIG.GENERAL_BUFFER_ENCODING),
    ),
    decipher.final(),
  ]);
  return decrpyted.toString();
};

/**
 * Generates A Pair of Public and Private Keys
 *
 * @returns {object}
 * */
const generateKeyPair = () => {
  const rsaKeyPair = crypto.generateKeyPairSync(CRYPTOCONFIG.KEY_PAIR_ALGORITHM, {
    modulusLength: CRYPTOCONFIG.KEY_PAIR_SIZE,
    publicKeyEncoding: {
      type: CRYPTOCONFIG.KEY_PAIR_PUBLIC_ENCODING_TYPE,
      format: CRYPTOCONFIG.KEY_PAIR_PUBLIC_ENCODING_FORMAT,
    },
    privateKeyEncoding: {
      type: CRYPTOCONFIG.KEY_PAIR_PRIVATE_ENCODING_TYPE,
      format: CRYPTOCONFIG.KEY_PAIR_PRIVATE_ENCODING_FORMAT,
    },
  });
  return rsaKeyPair;
};

/**
 * Create Hash Value of Input
 *
 * @param {string} text -  Text to Hash
 * @returns {string}
 * */
const createHashVal = (text, useBcrypt = true) => {
  const salt = bcrypt.genSaltSync(CRYPTOCONFIG.BCRYPT_SALT_ROUNDS);
  if (useBcrypt) return bcrypt.hashSync(text, salt);
  return crypto
    .createHash(CRYPTOCONFIG.HASH_ALGORITHM)
    .update(text)
    .digest(CRYPTOCONFIG.DIGEST_ENCODING);
};

/**
 * Compare Hash
 *
 * @param {string} plainText
 * @param {string} textHash
 * @returns {boolean}
 * */
const compareHash = async (plainText, textHash) => {
  return bcrypt.compare(plainText, textHash);
};

module.exports = {
  encrypt,
  publicEncrypt,
  decrypt,
  generateKeyPair,
  createHashVal,
  compareHash,
};
