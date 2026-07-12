import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Grid, Paper, Avatar, Divider, CircularProgress } from '@mui/material';
import PriorityChip from './components/PriorityChip';
import MaintenanceTimeline from './components/MaintenanceTimeline';
import maintenanceService from '../../services/maintenanceService';

const columns = ['Pending Approval', 'Technician Assigned', 'In Progress', 'Resolved'];

export default function MaintenanceKanban() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await maintenanceService.list();
      if (res && res.requests) {
        const mapped = res.requests.map(req => {
          // Map status step
          let step = 0;
          let colName = 'Pending Approval';
          
          if (req.status === 'Pending' || req.status === 'Approved') {
            step = 0;
            colName = 'Pending Approval';
          } else if (req.status === 'Technician Assigned') {
            step = 1;
            colName = 'Technician Assigned';
          } else if (req.status === 'In Progress') {
            step = 2;
            colName = 'In Progress';
          } else if (req.status === 'Resolved' || req.status === 'Rejected') {
            step = 3;
            colName = 'Resolved';
          }

          const techName = req.assignedTechnician?.name || 'Unassigned';
          const initials = techName !== 'Unassigned' ? techName.split(' ').map(n => n[0]).join('').slice(0, 2) : '';

          return {
            id: req.assetId?.assetTag || 'AF-XXXX',
            rawId: req._id,
            title: req.issueDescription,
            status: colName,
            priority: req.priority,
            currentStep: step,
            tech: req.assignedTechnician ? { name: techName, initials } : null
          };
        });
        setRequests(mapped);
      }
    } catch (err) {
      console.error('Failed to load maintenance boards', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Maintenance Board</Typography>
      
      <Grid container spacing={2} sx={{ flex: 1, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {columns.map(col => (
          <Grid item xs={12} sm={6} md={3} key={col} sx={{ minWidth: 320 }}>
            <Paper sx={{ p: 2, bgcolor: '#f4f6f8', height: '100%', borderRadius: '12px' }}>
              <Typography variant="subtitle1" fontWeight="600" mb={2} color="text.secondary">
                {col}
              </Typography>
              
              {requests.filter(c => c.status === col).map(card => (
                <Card key={card.rawId} sx={{ p: 2, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="700">{card.id}</Typography>
                    <PriorityChip priority={card.priority} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{card.title}</Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    {card.tech ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                          {card.tech.initials}
                        </Avatar>
                        <Typography variant="caption" fontWeight="500">{card.tech.name}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Unassigned</Typography>
                    )}
                  </Box>
                  
                  <MaintenanceTimeline currentStepIndex={card.currentStep} />
                </Card>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
