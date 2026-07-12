// Phase 4 Departments Tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_departments_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, Department, ROLES } from '../src/models/index.js';

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
describe('Phase 4 — Departments', () => {
  let server;
  let baseUrl;
  let adminToken;
  let empToken;
  let headEmployeeId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), Department.init()]);

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
    const { user: empUser, employee } = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    const { token: token2 } = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = token2;
    headEmployeeId = employee._id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Department.deleteMany({});
  });

  describe('POST /api/departments', () => {
    test('should allow Admin to create a department', async () => {
      const res = await fetch(`${baseUrl}/departments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'IT Department', departmentHeadId: headEmployeeId })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.department.name, 'IT Department');
      assert.strictEqual(body.department.departmentHeadId.toString(), headEmployeeId.toString());
    });
    
    test('should prevent duplicate names', async () => {
      await Department.create({ name: 'HR' });
      await Department.syncIndexes();
      
      const res = await fetch(`${baseUrl}/departments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'HR' })
      });
      assert.strictEqual(res.status, 409);
    });
    
    test('should reject non-admin users', async () => {
      const res = await fetch(`${baseUrl}/departments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Sales' })
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('GET /api/departments', () => {
    beforeEach(async () => {
       await Department.create({ name: 'Active Dept', isActive: true });
       await Department.create({ name: 'Inactive Dept', isActive: false });
    });
    
    test('should list all departments for authenticated users', async () => {
       const res = await fetch(`${baseUrl}/departments`, {
         headers: { Authorization: `Bearer ${empToken}` }
       });
       const body = await res.json();
       assert.strictEqual(res.status, 200);
       assert.strictEqual(body.total, 2);
    });
    
    test('should filter by isActive', async () => {
       const res = await fetch(`${baseUrl}/departments?isActive=true`, {
         headers: { Authorization: `Bearer ${empToken}` }
       });
       const body = await res.json();
       assert.strictEqual(res.status, 200);
       assert.strictEqual(body.total, 1);
       assert.strictEqual(body.departments[0].name, 'Active Dept');
    });
  });

  describe('PUT /api/departments/:id', () => {
    let deptId;
    beforeEach(async () => {
      const dept = await Department.create({ name: 'Finance' });
      deptId = dept._id;
    });

    test('should allow Admin to update department details and toggle status', async () => {
      const res = await fetch(`${baseUrl}/departments/${deptId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Global Finance', isActive: false })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.department.name, 'Global Finance');
      assert.strictEqual(body.department.isActive, false);
    });
    
    test('should prevent self-parenting', async () => {
      const res = await fetch(`${baseUrl}/departments/${deptId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentDepartmentId: deptId })
      });
      assert.strictEqual(res.status, 400);
    });
  });
});
