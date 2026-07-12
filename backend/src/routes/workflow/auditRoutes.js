import express from 'express';
import {
  createAuditCycle,
  updateAuditStatus,
  verifyAsset,
  closeAuditCycle,
  listAuditCycles,
  getAuditCycleDetail
} from '../../controllers/workflow/auditController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List audits
router.get('/', listAuditCycles);

// Get audit details
router.get('/:id', getAuditCycleDetail);

// Create audit cycle (Admin & Asset Manager only)
router.post('/', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), createAuditCycle);

// Update status of audit cycle (Admin & Asset Manager only)
router.patch('/:id/status', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), updateAuditStatus);

// Close audit cycle (Admin & Asset Manager only)
router.patch('/:id/close', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), closeAuditCycle);

// Verify an asset under a cycle (Auditors, Admin, Asset Manager)
router.post('/:cycleId/verify', verifyAsset);

export default router;
