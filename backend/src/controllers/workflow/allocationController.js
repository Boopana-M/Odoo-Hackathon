import { Asset, Allocation, ALLOCATION_STATUS, ASSET_LIFECYCLE, ROLES } from '../../models/index.js';
import mongoose from 'mongoose';

// ── Allocate Asset ───────────────────────────────────────────────────────────
/**
 * POST /api/allocations
 * Admin, Asset Manager
 */
export const allocateAsset = async (req, res) => {
  try {
    const { assetId, employeeId, departmentId, expectedReturnDate } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: { message: 'Asset ID is required.' } });
    }

    if (!employeeId && !departmentId) {
      return res.status(400).json({ error: { message: 'Must specify either employeeId or departmentId.' } });
    }

    if (employeeId && departmentId) {
      return res.status(400).json({ error: { message: 'Cannot specify both employeeId and departmentId.' } });
    }

    // Atomically find the asset IF it is AVAILABLE, and transition to ALLOCATED.
    // This prevents race conditions where two concurrent allocations grab the same asset.
    const asset = await Asset.findOneAndUpdate(
      { _id: assetId, lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE },
      { $set: { lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED } },
      { new: true }
    );

    if (!asset) {
      // It's possible the asset doesn't exist, or it's just not AVAILABLE.
      const existingAsset = await Asset.findById(assetId);
      if (!existingAsset) {
        return res.status(404).json({ error: { message: 'Asset not found.' } });
      }
      return res.status(400).json({
        error: { message: `Asset is not Available for allocation. Current status: ${existingAsset.lifecycleStatus}.` }
      });
    }

    // Create the allocation record
    const allocation = new Allocation({
      assetId,
      employeeId: employeeId || null,
      departmentId: departmentId || null,
      expectedReturnDate: expectedReturnDate || null,
      allocatedBy: req.user._id,
      status: ALLOCATION_STATUS.ACTIVE,
      allocationDate: new Date()
    });

    await allocation.save();

    return res.status(201).json({ message: 'Asset allocated successfully.', allocation });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to allocate asset.' } });
  }
};

// ── Return Asset ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/allocations/:id/return
 * Admin, Asset Manager
 */
export const returnAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnNotes, conditionOnReturn } = req.body;

    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ error: { message: 'Allocation record not found.' } });
    }

    if (allocation.status !== ALLOCATION_STATUS.ACTIVE) {
      return res.status(400).json({ error: { message: `Cannot return asset. Allocation is already ${allocation.status}.` } });
    }

    // Update the allocation
    allocation.status = ALLOCATION_STATUS.RETURNED;
    allocation.returnDate = new Date();
    allocation.returnNotes = returnNotes ? String(returnNotes).trim() : '';
    allocation.conditionOnReturn = conditionOnReturn ? String(conditionOnReturn).trim() : '';

    await allocation.save();

    // Release the asset back to AVAILABLE
    // (If the asset was disposed/retired manually in the interim, we might not want to override it to AVAILABLE, 
    // but typically a return sets it back to AVAILABLE or UNDER_MAINTENANCE based on condition. For now, AVAILABLE).
    await Asset.findByIdAndUpdate(allocation.assetId, {
      $set: { lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE }
    });

    return res.status(200).json({ message: 'Asset returned successfully.', allocation });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to return asset.' } });
  }
};

// ── List Allocations ─────────────────────────────────────────────────────────
/**
 * GET /api/allocations
 * Auth only (Employee sees only their own, Admin/Manager sees all)
 */
export const listAllocations = async (req, res) => {
  try {
    const { status, assetId, employeeId, departmentId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (assetId) filter.assetId = assetId;
    
    // RBAC visibility
    if (req.user.role === ROLES.EMPLOYEE) {
      // Wait, we need to map req.user._id to Employee profile to know their employeeId.
      // Easiest is to lookup Employee by userId.
      const Employee = mongoose.model('Employee');
      const emp = await Employee.findOne({ userId: req.user._id });
      
      if (!emp) {
         // Employee profile missing? Shouldn't happen, but return empty
         return res.status(200).json({ allocations: [], total: 0 });
      }

      // Force filtering to only their own allocations (employeeId) or their department's
      filter.$or = [
        { employeeId: emp._id },
        { departmentId: emp.departmentId }
      ];
    } else {
      if (employeeId) filter.employeeId = employeeId;
      if (departmentId) filter.departmentId = departmentId;
    }

    const allocations = await Allocation.find(filter)
      .populate('assetId', 'name assetTag serialNumber')
      .populate('employeeId', 'name')
      .populate('departmentId', 'name')
      .populate('allocatedBy', 'email')
      .sort({ allocationDate: -1 });

    return res.status(200).json({ allocations, total: allocations.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list allocations.' } });
  }
};
