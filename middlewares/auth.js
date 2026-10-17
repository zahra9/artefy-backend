const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json('No token available, authorization denied!');
  }
  try {
    //   Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }
    return res.status(401).json('Authorization denied!');
  } catch (e) {
    return res.status(400).send();
  }
};

function userAuth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json('No token available, authorization denied!');
  }
  try {
    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'user') {
      req.user = decoded;
      return next();
    }
    return res.status(401).json('Authorization denied!');
  } catch (e) {
    return res.status(401).send(e.message);
  }
}

module.exports = {
  adminAuth,
  userAuth,
};
