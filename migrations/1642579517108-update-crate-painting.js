require('dotenv').config();
const { ObjectId } = require('mongoose').Types;

module.exports = {
    async up(db, _client) {
      const recursiveCall = (cratesCollections) => {
        const arry = [];
        cratesCollections.forEach(collection => {
          collection.paintings.forEach((pinId) => {
            const obj = {updateOne: { filter: {_id: ObjectId(pinId)}, update: {$set: {paintingFrom: 'crate', price: 0, cryptoPrice: 0}} }};
            arry.push(obj);
          });
        })
        return arry;
      }
      const cratesCollections = await db.collection('lootcratecollections').find().toArray();
     
      const paintingIDtoChange = recursiveCall(cratesCollections);
      
      const rest = await db.collection('paintings').bulkWrite(paintingIDtoChange);
       
    },
  
    async down(_db, _client) {},
  };
  