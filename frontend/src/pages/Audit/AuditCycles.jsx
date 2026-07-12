import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Grid, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon, Add as AddIcon } from '@mui/icons-material';
import AuditorAssignment from './components/AuditorAssignment';
import AuditProgress from './components/AuditProgress';
import auditService from '../../services/auditService';
import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import { usePermission } from '../../hooks/usePermission';

export default function AuditCycles() {
  const [loading, setLoading] = useState(true);
  const [activeCycle, setActiveCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { isManager, isAdmin } = usePermission();

  const [createOpen, setCreateOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [auditForm, setAuditForm] = useState({
    title: '',
    scopeType: 'Department',
    scopeDepartmentId: '',
    scopeLocation: '',
    startDate: '',
    endDate: '',
    auditor: ''
  });

  const fetchActiveAudit = async () => {
    try {
      setLoading(true);
      const res = await auditService.list();
      if (res && res.cycles && res.cycles.length > 0) {
        // Find first open or planned audit
        const active = res.cycles.find(c => c.status === 'Open' || c.status === 'Planned') || res.cycles[0];
        setActiveCycle(active);
        
        // Fetch detailed items and populated cycle info
        const detail = await auditService.getById(active._id);
        if (detail) {
          if (detail.cycle) {
            setActiveCycle(detail.cycle);
          }
          if (detail.items) {
            setAuditItems(detail.items);
          }
        }
      }
      if (isManager || isAdmin) {
        const [deptRes, empRes] = await Promise.all([
          departmentService.list().catch(() => ({ departments: [] })),
          employeeService.list().catch(() => ({ users: [] }))
        ]);
        setDepartments(deptRes.departments || []);
        setEmployees(empRes.users || []);
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

  const handleCreateAudit = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await auditService.create({
        title: auditForm.title,
        scopeType: auditForm.scopeType,
        scopeDepartmentId: auditForm.scopeDepartmentId || null,
        scopeLocation: auditForm.scopeLocation || null,
        startDate: auditForm.startDate,
        endDate: auditForm.endDate,
        auditors: auditForm.auditor ? [auditForm.auditor] : []
      });
      setCreateOpen(false);
      setSuccessMsg('Audit Cycle created successfully!');
      fetchActiveAudit();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create audit cycle.';
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" fontWeight="600">Asset Audit</Typography>
          {(isManager || isAdmin) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create Audit
            </Button>
          )}
        </Box>
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">No active audit cycles scheduled.</Typography>
        </Card>
        {renderCreateDialog()}
      </Box>
    );
  }

  const verifiedCount = auditItems.filter(i => i.verificationResult === 'Verified').length;
  const discrepancyCount = auditItems.length - verifiedCount;
  
  // Format auditors list for the widget component
  const mappedAuditors = activeCycle.auditors?.map(a => {
    if (!a) return { name: 'Unknown Auditor', initials: 'UA' };
    if (typeof a === 'string') {
      return { name: a, initials: 'A' };
    }
    const nameOrEmail = a.name || a.email || 'Unknown Auditor';
    const initials = nameOrEmail.includes('@')
      ? nameOrEmail.charAt(0).toUpperCase()
      : nameOrEmail.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return {
      name: nameOrEmail,
      initials
    };
  }) || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">Asset Audit</Typography>
        {(isManager || isAdmin) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Audit
          </Button>
        )}
      </Box>
      
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

      {activeCycle.status !== 'Closed' && (isManager || isAdmin) && (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleCloseCycle}
          sx={{ borderRadius: '8px' }}
        >
          Complete Verification Phase
        </Button>
      )}
      {renderCreateDialog()}
    </Box>
  );

  function renderCreateDialog() {
    return (
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Audit Cycle</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Audit Title"
            fullWidth
            value={auditForm.title}
            onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Scope Type</InputLabel>
            <Select
              value={auditForm.scopeType}
              label="Scope Type"
              onChange={(e) => setAuditForm({ ...auditForm, scopeType: e.target.value })}
            >
              <MenuItem value="Department">Department</MenuItem>
              <MenuItem value="Location">Location</MenuItem>
            </Select>
          </FormControl>
          
          {auditForm.scopeType === 'Department' ? (
            <FormControl fullWidth>
              <InputLabel>Target Department</InputLabel>
              <Select
                value={auditForm.scopeDepartmentId}
                label="Target Department"
                onChange={(e) => setAuditForm({ ...auditForm, scopeDepartmentId: e.target.value })}
              >
                {departments.map(d => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label="Target Location"
              fullWidth
              value={auditForm.scopeLocation}
              onChange={(e) => setAuditForm({ ...auditForm, scopeLocation: e.target.value })}
            />
          )}

          <FormControl fullWidth>
            <InputLabel>Assign Primary Auditor</InputLabel>
            <Select
              value={auditForm.auditor}
              label="Assign Primary Auditor"
              onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })}
            >
              {employees.map(u => (
                <MenuItem key={u._id} value={u._id}>{u.employee?.name || u.email} ({u.role})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={auditForm.startDate}
              onChange={(e) => setAuditForm({ ...auditForm, startDate: e.target.value })}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={auditForm.endDate}
              onChange={(e) => setAuditForm({ ...auditForm, endDate: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAudit} variant="contained">Start Audit</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
