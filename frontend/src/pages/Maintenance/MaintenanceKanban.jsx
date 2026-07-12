import React from 'react';
import { Box, Card, Typography, Grid, Paper, Avatar, Divider } from '@mui/material';
import PriorityChip from './components/PriorityChip';
import MaintenanceTimeline from './components/MaintenanceTimeline';

const columns = ['Pending Approval', 'Technician Assigned', 'In Progress', 'Resolved'];

const mockCards = [
  { id: 'AF-0062', title: 'Projector bulb not turning on', status: 'Pending Approval', priority: 'High', tech: null, currentStep: 0 },
  { id: 'AF-003', title: 'AC unit noisy compressor', status: 'Technician Assigned', priority: 'Critical', tech: { name: 'R. Varma', initials: 'RV' }, currentStep: 1 },
  { id: 'AF-873', title: 'Chair repair', status: 'Resolved', priority: 'Low', tech: { name: 'S. Iqbal', initials: 'SI' }, currentStep: 4 },
];

export default function MaintenanceKanban() {
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
              
              {mockCards.filter(c => c.status === col).map(card => (
                <Card key={card.id} sx={{ p: 2, mb: 2, borderRadius: '8px', cursor: 'grab', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
