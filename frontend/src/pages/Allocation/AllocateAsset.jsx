import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, TextField, Button, Autocomplete, Alert, CircularProgress, Snackbar } from '@mui/material';
import assetService from '../../services/assetService';
import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import allocationService from '../../services/allocationService';

export default function AllocateAsset() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [assetOptions, setAssetOptions] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

      } catch (err) {
        console.error('Failed to load allocation options', err);
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

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
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Allocate Asset</Typography>
      
      <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

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
          InputLabelProps={{ shrink: true }}
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
    </Box>
  );
}
