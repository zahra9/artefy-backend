const { HTTP_STATUS_CODE } = require('../configs/constants');
const database = require('../services/database');

const getPaintingAvailableMintCount = async (req, res) => {
  try {
    const { id } = req.params;
    const availableMints = await database.mint.getPaintingAvailableMints(id);
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Mints retrieved successfully',
      data: { availableMints: availableMints.length },
    });
  } catch (error) {
    console.error('Error while getting mints', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server error',
    });
  }
};

const getLootCrateTransferMints = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const lootCrateTransferData =
      await database.lootCrateTransfer.getTransactionByPaymentId(paymentId);
    const { tokens } = lootCrateTransferData;
    const tokenIds = tokens.map((token) => token.tokenId);
    const paintings = await database.mint.getMintsDetailByTokenIds(tokenIds);
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Painting retrieved successfully',
      data: paintings,
    });
  } catch (error) {
    console.error('Error while getLootCrateTransferMints', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server error',
    });
  }
};

module.exports = { getPaintingAvailableMintCount, getLootCrateTransferMints };
