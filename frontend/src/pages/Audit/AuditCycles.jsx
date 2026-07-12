import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Grid, CircularProgress, Alert } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';
import AuditorAssignment from './components/AuditorAssignment';
import AuditProgress from './components/AuditProgress';
import auditService from '../../services/auditService';

export default function AuditCycles() {
  const [loading, setLoading] = useState(true);
  const [activeCycle, setActiveCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchActiveAudit = async () => {
    try {
      setLoading(true);
      const res = await auditService.list();
      if (res && res.cycles && res.cycles.length > 0) {
        // Find first open or planned audit
        const active = res.cycles.find(c => c.status === 'Open' || c.status === 'Planned') || res.cycles[0];
        setActiveCycle(active);
        
        // Fetch detailed items for this audit cycle
        const detail = await auditService.getById(active._id);
        if (detail && detail.items) {
          setAuditItems(detail.items);
        }
      }
    } catch (err) {
      console.error('Failed to load audit cycle details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAudit();
  }, []);

  const handleCloseCycle = async () => {
    if (!activeCycle) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await auditService.close(activeCycle._id);
      setSuccessMsg('Audit Cycle completed and finalized!');
      fetchActiveAudit();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to complete audit cycle.';
      setErrorMsg(msg);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!activeCycle) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="600" mb={3}>Asset Audit</Typography>
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No active audit cycles scheduled.</Typography>
        </Card>
      </Box>
    );
  }

  const verifiedCount = auditItems.filter(i => i.verificationResult === 'Verified').length;
  const discrepancyCount = auditItems.length - verifiedCount;
  
  // Format auditors list for the widget component
  const mappedAuditors = activeCycle.auditors?.map(a => ({
    name: a.name || a.email,
    initials: (a.name || a.email).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  })) || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Asset Audit</Typography>
      
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" fontWeight="600">{activeCycle.title}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {new Date(activeCycle.startDate).toLocaleDateString()} - {new Date(activeCycle.endDate).toLocaleDateString()}
                </Typography>
                <AuditorAssignment auditors={mappedAuditors} />
              </Box>
              <Chip label={activeCycle.status} color={activeCycle.status === 'Closed' ? 'default' : 'primary'} />
            </Box>
            <AuditProgress verified={verifiedCount} total={auditItems.length} />
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
           <Card sx={{ p: 3, height: '100%', bgcolor: discrepancyCount > 0 ? '#fff3e0' : '#e8f5e9', border: discrepancyCount > 0 ? '1px solid #ffcc80' : '1px solid #c8e6c9', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {discrepancyCount > 0 ? <Warning color="warning" /> : <CheckCircle color="success" />}
              <Typography variant="subtitle1" color={discrepancyCount > 0 ? 'warning.dark' : 'success.dark'} fontWeight="600">
                {discrepancyCount > 0 ? 'Discrepancy Alert' : 'Verification Clear'}
              </Typography>
            </Box>
            <Typography variant="body2" color={discrepancyCount > 0 ? 'warning.dark' : 'success.dark'} fontWeight="500">
              {discrepancyCount > 0 
                ? `${discrepancyCount} assets flagged missing or damaged. Discrepancy report auto-generated.`
                : 'All audited assets verified successfully.'
              }
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Audit Notes</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Verification</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No items verified in this audit cycle.
                </TableCell>
              </TableRow>
            ) : (
              auditItems.map((item, idx) => (
                <TableRow key={item._id || idx} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {item.assetId ? `${item.assetId.assetTag} - ${item.assetId.name}` : 'Unknown Asset'}
                  </TableCell>
                  <TableCell>{item.notes || 'No remarks.'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.verificationResult}
                      icon={item.verificationResult === 'Verified' ? <CheckCircle /> : item.verificationResult === 'Missing' ? <ErrorIcon /> : <Warning />}
                      color={item.verificationResult === 'Verified' ? 'success' : item.verificationResult === 'Missing' ? 'error' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: '600' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {activeCycle.status !== 'Closed' && (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleCloseCycle}
          sx={{ borderRadius: '8px' }}
        >
          Complete Verification Phase
        </Button>
      )}
    </Box>
  );
}
