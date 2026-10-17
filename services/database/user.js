const { ObjectId } = require('mongoose').Types;

const User = require('../../models/user.model');
const Mint = require('../../models/mint.model');
// const Painting = require('../../models/painting.model');

/**
 * Fetch User from DB
 *
 * @param {string} _id Users DB id
 * @param {object} selectedOpts Select fields for User
 */
const getUserById = async (_id, selectedOpts = {}) => {
  return User.findById(_id).select(selectedOpts);
};

/**
 * Fetch User from DB
 *
 * @param {string} email User Email
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Fetch User from DB
 *
 * @param {string} username User name
 */
const getUserByUsername = async (username) => {
  return User.findOne({ username });
};

const getUserByWalletAddress = async (walletAddress) => {
  const _user = await User.findOne({walletAddress: RegExp(walletAddress, 'ig')});
  return _user;
};

/**
 * Fetch User from DB
 *
 * @param {string} username User name
 */
const getUsersByIP = async (ipAddress) => {
  return User.find({ ipAddress }).exec();
};

const getUserByMintId = async (mintId) => {
  return User.findOne({ mints: ObjectId(mintId) });
};

/**
 * Store user in DB
 *
 * @param {object} user User Object
 */
const addUser = async (user) => {
  const newUser = new User(user);
  return newUser.save();
};

/**
 * Add Mints to user
 *
 * @param {ObjectId} userId userId
 * @param {array} mintIds mintIds
 */
const addMintsToUser = async (userId, mintIds) => {
  try {
    return User.updateOne(
      { _id: userId },
      { $push: { mints: { $each: mintIds } } },
    );
  } catch (err) {
    console.error(err);
    return err;
  }
};

// const getTokenIdFromMintById = async (mintId) => {
//   try {
//     return Mint.findOne({ _id: mintId });
//   } catch (err) {
//     console.log('error in getTokenIdFromMintById::', err);
//     return err;
//   }
// };

// const addMintsToPainting = async (paintingId, mintIds) => {
//   try {
//     return await Painting.updateOne(
//       { _id: ObjectId(paintingId) },
//       { $push: { mints: { $each: mintIds } } },
//     );
//   } catch (err) {
//     console.log('error in addMintsToPainting', err);
//     return err;
//   }
// };

const getAllUsers = async () => {
  try {
    const populateObj = [
      {
        path: 'mints',
        select: {
          name: 1,
          tokenId: 1,
        },
      },
    ];
    const userFields =
      'username email fullName address metaMaskAddress arkaneWalletAddress verified walletAddress';
    return User.find().select(userFields).populate(populateObj).exec();
  } catch (err) {
    console.error(err);
    return err;
  }
};

/**
 * Get user paintings
 *
 * @params {ObjectId} userId user _id
 */
const getUserPaintings = async (_id) => {
  try {
    const populateObj = {
      path: 'mints',
      populate: {
        path: 'paintingID',
        populate: [
          [
            {
              path: 'artists',
              select: { name: 1, bio: 1 },
            },
          ],
          {
            path: 'theme',
            select: { name: 1, paintings: 1 },
          },
        ],
        select: {
          artists: 1,
          artist: 1,
          theme: 1,
          name: 1,
          genre: 1,
          mints: 1,
          dropDate: 1,
          image: 1,
          rarity: 1,
          collectionTitle: 1,
          description: 1,
          filetype: 1,
          price: 1,
          num: 1,
          aboutNFT: 1,
          about: 1,
          paintingFrom: 1,
          cryptoPrice: 1,
          previewImage: 1,
        },
      },
      select: {
        paintingID: 1,
        updatedAt: 1,
        sale: 1,
        tokenId: 1,
        createdAt: 1,
        num: 1,
      },
      // perDocumentLimit: 100
    };
    return User.findOne({ _id }).populate(populateObj).exec();
  } catch (err) {
    return err;
  }
};

const setUserWallet = async (_id, keystore, address) => {
  return User.findOneAndUpdate(
    { _id },
    { keystore: keystore, artefyAddress: address, address: address },
  );
};

const doesArtefyWalletExist = async (_id) => {
  const user = await User.findById(_id);
  if (user.keystore) {
    return true;
  }

  return false;
};

const verifyEmail = async (_id) => {
  return User.updateOne({ _id }, { verified: true, verificationCode: '' });
};

const saveStripeDetails = (_id, stripeCustomerId, stripePaymentMethodId) => {
  return User.findOneAndUpdate(
    { _id },
    { stripeCustomerId, stripePaymentMethodId },
  );
};

const updateUser = (_id, user) => {
  return User.findOneAndUpdate({ _id }, user);
};

const getRecentUsers = () => {
  return User.find({
    verified: true,
    mints: { $size: 0 },
    $or: [{ walletAddress: { $exists: true, $ne: '' } }],
  })
    .sort({ createdAt: 1 })
    .limit(10);
};

const updateUserNonce = async (userId) => {
  return Mint.findOneAndUpdate(
    { _id: userId },
    { nonce: Math.floor(Math.random() * 1000000) },
  );
};

const getUsersMints = async (id) => {
  const user = await User.findById(id).populate('mints');

  return user.mints;
};

const getUserMintsArray = async (id) => {
  const user = await User.findById(id)
    .populate({
      path: 'mints',
      select: ['_id', 'tokenId', 'name', 'num'],
      populate: {
        path: 'paintingID',
        select: [
          '_id',
          'dropDate',
          'dropEndDate',
          'year',
          'theme',
          'genre',
          'cryptoPrice',
          'price',
          'description',
          'about',
          'image',
          'format',
          'size',
          'rarity',
          'filetype',
          'animation_url',
          'previewUrl',
          'preview3DUrl',
          'artist',
        ],
        populate: [
          { path: 'theme', select: ['name'], model: 'Collection' },
          { path: 'artist', select: ['name', 'bio'], model: 'Artist' },
        ],
      },
    })
    .lean();

  return user.mints;
};

const getUserMintsArrayV2 = async (id) => {
  const user = await User.findById(id)
    .populate({
      path: 'mints',
      populate: { path: 'paintingID' },
    })
    .lean();

  return user.mints;
};

module.exports = {
  addUser,
  getUsersByIP,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  getUserPaintings,
  setUserWallet,
  getAllUsers,
  doesArtefyWalletExist,
  verifyEmail,
  saveStripeDetails,
  updateUser,
  getRecentUsers,
  addMintsToUser,
  getUserByMintId,
  updateUserNonce,
  getUserByWalletAddress,
  getUsersMints,
  getUserMintsArray,
  getUserMintsArrayV2,
};
