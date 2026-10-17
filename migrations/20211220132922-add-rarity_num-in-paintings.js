const { PAINTINGS_RARITY } = require('../configs/constants');

module.exports = {
  async up(db, client) {
    try {
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Special', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Special } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Common', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Common } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Limited', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Limited } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Rare', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Rare } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Classic', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Classic } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Masterpiece', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Masterpiece } },
        );

      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Extraordinary', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Extraordinary } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Legendary', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Legendary } },
        );
      await db
        .collection('paintings')
        .updateMany(
          { rarity: { $regex: 'Unique', $options: 'i' } },
          { $set: { rarityValue: PAINTINGS_RARITY.Unique } },
        );
    } catch (error) {
      console.error(error);
    }
  },

  async down(db, client) {
    await db
      .collection('paintings')
      .updateMany({}, { $unset: { rarityValue: 1 } });
  },
};
