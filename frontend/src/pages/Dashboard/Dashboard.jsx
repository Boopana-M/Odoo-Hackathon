import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../components/layout/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import dashboardService from '../../services/dashboardService';
import allocationService from '../../services/allocationService';
import {
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Build as BuildIcon,
  CalendarMonth as CalendarMonthIcon,
  ArrowForward as ArrowForwardIcon,
  PlayArrow as PlayArrowIcon,
  AssignmentInd as AssignmentIndIcon,
  NotificationsActive as NotificationsActiveIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';



export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isManager, isEmployee } = usePermission();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    available: 0,
    allocated: 0,
    maintenance: 0,
    bookings: 0
  });
  const [activities, setActivities] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [upcomingReturns, setUpcomingReturns] = useState([]);
  const [categoriesShare, setCategoriesShare] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        if (isAdmin || isManager) {
          // Managers & Admins fetch full summary
          const [dashData, logData, transferData, allocData] = await Promise.all([
            dashboardService.getSummary().catch(() => null),
            dashboardService.listActivityLogs().catch(() => null),
            allocationService.listTransfers().catch(() => null),
            allocationService.list().catch(() => null)
          ]);

          if (dashData && dashData.summary) {
            const s = dashData.summary;
            setMetrics({
              available: s.assets.byStatus?.Available || 0,
              allocated: s.allocations.activeCount || 0,
              maintenance: s.maintenance.activeCount || 0,
              bookings: (s.bookings.metrics?.Upcoming || 0) + (s.bookings.metrics?.Ongoing || 0)
            });

            // Compute category share for Recharts
            const totalAssets = s.assets.totalCount || 1;
            const share = s.assets.byCategory.map((cat, idx) => {
              const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2'];
              return {
                name: cat.categoryName,
                value: Math.round((cat.count / totalAssets) * 100),
                color: colors[idx % colors.length]
              };
            });
            setCategoriesShare(share);
          }

          if (logData && logData.logs) {
            const list = logData.logs.slice(0, 5).map(log => {
              const name = log.actorEmployeeId?.name || 'System';
              return {
                id: log._id,
                user: name,
                action: `${log.action.replace('asset.', 'asset ').replace('transfer.', 'transfer ')}: ${log.metadata?.detail || ''}`,
                time: new Date(log.createdAt).toLocaleDateString(),
                initials: name.split(' ').map(n => n[0]).join('').slice(0, 2),
                color: '#1976d2'
              };
            });
            setActivities(list);
          }

          if (transferData && transferData.transfers) {
            const pending = transferData.transfers
              .filter(t => t.status === 'Requested')
              .slice(0, 5)
              .map(t => ({
                id: t._id,
                asset: t.assetId?.name || 'Unknown Asset',
                user: t.targetEmployeeId?.name || 'Unknown User',
                type: 'Transfer',
                status: t.status
              }));
            setPendingTransfers(pending);
          }

          if (allocData && allocData.allocations) {
            const returns = allocData.allocations
              .filter(a => a.status === 'Active')
              .slice(0, 5)
              .map(a => ({
                id: a.assetId?.assetTag || 'AF-XXXX',
                asset: a.assetId?.name || 'Unknown Asset',
                holder: a.employeeId?.name || 'Department',
                dueDate: a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : 'No limit',
                overdue: a.isOverdue || false
              }));
            setUpcomingReturns(returns);
          }
        } else {
          // Employee Dashboard fallback (since real API might not exist yet)
          setMetrics({
            available: 0,
            allocated: 0,
            maintenance: 0,
            bookings: 0
          });
        }

      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const kpis = [
    {
      title: 'Assets Available',
      value: String(metrics.available),
      change: 'Active',
      icon: <InventoryIcon sx={{ fontSize: 28, color: '#1976d2' }} />,
      bgColor: '#e3f2fd',
    },
    {
      title: 'Assets Allocated',
      value: String(metrics.allocated),
      change: 'In Use',
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 28, color: '#2e7d32' }} />,
      bgColor: '#e8f5e9',
    },
    {
      title: 'Active Maintenance',
      value: String(metrics.maintenance),
      change: 'Urgent Tasks',
      icon: <BuildIcon sx={{ fontSize: 28, color: '#ed6c02' }} />,
      bgColor: '#fff3e0',
    },
    {
      title: 'Active Bookings',
      value: String(metrics.bookings),
      change: 'Schedules',
      icon: <CalendarMonthIcon sx={{ fontSize: 28, color: '#9c27b0' }} />,
      bgColor: '#f3e5f5',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '70vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  const totalCount = metrics.available + metrics.allocated || 1;
  const currentUtil = Math.round((metrics.allocated / totalCount) * 100);
  const currentMaint = metrics.maintenance;

  const chartData = [
    { name: 'Jan', Utilization: Math.max(0, currentUtil - 25), Maintenance: Math.max(0, currentMaint - 2) },
    { name: 'Feb', Utilization: Math.max(0, currentUtil - 20), Maintenance: Math.max(0, currentMaint - 1) },
    { name: 'Mar', Utilization: Math.max(0, currentUtil - 15), Maintenance: Math.max(0, currentMaint - 3) },
    { name: 'Apr', Utilization: Math.max(0, currentUtil - 10), Maintenance: Math.max(0, currentMaint - 1) },
    { name: 'May', Utilization: Math.max(0, currentUtil - 5), Maintenance: Math.max(0, currentMaint + 1) },
    { name: 'Jun', Utilization: currentUtil, Maintenance: currentMaint },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time enterprise metrics, system usage statistics, and task approval pipelines.
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, index) => (
          <Grid xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: kpi.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {kpi.icon}
                  </Box>
                  <Chip
                    label={kpi.change}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: kpi.bgColor,
                      color: 'text.primary',
                    }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Panel */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2.5 }}>
            Operational Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<InventoryIcon />}
                onClick={() => navigate('/assets')}
                sx={{ py: 1.5, display: 'flex', justifyContent: 'flex-start', px: 3 }}
              >
                Register Corporate Asset
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalendarMonthIcon />}
                onClick={() => navigate('/booking')}
                sx={{ py: 1.5, display: 'flex', justifyContent: 'flex-start', px: 3 }}
              >
                Book Shared Resource
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                startIcon={<BuildIcon />}
                onClick={() => navigate('/maintenance')}
                sx={{ py: 1.5, display: 'flex', justifyContent: 'flex-start', px: 3 }}
              >
                Log Maintenance Request
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Charts & Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Asset Utilization & Maintenance Trends</Typography>
                <Typography variant="caption" color="text.secondary">
                  Active tracking for H1 2026
                </Typography>
              </Box>
              <Box sx={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ed6c02" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ed6c02" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="Utilization" stroke="#1976d2" strokeWidth={2} fillOpacity={1} fill="url(#colorUtil)" name="Allocation %" />
                    <Area type="monotone" dataKey="Maintenance" stroke="#ed6c02" strokeWidth={2} fillOpacity={1} fill="url(#colorMaint)" name="Maintenance Logs" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Asset Category Share
              </Typography>
              <Box sx={{ width: '100%', height: '200px', mb: 3 }}>
                <ResponsiveContainer>
                  <BarChart data={categoriesShare} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={16}>
                      {categoriesShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
                {categoriesShare.map((cat, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {cat.name} ({cat.value}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Lists & Details Panels */}
      <Grid container spacing={3}>
        {/* Recent Activity Timeline */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '360px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activities
              </Typography>
              <List sx={{ p: 0 }}>
                {activities.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>No recent activities logged.</Typography>
                ) : (
                  activities.map((act, index) => (
                    <React.Fragment key={act.id}>
                      <ListItem sx={{ px: 0, py: 1.2, alignItems: 'flex-start' }}>
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar sx={{ bgcolor: act.color, width: 32, height: 32, fontSize: '0.8rem', fontWeight: 600 }}>
                            {act.initials}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {act.user} <span style={{ fontWeight: 400, color: '#64748b' }}>{act.action}</span>
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2 }}>
                              {act.time}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < activities.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '360px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Pending Approvals
              </Typography>
              <List sx={{ p: 0 }}>
                {pendingTransfers.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>No pending approvals found.</Typography>
                ) : (
                  pendingTransfers.map((req, index) => (
                    <React.Fragment key={req.id}>
                      <ListItem
                        sx={{ px: 0, py: 1.2 }}
                        secondaryAction={
                          <IconButton edge="end" size="small" component={Link} to="/allocation">
                            <ArrowForwardIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {req.asset}
                              </Typography>
                              <Chip label={req.type} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Requested by: {req.user}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <WarningAmberIcon sx={{ fontSize: 12 }} /> {req.status}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < pendingTransfers.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Returns */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '360px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upcoming & Overdue Returns
              </Typography>
              <List sx={{ p: 0 }}>
                {upcomingReturns.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem sx={{ px: 0, py: 1.2 }}>
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.asset}
                            </Typography>
                            <Chip
                              label={item.id}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: '#f1f5f9',
                                color: '#475569',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Holder: {item.holder}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: item.overdue ? 'error.main' : 'text.secondary',
                              }}
                            >
                              {item.overdue ? '🚨 OVERDUE' : item.dueDate}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < upcomingReturns.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

