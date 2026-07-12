import React from 'react';
import { Box, Card, Typography, Grid, Paper } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function ResourceBooking() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Resource Booking</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar />
            </LocalizationProvider>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <Typography variant="h6" mb={2}>Schedule for Conference Room B2</Typography>
            
            <Box sx={{ position: 'relative', height: '100%', mt: 2 }}>
              <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 50, color: 'text.secondary' }}>9:00</Typography>
                <Paper sx={{ flex: 1, p: 2, bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="body2" fontWeight="500">Booked - Procurement Team</Typography>
                </Paper>
              </Box>

              <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 50, color: 'text.secondary' }}>10:30</Typography>
                <Paper sx={{ flex: 1, p: 2, border: '2px dashed #d32f2f', bgcolor: '#fff' }}>
                  <Typography variant="body2" color="error" fontWeight="500">Requested 10:30 to 11:30 - conflict - slot is unavailable</Typography>
                </Paper>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
