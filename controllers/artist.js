const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');
const database = require('../services/database');
const { ObjectId } = require('mongoose').Types;

/**
 * Post Artist
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Artist Details
 */
const publishArtist = async (request, response) => {
  try {
    const { name, tagline, banner, profileImage, bio, tags, worldID } =
      request.body;
    // Check if present
    if (
      !name ||
      !tagline ||
      !banner ||
      !profileImage ||
      !bio ||
      !tags ||
      !worldID
    )
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

    if (!ObjectId.isValid(worldID))
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.INVALID_WORLD);

    const artist = { name, tagline, banner, profileImage, bio, tags, worldID };
    await database.artist.addArtist(artist, worldID);

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Artist added successfully' });
  } catch (error) {
    console.error('Artist could not be added: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Get Artist
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.query.artistId - Artist Id to get their details
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 * @param {string} request.query.search - Search Text
 * @param {ObjectId} request.body.worldID - world Id
 */
const getArtist = async (request, response) => {
  try {
    let artists;

    if (
      request.query.worldId === 'undefined' ||
      request.query.worldId === undefined
    ) {
      artists = await database.artist.fetchAllArtists(request.query.search);
    } else if (request.query.search !== undefined) {
      artists = await database.artist.searchArtists(
        request.query.search,
        request.query.worldId,
      );
    } else {
      artists = await database.artist.fetchArtists(
        request.query.artistId,
        request.query.worldId,
      );
    }

    artists.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      return 0;
    });

    if (request.query.artistId === undefined) {
      const totalNumberOfArtists = artists.length;
      const numberOfPages = Math.ceil(
        totalNumberOfArtists / request.query.numberOfRows,
      );
      const startIndex = (request.query.page - 1) * request.query.numberOfRows;
      const endIndex = startIndex + request.query.numberOfRows;
      const artistsToDisplay = artists.slice(startIndex, endIndex);

      return response.status(HTTP_STATUS_CODE.OK).json({
        artists: artistsToDisplay,
        Total: totalNumberOfArtists,
        NumberOfPages: numberOfPages,
      });
    }

    return response.json(artists);
  } catch (error) {
    console.error('Artist/s could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Put Artist
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Updated Artist Details
 * @param {string} request.params.artistId - Artist _id
 */
const updateArtist = async (request, response) => {
  try {
    if (Object.keys(request.body).length === 0) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    await database.artist.updateArtist(request.body, request.params.artistId);

    return response.json({ message: 'Artist updated' });
  } catch (error) {
    console.error('Artist could not be updated: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Delete Artist
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.params.artistId - Artist _id
 */
const deleteArtist = async (request, response) => {
  try {
    const { artistId } = request.params;
    const { worldID } = request.body;
    await database.artist.deleteArtist(artistId, worldID);
    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Artist deleted' });
  } catch (error) {
    console.error('Artist could not be deleted: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Put Painting
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Painting Details
 * @param {string} request.params.artistId - Artist Id to which painting is to be added
 */
const putPainting = async (request, response) => {
  try {
    const {
      platform,
      name,
      year,
      genre,
      pointVal,
      description,
      about,
      image,
      format,
      size,
      rarity,
      filetype,
    } = request.body;
    // Check if present
    if (
      !platform ||
      !name ||
      !year ||
      !genre ||
      !pointVal ||
      !description ||
      !about ||
      !image ||
      !format ||
      !size ||
      !rarity ||
      !filetype
    )
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

    const painting = await database.artist.putPaintings(
      { ...request.body, artist: request.params.artistId },
      request.params.artistId,
      request.body.theme,
    );
    return response.status(HTTP_STATUS_CODE.OK).json(painting);
  } catch (error) {
    console.error('Painting could not be added: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Update Painting
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Updated Painting Details
 * @param {string} request.params.paintingId - Painting _id
 * @param {string} request.params.artistId - Artist Id
 */
const updatePainting = async (request, response) => {
  try {
    const { paintingId, artistId } = request.params;

    if (Object.keys(request.body).length === 0) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    await database.artist.updatePainting(request.body, paintingId, artistId);
    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Painting updated' });
  } catch (error) {
    console.error('Painting could not be updated: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Delete Paintings
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {Array} request.body - PaintingIds
 * @param {string} request.params.artistId - Artist Id from which paitings are to be removed
 */
const deletePaintings = async (request, response) => {
  try {
    const { paintingIds } = request.body;

    if (!paintingIds.length) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    for (let i = 0; i < paintingIds.length; i += 1) {
      if (!ObjectId.isValid(paintingIds[i]))
        return response
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json(ERROR_MESSAGE.INVALID_ID);
    }

    const painting = await database.artist.deletePainting(
      paintingIds,
      request.params.artistId,
    );

    return response.status(HTTP_STATUS_CODE.OK).json(painting);
  } catch (error) {
    console.error('Painting/s could not be removed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Get Painting
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.query.paintingId - painting Id to send specific details
 * @param {string} request.params.artistId - Artist Id to which painting is to be sent
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 */
const getArtistPainting = async (request, response) => {
  try {
    const { search, paintingId, page, numberOfRows } = request.query;
    const { artistId } = request.params;
    let painting;

    if (search !== undefined) {
      painting = await database.artist.searchArtistPaintings(artistId, search);
    } else {
      painting = await database.artist.fetchArtistPaintings(
        artistId,
        paintingId,
      );
    }

    if (search !== undefined && search !== '') {
      painting.sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
        return 0;
      });

      const totalNumberOfPaintings = painting.length;
      const numberOfPages = Math.ceil(
        totalNumberOfPaintings / parseInt(numberOfRows, 10),
      );
      const startIndex = (parseInt(page, 10) - 1) * parseInt(numberOfRows, 10);
      const endIndex = startIndex + parseInt(numberOfRows, 10);
      const paintingsToDisplay = painting.slice(startIndex, endIndex);

      return response.status(HTTP_STATUS_CODE.OK).json({
        paintings: paintingsToDisplay,
        Total: totalNumberOfPaintings,
        NumberOfPages: numberOfPages,
      });
    }

    if (paintingId === undefined || paintingId === 'undefined') {
      const paintings = painting[0].paintings;
      paintings.sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
        return 0;
      });

      const totalNumberOfPaintings = paintings.length;
      const numberOfPages = Math.ceil(
        totalNumberOfPaintings / request.query.numberOfRows,
      );
      const startIndex = (request.query.page - 1) * request.query.numberOfRows;
      const endIndex = startIndex + request.query.numberOfRows;
      const paintingsToDisplay = paintings.slice(startIndex, endIndex);

      return response.status(HTTP_STATUS_CODE.OK).json({
        paintings: paintingsToDisplay,
        Total: totalNumberOfPaintings,
        NumberOfPages: numberOfPages,
      });
    }
    let minPrice = painting[0].mints[0].sale.price;
    for (let i = 0; i < painting[0].mints.length; i += 1) {
      if (painting[0].mints[i].sale.price < minPrice) {
        minPrice = painting[0].mints[i].sale.price;
      }
    }
    delete painting[0]._doc.mints;

    return response.status(HTTP_STATUS_CODE.OK).json({
      painting: painting[0],
      minPrice: minPrice,
    });
  } catch (error) {
    console.error('Painting/s could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Get World paintings
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.params.worldId - World Id of which painting is to be sent
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 */
const getWorldPainting = async (request, response) => {
  try {
    const { worldId } = request.params;
    const { page, numberOfRows, search } = request.query;
    const painting = await database.artist.fetchWorldPainting(worldId, search);

    const totalNumberOfPaintings = painting.length;
    const numberOfPages = Math.ceil(totalNumberOfPaintings / numberOfRows);
    const startIndex = (page - 1) * numberOfRows;
    const endIndex = startIndex + numberOfRows;
    const paintingsToDisplay = painting.slice(startIndex, endIndex);

    return response.status(HTTP_STATUS_CODE.OK).json({
      paintings: paintingsToDisplay,
      Total: totalNumberOfPaintings,
      NumberOfPages: numberOfPages,
    });
  } catch (error) {
    console.error('Painting/s could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
  }
};

/**
 * Put Mint to Painting
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Array of mint objects
 * @param {string} request.params.artistId - Artist Id to which painting is linked
 * @param {string} request.query.paintingId - painting Id to which mints is to be added
 */
const addMintToPainting = async (request, response) => {
  try {
    for (let i = 0; i < request.body.length; i += 1) {
      const { name, tokenId, timestamp } = request.body[i];
      // check if present, price can't be zero
      if (!name || !tokenId || !timestamp)
        return response
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

      request.body[i] = {
        ...request.body[i],
        paintingID: request.params.paintingId,
      };
    }

    const world = await database.artist.getWorldNameByPaintingId(
      request.params.paintingId,
    );
    const mint = await database.artist.addMintsToPainting(
      request.body,
      request.params.artistId,
      request.params.paintingId,
      world.platform.name,
    );

    return response.status(HTTP_STATUS_CODE.OK).json(mint);
  } catch (error) {
    console.error('Painting could not be placed for sale', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.PAINTING_SALE_ERROR);
  }
};

/**
 * Update Mint
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.params.paintingId - painting Id to which mints is to be updated
 * @param {string} request.body.mintId - mint Id which is to be updated
 * @param {number} request.body.price - newPrice
 * @param {boolean} request.body.sale - sale value
 */
const putMintDetails = async (request, response) => {
  try {
    const { price, active, mintId } = request.body;

    if (mintId !== undefined) {
      if (!ObjectId.isValid(mintId)) {
        return response
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json(ERROR_MESSAGE.INVALID_MINT);
      }
    }

    const update = {};
    if (price !== undefined) update['sale.price'] = price;
    if (active !== undefined) update['sale.active'] = active;
    await database.artist.putMintDetail(
      request.params.paintingId,
      mintId,
      update,
    );

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Mints updated' });
  } catch (error) {
    console.error('Mint could not be updated', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.PAINTING_SALE_ERROR);
  }
};

/**
 * Get Mints
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {ObjectId} request.query.paintingID - paintingID
 * @param {ObjectId} request.query.mintID - mintID
 * @param {number} request.query.page - page number
 * @param {number} request.query.numberOfRows - number of rows
 * @param {object} request.query - { sortByPrice, listing, edition, saleType, lowPrice, highPrice }
 */
const getMints = async (request, response) => {
  try {
    const {
      paintingID,
      mintID,
      sortByPrice,
      // listing,
      // edition,
      // saleType,
      lowPrice,
      highPrice,
    } = request.query;
    const { page, numberOfRows } = request.query;
    if (mintID === undefined) {
      let mints = (await database.artist.fetchMints(paintingID)).mints;

      if (lowPrice) {
        mints = mints.filter((mint) => mint.sale.price >= lowPrice);
      }
      if (highPrice) {
        mints = mints.filter((mint) => mint.sale.price <= highPrice);
      }
      if (sortByPrice === undefined) {
        mints.sort((a, b) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
          if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
          return 0;
        });
      } else if (sortByPrice === 'lowest') {
        mints.sort((a, b) => {
          if (a.sale.price < b.sale.price) return -1;
          if (a.sale.price > b.sale.price) return 1;
          return 0;
        });
      } else if (sortByPrice === 'highest') {
        mints.sort((a, b) => {
          if (a.sale.price < b.sale.price) return 1;
          if (a.sale.price > b.sale.price) return -1;
          return 0;
        });
      }
      const totalNumberOfMints = mints.length;
      const totalPages = Math.ceil(totalNumberOfMints / parseInt(numberOfRows, 10));
      const startIndex = (parseInt(page, 10) - 1) * parseInt(numberOfRows, 10);
      const endIndex = startIndex + parseInt(numberOfRows, 10);
      const mintsToReturn = mints.slice(startIndex, endIndex);
      return response.status(HTTP_STATUS_CODE.OK).json({
        mints: mintsToReturn,
        totalPages,
        totalNumberOfMints,
      });
    }
    const mint = await database.artist.fetchMintById(mintID);

    let minPrice = mint.paintingID.mints[0].sale.price;
    for (let i = 0; i < mint.paintingID.mints.length; i += 1) {
      if (mint.paintingID.mints[i].sale.price < minPrice) {
        minPrice = mint.paintingID.mints[i].sale.price;
      }
    }

    const mints = mint._doc.paintingID.mints.length;
    delete mint._doc.paintingID.mints.splice(
      0,
      mint._doc.paintingID.mints.length,
    );
    return response.status(HTTP_STATUS_CODE.OK).json({
      NFT: mint,
      minPrice: minPrice,
      mints: mints,
    });

  } catch (error) {
    console.error('Mints could not be fetched', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.MINT_NOT_FOUND);
  }
};

module.exports = {
  publishArtist,
  getArtist,
  getMints,
  deleteArtist,
  putPainting,
  updateArtist,
  putMintDetails,
  updatePainting,
  getWorldPainting,
  deletePaintings,
  getArtistPainting,
  addMintToPainting,
};
