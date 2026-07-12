import mongoose from 'mongoose';

export const NOTIFICATION_TYPE = {
  ASSET_ASSIGNED: 'Asset Assigned',
  ASSET_RETURNED: 'Asset Returned',
  MAINTENANCE_APPROVED: 'Maintenance Approved',
  MAINTENANCE_REJECTED: 'Maintenance Rejected',
  MAINTENANCE_RESOLVED: 'Maintenance Resolved',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  BOOKING_CANCELLED: 'Booking Cancelled',
  BOOKING_REMINDER: 'Booking Reminder',
  TRANSFER_APPROVED: 'Transfer Approved',
  TRANSFER_REJECTED: 'Transfer Rejected',
  OVERDUE_RETURN_ALERT: 'Overdue Return Alert',
  AUDIT_DISCREPANCY_FLAGGED: 'Audit Discrepancy Flagged'
};

const notificationSchema = new mongoose.Schema(
  {
    // Recipient
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient (User) is required.']
    },
    recipientEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },

    type: {
      type: String,
      required: [true, 'Notification type is required.'],
      enum: {
        values: Object.values(NOTIFICATION_TYPE),
        message: 'Invalid notification type.'
      }
    },

    title: {
      type: String,
      required: [true, 'Notification title is required.'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required.'],
      trim: true
    },

    isRead: {
      type: Boolean,
      required: true,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },

    // Optional: link back to the related workflow entity
    relatedEntityType: {
      type: String,
      default: null,
      trim: true
      // e.g. 'Allocation', 'MaintenanceRequest', 'ResourceBooking', etc.
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
      // Generic ObjectId — no executable route logic stored here
    }
  },
  {
    timestamps: true
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
notificationSchema.index({ recipientUserId: 1, isRead: 1 });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

// ── Notes ─────────────────────────────────────────────────────────────────────
// Reminder scheduling is NOT implemented in Phase 1.
// No executable route logic or scheduling metadata is stored.
// Controllers create Notification documents as side effects of workflow actions.

notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
