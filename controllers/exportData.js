const { ObjectId } = require('mongoose').Types;
const mintsDb = require('../models/mint.model');
const usersDb = require('../models/user.model');
const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');

/**
 * Export Silver Worrier medallion drops
 *
 * @param {request} - Request Object
 * @param {response} - Response Object
 */
const exportSWMedallionSales = async (request, response) => {
  try {
    const content = ['username,email,walletAddress,purchased'];

    const paintings = [
      ObjectId('618af83cd389901607ed7263'),
      ObjectId('618af646d389901607ed723f'),
      ObjectId('618af473d389901607ed721d'),
      ObjectId('618af29ed389901607ed71f3'),
      ObjectId('618aedb9d389901607ed71c2'),
    ];

    const entryCounts = {
      '618af83cd389901607ed7263': 1,
      '618af646d389901607ed723f': 7,
      '618af473d389901607ed721d': 20,
      '618af29ed389901607ed71f3': 50,
      '618aedb9d389901607ed71c2': 200,
    };

    await Promise.all(
      paintings.map(async (painting) => {
        const mints = await mintsDb
          .find({ paintingID: painting, 'sale.sold': true })
          .exec();
        return Promise.all(
          mints.map(async (mint) => {
            const user = await usersDb.findOne({ mints: mint._id }).exec();
            const row = [
              user.username,
              user.email,
              user.metaMaskAddress || user.arkaneWalletAddress,
              mint.name,
            ].join(',');

            for (let i = 0; i < entryCounts[painting._id]; i += 1) {
              content.push(row);
            }
          }),
        );
      }),
    );


    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=CronjReport.csv;',
    );
    return response.end(content.join('\n'), 'binary');
  } catch (error) {
    console.error('Failed to export private key: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.LOGIN_FAIL);
  }
};

module.exports = { exportSWMedallionSales };
