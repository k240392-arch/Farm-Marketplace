// middleware/authMiddleware.js
// Verifies JWT token on protected routes

const jwt = require('jsonwebtoken');

// Verify any logged-in user
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired.' });
  }
};

// Only allow farmers
const farmerOnly = (req, res, next) => {
  if (req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Access denied. Farmers only.' });
  }
  next();
};

// Only allow admins
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

module.exports = { protect, farmerOnly, adminOnly };
