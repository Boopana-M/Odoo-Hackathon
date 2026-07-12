import jwt from 'jsonwebtoken';
import { User, Employee, ROLES } from '../../models/index.js';

/**
 * Register a new Employee user
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: { message: 'Email, password, and employee name are required.' } });
    }

    // Force normalized email comparison (though model does lowercase/trim, let's check manually for clean errors)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: { message: 'Email address is already in use.' } });
    }

    // SECURITY RULE: Force role to Employee. Prevents self-promotion on signup.
    const user = await User.create({
      email: normalizedEmail,
      password,
      role: ROLES.EMPLOYEE,
      isActive: true
    });

    // Automatically create a corresponding Employee directory record
    const employee = await Employee.create({
      name: name.trim(),
      userId: user._id,
      isActive: true
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkeyforassetflow',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user,
      employee
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    return res.status(500).json({ error: { message: 'Registration failed due to server error.' } });
  }
};

/**
 * Authenticate user credentials and return token
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password are required.' } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid email or password.' } });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: { message: 'Your account is deactivated. Please contact an admin.' } });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid email or password.' } });
    }

    const employee = await Employee.findOne({ userId: user._id }).populate('departmentId');

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkeyforassetflow',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user,
      employee
    });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Login failed due to server error.' } });
  }
};

/**
 * Retrieve current user profile and employee context
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    // req.user and req.employee are already populated by the authenticate middleware
    return res.status(200).json({
      user: req.user,
      employee: req.employee
    });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to retrieve profile.' } });
  }
};
