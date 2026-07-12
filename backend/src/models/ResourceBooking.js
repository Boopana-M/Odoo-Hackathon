import mongoose from 'mongoose';

export const BOOKING_STATUS = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const resourceBookingSchema = new mongoose.Schema(
  {
    // Must reference a BE-1 Asset where isSharedBookable === true
    // (enforced by controller; model stores the reference)
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'A bookable asset/resource is required.']
    },

    // Who made the booking
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A booking actor (User) is required.']
    },
    bookedByEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },

    // Optional department context
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },

    startTime: {
      type: Date,
      required: [true, 'Booking start time is required.']
    },
    endTime: {
      type: Date,
      required: [true, 'Booking end time is required.']
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(BOOKING_STATUS),
        message: 'Invalid booking status.'
      },
      default: BOOKING_STATUS.UPCOMING
    },

    purpose: {
      type: String,
      default: '',
      trim: true
    },

    // Cancellation metadata
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ── Validation: endTime must be after startTime ───────────────────────────────
resourceBookingSchema.pre('validate', function (next) {
  if (this.startTime && this.endTime) {
    if (this.endTime <= this.startTime) {
      return next(
        new Error('Booking end time must be after the start time.')
      );
    }
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
resourceBookingSchema.index({ assetId: 1, startTime: 1 });
resourceBookingSchema.index({ assetId: 1, endTime: 1 });
resourceBookingSchema.index({ assetId: 1, status: 1 });
resourceBookingSchema.index({ bookedBy: 1 });
resourceBookingSchema.index({ bookedByEmployee: 1 });

// ── Concurrency / Overlap note ────────────────────────────────────────────────
// CRITICAL OVERLAP RULE (enforced in Phase-2 controller, NOT here):
//   Two Active (non-Cancelled) bookings for the same resource must not overlap.
//   Canonical overlap condition:
//     existing.startTime < requested.endTime
//     AND existing.endTime > requested.startTime
//
// A normal unique index cannot represent this interval constraint.
// Phase-2 booking controller must query for overlapping non-Cancelled bookings
// before creating a new one, using an atomic guard or MongoDB transaction.
//
// Cancelled bookings must NOT block new bookings.

resourceBookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const ResourceBooking = mongoose.model('ResourceBooking', resourceBookingSchema);
export default ResourceBooking;
