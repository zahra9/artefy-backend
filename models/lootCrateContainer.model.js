const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lootCrateCollectionsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: { type: String },
    collectionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Collection',
    },
    paintings: [
      { type: Schema.Types.ObjectId, required: true, ref: 'Painting' },
    ],
    availableCrates: {
      type: Number,
      default: 0,
    },
    backgroundImage: {
      type: String,
      required: true,
    },
    totalCrates: {
      type: Number,
      default: 0,
    },
    slug: { type: String },
  },
  { timestamps: true },
);

const LootCrateCollections = mongoose.model(
  'LootCrateCollection',
  lootCrateCollectionsSchema,
);

module.exports = LootCrateCollections;
