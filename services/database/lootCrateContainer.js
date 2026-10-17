const LootCrateCollections = require('../../models/lootCrateContainer.model');

/**
 * Fetch loot crate container from DB
 *
 * @param {string} id MongoDB object id of the loot crate container
 * @returns a loot crate container document
 */
const getLootCrateContainerById = async (id) => {
  const data = await LootCrateCollections.findById(id);
  return data;
};

const updateAvailableCrateByContainerId = async (containerId, number) => {
  await LootCrateCollections.findOneAndUpdate(
    { _id: containerId },
    { $inc: { availableCrates: number } },
  );
};

const getLootCrateContainerBySlug = async (slug) => {
  try {
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
      ],
    };
    const crateCollection = await LootCrateCollections.findOne({ slug: slug })
      .populate(populateObj)
      .exec();

    return crateCollection;
  } catch (err) {
    console.log(err);
    return err;
  }
};
module.exports = {
  getLootCrateContainerById,
  getLootCrateContainerBySlug,
  updateAvailableCrateByContainerId,
};
