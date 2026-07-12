import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText, Divider, Chip, Button, CircularProgress } from '@mui/material';
import { NotificationsActive, CheckCircle, Warning, EventNote, SwapHoriz, DoneAll } from '@mui/icons-material';
import UnreadBadge from './components/UnreadBadge';
import notificationService from '../../services/notificationService';

export default function NotificationCenter() {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.list();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.readAll();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const getIcon = (type) => {
    if (type.includes('Alert') || type.includes('Flagged') || type.includes('Rejected')) {
      return <Warning color="error" />;
    } else if (type.includes('Approved') || type.includes('Resolved') || type.includes('Confirmed')) {
      return <CheckCircle color="success" />;
    } else if (type.includes('Booking') || type.includes('Reminder')) {
      return <EventNote color="primary" />;
    } else if (type.includes('Assigned') || type.includes('Returned') || type.includes('Transfer')) {
      return <SwapHoriz color="info" />;
    }
    return <NotificationsActive color="action" />;
  };

  const getMappedCategory = (type) => {
    if (type.includes('Alert') || type.includes('Flagged')) {
      return 'alert';
    } else if (type.includes('Approved') || type.includes('Rejected') || type.includes('Resolved')) {
      return 'approval';
    } else if (type.includes('Booking') || type.includes('Reminder')) {
      return 'booking';
    }
    return 'transfer';
  };

  const filteredNotifications = notifications.filter(n => {
    const cat = getMappedCategory(n.type);
    if (tabIndex === 0) return true;
    if (tabIndex === 1) return cat === 'alert';
    if (tabIndex === 2) return cat === 'approval';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Split into Today vs Past
  const today = [];
  const past = [];
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  filteredNotifications.forEach(n => {
    const createdDate = new Date(n.createdAt);
    if (createdDate >= startOfToday) {
      today.push(n);
    } else {
      past.push(n);
    }
  });

  const renderList = (items) => (
    <List sx={{ p: 0 }}>
      {items.length === 0 ? (
        <ListItem sx={{ py: 2, px: 3 }}>
          <ListItemText primary="No notifications in this category." primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }} />
        </ListItem>
      ) : (
        items.map((n, i) => (
          <ListItem 
            key={n._id} 
            divider={i !== items.length - 1}
            sx={{ py: 2, px: 3, '&:hover': { bgcolor: '#f8f9fa' }, transition: 'background-color 0.2s', opacity: n.isRead ? 0.7 : 1 }}
          >
            <ListItemIcon>{getIcon(n.type)}</ListItemIcon>
            <ListItemText 
              primary={`${n.title}`}
              secondary={n.message}
              primaryTypographyProps={{ fontWeight: n.isRead ? 500 : 700, variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight="500">
              {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </ListItem>
        ))
      )}
    </List>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">Activity & Notifications</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UnreadBadge count={unreadCount} />
          {unreadCount > 0 && (
            <Button startIcon={<DoneAll />} variant="outlined" size="small" onClick={handleMarkAllRead} sx={{ borderRadius: '8px' }}>
              Mark all as read
            </Button>
          )}
        </Box>
      </Box>
      
      <Paper sx={{ borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs 
          value={tabIndex} 
          onChange={(e, val) => setTabIndex(val)} 
          sx={{ borderBottom: '1px solid #eee', px: 2 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Activity" sx={{ fontWeight: 600, textTransform: 'none' }} />
          <Tab label="Alerts" sx={{ fontWeight: 600, textTransform: 'none' }} />
          <Tab label="Approvals" sx={{ fontWeight: 600, textTransform: 'none' }} />
        </Tabs>

        {today.length > 0 && (
          <>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Chip label="Today" size="small" sx={{ fontWeight: 600, bgcolor: '#e2e8f0' }} />
            </Box>
            {renderList(today)}
          </>
        )}

        {(past.length > 0 || today.length === 0) && (
          <>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
              <Chip label="Earlier Activity" size="small" sx={{ fontWeight: 600, bgcolor: '#e2e8f0' }} />
            </Box>
            {renderList(past)}
          </>
        )}

      </Paper>
    </Box>
  );
}
