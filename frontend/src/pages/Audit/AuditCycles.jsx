import React from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Grid } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import AuditorAssignment from './components/AuditorAssignment';
import AuditProgress from './components/AuditProgress';

const mockAuditItems = [
  { asset: 'AF-003 Dell Laptop', location: 'Desk E12', status: 'Verified' },
  { asset: 'AF-9921 Office Chair', location: 'Desk E14', status: 'Missing' },
  { asset: 'AF-9838 Monitor', location: 'Desk E15', status: 'Damaged' },
  { asset: 'AF-1022 Projector', location: 'Meeting Room C', status: 'Verified' },
];

export default function AuditCycles() {
  const verifiedCount = mockAuditItems.filter(i => i.status === 'Verified').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Asset Audit</Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" fontWeight="600">Q3 Audit: Engineering Dept</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>1 Jul - 15 Jul 2026</Typography>
                <AuditorAssignment auditors={[{ name: 'Aditi Rao', initials: 'AR' }, { name: 'Sana Iqbal', initials: 'SI' }]} />
              </Box>
              <Chip label="In Progress" color="primary" />
            </Box>
            <AuditProgress verified={verifiedCount} total={mockAuditItems.length} />
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
           <Card sx={{ p: 3, height: '100%', bgcolor: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Warning color="warning" />
              <Typography variant="subtitle1" color="warning.dark" fontWeight="600">
                Discrepancy Alert
              </Typography>
            </Box>
            <Typography variant="body2" color="warning.dark" fontWeight="500">
              {mockAuditItems.length - verifiedCount} assets flagged missing or damaged. Discrepancy report auto-generated.
            </Typography>
            <Button variant="contained" color="warning" size="small" sx={{ mt: 2, alignSelf: 'flex-start' }}>
              View Report
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expected Location</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Verification</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockAuditItems.map((item, idx) => (
              <TableRow key={idx} hover>
                <TableCell fontWeight="500">{item.asset}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.status}
                    icon={item.status === 'Verified' ? <CheckCircle /> : item.status === 'Missing' ? <ErrorIcon /> : <Warning />}
                    color={item.status === 'Verified' ? 'success' : item.status === 'Missing' ? 'error' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: '600' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Button variant="outlined" color="primary" sx={{ borderRadius: '8px' }}>
        Complete Verification Phase
      </Button>
    </Box>
  );
}
