import mongoose from 'mongoose';

const fieldDefinitionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Field key is required.'],
      trim: true
    },
    label: {
      type: String,
      required: [true, 'Field label is required.'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Field type is required.'],
      enum: {
        values: ['string', 'number', 'boolean', 'date'],
        message: 'Field type must be one of: string, number, boolean, date.'
      }
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  { _id: false } // No separate _id for embedded objects
);

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset Category name is required.'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    fieldDefinitions: {
      type: [fieldDefinitionSchema],
      default: [],
      validate: {
        validator: function (value) {
          if (!value || !Array.isArray(value)) return true;
          const keys = new Set();
          for (const field of value) {
            if (!field.key || !field.key.trim()) return false;
            const normKey = field.key.trim().toLowerCase();
            if (keys.has(normKey)) {
              return false; // Found duplicate
            }
            keys.add(normKey);
          }
          return true;
        },
        message: 'Duplicate custom field keys inside the same category are not allowed.'
      }
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true
  }
);

assetCategorySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
export default AssetCategory;
