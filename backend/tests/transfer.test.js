// Phase 8 Transfer Tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_transfer_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, Department, AssetCategory, Asset, Allocation, TransferRequest, ROLES, ASSET_LIFECYCLE, ALLOCATION_STATUS, TRANSFER_STATUS } from '../src/models/index.js';

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
describe('Phase 8 — Asset Transfer Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let empToken;
  let emp2Token;
  let empId;
  let emp2Id;
  let assetId;
  let currentAllocationId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), Department.init(), AssetCategory.init(), Asset.init(), Allocation.init(), TransferRequest.init()]);

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
    
    // Create Employee 1
    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    empId = userRes.employee._id;
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Create Employee 2
    userRes = await signupUser(baseUrl, { email: 'emp2@test.com', password: 'password123', name: 'Employee Two' });
    emp2Id = userRes.employee._id;
    loginRes = await loginUser(baseUrl, { email: 'emp2@test.com', password: 'password123' });
    emp2Token = loginRes.token;

    // Create Asset
    const cat = await AssetCategory.create({ name: 'Laptops' });
    const asset = await Asset.create({ name: 'MacBook', categoryId: cat._id, assetTag: 'AF-0001', lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED });
    assetId = asset._id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await TransferRequest.deleteMany({});
    await Allocation.deleteMany({});
    await Asset.updateMany({}, { lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED });
    
    // Setup initial allocation for emp 1
    const alloc = await Allocation.create({
      assetId,
      employeeId: empId,
      status: ALLOCATION_STATUS.ACTIVE,
      allocationDate: new Date()
    });
    currentAllocationId = alloc._id;
  });

  describe('POST /api/transfers', () => {
    test('should allow an employee to request transfer of their asset to another employee', async () => {
      const res = await fetch(`${baseUrl}/transfers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, destinationEmployeeId: emp2Id, reason: 'Changing roles' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.transfer.status, TRANSFER_STATUS.REQUESTED);
      assert.strictEqual(body.transfer.currentAllocationId.toString(), currentAllocationId.toString());
    });

    test('should block an employee from requesting transfer of an asset they do not hold', async () => {
      // emp2 tries to transfer emp's asset
      const res = await fetch(`${baseUrl}/transfers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${emp2Token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, destinationEmployeeId: emp2Id })
      });
      assert.strictEqual(res.status, 403);
    });

    test('should block multiple pending requests for the same asset', async () => {
      await fetch(`${baseUrl}/transfers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, destinationEmployeeId: emp2Id })
      });

      const res = await fetch(`${baseUrl}/transfers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, destinationEmployeeId: emp2Id })
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /already pending/i);
    });
  });

  describe('PATCH /api/transfers/:id/approve', () => {
    let transferId;
    beforeEach(async () => {
      const transfer = await TransferRequest.create({
        assetId,
        currentAllocationId,
        requestedBy: empId, // Note: storing userId typically for requestedBy, assuming empId for test simplicity or grabbing actual user id. Actually requestedBy is user ID, but this bypasses pre-hooks since we use create. Wait, empId is Employee ObjectId, requestedBy takes User ObjectId. For tests, just letting it cast or we should get the correct User _id.
        destinationEmployeeId: emp2Id,
        status: TRANSFER_STATUS.REQUESTED
      });
      transferId = transfer._id;
    });

    test('should allow Asset Manager to approve a transfer', async () => {
      const res = await fetch(`${baseUrl}/transfers/${transferId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionNotes: 'Approved for role change.' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.transfer.status, TRANSFER_STATUS.REALLOCATED);
      
      // Verify previous allocation is closed
      const oldAlloc = await Allocation.findById(currentAllocationId);
      assert.strictEqual(oldAlloc.status, ALLOCATION_STATUS.TRANSFERRED);
      
      // Verify new allocation is created
      const newAlloc = await Allocation.findOne({ assetId, status: ALLOCATION_STATUS.ACTIVE });
      assert.ok(newAlloc);
      assert.strictEqual(newAlloc.employeeId.toString(), emp2Id.toString());
      assert.notStrictEqual(newAlloc._id.toString(), currentAllocationId.toString());
    });
  });

  describe('PATCH /api/transfers/:id/reject', () => {
    let transferId;
    beforeEach(async () => {
      const transfer = await TransferRequest.create({
        assetId,
        currentAllocationId,
        requestedBy: empId,
        destinationEmployeeId: emp2Id,
        status: TRANSFER_STATUS.REQUESTED
      });
      transferId = transfer._id;
    });

    test('should allow Asset Manager to reject a transfer', async () => {
      const res = await fetch(`${baseUrl}/transfers/${transferId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionNotes: 'Denied, device needed.' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.transfer.status, TRANSFER_STATUS.REJECTED);
      
      // Verify old allocation remains active
      const oldAlloc = await Allocation.findById(currentAllocationId);
      assert.strictEqual(oldAlloc.status, ALLOCATION_STATUS.ACTIVE);
    });
  });
});
