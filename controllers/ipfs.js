const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { ERROR_MESSAGE, HTTP_STATUS_CODE } = require('../configs/constants');

const pinFileToIPFS = (req, res) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const data = new FormData();
  const filePath = './files/minted.gif';
  data.append('file', fs.createReadStream(filePath));
  return axios
    .post(url, data, {
      maxContentLength: 'Infinity',
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: process.env.PINETA_API_KEY,
        pinata_secret_api_key:process.env.PINETA_API_SECRET,
      },
    })
    .then(function(response) {
      const hash = response.data.IpfsHash;
      return res.status(HTTP_STATUS_CODE.OK).send({ hash });
    })
    .catch(function(error) {
      console.error(error);
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
        .send(ERROR_MESSAGE.IPFS_UPLOAD_FAIL);
    });
};

const pinJSONtoIPFS = (req, res) => {
  const { JSONBody } = req.body;
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  return axios
    .post(url, JSONBody, {
      headers: {
        pinata_api_key: process.env.PINETA_API_KEY,
        pinata_secret_api_key:process.env.PINETA_API_SECRET,
      },
    })
    .then(function(response) {
      const hash = response.data.IpfsHash;
      return res.status(HTTP_STATUS_CODE.OK).send({ hash });
    })
    .catch(function(error) {
      console.error(error);
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
        .send(ERROR_MESSAGE.IPFS_UPLOAD_FAIL);
    });
};

module.exports = {
  pinFileToIPFS,
  pinJSONtoIPFS,
};
