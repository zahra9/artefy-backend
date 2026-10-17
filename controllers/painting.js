const { HTTP_STATUS_CODE } = require('../configs/constants');
const queries = require('../services/database/painting');
const { sendPaymentSuccessEmail } = require('./payment');
const { getRandomPaintingMintsById } = require('../utils/helpers');
const getPaintingById = async ({ params }, res) => {
  try {
    const { id } = params;
    let artist;
    const painting = await queries.getPaintingById(id);
    const collection = await queries.getCollectionByPaintingId(id);
    if (painting?.artists?.length > 0) {
      // TODO: FETCH ALL THE Artsists instead of just one
      artist = await queries.getArtistByPaintingId(painting.artists[0]);
    }
    if (painting?.artist) {
      artist = await queries.getArtistByPaintingId(painting.artist);
    }
    if (!painting.artist && !painting?.artists) {
      console.error(
        `${painting._id} does not have an associated Artists to it`,
      );
    }

    const iframe = painting.format === 'Box';
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'Painting retrieved successfully',
      data: { painting, collection, artist, iframe },
    });
  } catch (error) {
    console.error('Error while getPaintingById', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server error',
    });
  }
};

const setNFTForSale = async (req, res) => {
  try {
    // TODO: Only fetching a random mint, issue with contract
    const { id } = req.params;
    const mint = await getRandomPaintingMintsById(id);
    if (!mint) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: 'NFT is not available for sale',
      });
    }
    await queries.updateMintProcessing(mint.tokenId, true);
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'NFT is available to buy',
      data: { mint },
    });
  } catch (error) {
    console.error('Error while getTokenId', error);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server error',
    });
  }
};

const updateNFTAfterTransaction = async ({ body, user }, res) => {
  try {
    const { success, txnHash, tokenId, paintingID } = body;
    const { id } = user;
    if (success === true && (txnHash === '' || !txnHash)) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: 'Missing body data',
      });
    }

    const price = await queries.getPaintingById(paintingID).cryptoPrice;
    await queries.updateNFTAfterTransaction(success, txnHash, tokenId);

    await sendPaymentSuccessEmail(id, paintingID, price);

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'NFT updated successfully',
    });
  } catch (error) {
    console.error(
      'Error while updating NFT after Transaction / Selling process',
      error,
    );
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      success: false,
      message: 'Internal Server error',
    });
  }
};
/**
 * Get paitings
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {number} request.query.page - PageNumber
 * @param {number} request.query.numberOfRows - Number of documents expected
 * @param {string} request.query.name - Search Text
 */

module.exports = {
  getPaintingById,
  setNFTForSale,
  updateNFTAfterTransaction,
};
