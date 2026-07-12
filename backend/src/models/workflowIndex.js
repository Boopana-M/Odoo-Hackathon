/**
 * BE-2 Workflow Model Index
 *
 * This file exports all BE-2 owned workflow models and their enums.
 * It does NOT re-export or modify BE-1 core models.
 * Import BE-1 models directly from '../models/index.js' where needed.
 */

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
  // Models
  Allocation,
  TransferRequest,
  ResourceBooking,
  MaintenanceRequest,
  AuditCycle,
  AuditItem,
  Notification,
  ActivityLog,

  // Enums
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
