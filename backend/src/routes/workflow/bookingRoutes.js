import express from 'express';
import {
  createBooking,
  listBookings,
  getBookingDetail,
  cancelBooking
} from '../../controllers/workflow/bookingController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List bookings
router.get('/', listBookings);

// Get booking detail
router.get('/:id', getBookingDetail);

// Create booking
router.post('/', createBooking);

// Cancel booking
router.patch('/:id/cancel', cancelBooking);

export default router;
