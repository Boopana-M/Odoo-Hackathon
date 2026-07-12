import express from 'express';
import {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus
} from '../../controllers/users/userController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// All user-management routes require authentication + Admin role
router.use(authenticate, requireRole(ROLES.ADMIN));

// GET /api/users          — list all users (with employee profiles)
router.get('/', listUsers);

// GET /api/users/:id      — get a single user + employee profile
router.get('/:id', getUserById);

// PATCH /api/users/:id/role   — promote or demote a user
router.patch('/:id/role', updateUserRole);

// PATCH /api/users/:id/status — activate or deactivate a user
router.patch('/:id/status', updateUserStatus);

export default router;
