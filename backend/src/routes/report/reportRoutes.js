import express from 'express';
import { getDashboardSummary } from '../../controllers/report/reportController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// Get dashboard summary (Admin and Asset Manager only)
router.get('/dashboard', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), getDashboardSummary);

export default router;
