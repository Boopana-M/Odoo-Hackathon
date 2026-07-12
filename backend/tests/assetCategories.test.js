// Phase 5 Asset Categories Tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_assetcategories_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, AssetCategory, ROLES } from '../src/models/index.js';

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

async function forceAdmin(userId) {
  await User.findByIdAndUpdate(userId, { role: ROLES.ADMIN });
}

// ── Test Suite ────────────────────────────────────────────────────────────────
describe('Phase 5 — Asset Categories', () => {
  let server;
  let baseUrl;
  let adminToken;
  let empToken;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), AssetCategory.init()]);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = BASE(port);
        resolve();
      });
    });
    
    // Create admin
    const { user: adminUser } = await signupUser(baseUrl, { email: 'admin@test.com', password: 'password123', name: 'Admin User' });
    await forceAdmin(adminUser._id);
    const { token: token1 } = await loginUser(baseUrl, { email: 'admin@test.com', password: 'password123' });
    adminToken = token1;
    
    // Create employee
    const { token: token2 } = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    empToken = token2;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await AssetCategory.deleteMany({});
  });

  describe('POST /api/asset-categories', () => {
    test('should allow Admin to create an asset category', async () => {
      const res = await fetch(`${baseUrl}/asset-categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Laptops',
          description: 'Company laptops',
          fieldDefinitions: [
            { key: 'ram', label: 'RAM (GB)', type: 'number', required: true }
          ]
        })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.category.name, 'Laptops');
      assert.strictEqual(body.category.fieldDefinitions.length, 1);
    });
    
    test('should prevent duplicate names', async () => {
      await AssetCategory.create({ name: 'Furniture' });
      await AssetCategory.syncIndexes();
      
      const res = await fetch(`${baseUrl}/asset-categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Furniture' })
      });
      assert.strictEqual(res.status, 409);
    });

    test('should prevent duplicate keys in field definitions', async () => {
      const res = await fetch(`${baseUrl}/asset-categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Desktops',
          fieldDefinitions: [
            { key: 'cpu', label: 'CPU', type: 'string', required: true },
            { key: 'CPU', label: 'Processor', type: 'string', required: true } // duplicate key ignoring case
          ]
        })
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /Duplicate custom field keys/i);
    });
    
    test('should reject non-admin users', async () => {
      const res = await fetch(`${baseUrl}/asset-categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Printers' })
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('GET /api/asset-categories', () => {
    beforeEach(async () => {
       await AssetCategory.create({ name: 'Active Cat', isActive: true });
       await AssetCategory.create({ name: 'Inactive Cat', isActive: false });
    });
    
    test('should list all categories for authenticated users', async () => {
       const res = await fetch(`${baseUrl}/asset-categories`, {
         headers: { Authorization: `Bearer ${empToken}` }
       });
       const body = await res.json();
       assert.strictEqual(res.status, 200);
       assert.strictEqual(body.total, 2);
    });
    
    test('should filter by isActive', async () => {
       const res = await fetch(`${baseUrl}/asset-categories?isActive=true`, {
         headers: { Authorization: `Bearer ${empToken}` }
       });
       const body = await res.json();
       assert.strictEqual(res.status, 200);
       assert.strictEqual(body.total, 1);
       assert.strictEqual(body.categories[0].name, 'Active Cat');
    });
  });

  describe('PUT /api/asset-categories/:id', () => {
    let catId;
    beforeEach(async () => {
      const cat = await AssetCategory.create({ name: 'Phones' });
      catId = cat._id;
    });

    test('should allow Admin to update category details and toggle status', async () => {
      const res = await fetch(`${baseUrl}/asset-categories/${catId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Smartphones', isActive: false })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.category.name, 'Smartphones');
      assert.strictEqual(body.category.isActive, false);
    });
  });
});
