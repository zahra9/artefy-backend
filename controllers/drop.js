const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');
const database = require('../services/database');
const adminWallet = require('../services/adminWallet/index');

/**
 * Publish Drop
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Object} request.body - Drop details
 */
const publishDrop = async (request, response) => {
  try {
    const { name, description, releaseTime, logo, worldID } = request.body;
    if (!name || !releaseTime || !logo || !worldID || !description) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }
    const drop = { name, releaseTime, logo, worldID, description };
    await database.drop.addDrop(drop);

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Drop created successfully' });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Update Drop
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Object} request.body - Drop details
 */
const updateDrop = async (request, response) => {
  try {
    if (Object.keys(request.body).length === 0) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    await database.drop.updateDrop(request.body, request.params.dropId);

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Drop updated successfully' });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Get Drops
 *
 * @param {Object} request
 * @param {Object} response
 * @param {number} - request.query.page - PageNumber
 * @param {number} - request.query.numberOfRows - Number of documents expected
 */
const getDrops = async (request, response) => {
  try {
    const { worldId, search, dropId } = request.query;
    const { page, numberOfRows } = request.query;
    let drops;

    if (request.query.search !== undefined) {
      drops = await database.drop.searchDrops(worldId, search);
    } else if (worldId !== undefined)
      drops = await database.drop.getDrops(worldId);
    else drops = await database.drop.fetchDrops(dropId);
    if (dropId) return response.status(HTTP_STATUS_CODE.OK).json(drops);

    const totalNumberOfDrops = drops.length;
    const numberOfPages = Math.ceil(
      totalNumberOfDrops / parseInt(numberOfRows, 10),
    );
    const start = (parseInt(page, 10) - 1) * parseInt(numberOfRows, 10);
    const end = start + parseInt(numberOfRows, 10);
    const dropsToDisplay = drops.slice(start, end);

    return response.status(HTTP_STATUS_CODE.OK).json({
      drops: dropsToDisplay,
      Total: totalNumberOfDrops,
      numberOfPages,
    });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Add Paintings
 *
 * @param {Object} request
 * @param {Object} response
 * @param {ObjectID} request.body - Paintings IDs
 * @param {ObjectID} request.body - Artist IDs
 * @param {ObjectID} request.body - Collection IDs
 */
const updateTheDrop = async (request, response) => {
  try {
    const { paintingIDs, artistIDs, key, price, cryptoPrice } = request.body;

    if (key === 'add') {
      if (!price || !cryptoPrice) {
        return response
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
      }
      if (artistIDs) {
        await database.drop.addArtists(request.params.dropId, artistIDs);
      }
      if (paintingIDs) {
        await database.drop.addPaintings(
          request.params.dropId,
          paintingIDs,
          price,
          cryptoPrice,
        );
      }
    } else if (key === 'remove') {
      if (artistIDs) {
        await database.drop.removeArtists(request.params.dropId, artistIDs);
      }
      if (paintingIDs) {
        await database.drop.removePaintings(request.params.dropId, paintingIDs);
      }
    } else {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.INVALID_REQUEST);
    }

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Drop updated' });
  } catch (error) {
    console.error(error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Get Paintings
 *
 * @param {Object} request
 * @param {Object} response
 * @param {number} - request.query.page - PageNumber
 * @param {number} - request.query.numberOfRows - Number of documents expected
 */
const getPaintings = async (request, response) => {
  try {
    const { dropId } = request.params;

    const { page, numberOfRows, search } = request.query;
    let paintings = (await database.drop.getPaintings(dropId)).paintings;
    const wallet = await adminWallet.getWallet(
      process.env.ADMIN_WALLET_PRIVATE_KEY,
    );
    const tokenIDList = await adminWallet.getAdminTokenBalance(wallet);

    if (search !== undefined && search !== '') {
      const t = [];
      paintings.forEach((painting) => {
        if (
          JSON.stringify(painting).toLowerCase().includes(search.toLowerCase())
        )
          t.push(painting);
      });
      paintings = t;
    }

    paintings.forEach((painting) => {
      const mints = [];
      painting.mints.forEach((mint) => {
        if (tokenIDList.includes(mint.tokenId)) mints.push(mint);
      });
      painting.mints = mints;
    });

    paintings.forEach((painting) => {
      let count = 0;
      if (painting.mints[0]) {
        let minPrice = painting.mints[0].sale.price;
        let minCryptoPrice = painting.mints[0].sale.cryptoPrice;
        painting._doc.mintCount = painting.mints.length;
        painting.mints.forEach((mint) => {
          if (mint.sale.price < minPrice) {
            minPrice = mint.sale.price;
          }
          if (mint.sale.cryptoPrice < minCryptoPrice) {
            minCryptoPrice = mint.cryptoPrice;
          }
          if (mint.sale.active && !mint.sale.sold) {
            count += 1;
          }
        });
        painting._doc.minPrice = minPrice;
        painting._doc.minCryptoPrice = minCryptoPrice;
        painting._doc.availableMint = count;
      }
    });

    const totalNumberOfPaintings = paintings.length;
    const numberOfPages = Math.ceil(
      totalNumberOfPaintings / parseInt(numberOfRows, 10),
    );
    const start = (parseInt(page, 10) - 1) * parseInt(numberOfRows, 10);
    const end = start + parseInt(numberOfRows, 10);
    const paintingsToDisplay = paintings.slice(start, end);

    return response.status(HTTP_STATUS_CODE.OK).json({
      paintings: paintingsToDisplay,
      Total: totalNumberOfPaintings,
      numberOfPages,
    });
  } catch (error) {
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  }
};

const getDropStats = async (req, res) => {
  const { slug } = req.params;
  if (!slug)
    return res
      .status(HTTP_STATUS_CODE.NOT_FOUND)
      .json({ message: 'please enter a valid slug' });
  return res
    .status(HTTP_STATUS_CODE.OK)
    .json(await database.drop.getLatestDropStats(slug));
};

const getDropPaintings = async (request, response) => {
  try {
    const { slug } = request.params;
    const { paintings, name, description, artists, collections, subTitle, logo, backgroundImage } =
      (await database.drop.getPaintingsBySlug(slug)) || {};
    if (!paintings) {
      return response.status(HTTP_STATUS_CODE.OK).json([]);
    }

    const totalMintsHardCoded = 0;
    const paintingsResponse = JSON.parse(JSON.stringify(paintings)).map((element) => {
      // if (
      //   element?.name === 'The Rise' ||
      //   element?._id.toString() === '618377b315cee10013a3329f'
      // ) {
      //   totalMintsHardCoded = 150;
      // }

      const availableMints = element.mints.filter(
        (mint) => !mint?.sale?.sold && mint.sale.active,
      ).length;
      const isComingSoon =
        new Date().getTime() < new Date(element?.dropDate).getTime();
      const isDropFinished =
        new Date(element?.dropEndDate).getTime() < new Date().getTime();
      // HARD CODED PLEASE REMOVE
      
      const {
        PlatinumBadge,
        PlatinumIcon,
        PlatinumImage,
        PlatinumBackground,
        PlatinumDescription,
      } = element;
      return {
        id: element?._id,
        name: element?.name,
        aboutArtWork: element?.about,
        aboutNFT: element?.aboutNFT,
        aboutArtist: element?.artists,
        previewUrl: element?.previewUrl,
        preview3DUrl: element?.preview3DUrl,
        gridImg: element?.previewUrl,
        authorBadge: element?.partnerBadge,
        collection: element?.collectionTitle,
        dropDate: element?.dropDate,
        rarity: element?.rarity,
        artist: element?.artists,
        desc: element?.description,
        saleType: element?.saleType,
        price: element?.price,
        cryptoPrice: element?.cryptoPrice,
        isSold: false,
        availableMints: availableMints,
        orientation: element?.orientation,
        slug: element?.slug,
        silverBadge: element?.silverBadge,
        totalMints:
          totalMintsHardCoded > 0
            ? totalMintsHardCoded
            : element?.mints?.length,
        dropStartDate: element?.dropDate,
        dropEndDate: element?.dropEndDate,
        isComingSoon: isComingSoon,
        isDropFinished: isDropFinished,
        drop3DEditionImageUrl: element?.drop3DEditionImageUrl,
        comicSideBannerUrl: element?.comicSideBannerUrl,
        PlatinumBadge,
        PlatinumIcon,
        PlatinumImage,
        PlatinumBackground,
        PlatinumDescription,
      };
    });

    return response.status(HTTP_STATUS_CODE.OK).json({
      paintings: paintingsResponse,
      dropName: name,
      dropDesc: description,
      dropArtist: artists.length,
      dropCollection: collections.length,
      dropPainting: paintings.length,
      subTitle: subTitle,
      backgroundImage,
      logo,
    });
  } catch (error) {
    console.error(error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};
/**
 * Get latest Drop
 *
 * @param {Object} request
 * @param {Object} response
 */
const getLatestDrop = async (req, res) => {
  try {
    const drop = await database.drop.getLatestDrop();
    if (drop) {
      return res.status(HTTP_STATUS_CODE.OK).json({ dropId: drop._id });
    }
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: false,
      message: 'No drop found',
    });
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  publishDrop,
  updateDrop,
  getDrops,
  updateTheDrop,
  getPaintings,
  getLatestDrop,
  getDropPaintings,
  getDropStats,
};
