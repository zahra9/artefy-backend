module.exports = {
  async up(db, _client) {
   
    const response = await db.collection('paintings').updateMany(
      {
        $and: [
          { image: { $exists: true } },
          { previewUrl: { $exists: false } },
        ],
      },
      [
        {
          $set: { previewUrl: '$image' },
        },
      ],
    );
   
  },
};
