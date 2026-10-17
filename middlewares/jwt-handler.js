// const RevokedTokens = require('../../common/models/revoked-tokens');
// const jwt = require('express-jwt');
// const fs = require('fs');

// module.exports = function(_app) {
//   const key = fs.readFileSync(process.env.JWT_PUBLIC_KEY);
//   const protect = jwt({
//     secret: key,
//     isRevoked: function(_req, payload, done) {
//       RevokedTokens
//         .findOne({where: {jti: payload.jti}})
//         .then(function(_record) {
//           return done(null, !!_record);
//         });
//     },
//   }).unless({path: ['/api/auth/login', '/api/file/download']});

//   _app.use('/api', protect);
// };
