import express from 'express';
import {
  createAssetCategory,
  listAssetCategories,
  getAssetCategoryById,
  updateAssetCategory
} from '../../controllers/organization/assetCategoryController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../models/index.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// GET endpoints (all authenticated users can view categories)
router.get('/', listAssetCategories);
router.get('/:id', getAssetCategoryById);

// Admin only routes for mutation
router.post('/', requireRole(ROLES.ADMIN), createAssetCategory);
router.put('/:id', requireRole(ROLES.ADMIN), updateAssetCategory);

export default router;
