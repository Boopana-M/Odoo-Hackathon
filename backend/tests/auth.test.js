// Set test environment database to local MongoDB test collection
process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_auth_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, ROLES } from '../src/models/index.js';

describe('Authentication and Authorization (BE-1 Phase 2)', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    // Drop database to ensure a clean state for index compilation
    await mongoose.connection.db.dropDatabase();

    // Ensure all model indexes are built before starting tests
    await Promise.all([
      User.init(),
      Employee.init()
    ]);

    // Start Express app on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api/auth`;
        resolve();
      });
    });
  });

  after(async () => {
    // Close HTTP server and drop test database
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    // Reset database state
    await User.deleteMany({});
    await Employee.deleteMany({});
  });

  describe('POST /signup', () => {
    test('should register a user, create an Employee profile, and return a JWT', async () => {
      const response = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jane.doe@example.com',
          password: 'password123',
          name: 'Jane Doe'
        })
      });

      const body = await response.json();

      assert.strictEqual(response.status, 201);
      assert.ok(body.token);
      assert.strictEqual(body.user.email, 'jane.doe@example.com');
      assert.strictEqual(body.user.role, ROLES.EMPLOYEE);
      assert.strictEqual(body.employee.name, 'Jane Doe');
      
      // Ensure password hash was not leaked
      assert.strictEqual(body.user.password, undefined);

      // Verify Employee is linked to User
      assert.strictEqual(body.employee.userId, body.user._id);
    });

    test('should fail if required fields are missing', async () => {
      const response = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jane.doe@example.com' // missing password and name
        })
      });

      assert.strictEqual(response.status, 400);
      const body = await response.json();
      assert.match(body.error.message, /required/i);
    });

    test('should prevent self-role promotion during registration', async () => {
      const response = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hacker@example.com',
          password: 'password123',
          name: 'Super Hacker',
          role: ROLES.ADMIN // Attempting self-promotion
        })
      });

      const body = await response.json();
      assert.strictEqual(response.status, 201);
      assert.strictEqual(body.user.role, ROLES.EMPLOYEE); // Must still be Employee
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Seed user and employee
      const response = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.smith@example.com',
          password: 'secretpassword',
          name: 'John Smith'
        })
      });
      if (response.status !== 201) {
        const text = await response.text();
        console.error('SEED SIGNUP ERROR in login tests:', response.status, text);
      }
    });

    test('should successfully authenticate and return token', async () => {
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.smith@example.com',
          password: 'secretpassword'
        })
      });

      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.ok(body.token);
      assert.strictEqual(body.user.email, 'john.smith@example.com');
      assert.strictEqual(body.employee.name, 'John Smith');
    });

    test('should reject incorrect password', async () => {
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.smith@example.com',
          password: 'wrongpassword'
        })
      });

      assert.strictEqual(response.status, 401);
      const body = await response.json();
      assert.match(body.error.message, /invalid/i);
    });

    test('should reject deactivated users', async () => {
      // Deactivate user manually
      await User.findOneAndUpdate(
        { email: 'john.smith@example.com' },
        { isActive: false }
      );

      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.smith@example.com',
          password: 'secretpassword'
        })
      });

      assert.strictEqual(response.status, 401);
      const body = await response.json();
      assert.match(body.error.message, /deactivated/i);
    });
  });

  describe('GET /me', () => {
    let token;

    beforeEach(async () => {
      const response = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'me@example.com',
          password: 'password123',
          name: 'Me Myself'
        })
      });
      const body = await response.json();
      token = body.token;
    });

    test('should reject unauthorized profile requests', async () => {
      const response = await fetch(`${baseUrl}/me`, {
        method: 'GET'
      });

      assert.strictEqual(response.status, 401);
    });

    test('should return current user and employee profile for authorized request', async () => {
      const response = await fetch(`${baseUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      assert.strictEqual(response.status, 200);
      const body = await response.json();
      assert.strictEqual(body.user.email, 'me@example.com');
      assert.strictEqual(body.employee.name, 'Me Myself');
    });
  });
});
