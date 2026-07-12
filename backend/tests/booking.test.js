process.env.MONGODB_URI = 'mongodb://localhost:27017/assetflow_booking_test';

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { User, Employee, AssetCategory, Asset, ResourceBooking, ROLES, BOOKING_STATUS } from '../src/models/index.js';

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

describe('Phase 11 — Resource Booking Workflow', () => {
  let server;
  let baseUrl;
  let managerToken;
  let empToken;
  let emp2Token;
  let empUserId;
  let emp2UserId;
  let bookableAssetId;
  let unbookableAssetId;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await mongoose.connection.db.dropDatabase();
    await Promise.all([User.init(), Employee.init(), AssetCategory.init(), Asset.init(), ResourceBooking.init()]);

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

    // Create Employee 1
    userRes = await signupUser(baseUrl, { email: 'emp@test.com', password: 'password123', name: 'Employee User' });
    empUserId = userRes.user._id;
    loginRes = await loginUser(baseUrl, { email: 'emp@test.com', password: 'password123' });
    empToken = loginRes.token;

    // Create Employee 2
    userRes = await signupUser(baseUrl, { email: 'emp2@test.com', password: 'password123', name: 'Employee Two' });
    emp2UserId = userRes.user._id;
    loginRes = await loginUser(baseUrl, { email: 'emp2@test.com', password: 'password123' });
    emp2Token = loginRes.token;

    // Create Category and Assets
    const cat = await AssetCategory.create({ name: 'Conference Rooms' });
    
    const sharedAsset = await Asset.create({
      name: 'Room A',
      categoryId: cat._id,
      assetTag: 'AF-1001',
      isSharedBookable: true
    });
    bookableAssetId = sharedAsset._id;

    const normalAsset = await Asset.create({
      name: 'Laptop X',
      categoryId: cat._id,
      assetTag: 'AF-1002',
      isSharedBookable: false
    });
    unbookableAssetId = normalAsset._id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await ResourceBooking.deleteMany({});
  });

  describe('POST /api/bookings', () => {
    test('should allow booking a shared/bookable asset', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: bookableAssetId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          purpose: 'Team sync'
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.ok(body.booking);
      assert.strictEqual(body.booking.purpose, 'Team sync');
      assert.strictEqual(body.booking.status, BOOKING_STATUS.UPCOMING);
    });

    test('should reject booking a non-shared asset', async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: unbookableAssetId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /not shared or bookable/i);
    });

    test('should reject booking where end time <= start time', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() - 1); // before start

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: bookableAssetId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
      });

      assert.strictEqual(res.status, 400);
    });

    test('should reject overlapping bookings', async () => {
      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() + 5);

      const start1 = new Date(baseTime);
      const end1 = new Date(baseTime);
      end1.setHours(end1.getHours() + 2); // 5 to 7

      // Create initial booking
      await ResourceBooking.create({
        assetId: bookableAssetId,
        bookedBy: empUserId,
        startTime: start1,
        endTime: end1,
        status: BOOKING_STATUS.UPCOMING
      });

      // Try overlapping booking: 6 to 8 (partially overlaps)
      const start2 = new Date(baseTime);
      start2.setHours(start2.getHours() + 1);
      const end2 = new Date(baseTime);
      end2.setHours(end2.getHours() + 3);

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${emp2Token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: bookableAssetId,
          startTime: start2.toISOString(),
          endTime: end2.toISOString()
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /overlap/i);
    });

    test('should allow back-to-back bookings', async () => {
      const baseTime = new Date();
      baseTime.setHours(baseTime.getHours() + 10);

      const start1 = new Date(baseTime);
      const end1 = new Date(baseTime);
      end1.setHours(end1.getHours() + 1); // 10 to 11

      await ResourceBooking.create({
        assetId: bookableAssetId,
        bookedBy: empUserId,
        startTime: start1,
        endTime: end1,
        status: BOOKING_STATUS.UPCOMING
      });

      // Try back to back booking: 11 to 12
      const start2 = new Date(baseTime);
      start2.setHours(start2.getHours() + 1);
      const end2 = new Date(baseTime);
      end2.setHours(end2.getHours() + 2);

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${emp2Token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: bookableAssetId,
          startTime: start2.toISOString(),
          endTime: end2.toISOString()
        })
      });

      assert.strictEqual(res.status, 201);
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    let bookingId;
    beforeEach(async () => {
      const start = new Date();
      start.setHours(start.getHours() + 1);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);

      const booking = await ResourceBooking.create({
        assetId: bookableAssetId,
        bookedBy: empUserId,
        startTime: start,
        endTime: end,
        status: BOOKING_STATUS.UPCOMING
      });
      bookingId = booking._id;
    });

    test('should allow creator to cancel their booking', async () => {
      const res = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${empToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Plans changed' })
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.booking.status, BOOKING_STATUS.CANCELLED);
      assert.strictEqual(body.booking.cancellationReason, 'Plans changed');
    });

    test('should block other employee from cancelling the booking', async () => {
      const res = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${emp2Token}` }
      });
      assert.strictEqual(res.status, 403);
    });

    test('should allow Asset Manager to cancel the booking', async () => {
      const res = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${managerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Room maintenance' })
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.booking.status, BOOKING_STATUS.CANCELLED);
    });

    test('cancelled booking should not block new bookings for the same time slot', async () => {
      // First cancel the active booking
      await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${empToken}` }
      });

      const booking = await ResourceBooking.findById(bookingId);
      const start = booking.startTime;
      const end = booking.endTime;

      // Rebook the same slot
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${emp2Token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: bookableAssetId,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      });

      assert.strictEqual(res.status, 201);
    });
  });
});
