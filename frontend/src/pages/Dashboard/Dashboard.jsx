import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
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

const chartData = [
  { name: 'Jan', Utilization: 65, Maintenance: 12 },
  { name: 'Feb', Utilization: 68, Maintenance: 15 },
  { name: 'Mar', Utilization: 74, Maintenance: 10 },
  { name: 'Apr', Utilization: 72, Maintenance: 14 },
  { name: 'May', Utilization: 80, Maintenance: 18 },
  { name: 'Jun', Utilization: 85, Maintenance: 8 },
];

const categoryData = [
  { name: 'IT Devices', value: 45, color: '#1976d2' },
  { name: 'Office Furniture', value: 25, color: '#2e7d32' },
  { name: 'Vehicles', value: 15, color: '#ed6c02' },
  { name: 'Lab Equipments', value: 15, color: '#d32f2f' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const kpis = [
    {
      title: 'Assets Available',
      value: '240',
      change: '+12% this month',
      icon: <InventoryIcon sx={{ fontSize: 28, color: '#1976d2' }} />,
      bgColor: '#e3f2fd',
    },
    {
      title: 'Assets Allocated',
      value: '1,102',
      change: '+4% this month',
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 28, color: '#2e7d32' }} />,
      bgColor: '#e8f5e9',
    },
    {
      title: 'Active Maintenance',
      value: '18',
      change: '5 urgent repairs',
      icon: <BuildIcon sx={{ fontSize: 28, color: '#ed6c02' }} />,
      bgColor: '#fff3e0',
    },
    {
      title: 'Active Bookings',
      value: '42',
      change: '8 slots today',
      icon: <CalendarMonthIcon sx={{ fontSize: 28, color: '#9c27b0' }} />,
      bgColor: '#f3e5f5',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Sarah Connor',
      action: 'requested transfer of Mac Studio to Marketing',
      time: '10 mins ago',
      initials: 'SC',
      color: '#1565c0',
    },
    {
      id: 2,
      user: 'John Doe',
      action: 'completed audit check-in for Asset AF-0941',
      time: '1 hour ago',
      initials: 'JD',
      color: '#2e7d32',
    },
    {
      id: 3,
      user: 'Maintenance Admin',
      action: 'approved repair for Conference Room B projector',
      time: '3 hours ago',
      initials: 'MA',
      color: '#ed6c02',
    },
    {
      id: 4,
      user: 'David Miller',
      action: 'registered new corporate vehicle AF-2038',
      time: '1 day ago',
      initials: 'DM',
      color: '#7b1fa2',
    },
  ];

  const pendingApprovals = [
    {
      id: 'REQ-019',
      asset: 'ThinkPad X1 Carbon',
      user: 'Alice Vance',
      type: 'Transfer',
      status: 'Pending Head Approval',
    },
    {
      id: 'REQ-020',
      asset: 'Conference Room 402',
      user: 'Bob Smith',
      type: 'Booking Overlap Conflict',
      status: 'Manager Review Required',
    },
    {
      id: 'REQ-021',
      asset: 'Dell Monitor 27"',
      user: 'Charlie Brown',
      type: 'Return Request',
      status: 'Awaiting Receipt Check',
    },
  ];

  const upcomingReturns = [
    { id: 'AF-1049', asset: 'MacBook Pro 16"', holder: 'Emma Stone', dueDate: 'Today, 5:00 PM', overdue: false },
    { id: 'AF-0822', asset: 'iPad Pro 12.9"', holder: 'Frank Castle', dueDate: 'Yesterday', overdue: true },
    { id: 'AF-1439', asset: 'Tesla Model 3', holder: 'Tony Stark', dueDate: 'Jul 15, 9:00 AM', overdue: false },
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
          <Grid item xs={12} sm={6} lg={3} key={index}>
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
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={16}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
                {categoryData.map((cat, i) => (
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
                {recentActivities.map((act, index) => (
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
                    {index < recentActivities.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                  </React.Fragment>
                ))}
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
                {pendingApprovals.map((req, index) => (
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
                    {index < pendingApprovals.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
                  </React.Fragment>
                ))}
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

