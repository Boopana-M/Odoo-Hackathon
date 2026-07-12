import { Asset, Allocation, TransferRequest, ALLOCATION_STATUS, TRANSFER_STATUS, ASSET_LIFECYCLE, ROLES } from '../../models/index.js';
import mongoose from 'mongoose';
import { logActivity } from '../../utils/logger.js';
import { createNotification } from '../../utils/notifier.js';

// ── Create Transfer Request ──────────────────────────────────────────────────
/**
 * POST /api/transfers
 * All Auth users. (Employee requests transfer, Manager/Admin can directly create one).
 */
export const createTransfer = async (req, res) => {
  try {
    const { assetId, destinationEmployeeId, destinationDepartmentId, reason } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: { message: 'Asset ID is required.' } });
    }

    if (!destinationEmployeeId && !destinationDepartmentId) {
      return res.status(400).json({ error: { message: 'Must specify destinationEmployeeId or destinationDepartmentId.' } });
    }

    if (destinationEmployeeId && destinationDepartmentId) {
      return res.status(400).json({ error: { message: 'Cannot specify both destinationEmployeeId and destinationDepartmentId.' } });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ error: { message: 'Asset not found.' } });
    }

    // Find if there is a current ACTIVE allocation for this asset
    const currentAllocation = await Allocation.findOne({ assetId, status: ALLOCATION_STATUS.ACTIVE });

    // Optional: Rule check if Employee is allowed to transfer. Typically only the assigned user or Admin can initiate.
    if (req.user.role === ROLES.EMPLOYEE) {
       // Lookup Employee ID to verify they hold the asset
       const EmployeeModel = mongoose.model('Employee');
       const emp = await EmployeeModel.findOne({ userId: req.user._id });
       if (!emp) {
         return res.status(403).json({ error: { message: 'Employee profile not found.' } });
       }

       const belongsToEmp = currentAllocation.employeeId && currentAllocation.employeeId.toString() === emp._id.toString();
       const belongsToDept = currentAllocation.departmentId && emp.departmentId && currentAllocation.departmentId.toString() === emp.departmentId.toString();

       if (!currentAllocation || (!belongsToEmp && !belongsToDept)) {
         return res.status(403).json({ error: { message: 'You can only request transfers for assets currently assigned to you or your department.' } });
       }
    }

    // Check for existing pending transfer for this asset to avoid spam
    const pendingTransfer = await TransferRequest.findOne({ assetId, status: TRANSFER_STATUS.REQUESTED });
    if (pendingTransfer) {
      return res.status(400).json({ error: { message: 'A transfer request is already pending for this asset.' } });
    }

    const transfer = new TransferRequest({
      assetId,
      currentAllocationId: currentAllocation ? currentAllocation._id : null,
      requestedBy: req.user._id,
      destinationEmployeeId: destinationEmployeeId || null,
      destinationDepartmentId: destinationDepartmentId || null,
      reason: reason ? String(reason).trim() : '',
      status: TRANSFER_STATUS.REQUESTED
    });

    await transfer.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'transfer.requested',
      entityType: 'TransferRequest',
      entityId: transfer._id,
      metadata: { assetId, destinationEmployeeId, destinationDepartmentId }
    });

    return res.status(201).json({ message: 'Transfer request submitted.', transfer });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to create transfer request.' } });
  }
};

// ── Approve Transfer Request ─────────────────────────────────────────────────
/**
 * PATCH /api/transfers/:id/approve
 * Admin, Asset Manager
 */
export const approveTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNotes } = req.body;

    const transfer = await TransferRequest.findOne({ _id: id, status: TRANSFER_STATUS.REQUESTED });
    if (!transfer) {
      return res.status(400).json({ error: { message: 'Transfer request not found or not in Requested status.' } });
    }

    if (req.user.role === ROLES.DEPARTMENT_HEAD) {
      const EmployeeModel = mongoose.model('Employee');
      const deptHeadEmp = await EmployeeModel.findOne({ userId: req.user._id });
      if (!deptHeadEmp || !deptHeadEmp.departmentId) {
         return res.status(403).json({ error: { message: 'Department Head profile or department ID missing.' } });
      }
      const allocation = await Allocation.findById(transfer.currentAllocationId);
      if (!allocation || !allocation.departmentId || allocation.departmentId.toString() !== deptHeadEmp.departmentId.toString()) {
         return res.status(403).json({ error: { message: 'Department Heads can only approve transfers for assets currently assigned to their department.' } });
      }
    }

    // Atomically guard against double approval
    const updatedTransfer = await TransferRequest.findOneAndUpdate(
      { _id: id, status: TRANSFER_STATUS.REQUESTED },
      { 
        $set: { 
          status: TRANSFER_STATUS.REALLOCATED,
          decidedBy: req.user._id,
          decisionAt: new Date(),
          decisionNotes: decisionNotes ? String(decisionNotes).trim() : ''
        } 
      },
      { new: true }
    );
    
    if (!updatedTransfer) {
      return res.status(400).json({ error: { message: 'Transfer request not found or already processed.' } });
    }

    // 1. Close current allocation if it exists and is still Active
    if (transfer.currentAllocationId) {
      await Allocation.findOneAndUpdate(
        { _id: transfer.currentAllocationId, status: ALLOCATION_STATUS.ACTIVE },
        { 
          $set: { 
            status: ALLOCATION_STATUS.TRANSFERRED,
            returnDate: new Date(),
            returnNotes: 'Transferred via request ' + transfer._id
          }
        }
      );
    }

    // 2. Create new allocation
    const newAllocation = new Allocation({
      assetId: transfer.assetId,
      employeeId: transfer.destinationEmployeeId,
      departmentId: transfer.destinationDepartmentId,
      allocatedBy: req.user._id,
      status: ALLOCATION_STATUS.ACTIVE,
      allocationDate: new Date()
    });
    await newAllocation.save();

    // 3. Ensure Asset status is ALLOCATED
    await Asset.findByIdAndUpdate(transfer.assetId, {
      $set: { lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED }
    });

    await logActivity({
      actorUserId: req.user._id,
      action: 'transfer.approved',
      entityType: 'TransferRequest',
      entityId: transfer._id,
      metadata: { assetId: transfer.assetId, newAllocationId: newAllocation._id }
    });

    await createNotification({
      recipientUserId: transfer.requestedBy,
      type: 'Transfer Approved',
      title: 'Transfer Request Approved',
      message: `Your transfer request for asset has been approved.`,
      relatedEntityType: 'TransferRequest',
      relatedEntityId: transfer._id
    });

    return res.status(200).json({ message: 'Transfer approved and re-allocated.', transfer, allocation: newAllocation });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to approve transfer.' } });
  }
};

// ── Reject Transfer Request ──────────────────────────────────────────────────
/**
 * PATCH /api/transfers/:id/reject
 * Admin, Asset Manager
 */
export const rejectTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNotes } = req.body;

    const transfer = await TransferRequest.findOne({ _id: id, status: TRANSFER_STATUS.REQUESTED });
    if (!transfer) {
      return res.status(400).json({ error: { message: 'Transfer request not found or not in Requested status.' } });
    }

    if (req.user.role === ROLES.DEPARTMENT_HEAD) {
      const EmployeeModel = mongoose.model('Employee');
      const deptHeadEmp = await EmployeeModel.findOne({ userId: req.user._id });
      if (!deptHeadEmp || !deptHeadEmp.departmentId) {
         return res.status(403).json({ error: { message: 'Department Head profile or department ID missing.' } });
      }
      const allocation = await Allocation.findById(transfer.currentAllocationId);
      if (!allocation || !allocation.departmentId || allocation.departmentId.toString() !== deptHeadEmp.departmentId.toString()) {
         return res.status(403).json({ error: { message: 'Department Heads can only reject transfers for assets currently assigned to their department.' } });
      }
    }

    const updatedTransfer = await TransferRequest.findOneAndUpdate(
      { _id: id, status: TRANSFER_STATUS.REQUESTED },
      { 
        $set: { 
          status: TRANSFER_STATUS.REJECTED,
          decidedBy: req.user._id,
          decisionAt: new Date(),
          decisionNotes: decisionNotes ? String(decisionNotes).trim() : ''
        } 
      },
      { new: true }
    );

    if (!updatedTransfer) {
      return res.status(400).json({ error: { message: 'Transfer request not found or already processed.' } });
    }

    await logActivity({
      actorUserId: req.user._id,
      action: 'transfer.rejected',
      entityType: 'TransferRequest',
      entityId: transfer._id
    });

    await createNotification({
      recipientUserId: transfer.requestedBy,
      type: 'Transfer Rejected',
      title: 'Transfer Request Rejected',
      message: `Your transfer request for asset has been rejected.`,
      relatedEntityType: 'TransferRequest',
      relatedEntityId: transfer._id
    });

    return res.status(200).json({ message: 'Transfer rejected.', transfer });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to reject transfer.' } });
  }
};

// ── Cancel Transfer Request ──────────────────────────────────────────────────
/**
 * PATCH /api/transfers/:id/cancel
 * Auth only. Requester or Admin/Asset Manager can cancel a Requested transfer.
 */
export const cancelTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await TransferRequest.findById(id);
    if (!transfer) {
      return res.status(404).json({ error: { message: 'Transfer request not found.' } });
    }

    if (transfer.status !== TRANSFER_STATUS.REQUESTED) {
      return res.status(400).json({ error: { message: 'Only pending (Requested) transfer requests can be cancelled.' } });
    }

    const isRequester = transfer.requestedBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === ROLES.ADMIN || req.user.role === ROLES.ASSET_MANAGER;

    if (!isRequester && !isPrivileged) {
      return res.status(403).json({ error: { message: 'You are not authorized to cancel this transfer request.' } });
    }

    transfer.status = TRANSFER_STATUS.CANCELLED;
    await transfer.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'transfer.cancelled',
      entityType: 'TransferRequest',
      entityId: transfer._id
    });

    return res.status(200).json({ message: 'Transfer request cancelled.', transfer });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to cancel transfer request.' } });
  }
};

// ── List Transfer Requests ───────────────────────────────────────────────────
/**
 * GET /api/transfers
 * Auth only
 */
export const listTransfers = async (req, res) => {
  try {
    const { status, assetId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (assetId) filter.assetId = assetId;

    if (req.user.role === ROLES.EMPLOYEE) {
      filter.requestedBy = req.user._id;
    }

    const transfers = await TransferRequest.find(filter)
      .populate('assetId', 'name assetTag serialNumber')
      .populate('requestedBy', 'email')
      .populate('decidedBy', 'email')
      .populate('destinationEmployeeId', 'name')
      .populate('destinationDepartmentId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ transfers, total: transfers.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list transfers.' } });
  }
};
