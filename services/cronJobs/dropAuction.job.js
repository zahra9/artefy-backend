
const cron = require('node-cron');
const Painting = require('../../models/painting.model');
const Mints = require('../../models/mint.model');

const dropAuction = async () => {
  cron.schedule('*/2 * * * * * *', async () => {
    try {
      await Painting.find( { mintsAuctions: { $exists: true } }, (err, paintings) => {
      
        paintings.forEach((painting) => {
          painting?.mintsAuctions.forEach(async (mintsAuction)=> {
            const mint = await Mints.findOne({ _id: mintsAuction }).exec();
            const endTime = new Date(mint?.auction?.endTime);
            const curretTime = Date.now();
            if(endTime < curretTime){
              // remove auctionHistory and auction from mints
              await Mints.updateOne(
                {_id: mintsAuction},
                {$unset: {auctionBidHistory: [], auction: {}}},
              );
              // Delete mint Id from mintAuction array in painting
              await Painting.findOneAndUpdate(
                { '_id': painting?._id},
                { $pull: { mintsAuctions: mintsAuction }}, (error) => {
                  if(error){
                    console.log('error ', error);
                  }
                },
              );
            }
            if(mint?.auctionBidHistory?.type === 'buyNow'){
              // blockchain logic
            }
          });
        });
      });
      return false;
    } catch (err) {
      console.error(err);
      return err;
    } 
  });
};

module.exports = { dropAuction };
