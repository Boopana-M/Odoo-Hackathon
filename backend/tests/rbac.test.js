// Phase 3 RBAC Tests — Users and Role Management
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_rbac_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, ROLES } from '../src/models/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = (port) => `http://localhost:${port}/api`;

/** Register a user via the public signup endpoint and return { token, user, employee } */
async function signupUser(baseUrl, { email, password, name }) {
  const res = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  return res.json();
}

/** Login and return token */
async function loginUser(baseUrl, { email, password }) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

/** Force a user to Admin role directly in DB (only way to get an Admin in tests) */
async function forceAdmin(userId) {
  await User.findByIdAndUpdate(userId, { role: ROLES.ADMIN });
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Phase 3 — Users and RBAC', () => {
  let server;
  let baseUrl;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init()]);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = BASE(port);
        resolve();
      });
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
    await User.deleteMany({});
    await Employee.deleteMany({});
  });

  // ── requireRole middleware ─────────────────────────────────────────────────

  describe('requireRole middleware', () => {
    test('should reject unauthenticated requests to /api/users', async () => {
      const res = await fetch(`${baseUrl}/users`);
      assert.strictEqual(res.status, 401);
    });

    test('should reject non-Admin users from /api/users', async () => {
      const { token } = await signupUser(baseUrl, {
        email: 'employee@test.com',
        password: 'password123',
        name: 'Emp One'
      });

      const res = await fetch(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(res.status, 403);
    });

    test('should allow Admin users to access /api/users', async () => {
      const { user, token: empToken } = await signupUser(baseUrl, {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin User'
      });
      await forceAdmin(user._id);

      // Re-login to get a fresh token with Admin role
      const { token } = await loginUser(baseUrl, {
        email: 'admin@test.com',
        password: 'password123'
      });

      const res = await fetch(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(res.status, 200);
    });
  });

  // ── GET /api/users ─────────────────────────────────────────────────────────

  describe('GET /api/users', () => {
    let adminToken;

    beforeEach(async () => {
      const { user } = await signupUser(baseUrl, {
        email: 'admin2@test.com',
        password: 'password123',
        name: 'Admin Two'
      });
      await forceAdmin(user._id);
      const { token } = await loginUser(baseUrl, {
        email: 'admin2@test.com',
        password: 'password123'
      });
      adminToken = token;
    });

    test('should list all users with employee profiles', async () => {
      await signupUser(baseUrl, {
        email: 'emp1@test.com',
        password: 'password123',
        name: 'Employee One'
      });

      const res = await fetch(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(body.users));
      assert.ok(body.total >= 2); // admin + emp1
      assert.ok(body.users[0].user);
      assert.ok('employee' in body.users[0]);
    });

    test('should filter by role query param', async () => {
      await signupUser(baseUrl, {
        email: 'emp2@test.com',
        password: 'password123',
        name: 'Employee Two'
      });

      const res = await fetch(`${baseUrl}/users?role=Employee`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      // All returned users must be Employees
      for (const { user } of body.users) {
        assert.strictEqual(user.role, ROLES.EMPLOYEE);
      }
    });
  });

  // ── GET /api/users/:id ────────────────────────────────────────────────────

  describe('GET /api/users/:id', () => {
    let adminToken;

    beforeEach(async () => {
      const { user } = await signupUser(baseUrl, {
        email: 'admin3@test.com',
        password: 'password123',
        name: 'Admin Three'
      });
      await forceAdmin(user._id);
      const { token } = await loginUser(baseUrl, {
        email: 'admin3@test.com',
        password: 'password123'
      });
      adminToken = token;
    });

    test('should return a user by ID with employee profile', async () => {
      const { user: emp } = await signupUser(baseUrl, {
        email: 'target@test.com',
        password: 'password123',
        name: 'Target User'
      });

      const res = await fetch(`${baseUrl}/users/${emp._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.user._id, emp._id);
      assert.strictEqual(body.employee.name, 'Target User');
    });

    test('should return 404 for unknown user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await fetch(`${baseUrl}/users/${fakeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 404);
    });
  });

  // ── PATCH /api/users/:id/role ─────────────────────────────────────────────

  describe('PATCH /api/users/:id/role — Role Promotion & Demotion', () => {
    let adminToken;
    let adminId;
    let targetUser;

    beforeEach(async () => {
      const { user } = await signupUser(baseUrl, {
        email: 'admin4@test.com',
        password: 'password123',
        name: 'Admin Four'
      });
      adminId = user._id;
      await forceAdmin(user._id);
      const { token } = await loginUser(baseUrl, {
        email: 'admin4@test.com',
        password: 'password123'
      });
      adminToken = token;

      const { user: emp } = await signupUser(baseUrl, {
        email: 'promo@test.com',
        password: 'password123',
        name: 'Promo Target'
      });
      targetUser = emp;
    });

    test('should promote an Employee to Asset Manager', async () => {
      const res = await fetch(`${baseUrl}/users/${targetUser._id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: ROLES.ASSET_MANAGER })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.user.role, ROLES.ASSET_MANAGER);
    });

    test('should promote an Employee to Department Head', async () => {
      const res = await fetch(`${baseUrl}/users/${targetUser._id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: ROLES.DEPARTMENT_HEAD })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.user.role, ROLES.DEPARTMENT_HEAD);
    });

    test('should demote an Asset Manager back to Employee', async () => {
      // First promote
      await User.findByIdAndUpdate(targetUser._id, { role: ROLES.ASSET_MANAGER });

      const res = await fetch(`${baseUrl}/users/${targetUser._id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: ROLES.EMPLOYEE })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.user.role, ROLES.EMPLOYEE);
    });

    test('should block Admin role assignment via this endpoint', async () => {
      const res = await fetch(`${baseUrl}/users/${targetUser._id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: ROLES.ADMIN })
      });
      assert.strictEqual(res.status, 403);
    });

    test('should prevent Admin from changing their own role', async () => {
      const res = await fetch(`${baseUrl}/users/${adminId}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: ROLES.EMPLOYEE })
      });
      assert.strictEqual(res.status, 403);
    });

    test('should reject role update without role field', async () => {
      const res = await fetch(`${baseUrl}/users/${targetUser._id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
    });
  });

  // ── PATCH /api/users/:id/status ───────────────────────────────────────────

  describe('PATCH /api/users/:id/status — Active / Inactive', () => {
    let adminToken;
    let adminId;
    let targetUser;

    beforeEach(async () => {
      const { user } = await signupUser(baseUrl, {
        email: 'admin5@test.com',
        password: 'password123',
        name: 'Admin Five'
      });
      adminId = user._id;
      await forceAdmin(user._id);
      const { token } = await loginUser(baseUrl, {
        email: 'admin5@test.com',
        password: 'password123'
      });
      adminToken = token;

      const { user: emp } = await signupUser(baseUrl, {
        email: 'status@test.com',
        password: 'password123',
        name: 'Status Target'
      });
      targetUser = emp;
    });

    test('should deactivate an Employee account', async () => {
      const res = await fetch(`${baseUrl}/users/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: false })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.user.isActive, false);
    });

    test('should reactivate a deactivated Employee account', async () => {
      await User.findByIdAndUpdate(targetUser._id, { isActive: false });

      const res = await fetch(`${baseUrl}/users/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: true })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.user.isActive, true);
    });

    test('should prevent Admin from deactivating themselves', async () => {
      const res = await fetch(`${baseUrl}/users/${adminId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: false })
      });
      assert.strictEqual(res.status, 403);
    });

    test('should reject non-boolean isActive value', async () => {
      const res = await fetch(`${baseUrl}/users/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: 'yes' })
      });
      assert.strictEqual(res.status, 400);
    });

    test('deactivated user token should be rejected by authenticate middleware', async () => {
      // Get token for the target user
      const { token: targetToken } = await loginUser(baseUrl, {
        email: 'status@test.com',
        password: 'password123'
      });

      // Admin deactivates the user
      await fetch(`${baseUrl}/users/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: false })
      });

      // Deactivated user's token is now rejected
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${targetToken}` }
      });
      assert.strictEqual(meRes.status, 401);
    });
  });
});
