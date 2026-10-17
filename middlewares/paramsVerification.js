const { ObjectId } = require('mongoose').Types;
const { HTTP_STATUS_CODE } = require('./../configs/constants');

function artistId(request, response, next) {
  if (!ObjectId.isValid(request.params.artistId)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid artist Id provided ' });
  }
  return next();
}

function collectionId(request, response, next) {
  if (!ObjectId.isValid(request.params.collectionId)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid collection Id provided ' });
  }
  return next();
}

function paintingId(request, response, next) {
  if (!ObjectId.isValid(request.params.paintingId)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid painting Id provided ' });
  }
  return next();
}

function worldId(request, response, next) {
  if (!ObjectId.isValid(request.params.worldId)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid world Id provided ' });
  }
  return next();
}

function dropId(request, response, next) {
  if (!ObjectId.isValid(request.params.dropId)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid drop Id provided ' });
  }
  return next();
}
function latestDropId(request, response, next) {
  if (!request.body.data.drop) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid drop Id provided ' });
  }
  return next();
}
function userId(request, response, next) {
  if (!ObjectId.isValid(request.params.userId)) {
    return response
      .status(HTTP_STATUS_CODE.BAD_REQUEST)
      .json({ message: 'Invalid user Id provided ' });
  }
  return next();
}

function mintId(request, response, next) {
  if (!ObjectId.isValid(request.params.mintId)) {
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
  userId,
  mintId,
  latestDropId,
};
