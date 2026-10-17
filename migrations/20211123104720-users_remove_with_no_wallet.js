module.exports = {
  async up(db, _client) {
    // await db.collection('users').deleteMany({
    //   $and: [
    //     { walletAddress: { $exists: false } },
    //     { walletType: { $exists: false } },
    //   ],
    // });
  },

  async down(_db, _client) {},
};
