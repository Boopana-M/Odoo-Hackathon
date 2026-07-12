import express from 'express';
import {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment
} from '../../controllers/organization/departmentController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// GET /api/departments (all users can view departments)
router.get('/', listDepartments);
router.get('/:id', getDepartmentById);

// Admin only routes
router.post('/', requireRole(ROLES.ADMIN), createDepartment);
router.put('/:id', requireRole(ROLES.ADMIN), updateDepartment);

export default router;
