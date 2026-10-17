const { ObjectId } = require('mongoose').Types;
const database = require('../services/database');
const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');

/**
 * Create World
 *
 * @param {object} - request Object
 * @param {object} - response Object
 */
const createWorld = (request, response) => {
  const { name, description, logo, tagline } = request.body;
  const world = {
    name,
    description,
    logo,
    tagline,
  };
  database.world
    .createWorld(world)
    .then(() => {
      response.status(HTTP_STATUS_CODE.OK).json({message: `World ${world.name} created successfully`});
    })
    .catch(() => {
      response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.WORLD_CREATE_FAILED});
    });
};

/**
 * Update World
 *
 * @param {object} - request Object
 * @param {object} - response Object
 */
const updateWorld = async (request, response) => {
  try {
    if (Object.keys(request.body).length === 0) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    const { artists, drops, collections } = request.body;
    const { worldId } = request.params;
    delete request.body.artists;
    delete request.body.drops;

    await database.world.updateWorld(
      worldId,
      request.body,
      artists === undefined ? [] : artists,
      drops === undefined ? [] : drops,
      collections === undefined ? [] : collections,
    );
    return response.status(HTTP_STATUS_CODE.OK).json({message: `World updated successfully`});
  } catch (error) {
    console.error(error);
    return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.WORLD_UPDATE_FAILED});
  }
};

/**
 * Get World
 *
 * @param {object} - request Object
 * @param {object} - response Object
 * @param {ObjectId} - request.params.worldID - World Id
 * @param {number} - request.query.page - pageNumber
 * @param {number} - request.query.numberOfRows - Number of documents expected
 */
const getWorld = async (request, response) => {
  try {
    if (request.query.worldID) {
      const world = await database.world.getWorldById(request.query.worldID);
      return response.status(HTTP_STATUS_CODE.OK).json(world);
    }
    const { page, numberOfRows, search } = request.query;
    let worlds;
    if (search) worlds = await database.world.getWorldByWord(search);
    else worlds = await database.world.getWorld();

    const totalNumberOfWorlds = worlds.length;
    const numberOfPages = Math.ceil(totalNumberOfWorlds / numberOfRows);
    const startIndex = (page - 1) * numberOfRows;
    const endIndex = parseInt(startIndex, 10) + parseInt(numberOfRows, 10);
    const worldsOnPage = worlds.slice(startIndex, endIndex);
    return response.status(HTTP_STATUS_CODE.OK).json({
      worlds: worldsOnPage,
      Total: totalNumberOfWorlds,
      Pages: numberOfPages,
    });
  } catch (error) {
    console.error(error);
    return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.WORLD_GET_FAILED});
  }
};

/**
 * Get Solo NFTs
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {number} request.query.page - pageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 * @param {string} request.query.search - Search string
 */
const getSoloNFTs = async (request, response) => {
  try {
    const { worldId } = request.params;
    const { page, numberOfRows, search } = request.query;

    const paintings = await database.world.getSoloPaintings(worldId, search);

    const totalNumberOfPaintings = paintings.length;
    const numberOfPages = Math.ceil(
      totalNumberOfPaintings / parseInt(numberOfRows, 10),
    );
    const startIndex = (parseInt(page, 10) - 1) * parseInt(numberOfRows, 10);
    const endIndex = parseInt(startIndex, 10) + parseInt(numberOfRows, 10);
    const paintingsOnPage = paintings.slice(startIndex, endIndex);
    response.status(HTTP_STATUS_CODE.OK).json({
      paintings: paintingsOnPage,
      Total: totalNumberOfPaintings,
      Pages: numberOfPages,
    });
  } catch (error) {
    console.error(error);
    response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.REQUEST_NOT_PROCESSED});
  }
};

// Yet to be furnished
/**
 * Delete a world
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.params.worldId - World Id to be deleted
 */
const deleteWorld = async (request, response) => {
  try {
    const { worldId } = request.params;
    await database.world.deleteWorld(worldId);
    response.status(HTTP_STATUS_CODE.OK).json({message: `World deleted successfully`});
  } catch (error) {
    console.error(error);
    response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.WORLD_DELETE_FAILED});
  }
};

/**
 * Filter Paintings
 *
 * @param {object} - request Object
 * @param {object} - response Object
 * @param {object} - request.query - { worldID, rarity, artistID, collectionID, minting, genre, media, saleType, search, lowPrice, highPrice, sortByPrice }
 * @param {number} - request.query.page - PageNumber
 * @param {number} - request.query.numberOfRows - Number of documents expected
 */
const filterPaintings = async (request, response) => {
  try {
    const {
      search,
      // worldID,
      // rarity,
      // artistID,
      // collectionID,
      // genre,
      // media,
      // saleType,
      // lowPrice,
      // highPrice,
      // sortByPrice,
    } = request.query;
    const { page, numberOfRows } = request.query;
    let mints = await database.world.filterPaintings();

    if (mints.length === 0) {
      response.status(HTTP_STATUS_CODE.OK).json({mints: []});
    }

    if (search) {
      const t = [];
      mints.forEach((painting) => {
        if (
          JSON.stringify(painting).toLowerCase().includes(search.toLowerCase())
        )
          t.push(painting);
      });
      mints = t;
    }
    // if (rarity) {
    //     paintings = paintings.filter((painting) => {
    //         return painting.rarity === rarity;
    //     });
    // }
    // if (artistID) {
    //     paintings = paintings.filter((painting) => {
    //         return painting.artistID === artistID;
    //     });
    // }
    // if (collectionID) {
    //     paintings = paintings.filter((painting) => {
    //         return painting.collectionID === collectionID;
    //     });
    // }
    // if (genre) {
    //     paintings = paintings.filter((painting) => {
    //         return painting.genre === genre;
    //     });
    // }
    // // fileType assumed as media
    // if (media) {
    //     paintings = paintings.filter((painting) => {
    //         return painting.fileType === media;
    //     });
    // }
    // if (lowPrice) {
    //     for (let i = 0; i < paintings.length; i+=1) {
    //         cosnt mints = paintings[i].mints.filter((mint) => {
    //             return mint.sale.price >= lowPrice;
    //         })
    //         paintings[i].mints = mints
    //     }
    // }
    // if (highPrice) {
    //     for (let i = 0; i < paintings.length; i+=1) {
    //         const mints = paintings[i].mints.filter((mint) => {
    //             return mint.sale.price <= highPrice;
    //         })
    //         paintings[i].mints = mints
    //     }
    // }
    // // if (saleType) {
    // //     paintings = paintings.filter((painting) => {
    // //         return painting.saleType === saleType;
    // //     });
    // // }
    // let minPrice
    // for (let i = 0; i < paintings.length; i+=1) {
    //     minPrice = paintings[i].mints[0].sale.price;
    //     paintings[i].mints.forEach((mint) => {
    //         minPrice = Math.min(minPrice, mint.sale.price);
    //     })
    //     paintings[i]._doc.minPrice = minPrice;
    // }
    // if (sortByPrice === undefined) {
    //     paintings.sort((a, b) => {
    //         if(a.title.toLowerCase() < b.title.toLowerCase()) return -1;
    //         if(a.title.toLowerCase() > b.title.toLowerCase()) return 1;
    //         return 0;
    //     });
    // } else if (sortByPrice === 'lowest') {
    //     paintings.sort((a, b) => {
    //         if (a.minPrice < b.minPrice) return -1;
    //         if (a.minPrice > b.minPrice) return 1;
    //         return 0;
    //     })
    // } if (sortByPrice === 'highest') {
    //     paintings.sort((a, b) => {
    //         if (a.minPrice < b.minPrice) return 1;
    //         if (a.minPrice > b.minPrice) return -1;
    //         return 0;
    //     })
    // }
    const totalNumberOfPaintings = mints.length;
    const numberOfPages = Math.ceil(
      totalNumberOfPaintings / parseInt(numberOfRows, 10),
    );
    const startIndex = (parseInt(page,10) - 1, 10) * parseInt(numberOfRows, 10);
    const endIndex = startIndex + parseInt(numberOfRows, 10);
    const paintingsToShow = mints.slice(startIndex, endIndex);
    return response.status(HTTP_STATUS_CODE.OK).json({
      paintings: paintingsToShow,
      numberOfPages,
      totalNumberOfPaintings,
    });
  } catch (error) {
    console.error(error);
    return response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.PAINTING_FILTER_FAILED});
  }
};

/**
 * Post Collection
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - collection details
 * @param {string} request.params.worldID - World Id to which collection is to be added
 */
const postCollection = async (request, response) => {
  try {
    const { name, logo } = request.body;

    // Check if present
    if (!name || !logo) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Collection added successfully.' });
  } catch (error) {
    console.error('Collection could not be added: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Delete Collections
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {Array} request.body - collectionIds
 * @param {string} request.params.worldId - World Id from which collections are to be removed
 */
const deleteCollection = async (request, response) => {
  try {
    const { collectionIds } = request.body;

    if (!collectionIds.length) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    for (let i = 0; i < collectionIds.length; i += 1) {
      if (!ObjectId.isValid(collectionIds[i]))
        return response
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json(ERROR_MESSAGE.INVALID_ID);
    }

    const collection = await database.world.deleteCollection(
      collectionIds,
      request.params.worldId,
    );

    return response.json(collection);
  } catch (error) {
    console.error('Collection could not be removed: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Put Collection
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Updated Collection Details
 * @param {string} request.params.worldId - World _id
 * @param {string} request.params.collectionId - Collection _id
 */
const updateCollection = async (request, response) => {
  try {
    if (Object.keys(request.body).length === 0) {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);
    }

    await database.world.updateCollection(
      request.body,
      request.params.worldId,
      request.params.collectionId,
    );

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Collection updated' });
  } catch (error) {
    console.error('Collection could not be updated: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Get all Collections
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.query.search - Search word
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 */
const getAllCollections = async (request, response) => {
  try {
    const { search, page, numberOfRows } = request.query;
    let collections;

    if (!search) {
      collections = await database.world.getAllCollections();
    } else {
      collections = await database.world.searchAllCollections(search);
    }

    collections.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    const totalNumberOfCollections = collections.length;
    const numberOfPages = Math.ceil(totalNumberOfCollections / numberOfRows);
    const startIndex = (page - 1) * numberOfRows;
    const endIndex = startIndex + numberOfRows;
    const collectionsToShow = collections.slice(startIndex, endIndex);
    response.status(HTTP_STATUS_CODE.OK).json({
      collections: collectionsToShow,
      Total: totalNumberOfCollections,
      NumberOfPages: numberOfPages,
    });
  } catch (error) {
    console.error(error);
    response.status(HTTP_STATUS_CODE.BAD_REQUEST).json({message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR});
  }
};

/**
 * Get Collections
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {string} request.query.collectionId - collection Id to send specific details
 * @param {string} request.params.worldId - World Id of which collection is to be sent
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 */
const getCollection = async (request, response) => {
  try {
    let collections;

    if (request.query.search !== undefined) {
      collections = await database.world.searchCollections(
        request.query.search,
        request.params.worldId,
      );
    } else {
      collections = await database.world.fetchCollections(
        request.params.worldId,
        request.query.collectionId,
      );
    }

    collections.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      return 0;
    });

    if (request.query.collectionId === undefined) {
      const totalNumberOfCollections = collections.length;
      const numberOfPages = Math.ceil(
        totalNumberOfCollections / request.query.numberOfRows,
      );
      const startIndex = (request.query.page - 1) * request.query.numberOfRows;
      const endIndex = startIndex + request.query.numberOfRows;
      const collectionsToDisplay = collections.slice(startIndex, endIndex);

      return response.status(HTTP_STATUS_CODE.OK).json({
        collections: collectionsToDisplay,
        Total: totalNumberOfCollections,
        NumberOfPages: numberOfPages,
      });
    }
    return response.status(HTTP_STATUS_CODE.OK).json(collections);
  } catch (error) {
    console.error('Collection/s could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(HTTP_STATUS_CODE.INTERNAL_SERVER);
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
    const { collectionId } = request.params;
    const { page, numberOfRows, search } = request.query;

    let { paintings } = await database.world.getPaintings(collectionId);

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

    const totalNumberOfPaintings = paintings.length;
    const numberOfPages = Math.ceil(totalNumberOfPaintings / numberOfRows);
    const start = (page - 1) * numberOfRows;
    const end = start + numberOfRows;
    const paintingsToDisplay = paintings.slice(start, end);

    return response.status(HTTP_STATUS_CODE.OK).json({
      paintings: paintingsToDisplay,
      Total: totalNumberOfPaintings,
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
 * Put Painting to Collection
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Painting Details
 * @param {string} request.params.worldId - World Id to which painting is to be added
 * @param {string} request.params.collectionId - Collection Id to which painting is to be added
 */
const updateTheCollection = async (request, response) => {
  try {
    const { paintingIDs, artistIDs, key } = request.body;

    if (key === 'add') {
      if (artistIDs) {
        await database.world.addArtists(request.params.collectionId, artistIDs);
      }
      if (paintingIDs) {
        await database.world.addPaintings(
          request.params.collectionId,
          paintingIDs,
        );
      }
    } else if (key === 'remove') {
      if (artistIDs) {
        await database.world.removeArtists(
          request.params.collectionId,
          artistIDs,
        );
      }
      if (paintingIDs) {
        await database.world.removePaintings(
          request.params.collectionId,
          paintingIDs,
        );
      }
    } else {
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.INVALID_REQUEST);
    }

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ message: 'Collection updated' });
  } catch (error) {
    console.error(error);
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
 * @param {string} request.params.worldId - World Id from which painting is to be sent
 * @param {string} request.params.collectionId - Collection Id from which painting is to be sent
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 */
const getCollectionPainting = async (request, response) => {
  try {
    const painting = await database.world.fetchCollectionPaintings(
      request.params.worldId,
      request.params.collectionId,
      request.query.paintingId,
    );

    if (request.query.paintingId === undefined) {
      const paintings = painting[0].paintings;
      paintings.sort((a, b) => {
        if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
        if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
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

    return response.status(HTTP_STATUS_CODE.OK).json({ painting: painting[0] });

    // if (request.query.search === undefined) {
    //     const mints = painting[0].mints
    //     mints.sort((a, b) => {
    //         if (a['tokenId'].toLowerCase() < b['tokenId'].toLowerCase()) return -1;
    //         if (a['tokenId'].toLowerCase() > b['tokenId'].toLowerCase()) return 1;
    //         return 0;
    //     })

    //     return response
    //         .status(HTTP_STATUS_CODE.OK)
    //         .json({
    //             'mints': mints.slice(request.query.page, request.query.page + request.query.numberOfRows),
    //             'Total': mints.length
    //         })
    // }

    // painting.sort((a, b) => {
    //     if (a['tokenId'].toLowerCase() < b['tokenId'].toLowerCase()) return -1;
    //     if (a['tokenId'].toLowerCase() > b['tokenId'].toLowerCase()) return 1;
    //     return 0;
    // })

    // return response
    //     .status(HTTP_STATUS_CODE.OK)
    //     .json({
    //         'mints': painting.slice(parseInt(request.query.page) * parseInt(request.query.numberOfRows), parseInt(request.query.page)* parseInt(request.query.numberOfRows) + parseInt(request.query.numberOfRows)),
    //         'Total': painting.length
    //     })
  } catch (error) {
    console.error('Painting/s could not be fetched: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Put Mint to Collection Painting
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.body - Array of mint objects
 * @param {string} request.params.worldId - World Id to which painting is linked
 * @param {string} request.params.collectionId - Collection Id in which painting is present
 * @param {string} request.query.paintingId - painting Id to which mints is to be added
 */
const addMintToCollectionPainting = async (request, response) => {
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

    const mint = await database.world.addMintsToCollectionPainting(
      request.body,
      request.params.worldId,
      request.params.paintingId,
      request.params.collectionId,
    );

    return response.status(HTTP_STATUS_CODE.OK).json(mint);
  } catch (error) {
    console.error('Painting could not be placed for sale', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.PAINTING_SALE_ERROR);
  }
};

module.exports = {
  getWorld,
  getSoloNFTs,
  createWorld,
  updateWorld,
  deleteWorld,
  getPaintings,
  getCollection,
  postCollection,
  filterPaintings,
  updateCollection,
  deleteCollection,
  getAllCollections,
  updateTheCollection,
  getCollectionPainting,
  addMintToCollectionPainting,
};
