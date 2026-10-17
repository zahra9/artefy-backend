# Art BE
## Introduction
Artefy is a game changing new digital Art platform that offers Artists an entirely new way to engage with fans and leverage new revenue streams. Artefy also provides Art lovers with new ways to collect and interact with the Art and Artists that they love.

### Stack
<img alt="javascript" src="https://img.shields.io/badge/JavaScript-F0DB4F?style=for-the-badge&logo=javascript&logoColor=323330"/> <img alt="nodejs" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node-dot-js&logoColor=white"/> <img alt="expressjs" src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white"/> <img alt="mongodb" src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white"/> <img alt="mongodb" src="https://img.shields.io/badge/Yarn-2188B6?style=for-the-badge&logo=yarn&logoColor=white"/>

## Prerequisites
- yarn
- nodemon
- truffle
- ganache

## Getting Started
- Clone this repository

## Run the NodeJs Server
- Install dependencies
  ```sh
  yarn
  ```
- For `TestToken` add `contractAdress`, `ownerAddress` and `ownerPrivateKey` to `./configs/erc20.json`
- For `OriginalArtToken` add `contractAdress`, `ownerAddress` and `ownerPrivateKey` to `./configs/oat.json`
- For `OATAuction` add `contractAdress`, `ownerAddress` and `ownerPrivateKey` to `./configs/oatAuction.json`
- Run the server
  ```sh
  yarn start
  ```

## Using artefy API's
- Go to [localhost:5000/api-docs](http://localhost:5000/api-docs/)
- Use the Swagger API documentation to interact with the Smart Contracts
- Find the Postman collection in the configs folder: `configs/Artefy_v2.postman_collection.json` and export it to Postman to make requests from there.
