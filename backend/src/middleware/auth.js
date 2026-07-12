import jwt from 'jsonwebtoken';
import { User, Employee } from '../models/index.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user & employee context to the request.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'Access token required.' } });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforassetflow');

    // Fetch user and ensure they are active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found.' } });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: { message: 'User account is deactivated.' } });
    }

    // Fetch linked employee profile if it exists
    const employee = await Employee.findOne({ userId: user._id });

    // Attach contexts
    req.user = user;
    req.employee = employee;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: { message: 'Invalid token.' } });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token has expired.' } });
    }
    return res.status(500).json({ error: { message: 'Internal server error during authentication.' } });
  }
};

/**
 * Role Authorization Middleware
 * Enforces Role-Based Access Control (RBAC) on routes.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Authentication required.' } });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Access denied: Insufficient permissions.' } });
    }

    next();
  };
};
