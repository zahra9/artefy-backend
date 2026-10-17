const path = require('path');
const multer = require('multer');
const express = require('express');
const router = require('express').Router();
const fileUpload = require('express-fileupload');

const controller = require('../../controllers/upload');
const adminAuth = require('../../middlewares/auth');

const secureUploadPath = path.join(__dirname, '../..', 'files');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    return cb(null, secureUploadPath);
  },
  filename: (req, file, cb) => {
    const fileNameArr = file.originalname.split('.');
    cb(
      null,
      fileNameArr.slice(0, -1).join('-') +
        '-' +
        Date.now() +
        '.' +
        fileNameArr[fileNameArr.length - 1],
    );
  },
});
const uploadCDN = multer({ storage: storage });

// endpoint to post single file
router.post(
  '/file',
  [adminAuth.adminAuth],
  uploadCDN.single('file'),
  controller.postFile,
);

// Maximum limit is currently 10
// endpoint to post multiple files
router.post(
  '/files',
  [adminAuth.adminAuth],
  express.static(secureUploadPath),
  uploadCDN.array('file', 10),
  controller.postMultipleFile,
);

// this route handles upload without multer
router.post(
  '/uploadSingleFile',
  [adminAuth.adminAuth],
  fileUpload(),
  [controller.singleFileUpload],
  controller.postFile,
);

module.exports = router;
