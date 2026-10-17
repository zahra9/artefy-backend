const Painting = require('../../models/painting.model');
const Collection = require('../../models/collection.model');
const Artist = require('../../models/artist.model');
const Mints = require('../../models/mint.model');
const { sortNFTsByRarity } = require('../../controllers/common/helper');
const { ObjectId } = require('mongoose').Types;

const getPaintingById = (id) => {
  return Painting.findById(id);
};

const getPaintingsByIds = async (ids) => {
  const paintings = await Painting.find({_id: { $in: ids.map((id) => ObjectId(id)) }})
    .populate({
      path: 'artists',
      model: 'Artist',
    })
    .populate({
      path: 'theme',
      model: 'Collection',
    });
  return paintings;
};

const getCollectionByPaintingId = (id) => {
  return Collection.findOne({ paintings: { $in: [ObjectId(id)] } });
};

const getArtistByPaintingId = (id) => {
  return Artist.findOne({ _id: id });
};

const getPaintingIdByTokenId = (id) => {
  return Mints.findOne({ tokenId: id });
};

const getAvailableMintsByPaintingId = (id) => {
  return Mints.findOne({$and: [{ 'sale.active': true }, { 'sale.sold': false }, { paintingID: id }]});
};
const getMintById = (id) => {
  return Mints.findOne({ _id: id });
};
const getMintByTokenID = (tokenID) => {
  return Mints.findOne({ tokenId: tokenID });
};

const getAllAvailableMintsByPaintingId = (_id) => {
  return Painting.findOne({ _id }).populate('mints').exec();
};

const setNFTSoldToTrue = (tokenId, mint) => {
  return Mints.updateOne({ tokenId }, mint);
};

const checkOrderExist = (orderId) => {
  return Mints.findOne({ 'sale.orderID': RegExp(orderId, 'ig') });
};

const checkOrderByTxnHash = (txnHash) => {
  return Mints.findOne({ 'sale.txnHash': txnHash });
};

const updateNFTAfterTransaction = (sold, txnHash, tokenId) => {
  return Mints.updateOne({ tokenId }, { sale: { txnHash, sold } });
};

const getMintsWithPaintingIDAndToken = async (paintingId, tokenIds) => {
  return Mints.find({
    paintingID: ObjectId(paintingId),
    tokenId: { $in: tokenIds },
  });
};

const getAvailableMintsByArrayIds = (ids) => {
  return Mints.find({
    $and: [
      { 'sale.active': true },
      { 'sale.sold': false },
      // { 'sale.processing': false },
      { _id: { $in: ids } },
    ],
  });
};

const updateMintProcessing = (tokenId, flag) => {
  return Mints.updateOne(
    { tokenId: tokenId },
    { $set: { 'sale.processing': flag } },
  );
};

const updateSingleMintByTokenId = (
  tokenId,
  transactionHash,
  orderId,
  cryptoPrice,
  price,
  lootCrateId = '',
) => {
  return Mints.updateOne(
    { tokenId: tokenId },
    {
      $set: {
        'sale.purchasedAt': new Date(),
        'sale.active': false,
        'sale.sold': true,
        'sale.txnHash': transactionHash,
        'sale.orderID': orderId,
        'sale.lootCrateId': lootCrateId,
        'sale.cryptoPrice': cryptoPrice,
        'sale.price': price,
        'sale.processing': false,
      },
    },
  );
};

const updateMintActiveStatus = (id, status) => {
  return Mints.updateOne({ _id: id }, { $set: { 'sale.active': status } });
};

const addMintsToPainting = async (paintingId, mintIds) => {
  try {
    return Painting.updateOne(
      { _id: ObjectId(paintingId) },
      { $push: { mints: { $each: mintIds } } },
    );
  } catch (error) {
    console.error('error in addMintsToPainting', error);
    return error;
  }
};

const dropPagePainting = (id) => {
  return Painting.findById({ _id: id });
};

const makePaintingAvailableOnMarketPlace = async (
  paintingId,
  fieldToUpdate,
) => {
  try {
    const inc = { $inc: {} };
    inc.$inc[`marketplace.${fieldToUpdate}`] = 1;
    return Painting.updateOne({ _id: paintingId }, inc);
  } catch (err) {
    console.error(err);
    return err;
  }
};

const removeMintFromPaintingAvailableOnMarketPlace = async (
  paintingId,
  fieldToUpdate = 'availableForSale',
) => {
  try {
    const inc = { $inc: {} };
    inc.$inc[`marketplace.${fieldToUpdate}`] = -1;
    let query = {
      _id: paintingId,
      'marketplace.availableForSale': { $gt: 0 },
    };
    if (fieldToUpdate === 'availableForAuction') {
      query = {
        _id: paintingId,
        'marketplace.availableForAuction': { $gt: 0 },
      };
    }
    return Painting.updateOne(query, inc);
  } catch (err) {
    console.error(err);
    return err;
  }
};

const getPaintingsAvailableOnMarketPlace = async (
  query,
  sort,
  page,
  limit,
  priceRange,
) => {
  const labels = {
    totalDocs: 'totalItems',
    docs: 'paintings',
    limit: 'limit',
    page: 'currentPage',
    nextPage: 'nextPage',
    prevPage: 'prevPage',
    totalPages: 'totalPages',
    pagingCounter: 'pagingCounter',
    meta: 'paginator',
  };
  try {
    page = page > 0 ? page : 1;
    const match = { 'marketplace.active': true };
    if (priceRange.minPrice && priceRange.maxPrice) {
      match.$and = [
        { 'marketplace.price': { $gte: parseFloat(priceRange.minPrice) } },
        { 'marketplace.price': { $lte: parseFloat(priceRange.maxPrice) } },
      ];
    }
    const mintsPopulateObject = {
      path: 'mints',
      select: 'marketplace num tokenId currentBuyer sale lastSaleDate',
      match: match,
      options: { sort: { 'marketplace.price': +1 } },
    };
    console.log(match.$and);
    const artistsPopulateObject = {
      path: 'artists',
      select: 'name',
    };

    const collectionPopulateObject = {
      path: 'theme',
      select: 'name',
    };
    return Painting.paginate(query, {
      offset: (page - 1) * limit,
      select:
        'name image rarity mints artists theme genre dropDate description about cryptoPrice price filetype rarityValue paintingFrom previewImage',
      populate: [
        mintsPopulateObject,
        artistsPopulateObject,
        collectionPopulateObject,
      ],
      lean: true,
      leanWithId: false,
      limit,
      sort,
      customLabels: labels,
    });
  } catch (err) {
    return err;
  }
};
//* ******-helpers
const MintsToPaintings = (updatedData) => {
  const paintingsList = [];
  const data = [...updatedData];
  data.forEach((item) => {
    const exist = paintingsList.filter(
      (pin) => `${pin?._id}` === `${item?.paintingID?._id}`,
    );
    if (exist.length === 0) {
      const mints = updatedData.filter(
        (pin) => pin?.paintingID?._id === item?.paintingID?._id,
      );
      const obj = {
        mints,
        ...JSON.parse(JSON.stringify(item.paintingID)),
      };
      paintingsList.push(obj);
    }
  });
  return paintingsList;
};
const CreatePaginator = (total, limit, page) => {
  const paginator = {
    totalItems: total,
    offset: (page - 1) * limit,
    limit: limit,
    totalPages: Math.round(total / limit),
    currentPage: page,
    nextPage: page + 1,
    hasPrevPage: false,
    hasNextPage: true,
    prevPage: null,
  };
  return paginator;
};
const PaintingJoin = () => {
  return {
    path: 'paintingID',
    populate: [
      [
        {
          path: 'artists',
          select: { name: 1 },
        },
      ],
      {
        path: 'theme',
        select: { name: 1 },
      },
    ],
    select:
      'name image rarity artists theme genre dropDate description about cryptoPrice price filetype rarityValue paintingFrom previewImage previewUrl updatedAt',
  };
};

const createFilterObject = (filter) => {
  const filteredAssets = {};
  Object.keys(filter).forEach(async (key) => {
    const value = filter[key].trim();

    let filterByRequest = [];
    if (value !== '') {
      filterByRequest = [];
      value.split(',').forEach((item) => {
        filterByRequest.push(item);
      });
      switch (key) {
        case 'rarity':
          filteredAssets.rarity = { $in: filterByRequest };
          break;
        case 'genre':
          filteredAssets.genre = { $in: filterByRequest };
          break;
        case 'artists':
          filteredAssets.artists = { $in: filterByRequest };
          break;
        case 'collections':
          filteredAssets.theme = { $in: filterByRequest };
          break;
        case 'media':
          filterByRequest = [];
          value.split(',').forEach((item) => {
            if (item === 'ThreeD') {
              filterByRequest.push(`GLTF`);
              filterByRequest.push(`GIF`);
            } else if (item === 'JPG') {
              filterByRequest.push(`JPG`);
              filterByRequest.push(`JPEG`);
              filterByRequest.push(`PNG`);
            } else {
              filterByRequest.push(item);
            }
          });
          filteredAssets.filetype = { $in: filterByRequest };
          break;
        default:
          break;
      }
    }
  });
  return filteredAssets;
};
//----------
const getSortedPaintingsAvailableOnMarketPlace = async (
  filter,
  sort,
  page,
  limit,
  priceRange,
  search,
) => {
  try {
    page = page > 0 ? page : 1;
    const match = { 'marketplace.active': true };
    if (priceRange.minPrice && priceRange.maxPrice) {
      match.$and = [
        { 'marketplace.price': { $gte: parseFloat(priceRange.minPrice) } },
        { 'marketplace.price': { $lte: parseFloat(priceRange.maxPrice) } },
      ];
    }
    const paintingPopulateObject = PaintingJoin();
    let updatedData = [];
    const queryObj = { 'marketplace.active': true };
    let paintingQuery = {};
    if (Object.keys(filter).length > 0) {
      const filterOBj = createFilterObject(filter);
      paintingQuery = { ...filterOBj };
    }
    if (search) {
      paintingQuery.name = { $regex: search, $options: '<i>' };
    }
    if (Object.keys(paintingQuery).length > 0) {
      const paintings = await Painting.find(paintingQuery).select('_id name');
      queryObj.paintingID = { $in: paintings.map((pin) => ObjectId(pin._id)) };
    }

    if (Object.keys(sort).length > 0) {
      updatedData = await Mints.find(queryObj)
        .sort({ 'marketplace.cryptoPrice': sort.price })
        .populate(paintingPopulateObject)
        .lean();
    } else {
      updatedData = await Mints.find(queryObj)
        .populate(paintingPopulateObject)
        .lean();
    }

    // ******if mints name not mathch then doing query from paiting collection********
    // const paintingId = Painting.find({name: {$regex: search, $options: 'i' } });
    let filteredAssets = MintsToPaintings(updatedData);
    if (sort?.rarityValue) {
      filteredAssets = sortNFTsByRarity(sort.rarityValue, filteredAssets);
    }
    if (sort?.updatedAt) {
      filteredAssets = filteredAssets.sort((a, b) => {
        const dateA = new Date(a.updatedAt);
        const dateB = new Date(b.updatedAt);
        return dateB - dateA;
      });
    }
    //* ******** filterBy record on marketplace *********/
    // if(Object.keys(filter).length > 0) {
    //   filteredAssets = filterByMarketplace(filter, filteredAssets);
    // }
    const paginator = CreatePaginator(filteredAssets.length, limit, page);

    const returnData = {
      paintings: filteredAssets.splice((page - 1) * limit, limit),
      paginator: paginator,
    };
    return returnData;
  } catch (err) {
    return err;
  }
};

const addAuctionRefToPaintings = async (paintingId, mintId) => {
  try {
    return await Painting.updateOne(
      { _id: paintingId },
      { $push: { mintsAuctions: mintId } },
    );
  } catch (e) {
    return e.message;
  }
};

module.exports = {
  getPaintingById,
  getPaintingsByIds,
  getCollectionByPaintingId,
  getArtistByPaintingId,
  getPaintingIdByTokenId,
  getAvailableMintsByPaintingId,
  getAllAvailableMintsByPaintingId,
  setNFTSoldToTrue,
  updateNFTAfterTransaction,
  getMintById,
  getMintsWithPaintingIDAndToken,
  updateSingleMintByTokenId,
  checkOrderExist,
  getAvailableMintsByArrayIds,
  updateMintActiveStatus,
  checkOrderByTxnHash,
  getMintByTokenID,
  addMintsToPainting,
  dropPagePainting,
  updateMintProcessing,
  makePaintingAvailableOnMarketPlace,
  getPaintingsAvailableOnMarketPlace,
  getSortedPaintingsAvailableOnMarketPlace,
  addAuctionRefToPaintings,
  removeMintFromPaintingAvailableOnMarketPlace,
};
