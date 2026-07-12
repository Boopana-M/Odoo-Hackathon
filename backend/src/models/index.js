/**
 * Phase 1 — Unified Model Index
 *
 * Imports and registers every Mongoose model in the connection registry.
 * This single import in server.js ensures cross-model references
 * (e.g. populate) never fail with "Schema hasn't been registered".
 *
 * Workflow models live in workflowIndex.js for organisational clarity,
 * but they are also registered here so that a single import is sufficient.
 */

import { mongoose } from '../config/db.js';

// ── Core domain models ────────────────────────────────────────────────────────
import User, { ROLES } from './User.js';
import Employee from './Employee.js';
import Department from './Department.js';
import AssetCategory from './AssetCategory.js';
import Asset, { ASSET_LIFECYCLE } from './Asset.js';

// ── Workflow models ───────────────────────────────────────────────────────────
// Registering them here (even though controllers import from workflowIndex.js)
// guarantees they exist in Mongoose's registry before any route handler runs.
import Allocation, { ALLOCATION_STATUS } from './Allocation.js';
import TransferRequest, { TRANSFER_STATUS } from './TransferRequest.js';
import ResourceBooking, { BOOKING_STATUS } from './ResourceBooking.js';
import MaintenanceRequest, {
  MAINTENANCE_STATUS,
  MAINTENANCE_PRIORITY
} from './MaintenanceRequest.js';
import AuditCycle, { AUDIT_STATUS, AUDIT_SCOPE_TYPE } from './AuditCycle.js';
import AuditItem, { VERIFICATION_RESULT } from './AuditItem.js';
import Notification, { NOTIFICATION_TYPE } from './Notification.js';
import ActivityLog, { ACTIVITY_ACTION } from './ActivityLog.js';

export {
  mongoose,

  // Core models
  User,
  Employee,
  Department,
  AssetCategory,
  Asset,

  // Core enums
  ROLES,
  ASSET_LIFECYCLE,

  // Workflow models
  Allocation,
  TransferRequest,
  ResourceBooking,
  MaintenanceRequest,
  AuditCycle,
  AuditItem,
  Notification,
  ActivityLog,

  // Workflow enums
  ALLOCATION_STATUS,
  TRANSFER_STATUS,
  BOOKING_STATUS,
  MAINTENANCE_STATUS,
  MAINTENANCE_PRIORITY,
  AUDIT_STATUS,
  AUDIT_SCOPE_TYPE,
  VERIFICATION_RESULT,
  NOTIFICATION_TYPE,
  ACTIVITY_ACTION
};
