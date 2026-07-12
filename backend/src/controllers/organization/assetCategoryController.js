import { AssetCategory } from '../../models/index.js';

// ── Create Asset Category ────────────────────────────────────────────────────
/**
 * POST /api/asset-categories
 * Admin only.
 */
export const createAssetCategory = async (req, res) => {
  try {
    const { name, description, fieldDefinitions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: { message: 'Asset Category name is required.' } });
    }

    const category = new AssetCategory({
      name: name.trim(),
      description: description ? description.trim() : '',
      fieldDefinitions: fieldDefinitions || []
    });

    await category.save();
    return res.status(201).json({ message: 'Asset Category created.', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'Asset Category name already exists.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    return res.status(500).json({ error: { message: 'Failed to create asset category.' } });
  }
};

// ── List Asset Categories ────────────────────────────────────────────────────
/**
 * GET /api/asset-categories
 * Auth only.
 */
export const listAssetCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const categories = await AssetCategory.find(filter).sort({ name: 1 });
    return res.status(200).json({ categories, total: categories.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list asset categories.' } });
  }
};

// ── Get Asset Category ───────────────────────────────────────────────────────
/**
 * GET /api/asset-categories/:id
 * Auth only.
 */
export const getAssetCategoryById = async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: { message: 'Asset Category not found.' } });
    }
    return res.status(200).json({ category });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid Asset Category ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to retrieve asset category.' } });
  }
};

// ── Update Asset Category ────────────────────────────────────────────────────
/**
 * PUT /api/asset-categories/:id
 * Admin only.
 */
export const updateAssetCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, fieldDefinitions, isActive } = req.body;

    const category = await AssetCategory.findById(id);
    if (!category) {
      return res.status(404).json({ error: { message: 'Asset Category not found.' } });
    }

    if (name !== undefined && name.trim()) {
      category.name = name.trim();
    }
    if (description !== undefined) {
      category.description = description.trim();
    }
    if (fieldDefinitions !== undefined && Array.isArray(fieldDefinitions)) {
      category.fieldDefinitions = fieldDefinitions;
    }
    if (isActive !== undefined && typeof isActive === 'boolean') {
      category.isActive = isActive;
    }

    await category.save();
    return res.status(200).json({ message: 'Asset Category updated.', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'Asset Category name already exists.' } });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update asset category.' } });
  }
};
