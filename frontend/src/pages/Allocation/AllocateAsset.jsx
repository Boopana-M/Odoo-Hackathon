import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, TextField, Button, Autocomplete, Alert, CircularProgress, Snackbar, Tabs, Tab, List, ListItem, ListItemText, Divider, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import assetService from '../../services/assetService';
import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import allocationService from '../../services/allocationService';
import transferService from '../../services/transferService';

export default function AllocateAsset() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [assetOptions, setAssetOptions] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);

  // Allocation State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  // Transfer State
  const [transfers, setTransfers] = useState([]);
  const [actionModal, setActionModal] = useState({ open: false, type: '', transferId: null });
  const [actionNotes, setActionNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadTransfers = async () => {
    try {
      const res = await transferService.list({ status: 'Requested' });
      if (res && res.transfers) {
        setTransfers(res.transfers);
      }
    } catch (err) {
      console.error('Failed to load transfers', err);
    }
  };

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoading(true);
        const [assetsRes, deptsRes, empsRes] = await Promise.all([
          assetService.list({ limit: 100 }),
          departmentService.list(),
          employeeService.list().catch(() => ({ users: [] })) // Fallback if user is not admin
        ]);

        if (assetsRes && assetsRes.assets) {
          setAssetOptions(assetsRes.assets.map(a => ({
            label: `${a.assetTag} - ${a.name} (${a.lifecycleStatus})`,
            id: a._id,
            status: a.lifecycleStatus,
            tag: a.assetTag
          })));
        }

        const assignees = [];
        if (deptsRes && deptsRes.departments) {
          deptsRes.departments.forEach(d => {
            assignees.push({
              label: `[Department] ${d.name}`,
              id: d._id,
              type: 'department'
            });
          });
        }
        if (empsRes && empsRes.users) {
          empsRes.users.forEach(item => {
            if (item.employee) {
              assignees.push({
                label: `[Employee] ${item.employee.name} (${item.user.email})`,
                id: item.employee._id,
                type: 'employee'
              });
            }
          });
        }
        setAssigneeOptions(assignees);
        await loadTransfers();

      } catch (err) {
        console.error('Failed to load allocation options', err);
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  const handleTransferAction = async () => {
    try {
      setSubmitting(true);
      if (actionModal.type === 'Approve') {
        await transferService.approve(actionModal.transferId, actionNotes);
      } else {
        await transferService.reject(actionModal.transferId, actionNotes);
      }
      setSuccessMsg(`Transfer ${actionModal.type}d successfully`);
      setActionModal({ open: false, type: '', transferId: null });
      setActionNotes('');
      loadTransfers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || `Failed to ${actionModal.type} transfer`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !selectedAssignee) {
      setErrorMsg('Asset and Assignee are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        assetId: selectedAsset.id,
        employeeId: selectedAssignee.type === 'employee' ? selectedAssignee.id : null,
        departmentId: selectedAssignee.type === 'department' ? selectedAssignee.id : null,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        notes: notes || 'Allocation created via ERP Allocation panel.'
      };

      await allocationService.allocate(payload);
      setSuccessMsg('Asset allocated successfully!');
      
      // Reset state
      setSelectedAsset(null);
      setSelectedAssignee(null);
      setExpectedReturnDate('');
      setNotes('');

      // Refresh options
      const assetsRes = await assetService.list({ limit: 100 });
      if (assetsRes && assetsRes.assets) {
        setAssetOptions(assetsRes.assets.map(a => ({
          label: `${a.assetTag} - ${a.name} (${a.lifecycleStatus})`,
          id: a._id,
          status: a.lifecycleStatus,
          tag: a.assetTag
        })));
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit allocation.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isAllocated = selectedAsset?.status === 'Allocated';

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Asset Allocation</Typography>
      
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label="Allocate Asset" />
        <Tab label={`Pending Transfers (${transfers.length})`} />
      </Tabs>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

      {activeTab === 0 && (
        <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
          <Autocomplete
          options={assetOptions}
          value={selectedAsset}
          onChange={(e, val) => {
            setSelectedAsset(val);
            if (val?.status === 'Allocated') {
              setSelectedAssignee(null);
            }
          }}
          renderInput={(params) => <TextField {...params} label="Select Asset" fullWidth sx={{ mb: 2 }} />}
        />

        {isAllocated && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Already Allocated. Direct re-allocation is blocked. Submit a transfer request instead.
          </Alert>
        )}

        <Autocomplete
          options={assigneeOptions}
          value={selectedAssignee}
          disabled={!selectedAsset || isAllocated}
          onChange={(e, val) => setSelectedAssignee(val)}
          renderInput={(params) => <TextField {...params} label="Allocate To (Employee / Department)" fullWidth sx={{ mb: 2 }} />}
        />

        <TextField
          type="date"
          label="Expected Return Date"
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
          disabled={!selectedAsset || isAllocated}
          value={expectedReturnDate}
          onChange={(e) => setExpectedReturnDate(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Notes / Comments"
          multiline
          rows={2}
          fullWidth
          disabled={!selectedAsset || isAllocated}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={!selectedAsset || !selectedAssignee || isAllocated || submitting}
          sx={{ borderRadius: '8px' }}
        >
          {submitting ? 'Submitting...' : 'Submit Allocation'}
        </Button>
      </Card>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
          <List>
            {transfers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No pending transfers.</Typography>
            ) : (
              transfers.map(transfer => (
                <Paper key={transfer._id} sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="600">
                        {transfer.assetId?.name} ({transfer.assetId?.assetTag})
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Requested by: {transfer.requestedBy?.email}
                      </Typography>
                      <Typography variant="caption" display="block">
                        To: {transfer.destinationEmployeeId?.name || transfer.destinationDepartmentId?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" mt={1}>
                        Reason: {transfer.reason || 'No reason provided'}
                      </Typography>
                    </Box>
                    <Box>
                      <Button size="small" variant="contained" color="success" sx={{ mr: 1 }} onClick={() => setActionModal({ open: true, type: 'Approve', transferId: transfer._id })}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => setActionModal({ open: true, type: 'Reject', transferId: transfer._id })}>
                        Reject
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </List>
        </Card>
      )}

      {/* Transfer Action Modal */}
      <Dialog open={actionModal.open} onClose={() => setActionModal({ open: false, type: '', transferId: null })} fullWidth maxWidth="sm">
        <DialogTitle>{actionModal.type} Transfer Request</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Decision Notes"
            fullWidth
            multiline
            rows={3}
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionModal({ open: false, type: '', transferId: null })}>Cancel</Button>
          <Button variant="contained" color={actionModal.type === 'Approve' ? 'success' : 'error'} onClick={handleTransferAction} disabled={submitting}>
            {submitting ? 'Processing...' : `Confirm ${actionModal.type}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
