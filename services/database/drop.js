const Mint = require('../../models/mint.model');
const Drop = require('../../models/drop.model');
const World = require('../../models/world.model');
const Painting = require('../../models/painting.model');

/**
 * Store Drop to db
 *
 * @param {Object} drop - Drop object
 */
const addDrop = async (drop) => {
  try {
    const newDrop = new Drop(drop);
    await newDrop.save();
    return World.updateOne(
      { _id: drop.worldID },
      { $push: { drops: newDrop._id } },
    ).exec();
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Update a Drop
 *
 * @param {Object} drop - Drop object
 * @param {ObjectId} dropId - Drop id
 */
const updateDrop = async (drop, dropId) => {
  try {
    await Drop.updateOne({ _id: dropId }, { $set: drop });
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Get Drops
 *
 * @param {ObjectId} worldId - World ID
 */
const getDrops = async (worldId) => {
  try {
    const drops = await Drop.find({ worldID: worldId }).exec();
    return drops;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Fetch all Drops
 *
 * @param {ObjectId} dropId - Drop ID
 */
const fetchDrops = async (dropId) => {
  try {
    if (dropId) return Drop.find({ _id: dropId }).exec();
    return Drop.find().exec();
  } catch (err) {
    console.error(err);
    return err;
  }
};

/**
 * Search Drops
 *
 * @param {string} worldId - world _id
 * @param {string} search - search word
 */
const searchDrops = async (worldId, search) => {
  try {
    if (search === '') return Drop.find({ worldID: worldId }).exec();
    return Drop.find({
      worldID: worldId,
      $text: { $search: search },
    }).exec();
  } catch (err) {
    return err;
  }
};

/**
 * Add Painting to a Drop
 *
 * @param {ObjectId} dropId - Drop ID
 * @param {ObjectId} paintingId - Painting ID
 */
const addPaintings = async (dropId, paintingId, price, cryptoPrice) => {
  try {
    const drop = await Drop.findOne({ _id: dropId }).exec();

    paintingId.forEach(async (id) => {
      const painting = await Painting.findOne({ _id: id }).exec();

      await Drop.updateOne(
        { _id: dropId },
        {
          $addToSet: {
            paintings: id,
            artists: painting.artist,
          },
        },
      );

      await Painting.updateOne(
        { _id: id },
        { dropDate: drop.releaseTime },
      ).exec();

      await Mint.updateMany(
        { paintingID: id },
        {
          $set: {
            'sale.price': price,
            'sale.cryptoPrice': cryptoPrice,
            'sale.active': true,
          },
        },
      );
    });
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Remove Painting to a Drop
 *
 * @param {ObjectId} dropId - Drop ID
 * @param {ObjectId} paintingId - Painting ID
 */
const removePaintings = async (dropId, paintingId) => {
  try {
    await Drop.updateOne(
      { _id: dropId },
      { $pull: { paintings: { $in: paintingId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Add Artist to a Drop
 *
 * @param {ObjectId} dropId - Drop ID
 * @param {ObjectId} artistId - Artist ID
 */
const addArtists = async (dropId, artistId) => {
  try {
    await Drop.updateOne(
      { _id: dropId },
      { $addToSet: { artists: { $each: artistId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Remove Artist to a Drop
 *
 * @param {ObjectId} dropId - Drop ID
 * @param {ObjectId} artistId - Artist ID
 */
const removeArtists = async (dropId, artistId) => {
  try {
    await Drop.updateOne(
      { _id: dropId },
      { $pull: { artists: { $in: artistId } } },
    );
    return true;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Get Paintings
 *
 * @param {ObjectId} drop - Drop ID | slug
 * @param {ObjectId} type - id|slug
 *
 */
const getPaintings = async (drop, type) => {
  try {
    console.log(type);
    const populateObj = {
      path: 'paintings',
      populate: [
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
            sale: 1,
            // sold:false ,
            tokenId: 1,
            active: true,
          },
        },
      ],
    };
    const paintings = await Drop.findOne({ _id: drop })
      .populate(populateObj)
      .exec();
    console.log(paintings);
    return paintings;
  } catch (err) {
    console.log(err);
    return err;
  }
};
/**
 * Get Paintings
 *
 * @param {ObjectId} drop - Drop ID | slug
 * @param {ObjectId} type - id|slug
 *
 */
const getPaintingsBySlug = async (drop, by) => {
  try {
    console.log(by);
    const populateObj = {
      path: 'paintings',
      populate: [
        {
          path: 'artists',
          select: {
            name: 1,
            bio: 1,
          },
        },
        {
          path: 'collections',
          select: {
            sold: false,
            sale: 1,
            tokenId: 1,
            active: true,
          },
        },
        {
          path: 'mints',
          select: {
            sale: 1,
            // sold:false ,
            tokenId: 1,
            active: true,
          },
        },
      ],
    };
    const paintings = await Drop.findOne({ slug: `${drop}` })
      .populate(populateObj)
      .exec();
    return paintings;
  } catch (err) {
    console.log(err);
    return err;
  }
};
/**
 * Get latest drop details
 */
const getLatestDrop = async () => {
  try {
    const drop = await Drop.findOne({}).sort({ releaseTime: -1 }).exec();
    return drop;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const getLatestDropStats = async (slug) => {
  try {
    const { paintings } = await getPaintingsBySlug(slug);

    if (!paintings) {
      return { message: 'No Painting was found against the drop' };
    }

    return await paintings.map((painting) => ({
      paintingName: painting.name,
      paintingId: painting._id,
      totalMints: painting?.mints?.length || 0,
      availableTokenIds: painting.mints.filter((mint) => {
        if (!mint.sale.sold && mint.sale.active) return mint.tokenId;
        return false;
      }),
      availableMints:
        painting?.mints?.filter(
          (mint) => !mint?.sale?.sold && mint?.sale.active,
        ).length || 0,
    }));
  } catch (err) {
    console.error(err);
    return err;
  }
};

module.exports = {
  addDrop,
  getDrops,
  fetchDrops,
  addArtists,
  updateDrop,
  searchDrops,
  addPaintings,
  getPaintings,
  getLatestDrop,
  removeArtists,
  removePaintings,
  getPaintingsBySlug,
  getLatestDropStats,
};
