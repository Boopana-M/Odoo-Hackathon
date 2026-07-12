import mongoose from 'mongoose';

export const AUDIT_STATUS = {
  PLANNED: 'Planned',
  OPEN: 'Open',
  CLOSED: 'Closed'
};

export const AUDIT_SCOPE_TYPE = {
  DEPARTMENT: 'Department',
  LOCATION: 'Location'
};

const auditCycleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Audit title is required.'],
      trim: true
    },

    scopeType: {
      type: String,
      required: [true, 'Audit scope type is required.'],
      enum: {
        values: Object.values(AUDIT_SCOPE_TYPE),
        message: 'Scope type must be Department or Location.'
      }
    },

    // Used when scopeType === 'Department'
    scopeDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },

    // Used when scopeType === 'Location'
    scopeLocation: {
      type: String,
      default: null,
      trim: true
    },

    startDate: {
      type: Date,
      required: [true, 'Audit start date is required.']
    },
    endDate: {
      type: Date,
      required: [true, 'Audit end date is required.']
    },

    // One or more auditors (reference Employee/User identities)
    auditors: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      default: [],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length >= 1;
        },
        message: 'At least one auditor must be assigned.'
      }
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(AUDIT_STATUS),
        message: 'Invalid audit cycle status.'
      },
      default: AUDIT_STATUS.PLANNED
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Close fields — set by controller logic only
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ── Validation: scope value must match scopeType ──────────────────────────────
auditCycleSchema.pre('validate', function (next) {
  if (this.scopeType === AUDIT_SCOPE_TYPE.DEPARTMENT && !this.scopeDepartmentId) {
    return next(
      new Error('scopeDepartmentId is required when scopeType is Department.')
    );
  }
  if (
    this.scopeType === AUDIT_SCOPE_TYPE.LOCATION &&
    (!this.scopeLocation || !this.scopeLocation.trim())
  ) {
    return next(
      new Error('scopeLocation is required when scopeType is Location.')
    );
  }
  // endDate must not precede startDate
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(new Error('Audit end date cannot be earlier than the start date.'));
  }
  next();
});

// ── Closure note ──────────────────────────────────────────────────────────────
// Phase-2 close-cycle controller must:
//   - Prevent verification changes after status === 'Closed'
//   - Inspect AuditItem discrepancies
//   - Potentially mark confirmed-missing Assets as Lost
//   - Set closedBy / closedAt atomically

// ── Indexes ───────────────────────────────────────────────────────────────────
auditCycleSchema.index({ status: 1 });
auditCycleSchema.index({ scopeType: 1 });
auditCycleSchema.index({ auditors: 1 });

auditCycleSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const AuditCycle = mongoose.model('AuditCycle', auditCycleSchema);
export default AuditCycle;
