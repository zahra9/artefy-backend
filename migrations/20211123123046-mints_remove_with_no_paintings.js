module.exports = {
  async up(db, _client) {
    // await db.collection('mints').deleteMany({ paintingID: { $exists: false } });
  },

  async down(_db, _client) {},
};
