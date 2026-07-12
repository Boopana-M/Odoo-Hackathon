import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required.'],
      unique: true,
      trim: true
    },
    departmentHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    parentDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value.toString() !== this._id.toString();
        },
        message: 'A department cannot be its own parent.'
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

departmentSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;
