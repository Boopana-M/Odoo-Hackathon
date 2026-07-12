import { Asset, MaintenanceRequest, Allocation, MAINTENANCE_STATUS, MAINTENANCE_PRIORITY, ASSET_LIFECYCLE, ALLOCATION_STATUS, ROLES } from '../../models/index.js';
import mongoose from 'mongoose';

// ── Create Maintenance Request ───────────────────────────────────────────────
/**
 * POST /api/maintenance
 * All Auth users
 */
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { assetId, issueDescription, priority } = req.body;

    if (!assetId || !issueDescription) {
      return res.status(400).json({ error: { message: 'Asset ID and issue description are required.' } });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ error: { message: 'Asset not found.' } });
    }

    // Lookup Employee ID
    const EmployeeModel = mongoose.model('Employee');
    const emp = await EmployeeModel.findOne({ userId: req.user._id });

    // Optional rule check: employees can only raise requests for assets they hold.
    // Managers/Admins can raise requests for any asset.
    if (req.user.role === ROLES.EMPLOYEE) {
      if (!emp) {
        return res.status(403).json({ error: { message: 'Employee profile not found.' } });
      }
      const currentAllocation = await Allocation.findOne({ assetId, status: ALLOCATION_STATUS.ACTIVE });
      
      const belongsToEmp = currentAllocation && currentAllocation.employeeId && currentAllocation.employeeId.toString() === emp._id.toString();
      const belongsToDept = currentAllocation && currentAllocation.departmentId && emp.departmentId && currentAllocation.departmentId.toString() === emp.departmentId.toString();

      if (!belongsToEmp && !belongsToDept) {
        return res.status(403).json({ error: { message: 'You can only request maintenance for assets currently assigned to you or your department.' } });
      }
    }

    // Create the request
    const maintenance = new MaintenanceRequest({
      assetId,
      raisedBy: req.user._id,
      raisedByEmployee: emp ? emp._id : null,
      issueDescription: issueDescription.trim(),
      priority: Object.values(MAINTENANCE_PRIORITY).includes(priority) ? priority : MAINTENANCE_PRIORITY.MEDIUM,
      status: MAINTENANCE_STATUS.PENDING
    });

    await maintenance.save();
    return res.status(201).json({ message: 'Maintenance request submitted.', maintenance });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to create maintenance request.' } });
  }
};

// ── Approve/Reject Maintenance Request ───────────────────────────────────────
/**
 * PATCH /api/maintenance/:id/approve
 * Admin, Asset Manager
 */
export const approveMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNotes, assignedTechnician } = req.body;

    const maintenance = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, status: MAINTENANCE_STATUS.PENDING },
      { 
        $set: { 
          status: MAINTENANCE_STATUS.APPROVED,
          decidedBy: req.user._id,
          decisionAt: new Date(),
          decisionNotes: decisionNotes ? String(decisionNotes).trim() : '',
          assignedTechnician: assignedTechnician || null
        } 
      },
      { new: true }
    );

    if (!maintenance) {
      return res.status(400).json({ error: { message: 'Request not found or not in Pending status.' } });
    }

    // Set Asset lifecycleStatus to UNDER_MAINTENANCE
    await Asset.findByIdAndUpdate(maintenance.assetId, {
      $set: { lifecycleStatus: ASSET_LIFECYCLE.UNDER_MAINTENANCE }
    });

    return res.status(200).json({ message: 'Maintenance request approved.', maintenance });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to approve maintenance request.' } });
  }
};

/**
 * PATCH /api/maintenance/:id/reject
 * Admin, Asset Manager
 */
export const rejectMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisionNotes } = req.body;

    const maintenance = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, status: MAINTENANCE_STATUS.PENDING },
      { 
        $set: { 
          status: MAINTENANCE_STATUS.REJECTED,
          decidedBy: req.user._id,
          decisionAt: new Date(),
          decisionNotes: decisionNotes ? String(decisionNotes).trim() : ''
        } 
      },
      { new: true }
    );

    if (!maintenance) {
      return res.status(400).json({ error: { message: 'Request not found or not in Pending status.' } });
    }

    return res.status(200).json({ message: 'Maintenance request rejected.', maintenance });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to reject maintenance request.' } });
  }
};

// ── Resolve Maintenance Request ──────────────────────────────────────────────
/**
 * PATCH /api/maintenance/:id/resolve
 * Admin, Asset Manager (or Assigned Technician if we had a dedicated role)
 */
export const resolveMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { workNotes } = req.body;

    // Allowed statuses to transition to RESOLVED
    const validCurrentStatuses = [
      MAINTENANCE_STATUS.APPROVED,
      MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED,
      MAINTENANCE_STATUS.IN_PROGRESS
    ];

    const maintenance = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, status: { $in: validCurrentStatuses } },
      { 
        $set: { 
          status: MAINTENANCE_STATUS.RESOLVED,
          workNotes: workNotes ? String(workNotes).trim() : '',
          resolvedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!maintenance) {
      return res.status(400).json({ error: { message: 'Request not found or not in a resolvable state.' } });
    }

    // Check if the asset has an active allocation to correctly restore its state
    const activeAllocation = await Allocation.findOne({ assetId: maintenance.assetId, status: ALLOCATION_STATUS.ACTIVE });
    const newAssetStatus = activeAllocation ? ASSET_LIFECYCLE.ALLOCATED : ASSET_LIFECYCLE.AVAILABLE;

    await Asset.findByIdAndUpdate(maintenance.assetId, {
      $set: { lifecycleStatus: newAssetStatus }
    });

    return res.status(200).json({ message: 'Maintenance request resolved.', maintenance });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to resolve maintenance request.' } });
  }
};

// ── List Maintenance Requests ────────────────────────────────────────────────
/**
 * GET /api/maintenance
 * Auth only
 */
export const listMaintenanceRequests = async (req, res) => {
  try {
    const { status, priority, assetId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assetId) filter.assetId = assetId;

    if (req.user.role === ROLES.EMPLOYEE) {
      filter.raisedBy = req.user._id;
    }

    const requests = await MaintenanceRequest.find(filter)
      .populate('assetId', 'name assetTag serialNumber')
      .populate('raisedBy', 'email name')
      .populate('decidedBy', 'email name')
      .populate('assignedTechnician', 'email name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests, total: requests.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list maintenance requests.' } });
  }
};
