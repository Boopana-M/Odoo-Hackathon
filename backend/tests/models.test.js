// Set test environment database to local SQLite-like MongoDB test collection
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import {
  User,
  Employee,
  Department,
  AssetCategory,
  Asset,
  ROLES,
  ASSET_LIFECYCLE
} from '../src/models/index.js';

describe('AssetFlow Mongoose Models (BE-1 Phase 1)', () => {
  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  after(async () => {
    // Drop the test database and close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    // Clear collections to ensure test isolation
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await AssetCategory.deleteMany({});
    await Asset.deleteMany({});
  });

  describe('User Model', () => {
    test('should create a valid user with default Employee role', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123'
      });

      assert.strictEqual(user.email, 'test@example.com');
      assert.strictEqual(user.role, ROLES.EMPLOYEE);
      assert.strictEqual(user.isActive, true);
      assert.ok(user._id);
    });

    test('should normalize email to lowercase and trim spaces', async () => {
      const user = await User.create({
        email: '  TEST.USER@Example.Com  ',
        password: 'password123'
      });

      assert.strictEqual(user.email, 'test.user@example.com');
    });

    test('should hash password on save and compare password correctly', async () => {
      const user = await User.create({
        email: 'hash@example.com',
        password: 'securepassword'
      });

      assert.notStrictEqual(user.password, 'securepassword');
      assert.ok(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

      const isMatch = await user.comparePassword('securepassword');
      assert.strictEqual(isMatch, true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      assert.strictEqual(isNotMatch, false);
    });

    test('should exclude password from serialized JSON representation', async () => {
      const user = await User.create({
        email: 'serialize@example.com',
        password: 'password123'
      });

      const json = user.toJSON();
      assert.strictEqual(json.password, undefined);
      assert.strictEqual(json.email, 'serialize@example.com');
    });

    test('should enforce unique email constraint', async () => {
      await User.create({
        email: 'duplicate@example.com',
        password: 'password123'
      });

      // Since unique constraint relies on MongoDB indexes, we trigger manual validation & index sync
      await User.syncIndexes();

      await assert.rejects(
        User.create({
          email: 'duplicate@example.com',
          password: 'anotherpassword'
        }),
        /duplicate key/i
      );
    });

    test('should fail validation with invalid role enum', async () => {
      await assert.rejects(
        User.create({
          email: 'invalidrole@example.com',
          password: 'password123',
          role: 'SuperAdmin' // Invalid role
        }),
        /ValidationError/i
      );
    });
  });

  describe('Department Model', () => {
    test('should create a valid department and trim name', async () => {
      const dept = await Department.create({
        name: '  Engineering Department  '
      });

      assert.strictEqual(dept.name, 'Engineering Department');
      assert.strictEqual(dept.isActive, true);
    });

    test('should enforce unique department name constraint', async () => {
      await Department.create({ name: 'HR' });
      await Department.syncIndexes();

      await assert.rejects(
        Department.create({ name: 'HR' }),
        /duplicate key/i
      );
    });

    test('should prevent self-parenting hierarchy', async () => {
      const dept = new Department({ name: 'Sales' });
      // Set parentDepartmentId to its own ID
      dept.parentDepartmentId = dept._id;

      await assert.rejects(
        dept.save(),
        /A department cannot be its own parent/i
      );
    });
  });

  describe('AssetCategory Model', () => {
    test('should create a valid category with field definitions', async () => {
      const category = await AssetCategory.create({
        name: 'Electronics',
        description: 'Electronic devices',
        fieldDefinitions: [
          { key: 'warranty', label: 'Warranty (Months)', type: 'number', required: true },
          { key: 'manufacturer', label: 'Manufacturer', type: 'string', required: false }
        ]
      });

      assert.strictEqual(category.name, 'Electronics');
      assert.strictEqual(category.fieldDefinitions.length, 2);
    });

    test('should prevent duplicate keys in field definitions', async () => {
      await assert.rejects(
        AssetCategory.create({
          name: 'Furniture',
          fieldDefinitions: [
            { key: 'material', label: 'Material', type: 'string', required: true },
            { key: 'MATERIAL', label: 'Second Material', type: 'string', required: false }
          ]
        }),
        /Duplicate custom field keys inside the same category are not allowed/i
      );
    });

    test('should prevent invalid field types in definitions', async () => {
      await assert.rejects(
        AssetCategory.create({
          name: 'Vehicles',
          fieldDefinitions: [
            { key: 'engine_size', label: 'Engine', type: 'float', required: true } // Invalid type 'float'
          ]
        }),
        /ValidationError/i
      );
    });
  });

  describe('Employee Model', () => {
    test('should link employee to user and department', async () => {
      const user = await User.create({ email: 'emp@example.com', password: 'password123' });
      const dept = await Department.create({ name: 'Marketing' });

      const employee = await Employee.create({
        name: 'John Doe',
        userId: user._id,
        departmentId: dept._id
      });

      assert.strictEqual(employee.name, 'John Doe');
      assert.ok(employee.userId.equals(user._id));
      assert.ok(employee.departmentId.equals(dept._id));
    });

    test('should prevent multiple employees linked to the same user account', async () => {
      const user = await User.create({ email: 'emp2@example.com', password: 'password123' });
      await Employee.syncIndexes();

      await Employee.create({
        name: 'Alice',
        userId: user._id
      });

      await assert.rejects(
        Employee.create({
          name: 'Bob',
          userId: user._id
        }),
        /duplicate key/i
      );
    });
  });

  describe('Asset Model', () => {
    let category;

    beforeEach(async () => {
      category = await AssetCategory.create({
        name: 'Laptops',
        fieldDefinitions: [
          { key: 'ram_gb', label: 'RAM (GB)', type: 'number', required: false },
          { key: 'is_touchscreen', label: 'Touchscreen', type: 'boolean', required: false }
        ]
      });
    });

    test('should create asset with default Available lifecycle state', async () => {
      const asset = await Asset.create({
        name: 'MacBook Pro',
        categoryId: category._id,
        assetTag: 'AF-0001'
      });

      assert.strictEqual(asset.lifecycleStatus, ASSET_LIFECYCLE.AVAILABLE);
      assert.strictEqual(asset.isSharedBookable, false);
      assert.strictEqual(asset.acquisitionCost, 0); // defaults to 0
    });

    test('should enforce asset tag format AF-XXXX', async () => {
      await assert.rejects(
        Asset.create({
          name: 'Asset Fail 1',
          categoryId: category._id,
          assetTag: 'INVALID-TAG'
        }),
        /Asset tag must follow the format AF-XXXX/i
      );

      // Should succeed with valid format
      const asset = await Asset.create({
        name: 'Asset Success',
        categoryId: category._id,
        assetTag: 'AF-10492'
      });
      assert.strictEqual(asset.assetTag, 'AF-10492');
    });

    test('should prevent duplicate asset tags', async () => {
      await Asset.syncIndexes();

      await Asset.create({
        name: 'Asset 1',
        categoryId: category._id,
        assetTag: 'AF-0002'
      });

      await assert.rejects(
        Asset.create({
          name: 'Asset 2',
          categoryId: category._id,
          assetTag: 'AF-0002'
        }),
        /duplicate key/i
      );
    });

    test('should enforce non-negative acquisition cost', async () => {
      await assert.rejects(
        Asset.create({
          name: 'Asset Neg Cost',
          categoryId: category._id,
          assetTag: 'AF-0003',
          acquisitionCost: -100.00
        }),
        /cannot be negative/i
      );
    });

    test('should validate custom fields according to category definitions', async () => {
      const requiredCategory = await AssetCategory.create({
        name: 'Required Laptops',
        fieldDefinitions: [
          { key: 'ram_gb', label: 'RAM (GB)', type: 'number', required: true },
          { key: 'is_touchscreen', label: 'Touchscreen', type: 'boolean', required: false }
        ]
      });

      // 1. Missing required field
      await assert.rejects(
        Asset.create({
          name: 'Laptop Missing RAM',
          categoryId: requiredCategory._id,
          assetTag: 'AF-0004',
          customFields: {} // ram_gb is required
        }),
        /Custom field "RAM \(GB\)" is required/i
      );

      // 2. Wrong type (string instead of number)
      await assert.rejects(
        Asset.create({
          name: 'Laptop Bad RAM Type',
          categoryId: requiredCategory._id,
          assetTag: 'AF-0005',
          customFields: { ram_gb: 'sixteen' }
        }),
        /must be a number/i
      );

      // 3. Success with valid values
      const asset = await Asset.create({
        name: 'Laptop Good',
        categoryId: requiredCategory._id,
        assetTag: 'AF-0006',
        customFields: { ram_gb: 16, is_touchscreen: false }
      });

      assert.strictEqual(asset.customFields.ram_gb, 16);
    });
  });
});
