const Mints = require('../../models/mint.model');

const getMintByProcessingStatus = async (status) => {
  return Mints.find({
    'sale.processing': status,
    'sale.sold': false,
    'sale.active': true,
  });
};

const getPaintingAvailableMints = async (paintingId) => {
  return Mints.find({
    paintingID: paintingId,
    'sale.processing': false,
    'sale.sold': false,
    'sale.active': true,
  });
};

const updateMintProcessing = (tokenId, flag) => {
  return Mints.updateOne(
    { tokenId: tokenId },
    { $set: { 'sale.processing': flag } },
  );
};
const updateMintFromCrate = (tokenId, lootCrateId) => {
  return Mints.updateOne(
    { tokenId: tokenId },
    { $set: { paintingFrom: 'crate', crateID: lootCrateId } },
  );
};
const getOrderedMintsByOrderId = (orderId) => {
  return Mints.find({ 'sale.orderID': RegExp(orderId, 'ig') });
};

const makeMintAvailableForSale = async (tokenId) => {
  return Mints.findOneAndUpdate(
    { tokenId: tokenId },
    { $set: { 'sale.active': true } },
  );
};

const getLastMintedTokenInDB = async () => {
  return Mints.findOne().sort({ _id: -1 });
};

const getMintsByTokenIds = async (tokenIds) => {
  return Mints.find({ tokenId: { $in: tokenIds } });
};

const getMintsDetailByTokenIds = async (tokenIds) => {
  const populateObj = {
    path: 'paintingID',
    select: '-mints',
    populate: [
      {
        path: 'artists',
        select: {
          name: 1,
          bio: 1,
        },
      },
    ],
  };
  return Mints.find({ tokenId: { $in: tokenIds } })
    .populate(populateObj)
    .exec();
};

const getMintsByPaintingIds = async (ids) => {
  return Mints.find({
    paintingID: { $in: ids },
    'sale.active': true,
    'sale.processing': false,
    'sale.sold': false,
  }).exec();
};

const getTokenIdByMintId = async (mintId) => {
  try {
    return Mints.findOne({ _id: mintId });
  } catch (error) {
    console.error('error in getTokenIdByMintId::', error);
    return error;
  }
};

const getMintByTokenAndOrderId = async (tokenId, orderId) => {
  try {
    return Mints.findOne({ tokenId, 'sale.orderID': RegExp(orderId, 'ig') });
  } catch (err) {
    console.log('error in getTokenIdByMintId::', err);
    return err;
  }
};

const putMintOnSale = async (mintId) => {
  try {
    return Mints.updateOne({ _id: mintId }, { $set: { 'sale.active': true } });
  } catch (err) {
    console.error(err);
    return err;
  }
};

const getMintById = async (mintId) => {
  try {
    return Mints.find({ _id: mintId }).populate('currentBuyer').exec();
  } catch (err) {
    return err;
  }
};

const searchMints = async (query) => {
  try {
    if (query === '') return Mints.find().exec();
    await Mints.createIndexes({ '$**': query });
    return Mints.find({ $text: { $search: query } }).exec();
  } catch (err) {
    return err;
  }
};

const countByOrderIdAndLootCrateId = async (orderId, lootCrateId) => {
  try {
    const count = await Mints.count({
      'sale.orderId': orderId,
      'sale.lootCrateId': lootCrateId,
    });
    return count;
  } catch (err) {
    console.log('countByOrderIdAndLootCrateId==================>', err);
    return err;
  }
};

const makeMintAvailableOnMarketPlace = async (
  mintId,
  itemId,
  price,
  cryptoPrice,
  userId,
) => {
  try {
    return await Mints.updateOne(
      { _id: mintId },
      {
        $set: {
          'marketplace.active': true,
          'marketplace.price': price,
          'marketplace.itemId': itemId,
          'marketplace.cryptoPrice': cryptoPrice,
          currentBuyer: userId,
        },
      },
    );
  } catch (err) {
    return err;
  }
};

const getMintsAvailableOnMarketplaceByPaintingId = async (paintingId) => {
  try {
    return await Mints.find({$and: [{ paintingID: paintingId }, { 'marketplace.active': true }]})
      .select(
        '_id currentBuyer name tokenId sale num marketplace currentAuctionBid auction',
      )
      .populate({
        path: 'currentBuyer',
        select: '_id username',
      });
  } catch (err) {
    return err;
  }
};

const createAuctionForMint = async (
  mintId,
  auctionTokenId,
  startingBidPrice,
  startingBidPriceUSD,
  auctionDuration,
  endTime,
  buyNowPrice,
  buyNowPriceUSD,
) => {
  const updatedMintResponse = await Mints.updateOne(
    { _id: mintId },
    {
      $set: {
        'auction.tokenId': auctionTokenId,
        'auction.startingBidPrice': startingBidPrice,
        'auction.startingBidPriceUSD': startingBidPriceUSD,
        'auction.duration': auctionDuration,
        'auction.active': true,
        'auction.startTime': new Date(),
        'auction.endTime': endTime,
        cryptoPrice: buyNowPrice,
        price: buyNowPriceUSD,
      },
    },
  );
  return updatedMintResponse;
};

const removeMintFromMarketplace = async (mintId) => {
  try {
    return await Mints.updateOne(
      { _id: mintId },
      { $set: { 'marketplace.active': false } },
    );
  } catch (error) {
    return error;
  }
};

const updateMintPriceInMarketplace = async (mintId, cryptoPrice, price) => {
  try {
    return await Mints.updateOne(
      { _id: mintId },
      {
        $set: {
          'marketplace.cryptoPrice': cryptoPrice,
          'marketplace.price': price,
        },
      },
    );
  } catch (error) {
    return error;
  }
};

const sellMintOnMarketplace = async (mintId, userId, cryptoPrice) => {
  try {
    return await Mints.updateOne(
      { _id: mintId },
      {
        $set: {
          'marketplace.active': false,
          'marketplace.lastSaleDate': new Date(),
          'sale.cryptoPrice': cryptoPrice,
        },
        currentBuyer: userId,
      },
    );
  } catch (error) {
    return error;
  }
};

const getUserListedMintsPaintings = async (userId) => {
  try {
    return Mints.find({ currentBuyer: userId, 'marketplace.active': true })
      .select('_id tokenId name num marketplace updatedAt')
      .populate({
        path: 'paintingID',
        select: [
          '_id',
          'dropDate',
          'year',
          'mints',
          'theme',
          'genre',
          'cryptoPrice',
          'price',
          'name',
          'description',
          'about',
          'image',
          'rarity',
          'filetype',
          'artists',
          'paintingFrom',
        ],
        populate: [
          {
            path: 'artists',
            select: ['name', 'bio'],
            model: 'Artist',
          },
          {
            path: 'theme',
            select: ['name', 'description'],
            model: 'Collection',
          },
        ],
      })
      .lean();
  } catch (error) {
    return error;
  }
};

const getPaintingDetail = async (mintID) => {
  try {
    return await Mints.findOne({ _id: mintID })
      .select('_id tokenId name num marketplace updatedAt sale')
      .populate({
        path: 'paintingID',
        select: [
          '_id',
          'dropDate',
          'year',
          'theme',
          'genre',
          'cryptoPrice',
          'price',
          'name',
          'description',
          'about',
          'image',
          'rarity',
          'filetype',
          'paintingFrom',
          'artists',
          'previewImage',
        ],
        populate: [
          {
            path: 'artists',
            select: ['name', 'bio'],
            model: 'Artist',
          },
          {
            path: 'theme',
            select: ['name', 'description'],
            model: 'Collection',
          },
        ],
      })
      .populate({
        path: 'currentBuyer',
        select: ['username', '_id', 'walletAddress'],
      });
  } catch (error) {
    return error;
  }
};
const getOwnMints = async (paintingID) => {
  try {
    return await Mints.find({ paintingID })
      .select('_id tokenId name num marketplace updatedAt currentBuyer')
      .populate({ path: 'currentBuyer', select: ['username'] });
  } catch (error) {
    return error;
  }
};
const getMintWithDetails = async (mintId) => {
  try {
    return Mints.findOne({ _id: mintId })
      .select('tokenId name num currentBuyer marketplace')
      .populate([
        { path: 'paintingID', select: ['price', 'cryptoPrice', 'rarity'] },
        { path: 'currentBuyer', select: ['name', 'email', 'walletAddress'] },
      ])
      .lean();
  } catch (err) {
    console.log("Error while getting mint's details");
    return err;
  }
};

module.exports = {
  getPaintingAvailableMints,
  getMintByProcessingStatus,
  updateMintProcessing,
  updateMintFromCrate,
  makeMintAvailableForSale,
  getLastMintedTokenInDB,
  getMintsByTokenIds,
  getTokenIdByMintId,
  putMintOnSale,
  getMintById,
  searchMints,
  getOrderedMintsByOrderId,
  getMintByTokenAndOrderId,
  getMintsDetailByTokenIds,
  countByOrderIdAndLootCrateId,
  getMintsByPaintingIds,
  makeMintAvailableOnMarketPlace,
  getMintsAvailableOnMarketplaceByPaintingId,
  createAuctionForMint,
  removeMintFromMarketplace,
  updateMintPriceInMarketplace,
  sellMintOnMarketplace,
  getUserListedMintsPaintings,
  getPaintingDetail,
  getOwnMints,
  getMintWithDetails,
};
