require('dotenv').config();
const { ObjectId } = require('mongoose').Types;

module.exports = {
    async up(db, _client) {
     
      const paintingIDtoChange = '6155151105e64b00147a782a';
      const mint = await db.collection('mints').find({paintingID: ObjectId(paintingIDtoChange)}).toArray();
      const arry = [];
     
      mint.forEach((pin, index) => {
          const obj = {updateOne: { filter: {num:parseInt(pin.tokenId)}, update: {$set: {num:index+1}} }};
          arry.push(obj);
      });
      console.log(JSON.stringify(arry[0]));
      // un comment this line to update all mint nums under painting id
      const rest = await db.collection('mints').bulkWrite(arry);
    
    },
  
    async down(_db, _client) {},
  };
  