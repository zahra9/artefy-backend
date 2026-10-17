module.exports = {
  async up(db, _client) {
    await db.collection('users').updateMany(
      {
        $and: [
          { metaMaskAddress: { $exists: true } },
          {
            metaMaskAddress: {
              $regex: '[a-fA-F0-9]{40}',
              $options: 'i',
            },
          },
        ],
      },
      [{ $set: { walletAddress: '$metaMaskAddress', walletType: 'metamask' } }],
    );
    await db.collection('users').updateMany(
      {
        $and: [
          { arkaneWalletAddress: { $exists: true } },
          {
            arkaneWalletAddress: {
              $regex: '[a-fA-F0-9]{40}',
              $options: 'i',
            },
          },
        ],
      },
      [
        {
          $set: {
            walletAddress: '$arkaneWalletAddress',
            walletType: 'venly',
          },
        },
      ],
    );
  },

  async down(_db, _client) {},
};
