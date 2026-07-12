import { Notification, Employee } from '../models/index.js';

/**
 * Creates a notification in the database as a side effect.
 */
export const createNotification = async ({ recipientUserId, type, title, message, relatedEntityType, relatedEntityId }) => {
  try {
    const employee = await Employee.findOne({ userId: recipientUserId });
    const notification = new Notification({
      recipientUserId,
      recipientEmployeeId: employee ? employee._id : null,
      type,
      title,
      message,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
