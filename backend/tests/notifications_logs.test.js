process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_notification_log_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, AssetCategory, Asset, Allocation, Notification, ActivityLog, ROLES } from '../src/models/index.js';

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

describe('Phase 14 — Notifications and Activity Logs Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let empToken;
  let empUserId;
  let empProfileId;
  let assetId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([
      User.init(),
      Employee.init(),
      AssetCategory.init(),
      Asset.init(),
      Allocation.init(),
      Notification.init(),
      ActivityLog.init()
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
    empUserId = userRes.user._id;
    empProfileId = userRes.employee._id;
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Create Category and Asset
    const cat = await AssetCategory.create({ name: 'Laptops' });
    const asset = await Asset.create({
      name: 'ThinkPad',
      categoryId: cat._id,
      assetTag: 'AF-3001'
    });
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
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    await Allocation.deleteMany({});
    await Asset.findByIdAndUpdate(assetId, { lifecycleStatus: 'Available' });
  });

  test('should trigger notification and log on asset allocation', async () => {
    // 1. Allocate asset
    const allocRes = await fetch(`${baseUrl}/allocations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        employeeId: empProfileId
      })
    });
    assert.strictEqual(allocRes.status, 201);

    // 2. Verify Activity Log exists (fetched as manager/admin)
    const logRes = await fetch(`${baseUrl}/activity-logs`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const logBody = await logRes.json();
    assert.strictEqual(logRes.status, 200);
    assert.strictEqual(logBody.total, 1);
    assert.strictEqual(logBody.logs[0].action, 'asset.allocated');

    // 3. Verify Notification exists for the employee
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    const notifBody = await notifRes.json();
    assert.strictEqual(notifRes.status, 200);
    assert.strictEqual(notifBody.total, 1);
    assert.strictEqual(notifBody.notifications[0].type, 'Asset Assigned');
    assert.strictEqual(notifBody.notifications[0].isRead, false);

    // 4. Mark notification as read
    const notifId = notifBody.notifications[0]._id;
    const readRes = await fetch(`${baseUrl}/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert.strictEqual(readRes.status, 200);
    const readBody = await readRes.json();
    assert.strictEqual(readBody.notification.isRead, true);
    assert.ok(readBody.notification.readAt);
  });
});
