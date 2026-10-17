const { model, Schema } = require('mongoose');

const dropSchema = new Schema(
  {
    worldID: {
      type: Schema.Types.ObjectId,
      ref: 'World',
    },
    paintings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Painting',
      },
    ],
    artists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
      },
    ],
    collections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Collection',
      },
    ],
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    releaseTime: {
      type: Date,
      required: true,
    },
    backgroundImage: { type: String },
    logo: {
      type: String,
      required: true,
    },
    dropEndDate: {
      type: Date,
      required: true,
    },
    subTitle: { type: String },
  },
  { timestamps: true },
  { timestamps: true },
);

const Drop = model('Drop', dropSchema);
module.exports = Drop;
