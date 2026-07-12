import express from 'express';
import { listActivityLogs } from '../../controllers/workflow/activityController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List activity logs (Admin and Asset Manager only)
router.get('/', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), listActivityLogs);

export default router;
