const { model, Schema } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const marketplaceSchema = new Schema({
  availableForAuction: {
    type: Number,
    required: false,
    default: 0,
  },
  availableForSale: {
    type: Number,
    required: false,
    default: 0,
  },
});

const paintingSchema = new Schema(
  {
    platform: {
      type: Schema.Types.ObjectId,
      ref: 'World',
    },
    artists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
      },
    ],
    artist:
      {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
      },
    theme: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
    },
    dropID: {
      type: Schema.Types.ObjectId,
      ref: 'Drop',
    },
    mints: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Mint',
      },
    ],
    partnerBadge: {
      type: String,
      required: false,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    pointVal: {
      type: Number,
      required: true,
    },
    dropDate: {
      type: Date,
      required: false,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    file: {
      type: String,
      required: false,
    },
    animation_url: {
      type: String,
      required: false,
    },
    format: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      required: true,
    },
    rarityValue: {
      type: Number,
      required: true,
    },
    filetype: {
      type: String,
      required: true,
    },
    fractionalOwnership: {
      type: String,
      required: true,
    },
    allowStaking: {
      type: String,
      required: true,
    },
    num: {
      type: Number,
      required: true,
    },
    aboutNFT: {
      type: String,
      required: false,
    },
    preview3DUrl: {
      type: String,
      required: false,
    },
    collectionTitle: {
      type: String,
      required: false,
    },
    price: {
      type: String,
      required: true,
    },
    cryptoPrice: {
      type: String,
      required: true,
    },
    saleType: {
      type: String,
      required: false,
    },
    // TODO: Update with ENUM
    orientation: {
      type: String,
      required: true,
    },
    previewUrl: {
      type: String,
      required: true,
    },
    gridImg: {
      type: String,
      required: true,
    },
    silverBadge: {
      type: String,
      required: true,
    },
    dropEndDate: {
      type: Date,
      required: false,
      default: null,
    },

    comicSideBannerUrl: {
      type: String,
      required: false,
      default: null,
    },

    drop3DEditionImageUrl: {
      type: String,
      required: false,
      default: null,
    },
    mintsAuctions: [
      {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Mint',
      },
    ],
    marketplace: marketplaceSchema,
  },
  { timestamps: true },
);

paintingSchema.plugin(mongoosePaginate);

const Painting = model('Painting', paintingSchema);
module.exports = Painting;
