import mongoose from 'mongoose';

export const MAINTENANCE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  TECHNICIAN_ASSIGNED: 'Technician Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved'
};

export const MAINTENANCE_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

const maintenanceRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required for a maintenance request.']
    },

    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'The user raising the request is required.']
    },
    raisedByEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },

    issueDescription: {
      type: String,
      required: [true, 'Issue description is required.'],
      trim: true,
      minlength: [5, 'Issue description must be at least 5 characters.']
    },

    priority: {
      type: String,
      required: true,
      enum: {
        values: Object.values(MAINTENANCE_PRIORITY),
        message: 'Invalid maintenance priority.'
      },
      default: MAINTENANCE_PRIORITY.MEDIUM
    },

    attachmentMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: Object.values(MAINTENANCE_STATUS),
        message: 'Invalid maintenance status.'
      },
      default: MAINTENANCE_STATUS.PENDING
    },

    // Decision fields — set by controller/service logic, never by model hooks
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
    },

    // Technician: reference existing User/Employee
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    workNotes: {
      type: String,
      default: '',
      trim: true
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ── Asset lifecycle rule (CRITICAL — enforced in controller, documented here) ─
// A PENDING maintenance request does NOT move the Asset to 'Under Maintenance'.
// Asset.lifecycleStatus → 'Under Maintenance' ONLY after approval.
// Asset.lifecycleStatus → 'Available' ONLY after resolution, when consistent
//   with the current workflow state (e.g., no active Allocation).
// Model hooks must NEVER mutate BE-1 Asset fields.
// Phase-2 controller/service coordinates these state changes transactionally.

// ── Indexes ───────────────────────────────────────────────────────────────────
maintenanceRequestSchema.index({ assetId: 1, status: 1 });
maintenanceRequestSchema.index({ raisedBy: 1 });
maintenanceRequestSchema.index({ priority: 1, status: 1 });
maintenanceRequestSchema.index({ createdAt: 1, status: 1 });

maintenanceRequestSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const MaintenanceRequest = mongoose.model(
  'MaintenanceRequest',
  maintenanceRequestSchema
);
export default MaintenanceRequest;
