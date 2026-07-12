import { Asset, MaintenanceRequest, Allocation, MAINTENANCE_STATUS, MAINTENANCE_PRIORITY, ASSET_LIFECYCLE, ALLOCATION_STATUS, ROLES } from '../../models/index.js';
import mongoose from 'mongoose';
import { logActivity } from '../../utils/logger.js';
import { createNotification } from '../../utils/notifier.js';

// ── Create Maintenance Request ───────────────────────────────────────────────
/**
 * POST /api/maintenance
 * All Auth users
 */
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { assetId, issueDescription, priority, imageUrl } = req.body;

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
      const isShared = asset.isSharedBookable === true;

      if (!belongsToEmp && !belongsToDept && !isShared) {
        return res.status(403).json({ error: { message: 'You can only request maintenance for assets currently assigned to you, your department, or shared resources.' } });
      }
    }

    // Create the request
    const maintenance = new MaintenanceRequest({
      assetId,
      raisedBy: req.user._id,
      raisedByEmployee: emp ? emp._id : null,
      issueDescription: issueDescription.trim(),
      priority: Object.values(MAINTENANCE_PRIORITY).includes(priority) ? priority : MAINTENANCE_PRIORITY.MEDIUM,
      status: MAINTENANCE_STATUS.PENDING,
      attachmentMetadata: imageUrl ? { url: imageUrl } : null
    });

    await maintenance.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'maintenance.raised',
      entityType: 'MaintenanceRequest',
      entityId: maintenance._id,
      metadata: { assetId, priority }
    });

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

    await logActivity({
      actorUserId: req.user._id,
      action: 'maintenance.approved',
      entityType: 'MaintenanceRequest',
      entityId: maintenance._id
    });

    await createNotification({
      recipientUserId: maintenance.raisedBy,
      type: 'Maintenance Approved',
      title: 'Maintenance Request Approved',
      message: `Your maintenance request for asset has been approved.`,
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: maintenance._id
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

    await logActivity({
      actorUserId: req.user._id,
      action: 'maintenance.rejected',
      entityType: 'MaintenanceRequest',
      entityId: maintenance._id
    });

    await createNotification({
      recipientUserId: maintenance.raisedBy,
      type: 'Maintenance Rejected',
      title: 'Maintenance Request Rejected',
      message: `Your maintenance request for asset has been rejected.`,
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: maintenance._id
    });

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

    await logActivity({
      actorUserId: req.user._id,
      action: 'maintenance.resolved',
      entityType: 'MaintenanceRequest',
      entityId: maintenance._id
    });

    await createNotification({
      recipientUserId: maintenance.raisedBy,
      type: 'Maintenance Resolved',
      title: 'Maintenance Request Resolved',
      message: `Your maintenance request for asset has been resolved.`,
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: maintenance._id
    });

    return res.status(200).json({ message: 'Maintenance request resolved.', maintenance });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to resolve maintenance request.' } });
  }
};

// ── Assign Technician to Maintenance Request ─────────────────────────────────
/**
 * PATCH /api/maintenance/:id/assign
 * Admin, Asset Manager
 */
export const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTechnician } = req.body;

    if (!assignedTechnician) {
      return res.status(400).json({ error: { message: 'Assigned technician (User ID) is required.' } });
    }

    const validStatuses = [MAINTENANCE_STATUS.APPROVED, MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED];

    const maintenance = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, status: { $in: validStatuses } },
      { 
        $set: { 
          status: MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED,
          assignedTechnician
        } 
      },
      { new: true }
    );

    if (!maintenance) {
      return res.status(400).json({ error: { message: 'Request not found or not in Approved/Assigned status.' } });
    }

    await logActivity({
      actorUserId: req.user._id,
      action: 'maintenance.assigned',
      entityType: 'MaintenanceRequest',
      entityId: maintenance._id,
      metadata: { assignedTechnician }
    });

    await createNotification({
      recipientUserId: assignedTechnician,
      type: 'Asset Assigned',
      title: 'Technician Assigned to Maintenance',
      message: `You have been assigned to handle a maintenance request.`,
      relatedEntityType: 'MaintenanceRequest',
      relatedEntityId: maintenance._id
    });

    return res.status(200).json({ message: 'Technician assigned successfully.', maintenance });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to assign technician.' } });
  }
};

// ── Update Maintenance Request Progress ──────────────────────────────────────
/**
 * PATCH /api/maintenance/:id/progress
 * Admin, Asset Manager, or Assigned Technician
 */
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { workNotes } = req.body;

    const maintenance = await MaintenanceRequest.findById(id);
    if (!maintenance) {
      return res.status(404).json({ error: { message: 'Maintenance request not found.' } });
    }

    const isTechnician = maintenance.assignedTechnician && maintenance.assignedTechnician.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === ROLES.ADMIN || req.user.role === ROLES.ASSET_MANAGER;

    if (!isTechnician && !isPrivileged) {
      return res.status(403).json({ error: { message: 'You are not authorized to update progress on this request.' } });
    }

    const validStatuses = [
      MAINTENANCE_STATUS.APPROVED,
      MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED,
      MAINTENANCE_STATUS.IN_PROGRESS
    ];

    if (!validStatuses.includes(maintenance.status)) {
      return res.status(400).json({ error: { message: 'Cannot update progress for request in this status.' } });
    }

    maintenance.status = MAINTENANCE_STATUS.IN_PROGRESS;
    if (workNotes) {
      maintenance.workNotes = String(workNotes).trim();
    }
    await maintenance.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'maintenance.assigned', // using existing MAINTENANCE_ASSIGNED prefix as action or similar. wait, let's keep it simple: log action as maintenance.progress
      entityType: 'MaintenanceRequest',
      entityId: maintenance._id
    });

    return res.status(200).json({ message: 'Maintenance progress updated.', maintenance });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update progress.' } });
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
