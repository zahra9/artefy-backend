const LootCrateCollection = require('../models/lootCrateContainer.model');
const {getLootCrateContainerBySlug} = require('../services/database/lootCrateContainer');
const { getLootCrateByContainerId } = require('../services/database/lootCrate');

const { HTTP_STATUS_CODE } = require('../configs/constants');
const Collection = require('../models/collection.model');
const createCrateLootCollections = async (req, res) => {
  try {
    const { lootCrateCollections } = req.body;
    if (!lootCrateCollections.length)
      throw new Error('Please provide CrateCollection as Array');
    const lootCrateCollectionsCreated = await LootCrateCollection.insertMany(
      lootCrateCollections,
    );
    if (!lootCrateCollectionsCreated.acknowledged)
      throw new Error('Unable to add the collection');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Crate collection inserted',
      insertedIds: lootCrateCollectionsCreated.insertedIds,
    });
  } catch (err) {
    console.log('createLootCollection', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllLootCrateCollection = async (req, res) => {
  try {
    const lootCrateCollections = await LootCrateCollection.find().populate({
      path: 'collectionId',
      model: Collection,
    });
    if (!lootCrateCollections.length)
      throw new Error('No loot crate collection found');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Loot crate collection found',
      lootCrateCollections,
    });
  } catch (err) {
    console.log('getLootCollection error', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const createLootCrateCollection = async (req, res) => {
  try {
    const { name, availableCrates } = req.body;
    if (!name || !availableCrates)
      throw new Error('Please provide CrateCollection as Array');
    const lootCrateCollectionCreated = await LootCrateCollection.create(
      req.body,
    );
    if (!lootCrateCollectionCreated)
      throw new Error('Unable to add the collection');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Crate collection inserted',
      insertedId: lootCrateCollectionCreated,
    });
  } catch (err) {
    console.log('createLootCollection', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const getLootCrateCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('slug', slug);
    const lootCrateContainer = await getLootCrateContainerBySlug(slug);
    if (!lootCrateContainer) return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      success: false,
      message: 'Container not found',
    });
    const lootCrates = await getLootCrateByContainerId(lootCrateContainer._id);
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Loot crate collection found',
      data: { lootCrateContainer, lootCrates },
    });
  } catch (err) {
    console.log('getLootCollection error', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

const getLootCrateCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const lootCrateCollection = await LootCrateCollection.findOne({_id: id}).populate({
      path: 'collectionId',
      model: Collection,
    });
    if (!lootCrateCollection) throw new Error('No loot crate collection found');
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Loot crate collection found',
      lootCrateCollection,
    });
  } catch (err) {
    console.log('getLootCollection error', err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createCrateLootCollections,
  getAllLootCrateCollection,
  createLootCrateCollection,
  getLootCrateCollectionById,
  getLootCrateCollectionBySlug,
};
