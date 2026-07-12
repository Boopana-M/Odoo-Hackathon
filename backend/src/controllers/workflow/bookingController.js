import { Asset, ResourceBooking, BOOKING_STATUS, Employee, ROLES } from '../../models/index.js';
import { logActivity } from '../../utils/logger.js';
import { createNotification } from '../../utils/notifier.js';

// ── Create Resource Booking ──────────────────────────────────────────────────
/**
 * POST /api/bookings
 * Auth user. Can book shared/bookable assets.
 */
export const createBooking = async (req, res) => {
  try {
    const { assetId, startTime, endTime, purpose } = req.body;

    if (!assetId || !startTime || !endTime) {
      return res.status(400).json({ error: { message: 'Asset ID, startTime, and endTime are required.' } });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: { message: 'Invalid date format.' } });
    }

    if (end <= start) {
      return res.status(400).json({ error: { message: 'Booking end time must be after the start time.' } });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ error: { message: 'Asset not found.' } });
    }

    if (!asset.isSharedBookable) {
      return res.status(400).json({ error: { message: 'Asset is not shared or bookable.' } });
    }

    // Check overlaps: existing.startTime < requested.endTime AND existing.endTime > requested.startTime
    // and status is not Cancelled.
    const overlappingBooking = await ResourceBooking.findOne({
      assetId,
      status: { $ne: BOOKING_STATUS.CANCELLED },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlappingBooking) {
      return res.status(400).json({ error: { message: 'Booking overlaps with an existing booking for this resource.' } });
    }

    // Find employee profile to link departmentId and employeeId if available
    const employee = await Employee.findOne({ userId: req.user._id });

    const booking = new ResourceBooking({
      assetId,
      bookedBy: req.user._id,
      bookedByEmployee: employee ? employee._id : null,
      departmentId: employee ? employee.departmentId : null,
      startTime: start,
      endTime: end,
      purpose: purpose ? String(purpose).trim() : '',
      status: BOOKING_STATUS.UPCOMING
    });

    await booking.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'booking.created',
      entityType: 'ResourceBooking',
      entityId: booking._id,
      metadata: { assetId, startTime: start, endTime: end }
    });

    await createNotification({
      recipientUserId: req.user._id,
      type: 'Booking Confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for ${asset.name} has been confirmed.`,
      relatedEntityType: 'ResourceBooking',
      relatedEntityId: booking._id
    });

    return res.status(201).json({ message: 'Booking created successfully.', booking });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to create booking.' } });
  }
};

// ── List Resource Bookings ───────────────────────────────────────────────────
/**
 * GET /api/bookings
 * Auth user.
 */
export const listBookings = async (req, res) => {
  try {
    const { assetId, status, bookedBy } = req.query;
    const filter = {};

    if (assetId) filter.assetId = assetId;
    if (status) filter.status = status;
    if (bookedBy) filter.bookedBy = bookedBy;

    const bookings = await ResourceBooking.find(filter)
      .populate('assetId', 'name assetTag serialNumber')
      .populate('bookedBy', 'email')
      .populate('bookedByEmployee', 'name')
      .populate('departmentId', 'name')
      .sort({ startTime: 1 });

    return res.status(200).json({ bookings, total: bookings.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to list bookings.' } });
  }
};

// ── Get Booking Detail ───────────────────────────────────────────────────────
/**
 * GET /api/bookings/:id
 * Auth user.
 */
export const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await ResourceBooking.findById(id)
      .populate('assetId', 'name assetTag serialNumber')
      .populate('bookedBy', 'email')
      .populate('bookedByEmployee', 'name')
      .populate('departmentId', 'name');

    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found.' } });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to retrieve booking.' } });
  }
};

// ── Cancel Booking ───────────────────────────────────────────────────────────
/**
 * PATCH /api/bookings/:id/cancel
 * Auth user. (Creator of booking or Admin/Asset Manager)
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await ResourceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: { message: 'Booking not found.' } });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({ error: { message: 'Booking is already cancelled.' } });
    }

    const isOwner = booking.bookedBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === ROLES.ADMIN || req.user.role === ROLES.ASSET_MANAGER;

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: { message: 'You are not authorized to cancel this booking.' } });
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    booking.cancellationReason = cancellationReason ? String(cancellationReason).trim() : '';

    await booking.save();

    await logActivity({
      actorUserId: req.user._id,
      action: 'booking.cancelled',
      entityType: 'ResourceBooking',
      entityId: booking._id
    });

    await createNotification({
      recipientUserId: booking.bookedBy,
      type: 'Booking Cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for resource has been cancelled.`,
      relatedEntityType: 'ResourceBooking',
      relatedEntityId: booking._id
    });

    return res.status(200).json({ message: 'Booking cancelled successfully.', booking });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to cancel booking.' } });
  }
};
