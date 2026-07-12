import express from 'express';
import {
  createMaintenanceRequest,
  approveMaintenance,
  rejectMaintenance,
  assignTechnician,
  updateProgress,
  resolveMaintenance,
  listMaintenanceRequests
} from '../../controllers/workflow/maintenanceController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List maintenance requests
router.get('/', listMaintenanceRequests);

// Create maintenance request
router.post('/', createMaintenanceRequest);

// Approve / Reject (Admin & Asset Manager only)
router.patch('/:id/approve', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), approveMaintenance);
router.patch('/:id/reject', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), rejectMaintenance);

// Assign technician (Admin & Asset Manager only)
router.patch('/:id/assign', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), assignTechnician);

// Update progress (All Auth users - authorized checks are inside the controller)
router.patch('/:id/progress', updateProgress);

// Resolve maintenance (Admin & Asset Manager only)
router.patch('/:id/resolve', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), resolveMaintenance);

export default router;
