const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');
const database = require('../services/database');
const mongoose = require('mongoose');
const paintingModel = require('../models/painting.model');
const escapeStringRegexp = require('escape-string-regexp');
const jwt = require('jsonwebtoken');
const Painting = require('../models/painting.model');
const Mint = require('../models/mint.model');
const {
  marketplaceSalePurchaseEmailConfirmation,
  marketplaceListAndUnlistConfirmation,
} = require('../services/sendgrid');
const {
  MARKETPLACE_LIST_CONFIRMATION,
  MARKETPLACE_UN_LIST_CONFIRMATION,
} = require('../services/sendgrid/constants');
const {
  createAuctionForMint,
  removeMintFromMarketplace,
  updateMintPriceInMarketplace,
  sellMintOnMarketplace,
} = require('../services/database/mint');
const { getEditionDetails } = require('./common/helper');
const { addAuctionRefToPaintings } = require('../services/database/painting');
const OATAuctionImplementation = require('../services/contracts/interfaceOATAuctionImplementation.js');
const OATMarketplaceImplementation = require('../services/contracts/interfaceOATMarketplaceImplementation.js');
const axios = require('axios');

// ------------------ Helpers Function ------------ //

const createResponseObject = (response, statusCode, returnResponse) => {
  return response.status(statusCode).json(returnResponse);
};

const generateReturnResponse = (success, message, data) => {
  return {
    success,
    message,
    ...(data && { data }),
  };
};
const isValueAvailable = (response, value, errorMessage) => {
  if (!value) {
    return createResponseObject(
      response,
      HTTP_STATUS_CODE.BAD_REQUEST,
      generateReturnResponse(false, errorMessage),
    );
  }
  return true;
};

const getMaticToUSDPrice = async (maticPrice) => {
  const fetchedResult = await axios.get(
    'https://api.coinlore.net/api/ticker/?id=33536',
  );
  const USDPrice = fetchedResult?.data[0]?.price_usd || 0;
  const convertedPrice = maticPrice * USDPrice;
  return convertedPrice;
};

const getUSDToMaticPrice = async (usdPrice) => {
  const fetchedResult = await axios.get(
    'https://api.coinlore.net/api/ticker/?id=33536',
  );
  const USDPrice = fetchedResult?.data[0]?.price_usd || 0;
  const convertedPrice = usdPrice / USDPrice;
  return convertedPrice;
};

function sortPaintingMarketplacePrice(paintings, sortMethod) {
  if (
    sortMethod !== null &&
    sortMethod.field === 'price' &&
    sortMethod.order === 'asc'
  ) {
    paintings.paintings = paintings.paintings.sort(
      (a, b) => Number(a.marketplacePrice) - Number(b.marketplacePrice),
    );
    return paintings;
  }
  if (
    sortMethod !== null &&
    sortMethod.field === 'price' &&
    sortMethod.order === 'dsc'
  ) {
    paintings.paintings = paintings.paintings.sort(
      (a, b) => Number(b.marketplacePrice) - Number(a.marketplacePrice),
    );
    return paintings;
  }
  return null;
}

// ----------------------------------------- //
const unlistMintFromMarketplace = async ({
  mintId,
  tokenId,
  itemId,
  nftOwner,
}) => {
  try {
    // ---------------- BlockChain unlist NFT Method ----------- //
    const unlistedNft =
      await OATMarketplaceImplementation.unlistNftOnMarketplace({
        tokenId,
        itemId,
        nftOwner,
      });
    const unlistedNftResult = unlistedNft?.events?.ItemUnlisted?.returnValues;

    // ----------- Update Marketplace Active Block Data in DB ------------ //

    if (unlistedNftResult?.itemid) {
      const session = await mongoose.startSession();

      const removedMintFromMarketplace = await removeMintFromMarketplace(
        mintId,
      );
      if (removedMintFromMarketplace?.n > 0) {
        const { paintingID } = await database.mint.getTokenIdByMintId(mintId);
        const updatedPainting =
          await database.painting.removeMintFromPaintingAvailableOnMarketPlace(
            paintingID,
          );
        if (updatedPainting?.n <= 0) {
          return generateReturnResponse(
            false,
            'Error while Updating Painting from Marketplace in DB' +
              removedMintFromMarketplace,
          );
        }
        session.endSession();
        return generateReturnResponse(true, 'Mint removed from Marketplace');
      }
      return generateReturnResponse(
        false,
        'Error while Removing Mint from Marketplace in DB' +
          removedMintFromMarketplace,
      );
    }
    return generateReturnResponse(
      false,
      'Error while Removing Mint from Marketplace in Block' + unlistedNft,
    );
  } catch (e) {
    console.error(
      'Error in unlistMintFromMarketplace - Controller/marketplace.js ---->',
      e,
    );
    return generateReturnResponse(
      true,
      'Error while Removing Mint from Marketplace ' + e.message,
    );
  }
};

const unlistNft = async (request, response) => {
  try {
    const { mintId, tokenId, itemId } = request.body;

    const { id } = request.user;

    const user = await database.user.getUserById(id);

    const { walletAddress: nftOwner, email } = user;

    const removedMintFromMarketplaceDetails = await unlistMintFromMarketplace({
      mintId,
      tokenId,
      itemId,
      nftOwner,
    });

    const paintingDetails = await database.mint.getMintWithDetails(mintId);


    if (removedMintFromMarketplaceDetails?.success) {
      await marketplaceListAndUnlistConfirmation(
        { email, ...paintingDetails },
        MARKETPLACE_UN_LIST_CONFIRMATION,
        'NFT un-listed Confirmation',
      );

      return createResponseObject(
        response,
        200,
        generateReturnResponse(
          true,
          removedMintFromMarketplaceDetails?.message,
        ),
      );
    }
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, removedMintFromMarketplaceDetails?.message),
    );
  } catch (e) {
    console.error('Error in unlistNft - Controller/marketplace.js ---->', e);
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, e.message),
    );
  }
};

const reassingMintPriceInMarketplace = async (
  price,
  mintId,
  mintTokenId,
  mintItemId,
  commission,
) => {
  try {
    // ---------------- BlockChain setPrice Method ----------- //
    const updatedNft = await OATMarketplaceImplementation.setNftPrice({
      price,
      mintItemId,
      mintTokenId,
      commission,
    });
    const updtedNftResult = updatedNft?.events?.priceUpdated?.returnValues;

    // ----------- Update Marketplace Price Block Data in DB ------------ //

    if (updtedNftResult?._itemId) {
      const reassignedMintFromMarketplace = await updateMintPriceInMarketplace(
        mintId,
        price,
        price,
      );
      if (reassignedMintFromMarketplace?.n > 0) {
        return generateReturnResponse(true, 'Mint updated from Marketplace');
      }
      return generateReturnResponse(
        false,
        'Error while Updating Mint from Marketplace in DB' +
          reassignedMintFromMarketplace,
      );
    }
    return generateReturnResponse(
      false,
      'Error while Updating Mint from Marketplace in Block' + updatedNft,
    );
  } catch (e) {
    console.error(
      'Error in reassingMintPriceInMarketplace - Controller/marketplace.js ---->',
      e,
    );
    return generateReturnResponse(
      true,
      'Error while Updating Mint from Marketplace ' + e.message,
    );
  }
};

const sellNft = async (request, response) => {
  try {
    const { mintId } = request.body;
    const { id: userId } = request.user;
    const session = await mongoose.startSession();

    const user = await database.user.getUserById(userId);
    console.log('User', user);
    const { email } = user;
    const paintingDetails = await database.mint.getMintWithDetails(mintId);
    console.log('Painting Details', paintingDetails);

    const soldMintFromMarketplace = await sellMintOnMarketplace(
      mintId,
      userId,
      paintingDetails?.marketplace?.cryptoPrice,
    );
    if (soldMintFromMarketplace?.n <= 0) {
      return createResponseObject(
        response,
        500,
        generateReturnResponse(
          false,
          'Error Updating Mint in sellNft, controller marketplace.js',
        ),
      );
    }

    const { paintingID } = await database.mint.getTokenIdByMintId(mintId);

    const updatedPainting =
      await database.painting.removeMintFromPaintingAvailableOnMarketPlace(
        paintingID,
      );

    if (updatedPainting?.n <= 0) {
      return createResponseObject(
        response,
        500,
        generateReturnResponse(
          false,
          'Error Updating Painting in sellNft, controller marketplace.js',
        ),
      );
    }

    session.endSession();

    await marketplaceSalePurchaseEmailConfirmation({
      email,
      ...paintingDetails,
    });

    return createResponseObject(
      response,
      200,
      generateReturnResponse(true, 'Nft Sold SuccessFully'),
    );
  } catch (e) {
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, e.message),
    );
  }
};

const updateMintPrice = async (request, response) => {
  try {
    const { price, mintId, tokenId, itemId, commission } = request.body;
    if (!mintId || !price || !tokenId || !itemId || !commission) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }
    const updatedMintFromMarketplaceDetails =
      await reassingMintPriceInMarketplace({
        price,
        mintId,
        tokenId,
        itemId,
        commission,
      });
    if (updatedMintFromMarketplaceDetails?.success) {
      return createResponseObject(
        response,
        200,
        generateReturnResponse(
          true,
          updatedMintFromMarketplaceDetails?.message,
        ),
      );
    }
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, updatedMintFromMarketplaceDetails?.message),
    );
  } catch (e) {
    console.error(
      'Error in updateMintPrice - Controller/marketplace.js ---->',
      e,
    );
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, e.message),
    );
  }
};

const addMint = async (request, response) => {
  try {
    const { mintId, price, itemId, txnHash } = request.body;
    if (!mintId || !price || !itemId || !txnHash) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }
    const { id: userId } = request.user;
    const user = await database.user.getUserById(userId);
    const { email: userEmail } = user;

    const session = await mongoose.startSession();

    // const { id } = request.user;
    // const { walletAddress: nftOwner } = await database.user.getUserById(id);
    // const {
    //   itemindex: fromTransactionItemindex,
    //   nftowner: fromTransactionNftowner,
    // } = await OATMarketplaceImplementation.getListNftTransaction(txnHash);

    // if (
    //   fromTransactionItemindex !== itemId.toString() ||
    //   nftOwner.toString() !== fromTransactionNftowner
    // ) {
    //   return response
    //     .status(HTTP_STATUS_CODE.BAD_REQUEST)
    //     .json(
    //       'Wrong Information, Please Contact Administrator with Transaction Hash',
    //     );
    // }

    // -----------   Fetching Token ID ------------ //

    const mint = await database.mint.getTokenIdByMintId(mintId);
    if (!mint) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.MINT_NOT_FOUND);
    }

    const { num, name, tokenId } = mint;

    const dollarPrice = await getMaticToUSDPrice(price);
    // ----------- Adding Mint to Marketplace ------------ //
    await database.mint.makeMintAvailableOnMarketPlace(
      mintId,
      itemId,
      dollarPrice,
      price,
      userId,
    );
    const fieldToUpdate = 'availableForSale';
    // ----------- Adding Painting to Marketplace ----------
    await database.painting.makePaintingAvailableOnMarketPlace(
      mint.paintingID,
      fieldToUpdate,
    );

    session.endSession();
    await marketplaceListAndUnlistConfirmation(
      {
        email: userEmail,
        num,
        name,
        tokenId,
      },
      MARKETPLACE_LIST_CONFIRMATION,
      'NFT listed Confirmation',
    );
    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Successfully Listed on marketplace' });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LISTING_TO_MARKETPLACE_FAILED);
  }
};

const getMongoObjetIdArray = async (input) => {
  try {
    const res = [];
    input.split(',').forEach((item) => {
      const id = new mongoose.Types.ObjectId(item);
      res.push(id);
    });
    return res;
  } catch (error) {
    console.error(
      'Error in getMongoObjetIdArray => controller marketplace.js: ',
      error,
    );
    return [];
  }
};

const generateQueryGetPaintings = async (search, filters) => {
  try {
    const query = {};
    let saleTypeFilterSet = false;

    Object.keys(filters).forEach(async (key) => {
      const value = filters[key].trim();
      let condition = [];
      if (value !== '') {
        switch (key) {
          case 'rarity':
          case 'genre':
            condition = [];
            value.split(',').forEach((item) => {
              condition.push(item);
            });
            query[key] = { $in: condition };
            break;
          case 'collections':
            query.theme = { $in: await getMongoObjetIdArray(value) };
            break;
          case 'artists':
            query[key] = { $in: await getMongoObjetIdArray(value) };
            break;
          case 'media':
            condition = [];
            value.split(',').forEach((item) => {
              if (item === 'ThreeD') {
                condition.push(`GLTF`);
                condition.push(`GIF`);
              } else if (item === 'JPG') {
                condition.push(`JPG`);
                condition.push(`JPEG`);
                condition.push(`PNG`);
              } else {
                condition.push(item);
              }
            });
            query.filetype = { $in: condition };
            break;
          case 'saleType':
            if (value === 'purchase') {
              saleTypeFilterSet = true;
              query['marketplace.availableForSale'] = { $gt: 0 };
            } else if (value === 'bid') {
              saleTypeFilterSet = true;
              query['marketplace.availableForAuction'] = { $gt: 0 };
            }
            break;

          default:
            break;
        }
      }
    });
    if (!saleTypeFilterSet) {
      query.$or = [
        { 'marketplace.availableForSale': { $gt: 0 } },
        { 'marketplace.availableForAuction': { $gt: 0 } },
      ];
    }
    if (search.trim() !== '') {
      const $regex = escapeStringRegexp(search.trim());
      query.name = { $regex: $regex, $options: 'i' };
    }
    return query;
  } catch (error) {
    console.error(error);
    return { availableOnMarketplace: true };
  }
};

const generateSortGetPaintings = async (sort) => {
  try {
    const query = {};
    if (sort) {
      query[sort.field === 'rarity' ? 'rarityValue' : sort.field] =
        sort.order.toLowerCase() === 'asc' ? 1 : -1;
    }
    query._id = 1;
    return query;
  } catch (error) {
    console.error(error);
    return { _id: 1 };
  }
};

const getPaintings = async (request, response) => {
  try {
    const {
      page = 1,
      limit = 16,
      search = '',
      filters = {},
      sort = null,
      priceRange = {},
    } = request.query;
    const query = await generateQueryGetPaintings(search, filters);
    const querySort = await generateSortGetPaintings(sort);
    const paintings =
      await database.painting.getPaintingsAvailableOnMarketPlace(
        query,
        querySort,
        page,
        limit,
        priceRange,
      );
    paintings.paintings = paintings.paintings.map((painting) => {
      const auctionAvailable = painting.mints.findIndex((mint) => {
        return mint.marketplace.auctionDuration > 0;
      });
      const floorPrice =
        painting.mints.sort((a, b) => {
          return a.marketplace.cryptoPrice - b.marketplace.cryptoPrice;
        })[0]?.marketplace?.cryptoPrice || 0;
      const buyNowAvailable = painting.mints.findIndex((mint) => {
        return (
          !mint.marketplace.auctionDuration ||
          mint.marketplace.auctionDuration <= 0
        );
      });
      painting.startingFromPrice = floorPrice;
      painting.mintsCount = painting.mints.length;
      painting.auctionAvailable = auctionAvailable >= 0;
      painting.buyNowAvailable = buyNowAvailable >= 0;
      painting.marketplacePrice = painting.mints[0]?.marketplace?.cryptoPrice;

      return painting;
    });
    const sortedPaintings = sortPaintingMarketplacePrice(paintings, sort);
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Marketplace retrieved successfully',
      data: !sortedPaintings ? paintings : sortedPaintings,
    });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LISTING_TO_MARKETPLACE_FAILED);
  }
};
const getSortedPaintings = async (request, response) => {
  try {
    const {
      page = 1,
      limit = 16,
      search = '',
      filters = {},
      sort = null,
      priceRange = {},
    } = request.query;
    const querySort = await generateSortGetPaintings(sort);
    const paintings =
      await database.painting.getSortedPaintingsAvailableOnMarketPlace(
        filters,
        querySort,
        page,
        limit,
        priceRange,
        search,
      );
    // const updatedPaintings = JSON.parse(
    //   JSON.stringify(paintings.paintings),
    // ).map((painting) => {
    paintings.paintings.map((painting) => {
      const auctionAvailable = painting.mints.findIndex((mint) => {
        return mint?.marketplace?.auctionDuration > 0;
      });
      const floorPrice =
        painting.mints.sort((a, b) => {
          return a.marketplace.cryptoPrice - b.marketplace.cryptoPrice;
        })[0]?.marketplace?.cryptoPrice || 0;
      const buyNowAvailable = painting.mints.findIndex((mint) => {
        return (
          !mint.marketplace.auctionDuration ||
          mint.marketplace.auctionDuration <= 0
        );
      });
      painting.startingFromPrice = floorPrice;
      painting.mintsCount = painting.mints.length;
      painting.auctionAvailable = auctionAvailable >= 0;
      painting.buyNowAvailable = buyNowAvailable >= 0;
      painting.marketplacePrice =
        painting.mints[painting.mints.length - 1]?.marketplace?.cryptoPrice;
      return painting;
    });
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Marketplace retrieved successfully',
      data: {
        paginator: paintings.paginator,
        paintings: paintings.paintings,
      },
    });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LISTING_TO_MARKETPLACE_FAILED);
  }
};

const getFilters = async (request, response) => {
  try {
    const rarity = {
      Unique: 'Unique', // 1
      Legendary: 'Legendary', // 2-10
      Extraordinary: 'Extraordinary', // 11-50
      Masterpiece: 'Masterpiece', // 51-100
      Classic: 'Classic', // 101-250
      Rare: 'Rare', // 251-500
      Limited: 'Limited', // 501-999
      Common: 'Common', // 1000+
      Special: 'Special',
    };
    const artists = (await database.artist.fetchAllArtists()).map((artist) => {
      const output = {};
      output[artist._id] = artist.name;
      return output;
    });
    const collections = (await database.world.getAllCollections()).map(
      (collection) => {
        const output = {};
        output[collection._id] = collection.name;
        return output;
      },
    );
    const genre = { Fantasy: 'Fantasy', Horror: 'Horror', 'Sci-Fi': 'Sci-Fi' };
    const media = {
      JPG: 'Static Artwork',
      MP4: 'Animated Artwork',
      ThreeD: '3D Model',
    };
    const saleType = { bid: 'Auction', purchase: 'Buy Now' };
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Filter listed successfully',
      data: { rarity, artists, collections, genre, media, saleType },
    });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LISTING_TO_MARKETPLACE_FAILED);
  }
};

const getAllEditionsOverview = async (request, response) => {
  try {
    const { paintingId } = request.query;
    if (!paintingId) {
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.PAINTING_ID_IS_REQUIRED,
      });
    }
    const mintsPopulateObject = {
      path: 'mints',
      select: { sale: 1, updatedAt: 1, createdAt: 1, marketplace: 1 },
    };

    const foundedPaintingMints = await paintingModel
      .findById(paintingId)
      .select('mints')
      .populate(mintsPopulateObject);
    
    if (!foundedPaintingMints)
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.PAINTING_NOT_FOUND,
      });

    const editionOverviewDetails = await getEditionDetails(
      foundedPaintingMints?.mints,
    );
   
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Success',
      data: editionOverviewDetails,
    });
  } catch (e) {
    console.error('ERR get All Editions Overview ', e.message);
    return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
      success: false,
      message: e.message,
    });
  }
};

const getPaintingDetails = async (request, response) => {
  try {
    const { paintingId, mintId } = request.query;
    console.log('mintId', mintId);
    if (!paintingId) {
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.PAINTING_ID_IS_REQUIRED,
      });
    }
    // ----------- Creating DB Queries  ---------- /s/
    const mintsPopulateObject = {
      path: 'mints',
      ...(mintId && { match: { _id: mintId } }), //  Only for specific mint from Dashboard view listing
      ...(!mintId && {
        match: { 'marketplace.active': true }, // for marketplace view listing
        options: { sort: { num: +1 }, limit: 1 }, // +1 for min / -1 for max num of NFT
      }),
      populate: {
        path: 'currentBuyer',
        select: { walletAddress: 1, username: 1 },
      },
    };
    const artistsPopulateObject = { path: 'artists' };
    const collectionPopulateObject = { path: 'theme' }; // Also know as collection
    // ----------- Fetching Painting  ----------//
    const foundedPainting = await paintingModel
      .findById(paintingId)
      .populate(mintsPopulateObject)
      .populate(artistsPopulateObject)
      .populate(collectionPopulateObject);

    if (!foundedPainting)
      return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGE.PAINTING_NOT_FOUND,
      });
    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Success',
      data: foundedPainting,
    });
  } catch (e) {
    console.error('ERR Paining Details', e.message);
    return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
      success: false,
      message: e.message,
    });
  }
};
/**
 * getBid
 * @param {request} - request Object
 * @param {response} - response Object
 * @param {ObjectId} request.params.auctionMintId - currentAuctionId
 */
const getBid = async (request, response) => {
  try {
    const { mintId } = request.query;
    console.log('request.params', request);
    if (!mintId) {
      return createResponseObject(
        response,
        HTTP_STATUS_CODE.NOT_FOUND,
        generateReturnResponse(true, 'failed', 'Mint Id is required'),
      );
    }

    // ----------- Fetching Auction Bids ---------- //
    const currentBidAuctions = await Mint.findById(mintId)
      .select('auctionBidHistory')
      .populate({
        path: 'auctionBidHistory.bidderId',
        select: { username: 1 },
      })
      .exec();

    if (currentBidAuctions) {
      return createResponseObject(
        response,
        HTTP_STATUS_CODE.OK,
        generateReturnResponse(true, 'Success', currentBidAuctions),
      );
    }
    return createResponseObject(
      response,
      HTTP_STATUS_CODE.NOT_FOUND,
      generateReturnResponse(true, 'failed', 'AuctionData not Found'),
    );
  } catch (error) {
    console.error(error);
    return createResponseObject(
      response,
      HTTP_STATUS_CODE.NOT_FOUND,
      generateReturnResponse(true, 'failed', error.message),
    );
  }
};

/**
 * Store Drop to db
 *
 * @param {Object} drop - Drop object
 */
const addBid = async (request, response) => {
  try {
    const { type, price, mint } = request.body;
    if (!type || !price || !mint) {
      createResponseObject(
        response,
        HTTP_STATUS_CODE.OK,
        generateReturnResponse(
          true,
          'Success',
          'Required parameters are missing',
        ),
      );
    }
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;
    const isMintExists = await Mint.findById(mint).exec();
    if (!isMintExists) {
      createResponseObject(
        response,
        HTTP_STATUS_CODE.BAD_REQUEST,
        generateReturnResponse(true, ' Mint Auction not exists '),
      );
    }
    // Todo Need a validation if auction Exists than add bid.

    // if drop auction Bid then save
    if (isValueAvailable(response, isMintExists, 'User id is required')) {
      const bidObj = {
        type,
        bidderId: userId,
        date: new Date().toUTCString(),
        price,
      };

      const saveAuctionBid = await Mint.updateOne(
        { _id: mint },
        {
          $set: { currentAuctionBid: bidObj },
          $push: { auctionBidHistory: bidObj },
        },
      );

      createResponseObject(
        response,
        HTTP_STATUS_CODE.OK,
        generateReturnResponse(true, 'Success', saveAuctionBid),
      );
    }
  } catch (error) {
    console.error('Error in Create Bid Auction', error);
    createResponseObject(
      response,
      HTTP_STATUS_CODE.BAD_REQUEST,
      generateReturnResponse(true, error.message),
    );
  }
};

const getNftsOfPainting = async (request, response) => {
  const { paintingId } = request.params;
  try {
    const mints =
      await database.mint.getMintsAvailableOnMarketplaceByPaintingId(
        paintingId,
      );
    const artistsPopulateObject = {
      path: 'artists',
      select: 'name',
    };

    const collectionPopulateObject = {
      path: 'theme',
      select: 'name',
    };
    const painting = await Painting.findOne({ _id: paintingId })
      .select(
        'name image rarity mints artists theme genre dropDate description about cryptoPrice price filetype',
      )
      .populate([artistsPopulateObject, collectionPopulateObject])
      .lean();

    painting.mintsCount = Object.keys(painting.mints).length;
    delete painting.mints;

    return response.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Mints by Painting ID listed Successfully',
      data: { painting, mints },
    });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LISTING_TO_MARKETPLACE_FAILED);
  }
};

const createAuction = async ({
  mintId,
  mintTokenId,
  startingBidPrice,
  auctionDuration,
  buyNowPrice,
  paintingId,
}) => {
  try {
    // ---------------- BlockChain Create Auction Method ----------- //
    const startingBidPriceCents = (
      (await getMaticToUSDPrice(startingBidPrice)) * 100
    ).toFixed(0);
    const buyNowPriceCents = (
      (await getMaticToUSDPrice(buyNowPrice)) * 100
    ).toFixed(0);
    const startTime = Math.floor(new Date() / 1000); //  convert start date to unix timestamp
    const createdAuction = await OATAuctionImplementation.createAuction({
      mintTokenId,
      startingBidPrice,
      startingBidPriceCents,
      startTime,
      buyNowPrice,
      buyNowPriceCents,
      auctionDuration,
    });
    const createdAuctionResult =
      createdAuction?.events?.AuctionCreated?.returnValues;
    // ----------- Add Created Auction Block Data in DB ------------ //
    if (createdAuctionResult?._index) {
      const _endTime = createdAuctionResult?._endTime || null;

      const formattedEndTime = new Date(_endTime * 1000);
      const addedAuctionToMint = await createAuctionForMint(
        mintId,
        createdAuctionResult?._index, // block Chain created Auction token id
        startingBidPrice,
        startingBidPriceCents / 100,
        auctionDuration,
        formattedEndTime,
        buyNowPrice,
        buyNowPriceCents / 100,
      );
      const addedAuctionRef = await addAuctionRefToPaintings(
        paintingId,
        mintId,
      );

      if (addedAuctionToMint?.n > 0 && addedAuctionRef.n > 0) {
        return generateReturnResponse(true, 'Auction Created Successfully');
      }
      return generateReturnResponse(
        false,
        'Error while Creating Auction in DB' +
          addedAuctionToMint +
          addedAuctionRef,
      );
    }
    return generateReturnResponse(
      false,
      'Error while Creating Auction in Block' + createdAuction,
    );
  } catch (e) {
    console.error(
      'Error in createAuction - Controller/marketplace.js ---->',
      e,
    );
    return generateReturnResponse(
      true,
      'Error while Creating Auction ' + e.message,
    );
  }
};

const createDropAuction = async (request, response) => {
  const {
    mintId,
    mintTokenId,
    startingBidPrice,
    auctionDuration,
    buyNowPrice,
    paintingId,
  } = request.body;

  try {
    const createdAuctionDetails = await createAuction({
      mintId,
      mintTokenId,
      startingBidPrice,
      auctionDuration,
      buyNowPrice,
      paintingId,
    });
    if (createdAuctionDetails?.success) {
      return createResponseObject(
        response,
        200,
        generateReturnResponse(true, createdAuctionDetails?.message),
      );
    }
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, createdAuctionDetails?.message),
    );
  } catch (e) {
    console.error(
      'Error in createDropAuction - Controller/marketplace.js ---->',
      e,
    );
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, e.message),
    );
  }
};

const approveNftForBuyNow = async (request, response) => {
  try {
    const { nftTokenId, to } = request.body;
    if (!nftTokenId || !to) {
      return createResponseObject(
        response,
        500,
        generateReturnResponse(false, 'Parameters Missing'),
      );
    }
    const nftApproval = await OATAuctionImplementation.approveNft(
      to,
      nftTokenId,
    );
    if (nftApproval?.events?.Approval) {
      return createResponseObject(
        response,
        200,
        generateReturnResponse(true, 'success', nftApproval),
      );
    }
    return createResponseObject(
      response,
      500,
      generateReturnResponse(true, 'Error From Block' + nftApproval),
    );
  } catch (e) {
    console.error('Error in controller/marketplace ===>', e.message);
    return createResponseObject(
      response,
      500,
      generateReturnResponse(true, e.message),
    );
  }
};

const buyNow = async (request, response) => {
  try {
    const { mintId, paintingId, price } = request.body;
    if (!mintId || !paintingId || !price) {
      return createResponseObject(
        response,
        500,
        generateReturnResponse(false, 'Required parameters are missing'),
      );
    }
    const token = request.header('x-auth-token');
    const userId = jwt.verify(token, process.env.JWT_SECRET).id;

    const bidObj = {
      type: 'buy',
      bidderId: userId,
      date: new Date().toUTCString(),
      price,
    };
    
    const updatedMint = await Mint.updateOne(
      { _id: mintId },
      {
        auctionBidHistory: [],
        auction: {},
        currentBuyer: userId,
        currentAuctionBid: bidObj,
      },
    ).exec();

    if (updatedMint?.n > 0) {
      const updatedPainting = await paintingModel.updateOne(
        { _id: paintingId },
        { $pull: { mintsAuctions: mintId } },
      );

      if (updatedPainting?.n > 0) {
        return createResponseObject(
          response,
          200,
          generateReturnResponse(true, 'Buy Now is SuccessFull'),
        );
      }
      return createResponseObject(
        response,
        500,
        generateReturnResponse(false, updatedPainting),
      );
    }
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, updatedMint),
    );
  } catch (e) {
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, e.message),
    );
  }
};

const assureMintPrice = async (request, response) => {
  try {
    const { mintId, commission } = request.body;
    if (!mintId || !commission) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }
    const mint = await database.mint.getTokenIdByMintId(mintId);
    const { tokenId } = mint;
    const { active, itemId, price } = mint.marketplace;

    if (!active || !itemId || !price || !tokenId) {
      return createResponseObject(
        response,
        500,
        generateReturnResponse(false, 'Mint not available on Marketplace'),
      );
    }

    const updatedPrice = await getUSDToMaticPrice(price);

    const updatedNft = await OATMarketplaceImplementation.setNftPrice({
      amount: updatedPrice,
      itemId,
      tokenId,
      commission,
    });
    const updatedMintFromMarketplaceDetails =
      updatedNft?.events?.priceUpdated?.returnValues;

    if (updatedMintFromMarketplaceDetails?.itemId) {
      return createResponseObject(
        response,
        200,
        generateReturnResponse(true, 'Price Updated for Mint'),
      );
    }
    return createResponseObject(
      response,
      500,
      generateReturnResponse(
        false,
        'Error in AssureMintPrice => controller marketplace.js' + updatedNft,
      ),
    );
  } catch (e) {
    console.error(
      'Exception in AssureMintPrice - Controller/marketplace.js ---->',
      e,
    );
    return createResponseObject(
      response,
      500,
      generateReturnResponse(false, e.message),
    );
  }
};

const marketplaceListedSync = async (listedTokens) => {
  listedTokens?.forEach(async (item) => {
    const updatedMint = await Mint.findOneAndUpdate(
      {
        tokenId: item.tokenId,
        $or: [
          { marketplace: { $exists: false } },
          { 'marketplace.active': false },
        ],
      },
      {
        $set: {
          'marketplace.active': true,
          'marketplace.itemId': item?.itemId,
          'marketplace.cryptoPrice': item?.price,
          'marketplace.price': await getMaticToUSDPrice(item?.price),
        },
      },
    ).select('paintingID tokenId marketplace');
    if (!updatedMint) {
      return;
    }
    const paintingId = updatedMint?.paintingID;
    await database.painting.makePaintingAvailableOnMarketPlace(
      paintingId,
      'availableForSale',
    );
  });
};
const marketplaceUnlistedSync = async (listedTokens) => {
  const tokensIds = listedTokens?.map((item) => {
    return item.tokenId;
  });
  const foundMints = await Mint.find({
    tokenId: { $nin: tokensIds },
    'marketplace.active': true,
  }).select('paintingID');
  if (foundMints?.length === 0) {
    return;
  }
  foundMints?.forEach(async (item) => {
    const updatedMint = await Mint.updateOne(
      { _id: item._id },
      { 'marketplace.active': false },
    );
    if (!updatedMint?.n > 0) {
      return;
    }
    await database.painting.removeMintFromPaintingAvailableOnMarketPlace(
      item?.paintingID,
      'availableForSale',
    );
  });
};
const paintingSyncService = async (req, res) => {
  try {
    const { listedTokens } = req.body;

    if (!listedTokens?.length) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: 'No Listed token available',
      });
    }
    await marketplaceListedSync(listedTokens);
    await marketplaceUnlistedSync(listedTokens);

    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Paintings Synced',
    });
  } catch (error) {
    console.log(
      'paintingSyncService Error in Marketplace Controller.js---->',
      error?.message,
    );
    return res.status(200).json({
      status: 200,
      success: false,
      message: error?.message,
    });
  }
};

module.exports = {
  addMint,
  getPaintingDetails,
  getBid,
  addBid,
  getPaintings,
  getSortedPaintings,
  getFilters,
  getAllEditionsOverview,
  getNftsOfPainting,
  createDropAuction,
  approveNftForBuyNow,
  buyNow,
  unlistNft,
  updateMintPrice,
  sellNft,
  paintingSyncService,
  assureMintPrice,
};
