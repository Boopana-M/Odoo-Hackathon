import { ActivityLog, Employee } from '../models/index.js';

/**
 * Creates an activity log entry in the database.
 * Enforces strict security by cleaning sensitive metadata fields (passwords, tokens, hashes, secrets).
 */
export const logActivity = async ({ actorUserId, action, entityType, entityId, metadata }) => {
  try {
    const cleanMetadata = metadata ? { ...metadata } : {};
    const sensitiveFields = ['password', 'token', 'secret', 'hash', 'jwt'];
    for (const key of Object.keys(cleanMetadata)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        delete cleanMetadata[key];
      }
    }

    const employee = actorUserId ? await Employee.findOne({ userId: actorUserId }) : null;

    const log = new ActivityLog({
      actorUserId,
      actorEmployeeId: employee ? employee._id : null,
      action,
      entityType,
      entityId,
      metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
