import { ActivityLog } from '../../models/index.js';

// ── List Activity Logs ───────────────────────────────────────────────────────
/**
 * GET /api/activity-logs
 * Admin, Asset Manager only.
 */
export const listActivityLogs = async (req, res) => {
  try {
    const { action, entityType, actorUserId } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actorUserId) filter.actorUserId = actorUserId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find(filter)
      .populate('actorUserId', 'email')
      .populate('actorEmployeeId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(filter);

    return res.status(200).json({ logs, total, page, limit });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Failed to retrieve activity logs.' } });
  }
};
