const { ObjectId } = require('mongoose').Types;
const World = require('../../models/world.model');
const Painting = require('../../models/painting.model');
const Collection = require('../../models/collection.model');
const Mint = require('../../models/mint.model');

/**
 * Create World
 *
 * @param {object} world - world object
 */
const createWorld = async (world) => {
  try {
    const newWorld = new World(world);
    return newWorld.save();
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Update World
 *
 * @param {ObjectId} worldID - world id
 * @param {object} worldUpdate - updated fields
 * @param {Array} artists - Artist array
 * @param {Array} drops - Drop array
 */
const updateWorld = async (
  worldID,
  worldUpdate,
  artists,
  drops,
  collections,
) => {
  try {
    await World.updateOne(
      { _id: worldID },
      {
        $push: {
          artists: { $each: artists },
          drops: { $each: drops },
          collections: { $each: collections },
        },
        $set: worldUpdate,
      },
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Get solo paintings
 *
 * @param {ObjectId} worldID - world id
 * @param {string} search - word
 */
const getSoloPaintings = async (worldId, search) => {
  try {
    if (search) {
      await Painting.createIndexes({ '$**': search });
      return Painting.find(
        {
          platform: worldId,
          dropDate: null,
          $text: { $search: search },
        },
        {
          name: 1,
          mints: 1,
        },
      )
        .populate('mints', { tokenId: 1 })
        .exec();
    }
    return Painting.find(
      {
        platform: worldId,
        dropDate: null,
      },
      {
        name: 1,
        mints: 1,
      },
    )
      .populate('mints', { tokenId: 1 })
      .exec();
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Get world by Id
 *
 * @param {ObjectId} worldID - world id
 */
const getWorldById = async (worldID) => {
  try {
    return World.find({ _id: worldID }).exec();
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Get World
 *
 */
const getWorld = async () => {
  try {
    const world = await World.find({}, { name: 1 }).exec();
    return world;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Get world by word
 *
 * @param {string} search - word
 */
const getWorldByWord = async (search) => {
  try {
    await World.createIndexes({ '$**': search });
    return World.find({ $text: { $search: search } }, { name: 1 }).exec();
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Delete world
 *
 * @param {string} worldId World _id
 */
const deleteWorld = async (worldId) => {
  try {
    await World.remove({ _id: worldId }).exec();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Filter Paintings
 *
 */
const filterPaintings = async () => {
  try {
    const populateObj = {
      path: 'paintingID',
      populate: [
        {
          path: 'artist',
          select: { name: 1 },
        },
        {
          path: 'theme',
          select: { name: 1 },
        },
      ],
    };
    return Mint.find({
      'sale.active': true,
      currentBuyer: { $exists: true, $ne: null },
    })
      .populate(populateObj)
      .exec();
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * Post Collection
 *
 * @param {object} newCollection Collection Object
 * @param {string} worldId World _id
 */
const postCollection = async (newCollection, worldId) => {
  try {
    newCollection.num = (await Collection.countDocuments({})) + 1;
    const collection = new Collection(newCollection);
    await collection.save();
    await World.updateOne(
      { _id: worldId },
      { $push: { collections: collection._id } },
    );
    return collection;
  } catch (err) {
    return err;
  }
};

/**
 * Get Paintings
 *
 * @param {ObjectId} collectionId - Drop ID
 */
const getPaintings = async (collectionId) => {
  try {
    const paintings = await Collection.findOne({ _id: collectionId }).populate(
      'paintings',
    );
    return paintings;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Delete Collection
 *
 * @param {Array} collectionIds all collectionIds
 * @param {string} worldId World _id
 */
const deleteCollection = async (collectionIds, worldId) => {
  try {
    await Collection.deleteMany({
      _id: { $in: collectionIds },
      worldID: worldId,
    });
    return World.updateOne(
      { _id: worldId },
      { $pull: { collections: { $in: collectionIds } } },
    );
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Update collection
 *
 * @param {object} req modified fields
 * @param {string} worldId Artist _id
 * @param {string} collectionId collection _id
 */
const updateCollection = async (req, worldId, collectionId) => {
  try {
    return Collection.updateOne(
      {
        _id: collectionId,
        worldID: worldId,
      },
      { $set: req },
    );
  } catch (err) {
    return err;
  }
};

/**
 * Get Collections
 *
 * @param {string} collectionId Collection _id
 * @param {ObjectId} worldId World _id
 */
const fetchCollections = async (worldId, collectionId) => {
  try {
    if (collectionId === undefined) {
      return Collection.find({ worldID: worldId }).exec();
    }
    return Collection.find({ _id: collectionId }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Get all collections
 *
 */
const getAllCollections = async () => {
  try {
    const collections = await Collection.find(
      { name: { $nin: ['World of Dragons'] } },
      { name: 1 },
    ).exec();
    return collections;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * search All Collections
 *
 * @param {string} search - word
 */
const searchAllCollections = async (search) => {
  try {
    await Collection.createIndexes({ '$**': search });
    return Collection.find({ $text: { $search: search } }, { name: 1 }).exec();
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Search Collections
 *
 * @param {string} search - seach word
 * @param {ObjectId} worldId - world _id
 */
const searchCollections = async (search, worldId) => {
  try {
    if (search === '') return Collection.find({ worldID: worldId }).exec();
    return Collection.find({
      worldID: worldId,
      $text: { $search: search },
    }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Add painting to collection
 *
 * @param {object} newPainting modified fields
 * @param {string} worldId World _id
 * @param {string} collectionId collection _id
 */
const putCollectionPainting = async (newPainting, collectionId, worldId) => {
  try {
    const painting = new Painting(newPainting);
    await painting.save();
    await Collection.updateOne(
      {
        _id: collectionId,
        worldID: worldId,
      },
      { $push: { paintings: painting._id } },
    );
    return painting;
  } catch (err) {
    return err;
  }
};

/**
 * Get Collection Paintings
 *
 * @param {string} collectionId Collection _id
 * @param {string} worldId World _id
 * @param {string} paintingId painting _id
 */
const fetchCollectionPaintings = async (worldId, collectionId, paintingId) => {
  try {
    if (paintingId === undefined) {
      return Collection.find(
        { _id: collectionId, worldID: worldId },
        { paintings: 1 },
      )
        .populate('paintings')
        .exec();
    }
    return Painting.find({
      _id: paintingId,
      worldID: worldId,
      collectionID: collectionId,
    }).exec();
    // return Mint.find({ paintingID: paintingId, $text: { $search: search } }).exec()
    // if (search === undefined) {
    //   return Painting.find({ _id: paintingId, artistID: artistId, collectionID: collectionId }).populate('mints').exec()
    // }
    // if (search === '') {
    //   return Mint.find({ paintingID: paintingId }).exec()
    // }
  } catch (err) {
    return err;
  }
};

/**
 * Put Mints to Collection Painting
 *
 * @param {string} worldId Artist _id
 * @param {string} paintingId painting _id
 * @param {string} collectionId collection _id
 * @param {Array} mints Mint array
 */
const addMintsToCollectionPainting = async (
  mints,
  worldId,
  paintingId,
  collectionId,
) => {
  try {
    let mint = await Mint.insertMany(mints);
    mint = mint.map((element) => {
      return ObjectId(element._id);
    });

    return Painting.updateOne(
      {
        _id: paintingId,
        worldID: worldId,
        collectionID: collectionId,
      },
      { $push: { mints: { $each: mint } } },
    );
  } catch (err) {
    return err;
  }
};

/**
 * Add Painting to a Collection
 *
 * @param {ObjectId} collectionId - Collection ID
 * @param {ObjectId} paintingId - Painting ID
 */
const addPaintings = async (collectionId, paintingId) => {
  try {
    await Collection.updateOne(
      { _id: collectionId },
      { $addToSet: { paintings: { $each: paintingId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Remove Painting to a Collection
 *
 * @param {ObjectId} collectionId - Collection ID
 * @param {ObjectId} paintingId - Painting ID
 */
const removePaintings = async (collectionId, paintingId) => {
  try {
    await Collection.updateOne(
      { _id: collectionId },
      { $pull: { paintings: { $in: paintingId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Add Artist to a Collection
 *
 * @param {ObjectId} collectionId - Collection ID
 * @param {ObjectId} artistId - Artist ID
 */
const addArtists = async (collectionId, artistId) => {
  try {
    await Collection.updateOne(
      { _id: collectionId },
      { $addToSet: { artists: { $each: artistId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Remove Artist to a Collection
 *
 * @param {ObjectId} collectionId - Collection ID
 * @param {ObjectId} artistId - Artist ID
 */
const removeArtists = async (collectionId, artistId) => {
  try {
    await Collection.updateOne(
      { _id: collectionId },
      { $pull: { artists: { $in: artistId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

module.exports = {
  addArtists,
  addPaintings,
  removeArtists,
  removePaintings,
  getWorld,
  createWorld,
  updateWorld,
  deleteWorld,
  getPaintings,
  getWorldById,
  getWorldByWord,
  getSoloPaintings,
  getAllCollections,
  postCollection,
  filterPaintings,
  searchCollections,
  deleteCollection,
  updateCollection,
  fetchCollections,
  searchAllCollections,
  putCollectionPainting,
  fetchCollectionPaintings,
  addMintsToCollectionPainting,
};
