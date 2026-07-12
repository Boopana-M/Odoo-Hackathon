process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_report_test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, Department, AssetCategory, Asset, Allocation, ResourceBooking, MaintenanceRequest, AuditCycle, AuditItem, TransferRequest, ROLES } from '../src/models/index.js';

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

describe('Phase 15 — Reports and Dashboard Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let empToken;

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
      ResourceBooking.init(),
      MaintenanceRequest.init(),
      AuditCycle.init(),
      AuditItem.init(),
      TransferRequest.init()
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

    // Create Employee
    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Seed Data
    const dept = await Department.create({ name: 'Engineering' });
    const cat = await AssetCategory.create({ name: 'Laptops' });

    // Assets
    const a1 = await Asset.create({ name: 'Laptop A', categoryId: cat._id, assetTag: 'AF-4001', acquisitionCost: 1000, lifecycleStatus: 'Available' });
    const a2 = await Asset.create({ name: 'Laptop B', categoryId: cat._id, assetTag: 'AF-4002', acquisitionCost: 1500, lifecycleStatus: 'Allocated' });
    const a3 = await Asset.create({ name: 'Laptop C', categoryId: cat._id, assetTag: 'AF-4003', acquisitionCost: 2000, lifecycleStatus: 'Under Maintenance' });
    const a4 = await Asset.create({ name: 'Laptop D', categoryId: cat._id, assetTag: 'AF-4004', acquisitionCost: 1200, lifecycleStatus: 'Allocated' });

    // Active Allocation for a2 (to employee)
    const emp = await Employee.findOne({ userId: userRes.user._id });
    await Allocation.create({
      assetId: a2._id,
      employeeId: emp._id,
      status: 'Active',
      allocationDate: new Date(Date.now() - 5 * 86400000),
      expectedReturnDate: new Date(Date.now() - 2 * 86400000) // Overdue!
    });

    // Active Allocation for a4 (to department)
    await Allocation.create({
      assetId: a4._id,
      departmentId: dept._id,
      status: 'Active',
      allocationDate: new Date()
    });

    // Active Maintenance for a3
    await MaintenanceRequest.create({
      assetId: a3._id,
      raisedBy: userRes.user._id,
      issueDescription: 'Battery failure',
      status: 'Approved'
    });

    // Booking
    await ResourceBooking.create({
      assetId: a1._id,
      bookedBy: userRes.user._id,
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 7200000),
      status: 'Upcoming'
    });

    // Audit Discrepancies
    const cycle = await AuditCycle.create({
      title: 'Eng Audit',
      scopeType: 'Location',
      scopeLocation: 'Office A',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      auditors: [userRes.user._id],
      status: 'Open'
    });

    await AuditItem.create({
      auditCycleId: cycle._id,
      assetId: a1._id,
      verifiedBy: userRes.user._id,
      verificationResult: 'Missing',
      verifiedAt: new Date()
    });

    // Transfer
    await TransferRequest.create({
      assetId: a2._id,
      requestedBy: userRes.user._id,
      destinationEmployeeId: emp._id,
      status: 'Requested'
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  test('should return correct report and dashboard summary for manager', async () => {
    const res = await fetch(`${baseUrl}/reports/dashboard`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    
    // Total assets check
    assert.strictEqual(body.summary.assets.totalCount, 4);
    assert.strictEqual(body.summary.assets.totalValue, 5700);

    // Status distributions
    assert.strictEqual(body.summary.assets.byStatus['Available'], 1);
    assert.strictEqual(body.summary.assets.byStatus['Allocated'], 2);
    assert.strictEqual(body.summary.assets.byStatus['Under Maintenance'], 1);

    // Department allocation counts
    assert.strictEqual(body.summary.assets.byDepartment.length, 1);
    assert.strictEqual(body.summary.assets.byDepartment[0].departmentName, 'Engineering');
    assert.strictEqual(body.summary.assets.byDepartment[0].count, 1);

    // Allocation status
    assert.strictEqual(body.summary.allocations.activeCount, 2);
    assert.strictEqual(body.summary.allocations.overdueCount, 1);

    // Maintenance
    assert.strictEqual(body.summary.maintenance.activeCount, 1);

    // Bookings
    assert.strictEqual(body.summary.bookings.metrics['Upcoming'], 1);

    // Audits discrepancies
    assert.strictEqual(body.summary.audits.discrepancies.missing, 1);
    assert.strictEqual(body.summary.audits.discrepancies.damaged, 0);

    // Transfers
    assert.strictEqual(body.summary.transfers.totalCount, 1);
    assert.strictEqual(body.summary.transfers.pendingCount, 1);
  });

  test('should block normal employees from viewing dashboard summary', async () => {
    const res = await fetch(`${baseUrl}/reports/dashboard`, {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert.strictEqual(res.status, 403);
  });
});
