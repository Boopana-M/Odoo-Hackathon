import { Notification } from '../../models/index.js';

// ── Get User's Notifications ────────────────────────────────────────────────
/**
 * GET /api/notifications
 * Auth user. Lists notifications for the authenticated user.
 */
export const listMyNotifications = async (req, res) => {
  try {
    const { isRead } = req.query;
    const filter = { recipientUserId: req.user._id };

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({ notifications, total: notifications.length });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to retrieve notifications.' } });
  }
};

// ── Mark Notification as Read ────────────────────────────────────────────────
/**
 * PATCH /api/notifications/:id/read
 * Auth user. Marks a single notification as read.
 */
export const readNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientUserId: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found.' } });
    }

    return res.status(200).json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: { message: 'Invalid ID format.' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update notification.' } });
  }
};

// ── Mark All Notifications as Read ───────────────────────────────────────────
/**
 * PATCH /api/notifications/read-all
 * Auth user. Marks all unread notifications of the user as read.
 */
export const readAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientUserId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to update notifications.' } });
  }
};
