// Phase 9 Maintenance Tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_maintenance_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, Department, AssetCategory, Asset, Allocation, MaintenanceRequest, ROLES, ASSET_LIFECYCLE, ALLOCATION_STATUS, MAINTENANCE_STATUS, MAINTENANCE_PRIORITY } from '../src/models/index.js';

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
describe('Phase 9 — Asset Maintenance Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let empToken;
  let empId;
  let assetId;
  let otherAssetId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), Department.init(), AssetCategory.init(), Asset.init(), Allocation.init(), MaintenanceRequest.init()]);

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
    
    // Create Employee
    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    empId = userRes.employee._id;
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Create Assets
    const cat = await AssetCategory.create({ name: 'Laptops' });
    const asset = await Asset.create({ name: 'MacBook', categoryId: cat._id, assetTag: 'AF-0001', lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED });
    assetId = asset._id;

    const otherAsset = await Asset.create({ name: 'Dell XPS', categoryId: cat._id, assetTag: 'AF-0002', lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE });
    otherAssetId = otherAsset._id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await MaintenanceRequest.deleteMany({});
    await Allocation.deleteMany({});
    await Asset.updateMany({ _id: assetId }, { lifecycleStatus: ASSET_LIFECYCLE.ALLOCATED });
    await Asset.updateMany({ _id: otherAssetId }, { lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE });
    
    // Setup initial allocation for emp
    await Allocation.create({
      assetId,
      employeeId: empId,
      status: ALLOCATION_STATUS.ACTIVE,
      allocationDate: new Date()
    });
  });

  describe('POST /api/maintenance', () => {
    test('should allow an employee to request maintenance for their asset', async () => {
      const res = await fetch(`${baseUrl}/maintenance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, issueDescription: 'Screen flickering', priority: MAINTENANCE_PRIORITY.HIGH })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.maintenance.status, MAINTENANCE_STATUS.PENDING);
    });

    test('should block an employee from requesting maintenance for an asset they do not hold', async () => {
      const res = await fetch(`${baseUrl}/maintenance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: otherAssetId, issueDescription: 'Broken keyboard' })
      });
      assert.strictEqual(res.status, 403);
    });

    test('should allow a manager to request maintenance for any asset', async () => {
      const res = await fetch(`${baseUrl}/maintenance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: otherAssetId, issueDescription: 'Battery replacement' })
      });
      assert.strictEqual(res.status, 201);
    });
  });

  describe('PATCH /api/maintenance/:id/approve', () => {
    let reqId;
    beforeEach(async () => {
      const req = await MaintenanceRequest.create({
        assetId,
        raisedBy: empId, // Mock user ID
        issueDescription: 'Broken',
        status: MAINTENANCE_STATUS.PENDING
      });
      reqId = req._id;
    });

    test('should allow Asset Manager to approve a maintenance request', async () => {
      const res = await fetch(`${baseUrl}/maintenance/${reqId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionNotes: 'Approved' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.maintenance.status, MAINTENANCE_STATUS.APPROVED);
      
      const updatedAsset = await Asset.findById(assetId);
      assert.strictEqual(updatedAsset.lifecycleStatus, ASSET_LIFECYCLE.UNDER_MAINTENANCE);
    });
  });

  describe('PATCH /api/maintenance/:id/reject', () => {
    let reqId;
    beforeEach(async () => {
      const req = await MaintenanceRequest.create({
        assetId,
        raisedBy: empId,
        issueDescription: 'Dusty',
        status: MAINTENANCE_STATUS.PENDING
      });
      reqId = req._id;
    });

    test('should allow Asset Manager to reject a maintenance request', async () => {
      const res = await fetch(`${baseUrl}/maintenance/${reqId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionNotes: 'Clean it yourself' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.maintenance.status, MAINTENANCE_STATUS.REJECTED);
      
      const updatedAsset = await Asset.findById(assetId);
      // Still Allocated, hasn't changed to Under Maintenance
      assert.strictEqual(updatedAsset.lifecycleStatus, ASSET_LIFECYCLE.ALLOCATED);
    });
  });

  describe('PATCH /api/maintenance/:id/resolve', () => {
    let reqId;
    beforeEach(async () => {
      const req = await MaintenanceRequest.create({
        assetId,
        raisedBy: empId,
        issueDescription: 'Broken',
        status: MAINTENANCE_STATUS.APPROVED
      });
      reqId = req._id;
    });

    test('should allow Asset Manager to resolve a maintenance request and restore asset status', async () => {
      const res = await fetch(`${baseUrl}/maintenance/${reqId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ workNotes: 'Fixed screen' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.maintenance.status, MAINTENANCE_STATUS.RESOLVED);
      
      // Asset had an active allocation, so it should go back to ALLOCATED
      const updatedAsset = await Asset.findById(assetId);
      assert.strictEqual(updatedAsset.lifecycleStatus, ASSET_LIFECYCLE.ALLOCATED);
    });
  });

  describe('PATCH /api/maintenance/:id/assign', () => {
    let reqId;
    beforeEach(async () => {
      const req = await MaintenanceRequest.create({
        assetId,
        raisedBy: empId,
        issueDescription: 'Broken screen',
        status: MAINTENANCE_STATUS.APPROVED
      });
      reqId = req._id;
    });

    test('should allow Asset Manager to assign a technician', async () => {
      const technicianUser = await User.findOne({ email: 'emp@test.com' });
      const res = await fetch(`${baseUrl}/maintenance/${reqId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTechnician: technicianUser._id })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.maintenance.status, MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED);
      assert.strictEqual(body.maintenance.assignedTechnician.toString(), technicianUser._id.toString());
    });
  });

  describe('PATCH /api/maintenance/:id/progress', () => {
    let reqId;
    let techToken;
    beforeEach(async () => {
      const technicianUser = await User.findOne({ email: 'emp@test.com' });
      techToken = empToken;

      const req = await MaintenanceRequest.create({
        assetId,
        raisedBy: empId,
        issueDescription: 'Broken screen',
        status: MAINTENANCE_STATUS.TECHNICIAN_ASSIGNED,
        assignedTechnician: technicianUser._id
      });
      reqId = req._id;
    });

    test('should allow the assigned technician to update progress', async () => {
      const res = await fetch(`${baseUrl}/maintenance/${reqId}/progress`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${techToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ workNotes: 'Diagnosed panel issue' })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.maintenance.status, MAINTENANCE_STATUS.IN_PROGRESS);
      assert.strictEqual(body.maintenance.workNotes, 'Diagnosed panel issue');
    });

    test('should block unauthorized users from updating progress', async () => {
      const userRes = await signupUser(baseUrl, { email: 'emp_other@test.com', password: 'password123', name: 'Other User' });
      const loginRes = await loginUser(baseUrl, { email: 'emp_other@test.com', password: 'password123' });
      const otherToken = loginRes.token;

      const res = await fetch(`${baseUrl}/maintenance/${reqId}/progress`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${otherToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ workNotes: 'Spying on progress' })
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('GET /api/maintenance', () => {
    beforeEach(async () => {
      await fetch(`${baseUrl}/maintenance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, issueDescription: 'Test request' })
      });
    });

    test('should list maintenance requests for an employee restricted to their own', async () => {
      const res = await fetch(`${baseUrl}/maintenance`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.total, 1);
    });
  });
});
