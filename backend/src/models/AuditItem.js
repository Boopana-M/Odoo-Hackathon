import mongoose from 'mongoose';

export const VERIFICATION_RESULT = {
  VERIFIED: 'Verified',
  MISSING: 'Missing',
  DAMAGED: 'Damaged'
};

const auditItemSchema = new mongoose.Schema(
  {
    auditCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditCycle',
      required: [true, 'Audit Cycle is required.']
    },

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required for an audit item.']
    },

    // Who performed the verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    verificationResult: {
      type: String,
      required: [true, 'Verification result is required.'],
      enum: {
        values: Object.values(VERIFICATION_RESULT),
        message: 'Verification result must be one of: Verified, Missing, Damaged.'
      }
    },

    notes: {
      type: String,
      default: '',
      trim: true
    },

    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ── Unique constraint: one AuditItem per (AuditCycle + Asset) ─────────────────
// The same Asset cannot appear twice in the same Audit Cycle.
auditItemSchema.index({ auditCycleId: 1, assetId: 1 }, { unique: true });

// Additional lookup indexes
auditItemSchema.index({ auditCycleId: 1 });
auditItemSchema.index({ assetId: 1 });

// ── Asset lifecycle / close-cycle note ───────────────────────────────────────
// Model hooks must NOT update Asset.lifecycleStatus.
// Phase-2 close-cycle controller inspects AuditItems after closure:
//   - discrepancies (Missing / Damaged) are reviewed
//   - confirmed-missing Assets may be marked Lost by controller logic
//   - verificationResult cannot be changed once AuditCycle is Closed

auditItemSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const AuditItem = mongoose.model('AuditItem', auditItemSchema);
export default AuditItem;
