const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db('users')
      .select('id', 'username', 'email', 'is_active', 'created_at')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db('users')
        .select('id', 'username', 'email', 'is_active')
        .where({ id: decoded.userId })
        .first();

      if (user && user.is_active) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRole = await db('users')
        .select('role')
        .where({ id: req.user.id })
        .first();

      if (!userRole || !roles.includes(userRole.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
}; 