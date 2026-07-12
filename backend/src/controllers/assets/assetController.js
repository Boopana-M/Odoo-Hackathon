import mongoose from 'mongoose';
import { Asset, AssetCategory, ASSET_LIFECYCLE, ROLES, Allocation, ALLOCATION_STATUS, Employee } from '../../models/index.js';

// Helper to validate custom fields against category definition
const validateCustomFields = (customFields, fieldDefinitions) => {
  const errors = [];
  const processedFields = {};

  if (!fieldDefinitions || fieldDefinitions.length === 0) {
    return { isValid: true, processedFields };
  }

  for (const def of fieldDefinitions) {
    const { key, type, required, label } = def;
    const value = customFields ? customFields[key] : undefined;

    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`Custom field "${label}" (${key}) is required.`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      switch (type) {
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`Custom field "${label}" (${key}) must be a number.`);
          } else {
            processedFields[key] = numValue;
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push(`Custom field "${label}" (${key}) must be a boolean.`);
          } else {
            processedFields[key] = value === 'true' || value === true;
          }
          break;
        case 'date':
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            errors.push(`Custom field "${label}" (${key}) must be a valid date.`);
          } else {
            processedFields[key] = dateValue;
          }
          break;
        case 'string':
        default:
          processedFields[key] = String(value).trim();
          break;
      }
    }
  }

  return { isValid: errors.length === 0, errors, processedFields };
};

// Helper to generate Asset Tag AF-XXXX
const generateAssetTag = async () => {
  // Simple increment strategy (could be improved for concurrency)
  const lastAsset = await Asset.findOne().sort({ createdAt: -1 });
  let nextNumber = 1;
  if (lastAsset && lastAsset.assetTag && lastAsset.assetTag.startsWith('AF-')) {
    const parts = lastAsset.assetTag.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      nextNumber = parseInt(parts[1], 10) + 1;
    }
  }
  return `AF-${String(nextNumber).padStart(4, '0')}`;
};

// ── Create Asset ─────────────────────────────────────────────────────────────
/**
 * POST /api/assets
 * Admin, Asset Manager
 */
export const createAsset = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      description,
      serialNumber,
      customFields,
      acquisitionCost,
      vendorInfo,
      purchaseDate,
      warrantyExpiry,
      location,
      isSharedBookable
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: { message: 'Asset name is required.' } });
    }
    if (!categoryId) {
      return res.status(400).json({ error: { message: 'Asset category is required.' } });
    }

    const category = await AssetCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ error: { message: 'Invalid Asset Category ID.' } });
    }
    if (!category.isActive) {
      return res.status(400).json({ error: { message: 'Cannot create asset in deactivated category.' } });
    }

    // Validate custom fields
    const validation = validateCustomFields(customFields, category.fieldDefinitions);
    if (!validation.isValid) {
      return res.status(400).json({ error: { message: 'Custom field validation failed.', details: validation.errors } });
    }

    const assetTag = await generateAssetTag();

    const asset = new Asset({
      name: name.trim(),
      categoryId,
      assetTag,
      description,
      serialNumber,
      customFields: validation.processedFields,
      acquisitionCost: acquisitionCost || 0,
      vendorInfo,
      purchaseDate,
      warrantyExpiry,
      location,
      isSharedBookable: isSharedBookable || false,
      lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE // Default status
    });

    await asset.save();
    return res.status(201).json({ message: 'Asset created.', asset });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'Asset tag or serial number already exists.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    return res.status(500).json({ error: { message: 'Failed to create asset.' } });
  }
};

// ── List Assets ──────────────────────────────────────────────────────────────
/**
 * GET /api/assets
 * Auth only
 */
export const listAssets = async (req, res) => {
  try {
    const { lifecycleStatus, categoryId, search, isSharedBookable, myAssets } = req.query;
    const filter = {};

    if (lifecycleStatus) filter.lifecycleStatus = lifecycleStatus;
    if (categoryId) filter.categoryId = categoryId;
    if (isSharedBookable !== undefined) filter.isSharedBookable = isSharedBookable === 'true';

    // If myAssets is requested, filter assets allocated to the current user
    if (myAssets === 'true') {
      const emp = await Employee.findOne({ userId: req.user._id });
      if (emp) {
        const allocations = await Allocation.find({ 
          employeeId: emp._id, 
          status: ALLOCATION_STATUS.ACTIVE 
        });
        const assetIds = allocations.map(a => a.assetId);
        filter._id = { $in: assetIds };
      } else {
        return res.status(200).json({ assets: [], total: 0 });
      }
    } else if (req.user.role === ROLES.EMPLOYEE) {
      // Employees generally only see what's shared bookable or what's explicitly assigned to them
      filter.lifecycleStatus = { $in: [ASSET_LIFECYCLE.AVAILABLE, ASSET_LIFECYCLE.ALLOCATED] };
    }

    let assets = await Asset.find(filter).populate('categoryId', 'name').sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      assets = assets.filter(
        a => 
          a.name.toLowerCase().includes(term) || 
          a.assetTag.toLowerCase().includes(term) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(term))
      );
    }

    return res.status(200).json({ assets, total: assets.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list assets.' } });
  }
};

// ── Get Asset ────────────────────────────────────────────────────────────────
/**
 * GET /api/assets/:id
 * Auth only
 */
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('categoryId');
    if (!asset) {
      return res.status(404).json({ error: { message: 'Asset not found.' } });
    }
    return res.status(200).json({ asset });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid Asset ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to retrieve asset.' } });
  }
};

// ── Update Asset ─────────────────────────────────────────────────────────────
/**
 * PUT /api/assets/:id
 * Admin, Asset Manager
 */
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      serialNumber,
      customFields,
      acquisitionCost,
      vendorInfo,
      purchaseDate,
      warrantyExpiry,
      location,
      isSharedBookable,
      lifecycleStatus // Updating status manually (usually should be workflow driven)
    } = req.body;

    const asset = await Asset.findById(id).populate('categoryId');
    if (!asset) {
      return res.status(404).json({ error: { message: 'Asset not found.' } });
    }

    if (name !== undefined && name.trim()) asset.name = name.trim();
    if (description !== undefined) asset.description = description.trim();
    if (serialNumber !== undefined) asset.serialNumber = serialNumber.trim();
    if (acquisitionCost !== undefined) asset.acquisitionCost = acquisitionCost;
    if (vendorInfo !== undefined) asset.vendorInfo = vendorInfo;
    if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate;
    if (warrantyExpiry !== undefined) asset.warrantyExpiry = warrantyExpiry;
    if (location !== undefined) asset.location = location;
    if (isSharedBookable !== undefined) asset.isSharedBookable = isSharedBookable;
    
    // Allow manual status update only for certain transitions or by Admin
    if (lifecycleStatus !== undefined && Object.values(ASSET_LIFECYCLE).includes(lifecycleStatus)) {
       asset.lifecycleStatus = lifecycleStatus;
    }

    // Validate and merge custom fields if provided
    if (customFields) {
      // We need the full merged custom fields to validate required fields if updating partially
      const mergedFields = { ...asset.customFields, ...customFields };
      const validation = validateCustomFields(mergedFields, asset.categoryId.fieldDefinitions);
      if (!validation.isValid) {
        return res.status(400).json({ error: { message: 'Custom field validation failed.', details: validation.errors } });
      }
      asset.customFields = validation.processedFields;
    }

    await asset.save();
    return res.status(200).json({ message: 'Asset updated.', asset });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'Serial number already exists.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update asset.' } });
  }
};
