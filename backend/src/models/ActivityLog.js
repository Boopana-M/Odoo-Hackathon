import mongoose from 'mongoose';

// Controlled action values — extend as new workflow operations are added
export const ACTIVITY_ACTION = {
  // Allocation
  ASSET_ALLOCATED: 'asset.allocated',
  ASSET_RETURNED: 'asset.returned',

  // Transfer
  TRANSFER_REQUESTED: 'transfer.requested',
  TRANSFER_APPROVED: 'transfer.approved',
  TRANSFER_REJECTED: 'transfer.rejected',
  TRANSFER_CANCELLED: 'transfer.cancelled',

  // Booking
  BOOKING_CREATED: 'booking.created',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_COMPLETED: 'booking.completed',

  // Maintenance
  MAINTENANCE_RAISED: 'maintenance.raised',
  MAINTENANCE_APPROVED: 'maintenance.approved',
  MAINTENANCE_REJECTED: 'maintenance.rejected',
  MAINTENANCE_ASSIGNED: 'maintenance.assigned',
  MAINTENANCE_RESOLVED: 'maintenance.resolved',

  // Audit
  AUDIT_CREATED: 'audit.created',
  AUDIT_ITEM_VERIFIED: 'audit.item.verified',
  AUDIT_CLOSED: 'audit.closed',

  // Core (BE-1 actions logged by BE-2 controllers as side effects)
  ASSET_CREATED: 'asset.created',
  ASSET_UPDATED: 'asset.updated',
  USER_ROLE_PROMOTED: 'user.role.promoted'
};

const activityLogSchema = new mongoose.Schema(
  {
    // Actor who performed the action (User identity)
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actorEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },

    action: {
      type: String,
      required: [true, 'Activity action is required.'],
      trim: true
      // Not enum-constrained so future actions can be added without migration
    },

    // Related entity
    entityType: {
      type: String,
      required: [true, 'Entity type is required.'],
      trim: true
      // e.g. 'Asset', 'Allocation', 'TransferRequest', 'ResourceBooking', etc.
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity identifier is required.']
    },

    // Optional lightweight summary — NEVER store passwords, tokens, or secrets
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    // createdAt is the authoritative event timestamp; no updatedAt needed
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
activityLogSchema.index({ actorUserId: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

// ── Security rules (enforced in controllers, documented here) ─────────────────
// NEVER log: password hashes, authentication tokens, secrets.
// NEVER store full request bodies blindly.
// No broad automatic logging middleware is added in Phase 1.
// BE-1 middleware is NOT modified.

activityLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
