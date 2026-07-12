import mongoose from 'mongoose';

export const TRANSFER_STATUS = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  REALLOCATED: 'Re-allocated' // terminal: transfer completed, new allocation created
};

const transferRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required for a transfer request.']
    },

    // Optional reference to the current active Allocation being transferred
    currentAllocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Allocation',
      default: null
    },

    // Who is requesting the transfer
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user is required.']
    },

    // Destination: exactly one of destinationEmployeeId OR destinationDepartmentId
    destinationEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    destinationDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },

    reason: {
      type: String,
      default: '',
      trim: true
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(TRANSFER_STATUS),
        message: 'Invalid transfer request status.'
      },
      default: TRANSFER_STATUS.REQUESTED
    },

    // Decision fields — populated by controller/service logic, never by model hooks
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionAt: {
      type: Date,
      default: null
    },
    decisionNotes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// ── Validation: exactly one destination ──────────────────────────────────────
transferRequestSchema.pre('validate', function (next) {
  const hasEmployee = !!this.destinationEmployeeId;
  const hasDepartment = !!this.destinationDepartmentId;

  if (hasEmployee && hasDepartment) {
    return next(
      new Error(
        'Transfer destination must be exactly one of Employee or Department, not both.'
      )
    );
  }
  if (!hasEmployee && !hasDepartment) {
    return next(
      new Error(
        'Transfer destination must be exactly one of Employee or Department; neither is set.'
      )
    );
  }

  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
transferRequestSchema.index({ assetId: 1, status: 1 });
transferRequestSchema.index({ requestedBy: 1 });
transferRequestSchema.index({ destinationEmployeeId: 1 });
transferRequestSchema.index({ destinationDepartmentId: 1 });
transferRequestSchema.index({ createdAt: 1, status: 1 });

// ── Concurrency note ─────────────────────────────────────────────────────────
// Phase-2 approval controller must coordinate transactionally:
//   1. Approve this TransferRequest (status → Approved → Re-allocated)
//   2. Close the current Allocation (status → Transferred)
//   3. Create a new Allocation for the destination
//   4. Optionally update Asset.lifecycleStatus
// Duplicate approval race is mitigated by an atomic status guard
// (findOneAndUpdate where status === 'Requested').

transferRequestSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
export default TransferRequest;
