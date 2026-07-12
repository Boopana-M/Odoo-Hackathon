import express from 'express';
import {
  createAsset,
  listAssets,
  getAssetById,
  updateAsset
} from '../../controllers/assets/assetController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// GET endpoints (all authenticated users can list/view assets)
// (Controller handles role-based filtering visibility)
router.get('/', listAssets);
router.get('/:id', getAssetById);

// Asset Manager only for mutation
router.post('/', requireRole(ROLES.ASSET_MANAGER), createAsset);
router.put('/:id', requireRole(ROLES.ASSET_MANAGER), updateAsset);

export default router;
