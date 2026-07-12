import React from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import ExportButtons from './components/ExportButtons';

const utilData = [
  { name: 'Engineering', value: 80 },
  { name: 'Facilities', value: 45 },
  { name: 'Field Ops', value: 90 },
  { name: 'Marketing', value: 30 }
];

const maintenanceData = [
  { month: 'Jan', requests: 12 },
  { month: 'Feb', requests: 19 },
  { month: 'Mar', requests: 15 },
  { month: 'Apr', requests: 22 },
  { month: 'May', requests: 30 },
];

export default function AnalyticsDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">Reports & Analytics</Typography>
        <ExportButtons />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '12px', height: 320, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" fontWeight="600" mb={2}>Department Asset Utilization</Typography>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={utilData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '12px', height: 320, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" fontWeight="600" mb={2}>Maintenance Trends</Typography>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={maintenanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" name="Requests" dataKey="requests" stroke="#d32f2f" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '12px', height: '100%', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" fontWeight="600" mb={2}>Most Used Assets</Typography>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="primary.main">Room B2</Typography>
              <Typography variant="body2" color="text.secondary">34 bookings this month</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="primary.main">Van AF-343</Typography>
              <Typography variant="body2" color="text.secondary">21 trips this month</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: '12px', height: '100%', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" fontWeight="600" mb={2}>Idle & Aging Assets</Typography>
            <Box sx={{ p: 2, borderLeft: '4px solid #ed6c02', bgcolor: '#fff3e0', borderRadius: '0 8px 8px 0', mb: 2 }}>
              <Typography variant="subtitle2" color="warning.dark">Camera AF-0301</Typography>
              <Typography variant="body2" color="warning.dark">Unused for 60+ days</Typography>
            </Box>
            <Box sx={{ p: 2, borderLeft: '4px solid #d32f2f', bgcolor: '#ffebee', borderRadius: '0 8px 8px 0' }}>
              <Typography variant="subtitle2" color="error.dark">Laptop AF-0020</Typography>
              <Typography variant="body2" color="error.dark">4 years old - nearing retirement</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
