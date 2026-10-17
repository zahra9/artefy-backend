const LootCrate = require('../../models/lootCrate.model');
const LootCrateCollections = require('../../models/lootCrateContainer.model');

const getLootCrateByContainerId = async (id) => {
  const data = await LootCrate.find({ lootCrateContainerId: id });
  return data;
};

const getLootCrateById = async (id) => {
  const lootCrate = await LootCrate.findById(id).populate({
    path: 'lootCrateContainerId',
    model: LootCrateCollections,
  });
  return lootCrate;
};

const getLootCrateByPrice = async (cryptoPrice) => {
  const lootCrate = await LootCrate.findOne({cryptoPrice}).populate({
    path: 'lootCrateContainerId',
    model: LootCrateCollections,
  });
  return lootCrate;
};

module.exports = { getLootCrateById, getLootCrateByContainerId, getLootCrateByPrice };
