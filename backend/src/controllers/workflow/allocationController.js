import { Asset, Allocation, ALLOCATION_STATUS, ASSET_LIFECYCLE, ROLES } from '../../models/index.js';
import mongoose from 'mongoose';
import { logActivity } from '../../utils/logger.js';
import { createNotification } from '../../utils/notifier.js';

let isReplicaSet = null;
const checkReplicaSet = async () => {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const res = await mongoose.connection.db.command({ hello: 1 });
    isReplicaSet = !!res.setName;
  } catch (e) {
    try {
      const res = await mongoose.connection.db.command({ isMaster: 1 });
      isReplicaSet = !!res.setName;
    } catch (err) {
      isReplicaSet = false;
    }
  }
  return isReplicaSet;
};

// ── Allocate Asset ───────────────────────────────────────────────────────────
/**
 * POST /api/allocations
 * Admin, Asset Manager
 */
export const allocateAsset = async (req, res) => {
  let session = null;
  let useTx = false;
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

    // Determine if transactions are supported
    const hasReplicaSet = await checkReplicaSet();
    if (hasReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTx = true;
      } catch (e) {
        session = null;
        useTx = false;
      }
    }

    const opts = useTx && session ? { session } : {};

    // 1. Concurrency Check: Prevent multiple simultaneous Active allocations for one Asset.
    const activeAllocation = await Allocation.findOne({ assetId, status: ALLOCATION_STATUS.ACTIVE }).setOptions(opts);
    if (activeAllocation) {
      if (useTx && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({
        error: { message: 'Asset is not Available for allocation. Current status: Already allocated (Active allocation exists).' }
      });
    }

    // 2. Atomically find the asset IF it is AVAILABLE, and transition to ALLOCATED.
    const asset = await Asset.findOneAndUpdate(
      { _id: assetId, lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE },
      { $set: { lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED } },
      { new: true, ...opts }
    );

    if (!asset) {
      if (useTx && session) {
        await session.abortTransaction();
        session.endSession();
      }
      const existingAsset = await Asset.findById(assetId);
      if (!existingAsset) {
        return res.status(404).json({ error: { message: 'Asset not found.' } });
      }
      return res.status(400).json({
        error: { message: `Asset is not Available for allocation. Current status: ${existingAsset.lifecycleStatus}.` }
      });
    }

    // 3. Create the allocation record
    const allocation = new Allocation({
      assetId,
      employeeId: employeeId || null,
      departmentId: departmentId || null,
      expectedReturnDate: expectedReturnDate || null,
      allocatedBy: req.user._id,
      status: ALLOCATION_STATUS.ACTIVE,
      allocationDate: new Date()
    });

    try {
      await allocation.save(opts);
    } catch (saveError) {
      // Revert asset status if not using transaction (if transaction failed, abortTransaction does this)
      if (!useTx) {
        await Asset.findByIdAndUpdate(assetId, { $set: { lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE } });
      }
      throw saveError;
    }

    if (useTx && session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Log activity
    await logActivity({
      actorUserId: req.user._id,
      action: 'asset.allocated',
      entityType: 'Allocation',
      entityId: allocation._id,
      metadata: { assetId, employeeId, departmentId }
    });

    // Notify employee
    if (employeeId) {
      try {
        const EmployeeModel = mongoose.model('Employee');
        const empProfile = await EmployeeModel.findById(employeeId);
        if (empProfile && empProfile.userId) {
          await createNotification({
            recipientUserId: empProfile.userId,
            type: 'Asset Assigned',
            title: 'Asset Allocated',
            message: `The asset has been allocated to you.`,
            relatedEntityType: 'Allocation',
            relatedEntityId: allocation._id
          });
        }
      } catch (err) {
        console.error('Failed to notify employee of allocation:', err);
      }
    }

    return res.status(201).json({ message: 'Asset allocated successfully.', allocation });
  } catch (error) {
    if (useTx && session) {
      try {
        await session.abortTransaction();
      } catch (err) {}
      session.endSession();
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    console.error('Allocation Error:', error);
    return res.status(500).json({ error: { message: 'Failed to allocate asset.', details: error.message } });
  }
};

// ── Return Asset ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/allocations/:id/return
 * Admin, Asset Manager
 */
export const returnAsset = async (req, res) => {
  let session = null;
  let useTx = false;
  try {
    const { id } = req.params;
    const { returnNotes, conditionOnReturn } = req.body;

    const hasReplicaSet = await checkReplicaSet();
    if (hasReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTx = true;
      } catch (e) {
        session = null;
        useTx = false;
      }
    }

    const opts = useTx && session ? { session } : {};

    const allocation = await Allocation.findById(id).setOptions(opts);
    if (!allocation) {
      if (useTx && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({ error: { message: 'Allocation record not found.' } });
    }

    if (allocation.status !== ALLOCATION_STATUS.ACTIVE) {
      if (useTx && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ error: { message: `Cannot return asset. Allocation is already ${allocation.status}.` } });
    }

    const oldStatus = allocation.status;
    const oldReturnDate = allocation.returnDate;
    const oldReturnNotes = allocation.returnNotes;
    const oldCondition = allocation.conditionOnReturn;

    // Update the allocation
    allocation.status = ALLOCATION_STATUS.RETURNED;
    allocation.returnDate = new Date();
    allocation.returnNotes = returnNotes ? String(returnNotes).trim() : '';
    allocation.conditionOnReturn = conditionOnReturn ? String(conditionOnReturn).trim() : '';

    try {
      await allocation.save(opts);
    } catch (saveError) {
      throw saveError;
    }

    // Release the asset back to AVAILABLE
    try {
      await Asset.findByIdAndUpdate(allocation.assetId, {
        $set: { lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE }
      }, opts);
    } catch (updateError) {
      // Revert allocation if not using transaction
      if (!useTx) {
        allocation.status = oldStatus;
        allocation.returnDate = oldReturnDate;
        allocation.returnNotes = oldReturnNotes;
        allocation.conditionOnReturn = oldCondition;
        await allocation.save();
      }
      throw updateError;
    }

    if (useTx && session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Log activity
    await logActivity({
      actorUserId: req.user._id,
      action: 'asset.returned',
      entityType: 'Allocation',
      entityId: allocation._id,
      metadata: { assetId: allocation.assetId }
    });

    // Send return notification
    if (allocation.employeeId) {
      try {
        const EmployeeModel = mongoose.model('Employee');
        const empProfile = await EmployeeModel.findById(allocation.employeeId);
        if (empProfile && empProfile.userId) {
          await createNotification({
            recipientUserId: empProfile.userId,
            type: 'Asset Returned',
            title: 'Asset Returned',
            message: `Your allocated asset has been successfully returned.`,
            relatedEntityType: 'Allocation',
            relatedEntityId: allocation._id
          });
        }
      } catch (err) {
        console.error('Failed to notify employee of return:', err);
      }
    }

    return res.status(200).json({ message: 'Asset returned successfully.', allocation });
  } catch (error) {
    if (useTx && session) {
      try {
        await session.abortTransaction();
      } catch (err) {}
      session.endSession();
    }
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
    const { status, assetId, employeeId, departmentId, overdue } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (assetId) filter.assetId = assetId;

    if (overdue === 'true') {
      filter.status = ALLOCATION_STATUS.ACTIVE;
      filter.expectedReturnDate = { $lt: new Date() };
    }
    
    // RBAC visibility
    if (req.user.role === ROLES.EMPLOYEE) {
      const Employee = mongoose.model('Employee');
      const emp = await Employee.findOne({ userId: req.user._id });
      
      if (!emp) {
         return res.status(200).json({ allocations: [], total: 0 });
      }

      // Force filtering to only their own allocations (employeeId) or their department's
      if (overdue === 'true') {
        filter.$and = [
          { status: ALLOCATION_STATUS.ACTIVE },
          { expectedReturnDate: { $lt: new Date() } },
          {
            $or: [
              { employeeId: emp._id },
              { departmentId: emp.departmentId }
            ]
          }
        ];
      } else {
        filter.$or = [
          { employeeId: emp._id },
          { departmentId: emp.departmentId }
        ];
      }
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
