module.exports = {
  async up(db, _client) {
    await db.collection('users').updateMany({}, { $unset: { password: 1 } });
  },
 
  async down(_db, _client) {},
};
