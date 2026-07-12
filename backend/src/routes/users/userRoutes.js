import express from 'express';
import {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  updateUserDepartment
} from '../../controllers/users/userController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Base authentication for all routes
router.use(authenticate);

// GET /api/users          — list all users (with employee profiles)
router.get('/', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD), listUsers);

// GET /api/users/:id      — get a single user + employee profile
router.get('/:id', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD), getUserById);

// PATCH /api/users/:id/role   — promote or demote a user
router.patch('/:id/role', requireRole(ROLES.ADMIN), updateUserRole);

// PATCH /api/users/:id/status — activate or deactivate a user
router.patch('/:id/status', requireRole(ROLES.ADMIN), updateUserStatus);

// PATCH /api/users/:id/department — change user department
router.patch('/:id/department', requireRole(ROLES.ADMIN), updateUserDepartment);

export default router;
