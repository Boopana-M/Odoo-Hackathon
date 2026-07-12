import React from 'react';
import { Box, Typography, Paper, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import { NotificationsActive, CheckCircle, Warning, EventNote, SwapHoriz } from '@mui/icons-material';
import UnreadBadge from './components/UnreadBadge';

const notificationsToday = [
  { id: 1, text: 'Laptop AF-0014 assigned to Priya Shah', time: '2m ago', type: 'assignment' },
  { id: 2, text: 'Maintenance request AF-0055 approved', time: '18m ago', type: 'approval' },
  { id: 3, text: 'Booking confirmed: Room B2 : 2:00 to 3:00 PM', time: '1h ago', type: 'booking' },
  { id: 4, text: 'Transfer approved: AF-0033 to Facilities', time: '3h ago', type: 'transfer' },
];

const notificationsYesterday = [
  { id: 5, text: 'Overdue return: AF-0021 was due 3 days ago', time: '1d ago', type: 'alert' },
  { id: 6, text: 'Audit discrepancy flagged: AF-0088 damaged', time: '1d ago', type: 'alert' }
];

export default function NotificationCenter() {
  const [tabIndex, setTabIndex] = React.useState(0);

  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <Warning color="error" />;
      case 'approval': return <CheckCircle color="success" />;
      case 'booking': return <EventNote color="primary" />;
      case 'transfer': return <SwapHoriz color="info" />;
      default: return <NotificationsActive color="action" />;
    }
  };

  const renderList = (items) => (
    <List sx={{ p: 0 }}>
      {items.map((n, i) => (
        <ListItem 
          key={n.id} 
          divider={i !== items.length - 1}
          sx={{ py: 2, px: 3, '&:hover': { bgcolor: '#f8f9fa' }, transition: 'background-color 0.2s' }}
        >
          <ListItemIcon>{getIcon(n.type)}</ListItemIcon>
          <ListItemText 
            primary={n.text} 
            primaryTypographyProps={{ fontWeight: 500 }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight="500">{n.time}</Typography>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">Activity & Notifications</Typography>
        <UnreadBadge count={6} />
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

        <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Chip label="Today" size="small" sx={{ fontWeight: 600, bgcolor: '#e2e8f0' }} />
        </Box>
        {renderList(notificationsToday)}

        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
          <Chip label="Yesterday" size="small" sx={{ fontWeight: 600, bgcolor: '#e2e8f0' }} />
        </Box>
        {renderList(notificationsYesterday)}

      </Paper>
    </Box>
  );
}
