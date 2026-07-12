import mongoose from 'mongoose';

export const ASSET_LIFECYCLE = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'Under Maintenance',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed'
};

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required.'],
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: [true, 'Asset Category is required.']
    },
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required.'],
      unique: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^AF-\d+$/.test(value);
        },
        message: 'Asset tag must follow the format AF-XXXX (e.g., AF-0001).'
      }
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true, // Enables multiple null/omitted serial numbers, but unique when present
      default: null,
      trim: true
    },
    acquisitionDate: {
      type: Date,
      default: null
    },
    acquisitionCost: {
      type: Number,
      required: true,
      default: 0.00,
      min: [0, 'Acquisition cost cannot be negative.']
    },
    condition: {
      type: String,
      default: 'Good',
      trim: true
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    photoMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isSharedBookable: {
      type: Boolean,
      required: true,
      default: false
    },
    lifecycleStatus: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ASSET_LIFECYCLE),
        message: 'Invalid asset lifecycle status.'
      },
      default: ASSET_LIFECYCLE.AVAILABLE
    },
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Optimize database searches with indexes
assetSchema.index({ categoryId: 1 });
assetSchema.index({ lifecycleStatus: 1 });
assetSchema.index({ location: 1 });
assetSchema.index({ categoryId: 1, lifecycleStatus: 1 });

// Dynamic validator hook to verify customFields match the category field definitions
assetSchema.pre('validate', async function (next) {
  if (!this.categoryId) return next();
  try {
    const category = await mongoose.model('AssetCategory').findById(this.categoryId);
    if (!category) {
      throw new Error('Associated Asset Category does not exist.');
    }

    const fieldDefs = category.fieldDefinitions || [];
    const customVals = this.customFields || {};

    for (const field of fieldDefs) {
      const val = customVals[field.key];

      // Verify required fields
      if (field.required && (val === undefined || val === null || val === '')) {
        throw new Error(`Custom field "${field.label}" is required.`);
      }

      // Verify custom field types
      if (val !== undefined && val !== null && val !== '') {
        if (field.type === 'number' && isNaN(Number(val))) {
          throw new Error(`Custom field "${field.label}" must be a number.`);
        }
        if (field.type === 'boolean' && typeof val !== 'boolean') {
          throw new Error(`Custom field "${field.label}" must be a boolean.`);
        }
        if (field.type === 'date' && isNaN(Date.parse(val))) {
          throw new Error(`Custom field "${field.label}" must be a valid date.`);
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

assetSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
