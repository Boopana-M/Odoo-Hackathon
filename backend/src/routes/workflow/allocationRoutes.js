import express from 'express';
import {
  allocateAsset,
  returnAsset,
  listAllocations
} from '../../controllers/workflow/allocationController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List allocations (all users, restricted by role internally)
router.get('/', listAllocations);

// Admin & Asset Manager only
router.post('/', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), allocateAsset);
router.patch('/:id/return', requireRole(ROLES.ADMIN, ROLES.ASSET_MANAGER), returnAsset);

export default router;
