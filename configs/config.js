

let AuctionImplementationAddress;
let AuctionProxyAddress;

let OatSaleImplementationAddress = '0x2f2C12EeD76f1e22a60cA62bd92B45e48FE88Cfc';
let OatSaleProxyAddress = '0x70CDB8E6B791ec05b6E846ceA912a53eaa7cf289';

let OatImplementationAddress = '0x95B21b314E90F47920d94Fe682B1b0e9d3aD19a0';
let OatProxyAddress = '0xb126578F2c86F9504376490B807B8b8e4Cf275C7';

let PolygonScanURL = 'https://api.polygonscan.com';
let AdminWalletAddress = '0x94cD6C60209C7060677bb8CC8300d0479dbEb7aa';

let MarketplaceImplementationAddress =
  '0x2A7abFe3031Af9eE878D9FCC4EAE776367fD7d7A';
let MarketplaceProxyAddress = '0x2E5F53441836D94A0c2AadE9Bcc8283F9198a06B';

let infuraURLs = [
  'https://polygon-mainnet.infura.io/v3/92f1cdaa7ab44637935d7a8e2690993e', // Paid Subscription for live
  'https://polygon-mainnet.infura.io/v3/228a5945a5dc46e1a98064b344467573', // Ali Tanveer Trail Accounts
  'https://polygon-mainnet.infura.io/v3/3d9be4dbf8c34631a538f178950d2740', // Usama Nasser Trail Accounts
];

if (process.env.ENV === 'DEVELOPMENT') {
  OatSaleImplementationAddress = '0x5BdABB373859A9bd33e35967Cb4a1eD8a2c0B10c';
  OatSaleProxyAddress = '0xd6146a4d98266aAc502A5C87Ff56C458197e4380';

  OatImplementationAddress = '0x5Cc62e9E7b5Cf59FF7440b3E9963044A5c57F2DB';
  OatProxyAddress = '0x603AbfAaF6D0086Ac522B8DEC5Db07675b622761';

  PolygonScanURL = 'https://api-testnet.polygonscan.com';
  AdminWalletAddress = '0x64165472c57771287B957B5399d91AD707c70D72';

  AuctionImplementationAddress = '0xA3cCcaf9fc9214d6B4e79C8996093C14a633C555';
  AuctionProxyAddress = '0x00fc622b923B61E6f6260ADd4CDEf0556BC46C2b';

  MarketplaceImplementationAddress =
    '0x3FB7E8833C54938F38db937dc74c596a9af8f8F7';
  MarketplaceProxyAddress = '0x32Be0E0757492b77D279F40f5822aD71848c3069';

  infuraURLs = [
    'https://polygon-mumbai.infura.io/v3/228a5945a5dc46e1a98064b344467573', // Ali Tanveer Trail Accounts
    'https://polygon-mumbai.infura.io/v3/3d9be4dbf8c34631a538f178950d2740', // Usama Nasser Trail Accounts
    'https://polygon-mumbai.infura.io/v3/41dec79b006040c08b1a78a64ac8e50b', // Safi Ullah Trail Accounts
  ];
}


module.exports = {
  OatSaleImplementationAddress,
  OatSaleProxyAddress,
  OatImplementationAddress,
  OatProxyAddress,
  PolygonScanURL,
  AdminWalletAddress,
  AuctionImplementationAddress,
  AuctionProxyAddress,
  MarketplaceImplementationAddress,
  MarketplaceProxyAddress,
  infuraURLs,
};
