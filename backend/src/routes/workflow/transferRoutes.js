import express from 'express';
import {
  createTransfer,
  approveTransfer,
  rejectTransfer,
  cancelTransfer,
  listTransfers
} from '../../controllers/workflow/transferController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List transfers
router.get('/', listTransfers);

// Create transfer request
router.post('/', createTransfer);

// Cancel transfer request
router.patch('/:id/cancel', cancelTransfer);

// Approve / Reject (Admin, Asset Manager, Dept Head)
router.patch('/:id/approve', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD), approveTransfer);
router.patch('/:id/reject', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD), rejectTransfer);

export default router;
