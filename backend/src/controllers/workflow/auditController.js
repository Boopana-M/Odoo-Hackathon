import { AuditCycle, AuditItem, Asset, Allocation, AUDIT_STATUS, AUDIT_SCOPE_TYPE, VERIFICATION_RESULT, ASSET_LIFECYCLE, ALLOCATION_STATUS, ROLES, User } from '../../models/index.js';
import { logActivity } from '../../utils/logger.js';
import { createNotification } from '../../utils/notifier.js';

// ── Create Audit Cycle ───────────────────────────────────────────────────────
/**
 * POST /api/audits
 * Admin, Asset Manager
 */
export const createAuditCycle = async (req, res) => {
  try {
    const { title, scopeType, scopeDepartmentId, scopeLocation, startDate, endDate, auditors } = req.body;

    const cycle = new AuditCycle({
      title,
      scopeType,
      scopeDepartmentId: scopeType === AUDIT_SCOPE_TYPE.DEPARTMENT ? scopeDepartmentId : null,
      scopeLocation: scopeType === AUDIT_SCOPE_TYPE.LOCATION ? scopeLocation : null,
      startDate,
      endDate,
      auditors,
      createdBy: req.user._id,
      status: AUDIT_STATUS.PLANNED
    });

    await cycle.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'audit.created',
      entityType: 'AuditCycle',
      entityId: cycle._id,
      metadata: { scopeType, startDate, endDate }
    });

    return res.status(201).json({ message: 'Audit Cycle created successfully.', cycle });
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('validation') || error.message.includes('date') || error.message.includes('scope') || error.message.includes('auditor')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    return res.status(500).json({ error: { message: 'Failed to create Audit Cycle.' } });
  }
};

// ── Update Audit Cycle Status ────────────────────────────────────────────────
/**
 * PATCH /api/audits/:id/status
 * Admin, Asset Manager
 */
export const updateAuditStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(AUDIT_STATUS).includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid audit status.' } });
    }

    const cycle = await AuditCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({ error: { message: 'Audit Cycle not found.' } });
    }

    if (cycle.status === AUDIT_STATUS.CLOSED) {
      return res.status(400).json({ error: { message: 'Cannot change status of a closed Audit Cycle.' } });
    }

    cycle.status = status;
    await cycle.save();

    return res.status(200).json({ message: `Audit Cycle status updated to ${status}.`, cycle });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update status.' } });
  }
};

// ── Verify Asset ─────────────────────────────────────────────────────────────
/**
 * POST /api/audits/:cycleId/verify
 * Assigned Auditors, Admin, Asset Manager
 */
export const verifyAsset = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { assetId, verificationResult, notes } = req.body;

    if (!assetId || !verificationResult) {
      return res.status(400).json({ error: { message: 'Asset ID and verification result are required.' } });
    }

    if (!Object.values(VERIFICATION_RESULT).includes(verificationResult)) {
      return res.status(400).json({ error: { message: 'Invalid verification result.' } });
    }

    const cycle = await AuditCycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({ error: { message: 'Audit Cycle not found.' } });
    }

    if (cycle.status !== AUDIT_STATUS.OPEN) {
      return res.status(400).json({ error: { message: 'Verification is only allowed for Open audits.' } });
    }

    // Verify authorized auditor
    const isAuditor = cycle.auditors.some(id => id.toString() === req.user._id.toString());
    const isPrivileged = req.user.role === ROLES.ADMIN || req.user.role === ROLES.ASSET_MANAGER;

    if (!isAuditor && !isPrivileged) {
      return res.status(403).json({ error: { message: 'You are not authorized to perform audits for this cycle.' } });
    }

    // Validate asset existence
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ error: { message: 'Asset not found.' } });
    }

    // Validate scope rules
    if (cycle.scopeType === AUDIT_SCOPE_TYPE.DEPARTMENT) {
      const activeAlloc = await Allocation.findOne({ assetId, status: ALLOCATION_STATUS.ACTIVE });
      if (!activeAlloc || !activeAlloc.departmentId || activeAlloc.departmentId.toString() !== cycle.scopeDepartmentId.toString()) {
        return res.status(400).json({ error: { message: 'Asset is not in scope for this department audit.' } });
      }
    } else if (cycle.scopeType === AUDIT_SCOPE_TYPE.LOCATION) {
      if (asset.location !== cycle.scopeLocation) {
        return res.status(400).json({ error: { message: 'Asset is not in scope for this location audit.' } });
      }
    }

    // Upsert verification item
    const auditItem = await AuditItem.findOneAndUpdate(
      { auditCycleId: cycleId, assetId },
      {
        $set: {
          verifiedBy: req.user._id,
          verificationResult,
          notes: notes ? String(notes).trim() : '',
          verifiedAt: new Date()
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    await logActivity({
      actorUserId: req.user._id,
      action: 'audit.item.verified',
      entityType: 'AuditItem',
      entityId: auditItem._id,
      metadata: { cycleId, assetId, verificationResult }
    });

    if (verificationResult === VERIFICATION_RESULT.MISSING || verificationResult === VERIFICATION_RESULT.DAMAGED) {
      try {
        const managers = await User.find({ role: { $in: [ROLES.ADMIN, ROLES.ASSET_MANAGER] } });
        for (const manager of managers) {
          await createNotification({
            recipientUserId: manager._id,
            type: 'Audit Discrepancy Flagged',
            title: 'Audit Discrepancy Flagged',
            message: `Discrepancy flagged: Asset ${asset.name} marked as ${verificationResult} in audit cycle ${cycle.title}.`,
            relatedEntityType: 'AuditCycle',
            relatedEntityId: cycle._id
          });
        }
      } catch (err) {
        console.error('Failed to notify managers of audit discrepancy:', err);
      }
    }

    return res.status(200).json({ message: 'Asset verified successfully.', auditItem });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to verify asset.' } });
  }
};

// ── Close Audit Cycle ────────────────────────────────────────────────────────
/**
 * PATCH /api/audits/:id/close
 * Admin, Asset Manager
 */
export const closeAuditCycle = async (req, res) => {
  try {
    const { id } = req.params;

    const cycle = await AuditCycle.findById(id);
    if (!cycle) {
      return res.status(404).json({ error: { message: 'Audit Cycle not found.' } });
    }

    if (cycle.status === AUDIT_STATUS.CLOSED) {
      return res.status(400).json({ error: { message: 'Audit Cycle is already closed.' } });
    }

    cycle.status = AUDIT_STATUS.CLOSED;
    cycle.closedBy = req.user._id;
    cycle.closedAt = new Date();
    await cycle.save();

    // Process confirmed outcomes: Transition confirmed missing assets to Lost
    const missingItems = await AuditItem.find({
      auditCycleId: id,
      verificationResult: VERIFICATION_RESULT.MISSING
    });

    for (const item of missingItems) {
      // 1. Transition Asset to Lost
      await Asset.findByIdAndUpdate(item.assetId, {
        $set: { lifecycleStatus: ASSET_LIFECYCLE.LOST }
      });

      // 2. Close active Allocation if any
      await Allocation.findOneAndUpdate(
        { assetId: item.assetId, status: ALLOCATION_STATUS.ACTIVE },
        {
          $set: {
            status: ALLOCATION_STATUS.RETURNED, // or a distinct terminal status
            returnDate: new Date(),
            returnNotes: `Asset marked Lost during audit cycle: ${cycle.title}`
          }
        }
      );
    }

    await logActivity({
      actorUserId: req.user._id,
      action: 'audit.closed',
      entityType: 'AuditCycle',
      entityId: cycle._id,
      metadata: { missingCount: missingItems.length }
    });

    return res.status(200).json({ message: 'Audit Cycle closed and discrepancy updates processed.', cycle, updatedCount: missingItems.length });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to close Audit Cycle.' } });
  }
};

// ── List Audit Cycles ────────────────────────────────────────────────────────
/**
 * GET /api/audits
 * Auth user
 */
export const listAuditCycles = async (req, res) => {
  try {
    const { status, scopeType } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (scopeType) filter.scopeType = scopeType;

    const cycles = await AuditCycle.find(filter)
      .populate('createdBy', 'email name')
      .populate('closedBy', 'email name')
      .populate('scopeDepartmentId', 'name')
      .sort({ startDate: -1 });

    return res.status(200).json({ cycles, total: cycles.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list Audit Cycles.' } });
  }
};

// ── Get Audit Cycle Detail ───────────────────────────────────────────────────
/**
 * GET /api/audits/:id
 * Auth user
 */
export const getAuditCycleDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const cycle = await AuditCycle.findById(id)
      .populate('createdBy', 'email name')
      .populate('closedBy', 'email name')
      .populate('scopeDepartmentId', 'name')
      .populate('auditors', 'email name');

    if (!cycle) {
      return res.status(404).json({ error: { message: 'Audit Cycle not found.' } });
    }

    const items = await AuditItem.find({ auditCycleId: id })
      .populate('assetId', 'name assetTag serialNumber')
      .populate('verifiedBy', 'email name');

    return res.status(200).json({ cycle, items });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to retrieve Audit Cycle details.' } });
  }
};
