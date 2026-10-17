const { model, Schema } = require('mongoose');

const worldSchema = new Schema(
  {
    name: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    logo: { type: String, required: true },
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
    drops: [{ type: Schema.Types.ObjectId, ref: 'Drop' }],
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
  },
  {timestamps: true},
);

const World = model('World', worldSchema);
module.exports = World;
