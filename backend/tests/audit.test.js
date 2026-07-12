process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_audit_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, Department, AssetCategory, Asset, Allocation, AuditCycle, AuditItem, ROLES, AUDIT_STATUS, AUDIT_SCOPE_TYPE, VERIFICATION_RESULT, ASSET_LIFECYCLE, ALLOCATION_STATUS } from '../src/models/index.js';

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

describe('Phase 13 — Asset Audit Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let auditorToken;
  let empToken;
  let auditorUserId;
  let empUserId;
  let departmentId;
  let catId;
  let inScopeAssetId;
  let outOfScopeAssetId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([
      User.init(),
      Employee.init(),
      Department.init(),
      AssetCategory.init(),
      Asset.init(),
      Allocation.init(),
      AuditCycle.init(),
      AuditItem.init()
    ]);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = BASE(port);
        resolve();
      });
    });

    // Create Manager
    let userRes = await signupUser(baseUrl, { email: 'manager@test.com', password: 'password123', name: 'Asset Manager' });
    await forceRole(userRes.user._id, ROLES.ASSET_MANAGER);
    let loginRes = await loginUser(baseUrl, { email: 'manager@test.com', password: 'password123' });
    managerToken = loginRes.token;

    // Create Auditor (Employee role but will be added as auditor)
    userRes = await signupUser(baseUrl, { email: 'auditor@test.com', password: 'password123', name: 'Auditor User' });
    auditorUserId = userRes.user._id;
    loginRes = await loginUser(baseUrl, { email: 'auditor@test.com', password: 'password123' });
    auditorToken = loginRes.token;

    // Create Normal Employee
    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Normal Employee' });
    empUserId = userRes.user._id;
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Create Department
    const dept = await Department.create({ name: 'Engineering' });
    departmentId = dept._id;

    // Create Category
    const cat = await AssetCategory.create({ name: 'Hardware' });
    catId = cat._id;

    // Create Assets
    const inScopeAsset = await Asset.create({
      name: 'MacBook Pro',
      categoryId: catId,
      assetTag: 'AF-2001',
      location: 'Office A'
    });
    inScopeAssetId = inScopeAsset._id;

    const outOfScopeAsset = await Asset.create({
      name: 'Dell Server',
      categoryId: catId,
      assetTag: 'AF-2002',
      location: 'Office B'
    });
    outOfScopeAssetId = outOfScopeAsset._id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await AuditCycle.deleteMany({});
    await AuditItem.deleteMany({});
    await Allocation.deleteMany({});
    await Asset.findByIdAndUpdate(inScopeAssetId, { lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE });
  });

  describe('POST /api/audits', () => {
    test('should allow Asset Manager to create a department-scoped audit cycle', async () => {
      const res = await fetch(`${baseUrl}/audits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Q3 Eng Audit',
          scopeType: AUDIT_SCOPE_TYPE.DEPARTMENT,
          scopeDepartmentId: departmentId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          auditors: [auditorUserId]
        })
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.cycle.title, 'Q3 Eng Audit');
      assert.strictEqual(body.cycle.status, AUDIT_STATUS.PLANNED);
    });

    test('should reject creation if end date is before start date', async () => {
      const res = await fetch(`${baseUrl}/audits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Invalid Date Audit',
          scopeType: AUDIT_SCOPE_TYPE.LOCATION,
          scopeLocation: 'Office A',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() - 86400000).toISOString(),
          auditors: [auditorUserId]
        })
      });

      assert.strictEqual(res.status, 400);
    });
  });

  describe('POST /api/audits/:cycleId/verify', () => {
    let cycleId;
    beforeEach(async () => {
      const cycle = await AuditCycle.create({
        title: 'Location Audit A',
        scopeType: AUDIT_SCOPE_TYPE.LOCATION,
        scopeLocation: 'Office A',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        auditors: [auditorUserId],
        status: AUDIT_STATUS.OPEN
      });
      cycleId = cycle._id;
    });

    test('should allow assigned auditor to verify an in-scope asset', async () => {
      const res = await fetch(`${baseUrl}/audits/${cycleId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auditorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: inScopeAssetId,
          verificationResult: VERIFICATION_RESULT.VERIFIED,
          notes: 'Asset is on desk'
        })
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.auditItem.verificationResult, VERIFICATION_RESULT.VERIFIED);
    });

    test('should block non-auditor employee from verifying an asset', async () => {
      const res = await fetch(`${baseUrl}/audits/${cycleId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: inScopeAssetId,
          verificationResult: VERIFICATION_RESULT.VERIFIED
        })
      });

      assert.strictEqual(res.status, 403);
    });

    test('should reject verification if asset is out of scope (location mismatch)', async () => {
      const res = await fetch(`${baseUrl}/audits/${cycleId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auditorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: outOfScopeAssetId,
          verificationResult: VERIFICATION_RESULT.VERIFIED
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /not in scope/i);
    });
  });

  describe('PATCH /api/audits/:id/close', () => {
    let cycleId;
    beforeEach(async () => {
      const cycle = await AuditCycle.create({
        title: 'Q3 Eng Audit',
        scopeType: AUDIT_SCOPE_TYPE.LOCATION,
        scopeLocation: 'Office A',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        auditors: [auditorUserId],
        status: AUDIT_STATUS.OPEN
      });
      cycleId = cycle._id;

      // Allocate asset to verify allocation closure on Lost
      const empProfile = await Employee.findOne({ userId: empUserId });

      await Allocation.create({
        assetId: inScopeAssetId,
        employeeId: empProfile._id,
        status: ALLOCATION_STATUS.ACTIVE,
        allocationDate: new Date()
      });

      // Auditor marks inScopeAsset as Missing
      await AuditItem.create({
        auditCycleId: cycleId,
        assetId: inScopeAssetId,
        verifiedBy: auditorUserId,
        verificationResult: VERIFICATION_RESULT.MISSING,
        verifiedAt: new Date()
      });
    });

    test('should allow Asset Manager to close audit and process outcomes (missing asset -> Lost)', async () => {
      const res = await fetch(`${baseUrl}/audits/${cycleId}/close`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}` }
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.cycle.status, AUDIT_STATUS.CLOSED);

      // Verify the missing asset is now Lost
      const asset = await Asset.findById(inScopeAssetId);
      assert.strictEqual(asset.lifecycleStatus, ASSET_LIFECYCLE.LOST);

      // Verify the active allocation was closed
      const alloc = await Allocation.findOne({ assetId: inScopeAssetId });
      assert.strictEqual(alloc.status, ALLOCATION_STATUS.RETURNED);
    });
  });
});
