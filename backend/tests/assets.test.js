// Phase 6 Assets Tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_assets_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, AssetCategory, Asset, ROLES, ASSET_LIFECYCLE } from '../src/models/index.js';

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
describe('Phase 6 — Assets Core', () => {
  let server;
  let baseUrl;
  let adminToken;
  let managerToken;
  let empToken;
  let laptopCategory;
  let simpleCategory;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), AssetCategory.init(), Asset.init()]);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = BASE(port);
        resolve();
      });
    });
    
    // Create admin
    let userRes = await signupUser(baseUrl, { email: 'admin@test.com', password: 'password123', name: 'Admin User' });
    await forceRole(userRes.user._id, ROLES.ADMIN);
    let loginRes = await loginUser(baseUrl, { email: 'admin@test.com', password: 'password123' });
    adminToken = loginRes.token;

    // Create asset manager
    userRes = await signupUser(baseUrl, { email: 'manager@test.com', password: 'password123', name: 'Asset Manager' });
    await forceRole(userRes.user._id, ROLES.ASSET_MANAGER);
    loginRes = await loginUser(baseUrl, { email: 'manager@test.com', password: 'password123' });
    managerToken = loginRes.token;
    
    // Create employee
    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Setup Categories
    laptopCategory = await AssetCategory.create({
      name: 'Laptops',
      fieldDefinitions: [
        { key: 'ram_gb', label: 'RAM (GB)', type: 'number', required: true },
        { key: 'is_touch', label: 'Touchscreen', type: 'boolean', required: false },
        { key: 'purchase_date', label: 'Purchase Date', type: 'date', required: false }
      ]
    });

    simpleCategory = await AssetCategory.create({
      name: 'Misc',
      fieldDefinitions: []
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Asset.deleteMany({});
  });

  describe('POST /api/assets', () => {
    test('should allow Asset Manager to create an asset with valid custom fields', async () => {
      const res = await fetch(`${baseUrl}/assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'MacBook Pro',
          categoryId: laptopCategory._id,
          serialNumber: 'SN-12345',
          customFields: {
            ram_gb: '16',
            is_touch: true,
            purchase_date: '2023-01-01'
          }
        })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.asset.name, 'MacBook Pro');
      assert.strictEqual(body.asset.lifecycleStatus, ASSET_LIFECYCLE.AVAILABLE);
      assert.match(body.asset.assetTag, /^AF-\d{4}$/);
      assert.strictEqual(body.asset.customFields.ram_gb, 16);
      assert.strictEqual(body.asset.customFields.is_touch, true);
    });

    test('should auto-increment asset tag', async () => {
      await Asset.create({ name: 'A1', categoryId: simpleCategory._id, assetTag: 'AF-0010' });
      
      const res = await fetch(`${baseUrl}/assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'A2', categoryId: simpleCategory._id })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.asset.assetTag, 'AF-0011');
    });

    test('should reject missing required custom fields', async () => {
      const res = await fetch(`${baseUrl}/assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'MacBook Air',
          categoryId: laptopCategory._id,
          customFields: { is_touch: false } // Missing ram_gb
        })
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(JSON.stringify(body.error.details), /RAM \(GB\)/);
    });
    
    test('should reject invalid custom field types', async () => {
      const res = await fetch(`${baseUrl}/assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'MacBook Air',
          categoryId: laptopCategory._id,
          customFields: { ram_gb: 'sixteen' } // Invalid number
        })
      });
      assert.strictEqual(res.status, 400);
    });
    
    test('should reject creation by regular Employee', async () => {
      const res = await fetch(`${baseUrl}/assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Monitor', categoryId: simpleCategory._id })
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('GET /api/assets', () => {
    beforeEach(async () => {
      await Asset.create({ name: 'Asset 1', categoryId: simpleCategory._id, assetTag: 'AF-0001', lifecycleStatus: ASSET_LIFECYCLE.AVAILABLE, isSharedBookable: true });
      await Asset.create({ name: 'Asset 2', categoryId: simpleCategory._id, assetTag: 'AF-0002', lifecycleStatus: ASSET_LIFECYCLE.UNDER_MAINTENANCE });
    });

    test('should list assets based on role filtering', async () => {
      // Employee should see only AVAILABLE (or ALLOCATED)
      const empRes = await fetch(`${baseUrl}/assets`, {
        headers: { Authorization: `Bearer ${empToken}` }
      });
      const empBody = await empRes.json();
      assert.strictEqual(empRes.status, 200);
      assert.strictEqual(empBody.total, 1);
      assert.strictEqual(empBody.assets[0].name, 'Asset 1');

      // Admin/Manager should see all
      const mgrRes = await fetch(`${baseUrl}/assets`, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      const mgrBody = await mgrRes.json();
      assert.strictEqual(mgrBody.total, 2);
    });
  });

  describe('PUT /api/assets/:id', () => {
    let assetId;
    beforeEach(async () => {
      const asset = await Asset.create({ 
        name: 'Old Laptop', 
        categoryId: laptopCategory._id, 
        assetTag: 'AF-0999',
        customFields: { ram_gb: 8 }
      });
      assetId = asset._id;
    });

    test('should update asset and validate partial custom fields', async () => {
      const res = await fetch(`${baseUrl}/assets/${assetId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Upgraded Laptop',
          customFields: { ram_gb: 16 } // Keeping it valid
        })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.asset.name, 'Upgraded Laptop');
      assert.strictEqual(body.asset.customFields.ram_gb, 16);
    });
  });
});
