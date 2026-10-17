const axios = require('axios');

const pinJSONtoIPFS = async (metaDataObject) => {
  console.log(metaDataObject);
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const data = await axios.post(url, metaDataObject, {
    headers: {
      pinata_api_key: process.env.PINETA_API_KEY,
      pinata_secret_api_key: process.env.PINETA_API_SECRET,
    },
  });

  return data.data.IpfsHash;
};

module.exports = { pinJSONtoIPFS };
