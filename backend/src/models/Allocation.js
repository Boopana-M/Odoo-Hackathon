import mongoose from 'mongoose';

export const ALLOCATION_STATUS = {
  ACTIVE: 'Active',
  RETURNED: 'Returned',
  TRANSFERRED: 'Transferred' // terminal: superseded by a Transfer
};

const allocationSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required for allocation.']
    },

    // Exactly one of employeeId OR departmentId must be set (model-level validation below)
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },

    allocationDate: {
      type: Date,
      required: [true, 'Allocation date is required.'],
      default: Date.now
    },
    expectedReturnDate: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ALLOCATION_STATUS),
        message: 'Invalid allocation status.'
      },
      default: ALLOCATION_STATUS.ACTIVE
    },

    returnDate: {
      type: Date,
      default: null
    },
    returnNotes: {
      type: String,
      default: '',
      trim: true
    },
    conditionOnReturn: {
      type: String,
      default: '',
      trim: true
    },

    // Who created / approved this allocation
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ── Validation: exactly one of employeeId / departmentId ──────────────────────
allocationSchema.pre('validate', function (next) {
  const hasEmployee = !!this.employeeId;
  const hasDepartment = !!this.departmentId;

  if (hasEmployee && hasDepartment) {
    return next(
      new Error('Allocation target must be exactly one of Employee or Department, not both.')
    );
  }
  if (!hasEmployee && !hasDepartment) {
    return next(
      new Error('Allocation target must be exactly one of Employee or Department; neither is set.')
    );
  }

  // expectedReturnDate must not precede allocationDate
  if (this.expectedReturnDate && this.allocationDate) {
    if (this.expectedReturnDate < this.allocationDate) {
      return next(
        new Error('Expected return date cannot be earlier than the allocation date.')
      );
    }
  }

  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
// Used by Phase-2 concurrency check: find Active allocation for the same Asset
allocationSchema.index({ assetId: 1, status: 1 });
allocationSchema.index({ employeeId: 1, status: 1 });
allocationSchema.index({ departmentId: 1, status: 1 });
allocationSchema.index({ expectedReturnDate: 1, status: 1 });

// ── Concurrency note ─────────────────────────────────────────────────────────
// CRITICAL: One Asset must never have multiple simultaneous Active allocations.
// A naive find-then-create pre-check is NOT race-condition safe.
// Phase-2 controller MUST use an atomic conditional update / findOneAndUpdate
// with a $exists/$ne guard, or a MongoDB transaction that queries for an
// existing Active allocation before creating a new one.

allocationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Allocation = mongoose.model('Allocation', allocationSchema);
export default Allocation;
