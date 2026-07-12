import express from 'express';
import {
  listMyNotifications,
  readNotification,
  readAllNotifications
} from '../../controllers/workflow/notificationController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// List current user's notifications
router.get('/', listMyNotifications);

// Mark all as read
router.patch('/read-all', readAllNotifications);

// Mark single notification as read
router.patch('/:id/read', readNotification);

export default router;
