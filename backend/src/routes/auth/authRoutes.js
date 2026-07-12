import express from 'express';
import { signup, login, getMe } from '../../controllers/auth/authController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/signup', signup);
router.post('/login', login);

// Protected profile endpoint
router.get('/me', authenticate, getMe);

export default router;
