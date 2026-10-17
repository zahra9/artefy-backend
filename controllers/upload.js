const compressImages = require('compress-images');
const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');

/**
 * Post File
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.file - Single File to be uploaded
 */
const postFile = async (request, response) => {
  try {
    const { file } = request;
    // Check if file is present
    if (!file || file.filename === undefined)
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

    const INPUTPathToImages = 'files/*.{jpg,JPG,jpeg,JPEG,gif,png,svg}';
    const OUTPUTPath = 'compressedFiles/';
    compressImages(
      INPUTPathToImages,
      OUTPUTPath,
      { compress_force: false, statistic: true, autoupdate: true },
      false,
      { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
      { png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] } },
      { svg: { engine: 'svgo', command: '--multipass' } },
      {
        gif: {
          engine: 'gifsicle',
          command: ['--colors', '64', '--use-col=web'],
        },
      },
      function() {},
    );

    return response
      .status(HTTP_STATUS_CODE.OK)
      .json({ filename: request.file.filename });
  } catch (error) {
    console.error('Image could not be uploaded: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

/**
 * Post Files
 *
 * @param {object} request - Request Object
 * @param {object} response - Response Object
 * @param {object} request.file - Multiple File to be uploaded
 */
const postMultipleFile = async (request, response) => {
  try {
    const { files } = request;
    // check if files are present
    if (!files || typeof files !== 'object')
      return response
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

    const filenames = [];
    for (let i = 0; i < files.length; i += 1) {
      // check if each parameter is correct
      if (files[i].filename === undefined)
        return response
          .status(HTTP_STATUS_CODE.BAD_REQUEST)
          .json(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING);

      filenames[i] = { filename: files[i].filename };
    }
    const INPUTPathToImages = 'files/*.{jpg,JPG,jpeg,JPEG,gif,png,svg}';
    const OUTPUTPath = 'compressedFiles/';
    compressImages(
      INPUTPathToImages,
      OUTPUTPath,
      { compress_force: false, statistic: true, autoupdate: true },
      false,
      { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
      { png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] } },
      { svg: { engine: 'svgo', command: '--multipass' } },
      {
        gif: {
          engine: 'gifsicle',
          command: ['--colors', '64', '--use-col=web'],
        },
      },
      function() {},
    );
    return response.status(HTTP_STATUS_CODE.OK).json({ filenames: filenames });
  } catch (error) {
    console.error('Image could not be uploaded: ', error);
    return response
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(ERROR_MESSAGE.REGISTRATION_FAIL);
  }
};

const singleFileUpload = (req, res, next) => {
  const { file } = req.files;
  const fileNameArr = file.name.split('.');
  const fileName =
    fileNameArr.slice(0, -1).join('-') +
    Date.now() +
    '.' +
    fileNameArr[fileNameArr.length - 1];
  file.mv(`${__dirname}/../files/${fileName}`, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send({ msg: 'error while saving file' });
    }
    req.file = file;
    req.file.filename = fileName;
    return next();

  });
};

module.exports = {
  postFile,
  postMultipleFile,
  singleFileUpload,
};
