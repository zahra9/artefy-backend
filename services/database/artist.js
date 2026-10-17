const { ObjectId } = require('mongoose').Types;
const Mint = require('../../models/mint.model');
const Artist = require('../../models/artist.model');
const Painting = require('../../models/painting.model');
const Collection = require('../../models/collection.model');
const World = require('../../models/world.model');

/**
 * Store artist in DB
 *
 * @param {object} artist Artist Object
 * @param {ObjectId} worldID World id
 */
const addArtist = async (artist, worldID) => {
  try {
    const newArtist = new Artist(artist);
    await newArtist.save();
    return World.updateMany(
      { _id: { $in: worldID } },
      { $addToSet: { artists: newArtist._id } },
    ).exec();
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Get artist from DB
 *
 * @param {object} search Search word
 * @param {string} worldID World id
 */
const searchArtists = async (search, worldID) => {
  try {
    if (search === '') return Artist.find({ worldID: worldID }).exec();
    return Artist.find({
      worldID: worldID,
      $text: { $search: search },
    }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Get artists from DB
 *
 * @param {string} artistId Artist _id
 * @param {string} worldId World _id
 */
const fetchArtists = async (artistId, worldId) => {
  try {
    if (artistId === undefined) {
      return Artist.find({ worldID: worldId }).exec();
    }
    return Artist.find({ _id: artistId, worldID: worldId }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Fetch all artists
 *
 * @param search - search word
 */
const fetchAllArtists = async (search) => {
  const filterArtist = {
    name: {
      $nin: [
        'Artefy v2',
        'Bob Fingerman',
        'Edit',
        'Gideon Kendall',
        'Luis Royo',
        'Matic Artist',
        'Primary',
        'Sven Sauer',
        'Frank Frazetta & Jimis X',
      ],
    },
  };

  try {
    if (search === undefined || search === '')
      return Artist.find(filterArtist).exec();
    return Artist.find({ $text: { $search: search }, filterArtist }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Update Artist
 *
 * @param {object} req modified Fields
 * @param {string} artistId Artist _id
 */
const updateArtist = async (req, artistId) => {
  try {
    if (req.worldID) {
      await World.updateOne(
        { _id: req.worldID },
        { $addToSet: { artists: artistId } },
      ).exec();
      await Artist.updateOne(
        { _id: artistId },
        { $addToSet: { worldID: req.worldID } },
      ).exec();
    }
    delete req.worldID;

    return Artist.updateOne({ _id: artistId }, { $set: req });
  } catch (err) {
    return err;
  }
};

/**
 * Update Painting
 *
 * @param {object} req modified Fields
 * @param {string} paintingId painting _id
 * @param {string} artistId Artist _id
 */
const updatePainting = async (req, paintingId, artistId) => {
  try {
    return Painting.updateOne(
      {
        _id: paintingId,
        artist: artistId,
      },
      { $set: req },
    );
  } catch (err) {
    return err;
  }
};

/**
 * Delete Artist
 *
 * @param {string} artistId Artist _id
 * @param {string} worldID World id
 */
const deleteArtist = async (artistId, worldID) => {
  try {
    await Artist.deleteOne({ _id: artistId });
    worldID.forEach(async (id) => {
      await World.updateOne({ _id: id }, { $pull: { artists: artistId } });
    });
    return true;
  } catch (err) {
    return err;
  }
};

/**
 * Add paintings to Artist
 *
 * @param {object} req modified Fields
 * @param {string} artistId Artist _id
 */
const putPaintings = async (req, artistId, collectionId) => {
  try {
    req.num = (await Painting.countDocuments({})) + 1;
    const painting = new Painting(req);
    await painting.save();
    await Artist.updateOne(
      { _id: artistId },
      { $addToSet: { paintings: painting._id } },
    );
    await Collection.updateOne(
      { _id: collectionId },
      { $addToSet: { paintings: painting._id } },
    );
    return painting;
  } catch (err) {
    return err;
  }
};

/**
 * Delete Paintings from artist
 *
 * @param {Array} paintingIds all paintingIDs
 * @param {string} artistId Artist _id
 */
const deletePainting = async (paintingIds, artistId) => {
  try {
    await Painting.deleteMany({
      _id: { $in: paintingIds },
      artistID: artistId,
    });
    return Artist.updateOne(
      { _id: artistId },
      { $pull: { paintings: { $in: paintingIds } } },
    );
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Get Artist Paintings
 *
 * @param {string} paintintId Painting _id
 * @param {string} artistId Artist _id
 */
const fetchArtistPaintings = async (artistId, paintingId) => {
  try {
    if (paintingId === undefined || paintingId === 'undefined') {
      return Artist.find({ _id: artistId }, { paintings: 1 })
        .populate('paintings')
        .exec();
    }
    const populateObj = [
      {
        path: 'artists',
        select: {
          name: 1,
          bio: 1,
        },
      },
      {
        path: 'mints',
        select: {
          name: 1,
          sale: 1,
        },
      },
    ];
    return Painting.find({ _id: paintingId, artists: artistId })
      .populate(populateObj)
      .exec();
  } catch (err) {
    return err;
  }
};

/**
 * Search Artist Paintings
 *
 * @param {string} artistId Artist _id
 * @param {string} search searckWord
 */
const searchArtistPaintings = async (artistId, search) => {
  try {
    if (search === '')
      return Artist.find({ _id: artistId }, { paintings: 1 })
        .populate('paintings')
        .exec();
    return Painting.find({
      artistID: artistId,
      $text: { $search: search },
    }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Get World Paintings
 *
 * @param {string} worldID World id
 * @param {string} search search word
 */
const fetchWorldPainting = async (worldID, search) => {
  try {
    if (search === undefined || search === '')
      return Painting.find({ platform: worldID }, { name: 1 }).exec();
    return Painting.find({
      platform: worldID,
      $text: { $search: search },
    }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Put Mints to Painting
 *
 * @param {string} artistId Artist _id
 * @param {string} paintingId painting _id
 * @param {Array} mints Mint array
 * @param {string} world world name
 */
const addMintsToPainting = async (mints, artistId, paintingId, world) => {
  try {
    const paintCount = (await Painting.find({ _id: paintingId }))[0].num;
    // const colCount = (await Collection.find({ paintings: paintingId }))[0].num;
    for (let i = 0; i < mints.length; i += 1) {
      const artPieceNumber =
        'ART-' +
        world.toUpperCase() +
        '-' +
        paintCount +
        '-' +
        // colCount +
        // '-' +
        (i + 1);
      mints[i].artPieceNumber = artPieceNumber;
      mints[i].num = i + 1;
    }

    let mint = await Mint.insertMany(mints);
    mint = mint.map((element) => {
      return ObjectId(element._id);
    });

    return Painting.updateOne(
      {
        _id: paintingId,
        // artist: artistId,
      },
      { $addToSet: { mints: { $each: mint } } },
    );
  } catch (err) {
    console.error(err);
    return err;
  }
};

/**
 * Put Mint Detail
 *
 * @param {string} req updated fields
 * @param {string} paintingId painting _id
 * @param {string} mintId mint _id
 */
const putMintDetail = async (paintingId, mintId, req) => {
  try {
    if (mintId) {
      await Mint.updateOne(
        {
          _id: mintId,
          paintingID: paintingId,
        },
        { $set: req },
      );
    } else {
      await Mint.updateMany({ paintingID: paintingId }, { $set: req });
    }
    return true;
  } catch (err) {
    return err;
  }
};

/**
 * Get Mints
 *
 * @param {ObjectId} paintingId painting _id
 */
const fetchMints = async (paintingId) => {
  try {
    const populateObj = {
      path: 'mints',
      populate: [
        {
          path: 'currentBuyer',
          select: { address: 1 },
        },
      ],
    };
    return Painting.findOne({ _id: paintingId }).populate(populateObj).exec();
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Get Mint by Id
 *
 * @param {ObjectId} mintId mint _id
 */
const fetchMintById = async (mintId) => {
  try {
    const populateObj = {
      path: 'paintingID',
      populate: [
        {
          path: 'artist',
          select: {
            name: 1,
            bio: 1,
          },
        },
        {
          path: 'mints',
          select: {
            name: 1,
            sale: 1,
          },
        },
      ],
    };
    return Mint.findOne({ _id: mintId }).populate(populateObj).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Get world name by paintingId
 *
 * @param {string} paintingId painting _id
 */
const getWorldNameByPaintingId = async (paintingId) => {
  try {
    return Painting.findOne({ _id: paintingId })
      .populate('platform', { name: 1 })
      .exec();
  } catch (err) {
    return err;
  }
};

const getArtistById = (id) => {
  return Artist.findById(id);
};

module.exports = {
  fetchMints,
  fetchMintById,
  fetchAllArtists,
  deleteArtist,
  addArtist,
  updatePainting,
  searchArtists,
  putMintDetail,
  fetchArtists,
  updateArtist,
  putPaintings,
  fetchWorldPainting,
  fetchArtistPaintings,
  deletePainting,
  addMintsToPainting,
  getWorldNameByPaintingId,
  searchArtistPaintings,
  getArtistById,
};
