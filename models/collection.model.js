const { model, Schema } = require('mongoose');

const collectionSchema = new Schema(
  {
    worldID: {
      type: Schema.Types.ObjectId,
      ref: 'World',
    },
    artists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
      },
    ],
    paintings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Painting',
      },
    ],
    name: { type: String },
    logo: {
      type: String,
      required: true,
    },
    num: {
      type: Number,
      required: true,
    },
    description: { type: String },
  },
  { timestamps: true },
);

const Collection = model('Collection', collectionSchema);
module.exports = Collection;
