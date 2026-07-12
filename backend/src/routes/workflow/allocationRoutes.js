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

// Asset Manager only
router.post('/', requireRole(ROLES.ASSET_MANAGER), allocateAsset);
router.patch('/:id/return', requireRole(ROLES.ASSET_MANAGER), returnAsset);

export default router;
