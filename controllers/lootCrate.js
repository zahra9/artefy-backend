const { HTTP_STATUS_CODE } = require('../configs/constants');
const LootCrateCollections = require('../models/lootCrateContainer.model');
const LootCrate = require('../models/lootCrate.model');
const database = require('../services/database');
const { getAvailableMintsByPaintingIds } = require('../utils/helpers');

const createManyLootCrateContainers = async (req, res) => {
  try {
    const { lootCrateContainers } = req.body;
    if (!lootCrateContainers)
      throw new Error('Please provide the list of Loot Crate Container');
    const lootCrateContainersCreated = await LootCrate.insertMany(
      lootCrateContainers,
    );
    if (!lootCrateContainersCreated.acknowleged)
      throw new Error('Unable to add the many loot crate containers');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Loot crate containers inserted',
      lootCrateContainersCreated,
    });
  } catch (err) {
    console.log('CreateLootContainer error ====> ', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const createLootContainer = async (req, res) => {
  try {
    const { name, numberOfNfts, lootCrateContainerId } = req.body;
    if (!name || !numberOfNfts || !lootCrateContainerId)
      throw new Error('Please provide valid data to create new crate');
    const crateCreated = await LootCrate.create(req.body);
    if (!crateCreated) throw new Error('Unable to create new Crate');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Crate Created',
      // Question: Should I sent the Created Crate back in response?
    });
  } catch (err) {
    console.log('CreateLootContainer error ====> ', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const getLootCrateById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) throw new Error('Please provide the Id of the crate');
    const crate = await LootCrate.findById(id).populate({
      path: 'lootCrateContainerId',
      model: LootCrateCollections,
      populate: {
        path: 'paintings',
        select: ['_id', 'mints'],
        $count: 'mints',
      },
    });

    if (!crate) throw new Error('No crate found.');

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Crate found',
      crate,
    });
  } catch (err) {
    console.log('getCrateContainerById error ====> ', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllCrateContainer = async (req, res) => {
  try {
    const allCrates = await LootCrate.find().populate({
      path: 'lootCrateContainerId',
      model: LootCrateCollections,
    });
    if (!allCrates.length) throw new Error('No crate found');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Creates found',
      crates: allCrates,
    });
  } catch (err) {
    console.log('getAllCrateContainer error ====> ', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const setMintsForSale = async (req, res) => {
  try {
    const { id } = req.params;
    const lootCrate = await database.lootCrate.getLootCrateById(id);
    const { numberOfNfts, lootCrateContainerId } = lootCrate;
    const { paintings, availableCrates } = lootCrateContainerId;
    if (availableCrates === 0) {
      return res.status(HTTP_STATUS_CODE.OK).json({
        success: false,
        message: `Not crate left`,
      });
    }
    const tokens = await getAvailableMintsByPaintingIds(
      paintings,
      numberOfNfts,
    );
    if (!tokens) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: true,
        message: 'Crates are not available.',
      });
    }
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Mints found',
      data: { lootCrateId: id, tokens },
    });
  } catch (err) {
    console.log('setMintsForSale error ====> ', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createManyLootCrateContainers,
  getLootCrateById,
  createLootContainer,
  getAllCrateContainer,
  setMintsForSale,
};
