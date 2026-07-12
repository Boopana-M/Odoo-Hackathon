// Phase 7 Allocation Tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_allocation_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, Department, AssetCategory, Asset, Allocation, ROLES, ASSET_LIFECYCLE, ALLOCATION_STATUS } from '../src/models/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE = (port) => `http://localhost:${port}/api`;

async function signupUser(baseUrl, { email, password, name }) {
  const res = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  return res.json();
}

async function loginUser(baseUrl, { email, password }) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

async function forceRole(userId, role) {
  await User.findByIdAndUpdate(userId, { role });
}

// ── Test Suite ────────────────────────────────────────────────────────────────
describe('Phase 7 — Asset Allocation Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let empToken;
  let empId;
  let deptId;
  let availableAssetId;
  let allocatedAssetId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), Department.init(), AssetCategory.init(), Asset.init(), Allocation.init()]);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = BASE(port);
        resolve();
      });
    });
    
    // Create Asset Manager
    let userRes = await signupUser(baseUrl, { email: 'manager@test.com', password: 'password123', name: 'Asset Manager' });
    await forceRole(userRes.user._id, ROLES.ASSET_MANAGER);
    let loginRes = await loginUser(baseUrl, { email: 'manager@test.com', password: 'password123' });
    managerToken = loginRes.token;
    
    // Create Employee and Department
    const dept = await Department.create({ name: 'Engineering' });
    deptId = dept._id;

    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    empId = userRes.employee._id;
    await Employee.findByIdAndUpdate(empId, { departmentId: deptId });

    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Create Assets
    const cat = await AssetCategory.create({ name: 'Laptops' });
    const asset1 = await Asset.create({ name: 'MacBook', categoryId: cat._id, assetTag: 'AF-0001', lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE });
    const asset2 = await Asset.create({ name: 'ThinkPad', categoryId: cat._id, assetTag: 'AF-0002', lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED });
    
    availableAssetId = asset1._id;
    allocatedAssetId = asset2._id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Allocation.deleteMany({});
    await Asset.updateMany({}, { lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE });
  });

  describe('POST /api/allocations', () => {
    test('should allow Asset Manager to allocate an available asset to an employee', async () => {
      const res = await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, employeeId: empId })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.allocation.status, ALLOCATION_STATUS.ACTIVE);
      
      const updatedAsset = await Asset.findById(availableAssetId);
      assert.strictEqual(updatedAsset.lifecycleStatus, ASSET_LIFECYCLE.ALLOCATED);
    });

    test('should allow allocating to a department', async () => {
      const res = await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, departmentId: deptId })
      });
      assert.strictEqual(res.status, 201);
    });

    test('should prevent allocating an asset that is not AVAILABLE', async () => {
      // First allocate it
      await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, employeeId: empId })
      });

      // Try again
      const res = await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, employeeId: empId })
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /not Available/i);
    });

    test('should reject providing both employeeId and departmentId', async () => {
      const res = await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, employeeId: empId, departmentId: deptId })
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('PATCH /api/allocations/:id/return', () => {
    let allocId;
    beforeEach(async () => {
      const res = await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, employeeId: empId })
      });
      const body = await res.json();
      allocId = body.allocation._id;
    });

    test('should return an allocated asset and make it AVAILABLE again', async () => {
      const res = await fetch(`${baseUrl}/allocations/${allocId}/return`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnNotes: 'All good', conditionOnReturn: 'Good' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.allocation.status, ALLOCATION_STATUS.RETURNED);

      const updatedAsset = await Asset.findById(availableAssetId);
      assert.strictEqual(updatedAsset.lifecycleStatus, ASSET_LIFECYCLE.AVAILABLE);
    });
  });

  describe('GET /api/allocations', () => {
    beforeEach(async () => {
      await fetch(`${baseUrl}/allocations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: availableAssetId, employeeId: empId })
      });
    });

    test('should list allocations for an employee restricted to their own (and department)', async () => {
      const res = await fetch(`${baseUrl}/allocations`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.total, 1);
      assert.strictEqual(body.allocations[0].employeeId._id.toString(), empId.toString());
    });
  });
});
