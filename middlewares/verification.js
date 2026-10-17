const { ObjectId } = require('mongoose').Types;
const { HTTP_STATUS_CODE } = require('./../configs/constants');

function artistId(request, response, next) {
  if (!ObjectId.isValid(request.body.artistID)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid artist Id provided ' });
  }
  return next();
}

function collectionId(request, response, next) {
  if (!ObjectId.isValid(request.body.collectionID)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid collection Id provided ' });
  }
  return next();
}

function paintingId(request, response, next) {
  if (!ObjectId.isValid(request.body.paintingID)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid painting Id provided ' });
  }
  return next();
}

function worldId(request, response, next) {
  if (!ObjectId.isValid(request.body.worldID)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid world Id provided ' });
  }
  return next();
}

function dropId(request, response, next) {
  if (!ObjectId.isValid(request.body.dropID)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid drop Id provided ' });
  }
  return next();
}

function mintId(request, response, next) {
  if (!ObjectId.isValid(request.body.mintID)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid mint Id provided ' });
  }
  return next();
}

module.exports = {
  artistId,
  worldId,
  collectionId,
  paintingId,
  dropId,
  mintId,
};
