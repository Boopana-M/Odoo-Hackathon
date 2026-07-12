import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../components/layout/AuthContext';
import notificationService from '../services/notificationService';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Breadcrumbs,
  InputBase,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Login as LoginIcon,
  AccountCircle as AccountCircleIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  Build as BuildIcon,
  FactCheck as FactCheckIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const sidebarWidth = 260;
const sidebarCollapsedWidth = 72;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, employee, logout } = useAuth();
  const initials = employee ? employee.name.split(' ').map(n => n[0]).join('').slice(0, 2) : (user?.email ? user.email[0].toUpperCase() : 'U');
  const displayName = employee ? employee.name : (user?.email ? user.email : 'User');
  const roleName = user ? user.role : 'Employee';

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await notificationService.list();
        const unread = data.notifications ? data.notifications.filter(n => !n.isRead).length : 0;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to load notifications count', err);
      }
    }
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for live notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Nav items based on role boundaries and routing
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Assets Directory', icon: <InventoryIcon />, path: '/assets' },
    { text: 'Asset Allocation', icon: <AssignmentIcon />, path: '/allocation' },
    { text: 'Resource Booking', icon: <CalendarTodayIcon />, path: '/booking' },
    { text: 'Maintenance Kanban', icon: <BuildIcon />, path: '/maintenance' },
    { text: 'Audit Cycles', icon: <FactCheckIcon />, path: '/audit' },
    { text: 'Analytics & Reports', icon: <BarChartIcon />, path: '/reports' },
    { text: 'Organization Setup', icon: <BusinessIcon />, path: '/organization' },
  ];

  // Helper to generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    if (pathnames.length === 0) return [{ label: 'Dashboard', path: '/dashboard' }];
    
    return pathnames.map((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
      return { label, path };
    });
  };

  const currentBreadcrumbs = getBreadcrumbs();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* AppBar / Top Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #f1f5f9',
          width: '100%',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          {/* Left: Brand & Sidebar toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}
              >
                AF
              </Avatar>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'primary.main',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                AssetFlow <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 500 }}>ERP</span>
              </Typography>
            </Box>
            <IconButton onClick={toggleSidebar} edge="start" sx={{ ml: 1 }}>
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>

          {/* Middle: Professional search bar */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              bgcolor: '#f1f5f9',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              width: '400px',
              border: '1px solid #e2e8f0',
              '&:focus-within': {
                borderColor: 'primary.main',
                bgcolor: 'background.paper',
              },
              transition: 'all 0.2s',
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search assets, employees, bookings..."
              sx={{ width: '100%', fontSize: '0.875rem' }}
            />
          </Box>

          {/* Right: Notifications & User profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Notifications">
              <IconButton component={Link} to="/notifications" color="inherit">
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ color: 'text.secondary' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
                <Avatar
                  sx={{ width: 36, height: 36, bgcolor: 'secondary.main', color: '#fff' }}
                  alt={displayName}
                >
                  {initials}
                </Avatar>
              </IconButton>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {roleName}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
                  mt: 1,
                  minWidth: 180,
                  border: '1px solid #f1f5f9',
                },
              }}
            >
              <MenuItem onClick={handleProfileMenuClose}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>My Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LoginIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? sidebarCollapsedWidth : sidebarWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: collapsed ? sidebarCollapsedWidth : sidebarWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#0f172a', // Dark Slate sidebar as requested
            color: '#94a3b8',
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar /> {/* Spacer */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyBetween: 'space-between', pt: 1 }}>
          <List sx={{ px: 1 }}>
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.text}
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    py: 1,
                    my: 0.5,
                    borderRadius: 2,
                    color: active ? '#ffffff' : '#94a3b8',
                    bgcolor: active ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: active ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                      color: active ? '#ffffff' : '#f8fafc',
                    },
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 'auto' : 3,
                      justifyContent: 'center',
                      color: active ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 500,
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>

          {/* Bottom user card inside sidebar */}
          {!collapsed && (
            <Box
              sx={{
                mt: 'auto',
                mb: 2,
                mx: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>{initials}</Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Server Session Active
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Main Content Layout Wrapper */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${collapsed ? sidebarCollapsedWidth : sidebarWidth}px)` },
          transition: 'width 0.2s',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Spacer */}
        
        {/* Dynamic Breadcrumbs Area */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Breadcrumbs separator="/" aria-label="breadcrumb" sx={{ fontSize: '0.85rem' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center' }}>
              Home
            </Link>
            {currentBreadcrumbs.map((crumb, idx) => {
              const isLast = idx === currentBreadcrumbs.length - 1;
              return isLast ? (
                <Typography key={crumb.path} color="text.primary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {crumb.label}
                </Typography>
              ) : (
                <Link key={crumb.path} to={crumb.path} style={{ textDecoration: 'none', color: '#64748b' }}>
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>

        {/* Page Content Rendered Here */}
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>

        {/* Premium footer */}
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 1,
            mt: 'auto',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'text.secondary',
          }}
        >
          <Typography variant="caption">
            &copy; 2026 AssetFlow Enterprise. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
            <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Support</Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
