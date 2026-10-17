const path = require('path');
// eslint-disable-next-line node/no-extraneous-require
const fs = require('fs-extra');
const aws = require('aws-sdk');
const multer = require('multer');
// eslint-disable-next-line node/no-missing-require
const multerS3 = require('multer-s3');
// eslint-disable-next-line node/no-missing-require
const PathService = require('../services/path');

const S3Storage = function(directory, disk) {
  aws.config.update({
    secretAccessKey: disk.secretAccessKey,
    accessKeyId: disk.accessKey,
  });
  const s3 = new aws.S3();
  return multerS3({
    s3: s3,
    bucket: `${disk.bucket}/${directory.replace(/\/$/, '')}`,
    acl: 'public-read',
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      const fileName = `${new Date().getTime()}_${path
        .basename(file.originalname)
        .split(' ')
        .join('_')}`;
      cb(null, fileName);
    },
  });
};

const mountedStorage = function(directory, disk) {
  return multer.diskStorage({
    async destination(_req, file, callback) {
      fs.ensureDirSync(disk.fullPath);
      callback(null, disk.fullPath);
    },
    filename(_req, file, callback) {
      const fileName = `${new Date().getTime()}_${path
        .basename(file.originalname)
        .split(' ')
        .join('_')}`;
      callback(null, fileName, file.originalname.length);
    },
  });
};

module.exports = function(directory, allowedMimes = [], fileSize = 16 * 1024 * 1024) {
  return async (_req, _res, _next) => {
    const disk = await PathService.getPath(directory);
    _req.disk = disk;

    const multerFileMiddleware = multer({
      storage: disk.protocol === 's3' ? S3Storage(directory, disk) : mountedStorage(directory, disk),
      // eslint-disable-next-line consistent-return
      fileFilter: (req, file, cb) => {
        if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
          return cb(null, false, new Error('Goes wrong on the mimetype'));
        }
        cb(null, true);
      },
      limits: { fileSize },
    }).any();

    multerFileMiddleware(_req, _res, _next);
  };
};
