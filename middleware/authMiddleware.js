const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');


module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; 
    next();
  } catch (error) {
    console.error("Token verify failed:", error.message);
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired.' });
    return res.status(400).json({ message: 'Invalid token.' });
  }
};