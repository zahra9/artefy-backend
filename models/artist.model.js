const { model, Schema } = require('mongoose');

// keep blockchain and backend in sync.
const artistSchema = new Schema(
  {
    worldID: [
      {
        type: Schema.Types.ObjectId,
        ref: 'World',
      },
    ],
    paintings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Painting',
      },
    ],
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    banner: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: String,
      required: true,
    },
  },
  {timestamps: true},
);

const Artist = model('Artist', artistSchema);
module.exports = Artist;
