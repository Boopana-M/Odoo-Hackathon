import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import {
  Inventory as InventoryIcon,
  AssignmentInd as AssignmentIndIcon,
  CalendarToday as CalendarTodayIcon,
  Build as BuildIcon,
  FactCheck as FactCheckIcon,
  BarChart as BarChartIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';

function BasePlaceholder({ title, description, icon, routeName }) {
  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        💡 <strong>Developer Integration Notice:</strong> This is a compiled route boundary wrapper. Developer 2 (FE-2) owns the actual page implementation under the path <code>src/pages/{routeName}/</code>.
      </Alert>
      <Card sx={{ textAlign: 'center', py: 6, px: 3, maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Box sx={{ display: 'inline-flex', p: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: '50%', color: 'primary.main', mb: 3 }}>
            {icon}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {description}
          </Typography>
          <Button variant="contained" component="a" href="/dashboard">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export function AssetDirectory() {
  return (
    <BasePlaceholder
      title="Asset Directory & Central Registry"
      description="Track structural asset codes (AF-XXXX), acquisition details, warranty tracking ledgers, condition history, and bookable resource definitions."
      icon={<InventoryIcon sx={{ fontSize: 40 }} />}
      routeName="Assets"
    />
  );
}

export function AllocateAsset() {
  return (
    <BasePlaceholder
      title="Asset Allocation & Transfer Workflows"
      description="Manage role-based asset assignments, trigger transfer request flows between departments, and verify check-in condition records."
      icon={<AssignmentIndIcon sx={{ fontSize: 40 }} />}
      routeName="Allocation"
    />
  );
}

export function ResourceBooking() {
  return (
    <BasePlaceholder
      title="Overlap-Validated Resource Booking"
      description="View shared company rooms, vehicles, or equipment calendar schedules and request bookings with automated overlap validation check guards."
      icon={<CalendarTodayIcon sx={{ fontSize: 40 }} />}
      routeName="Booking"
    />
  );
}

export function MaintenanceKanban() {
  return (
    <BasePlaceholder
      title="Maintenance Request Pipeline"
      description="Approval board for repair requests, technician assignment controls, and service verification cycles."
      icon={<BuildIcon sx={{ fontSize: 40 }} />}
      routeName="Maintenance"
    />
  );
}

export function AuditCycles() {
  return (
    <BasePlaceholder
      title="Structured Asset Auditing"
      description="Start scoped inventory verification campaigns, scan and inspect physical assets, and lock down resolved discrepancy reports."
      icon={<FactCheckIcon sx={{ fontSize: 40 }} />}
      routeName="Audit"
    />
  );
}

export function AnalyticsDashboard() {
  return (
    <BasePlaceholder
      title="Utilization Reports & Analytics"
      description="Review department allocation statistics, maintenance cost tracking, and resource booking usage charts."
      icon={<BarChartIcon sx={{ fontSize: 40 }} />}
      routeName="Reports"
    />
  );
}

export function NotificationCenter() {
  return (
    <BasePlaceholder
      title="AssetFlow Notification Center"
      description="Corporate feed for transfer requests, booking schedule warnings, audit tasks, and maintenance resolution approvals."
      icon={<NotificationsActiveIcon sx={{ fontSize: 40 }} />}
      routeName="Notifications"
    />
  );
}
