import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Grid, Paper, Avatar, Divider, CircularProgress, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, InputLabel, FormControl } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import PriorityChip from './components/PriorityChip';
import MaintenanceTimeline from './components/MaintenanceTimeline';
import maintenanceService from '../../services/maintenanceService';
import employeeService from '../../services/employeeService';
import assetService from '../../services/assetService';
import { useAuth } from '../../components/layout/AuthContext';
import { usePermission } from '../../hooks/usePermission';

const columns = ['Pending Approval', 'Technician Assigned', 'In Progress', 'Resolved'];

export default function MaintenanceKanban() {
  const { user } = useAuth();
  const { isManager, isAdmin } = usePermission();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  
  // Data for modals
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  // Modals state
  const [actionModal, setActionModal] = useState({ open: false, type: '', request: null });
  const [notes, setNotes] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [raiseData, setRaiseData] = useState({ assetId: '', issueDescription: '', priority: 'Medium', imageUrl: '' });

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuReq, setMenuReq] = useState(null);

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
            tech: req.assignedTechnician ? { name: techName, initials } : null,
            imageUrl: req.attachmentMetadata?.url || null
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

  const loadDependencies = async () => {
    try {
      if (isManager || isAdmin) {
        const empRes = await employeeService.list();
        if (empRes?.users) setEmployees(empRes.users);
      }
      const assetRes = await assetService.list();
      if (assetRes?.assets) setAssets(assetRes.assets);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    loadDependencies();
  }, []);

  const handleMenuClick = (event, req) => {
    setAnchorEl(event.currentTarget);
    setMenuReq(req);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReq(null);
  };

  const openModal = (type, req = menuReq) => {
    handleMenuClose();
    setActionModal({ open: true, type, request: req });
    setNotes('');
    setSelectedTech('');
  };

  const submitAction = async () => {
    try {
      const { type, request } = actionModal;
      if (type === 'Approve') await maintenanceService.approve(request.rawId, notes);
      if (type === 'Reject') await maintenanceService.reject(request.rawId, notes);
      if (type === 'Assign') await maintenanceService.assign(request.rawId, selectedTech);
      if (type === 'Start') await maintenanceService.updateProgress(request.rawId, notes);
      if (type === 'Resolve') await maintenanceService.resolve(request.rawId, notes);
      
      setActionModal({ open: false, type: '', request: null });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleRaiseSubmit = async () => {
    try {
      await maintenanceService.create(raiseData);
      setRaiseOpen(false);
      setRaiseData({ assetId: '', issueDescription: '', priority: 'Medium', imageUrl: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to raise request');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">Maintenance Board</Typography>
        <Button variant="contained" onClick={() => setRaiseOpen(true)}>Raise Request</Button>
      </Box>
      
      <Grid container spacing={2} sx={{ flex: 1, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {columns.map(col => (
          <Grid xs={12} sm={6} md={3} key={col} sx={{ minWidth: 320 }}>
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
                  {card.imageUrl && (
                    <Box 
                      component="img" 
                      src={card.imageUrl} 
                      alt="Maintenance Issue" 
                      sx={{ width: '100%', height: 'auto', maxHeight: 120, objectFit: 'cover', borderRadius: '8px', mb: 2 }} 
                    />
                  )}
                  
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
                    
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, card)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <MaintenanceTimeline currentStepIndex={card.currentStep} />
                </Card>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {menuReq?.status === 'Pending Approval' && (isManager || isAdmin) && [
          <MenuItem key="Approve" onClick={() => openModal('Approve')}>Approve</MenuItem>,
          <MenuItem key="Reject" onClick={() => openModal('Reject')}>Reject</MenuItem>
        ]}
        {menuReq?.status === 'Pending Approval' && menuReq?.currentStep === 0 && (
          <MenuItem key="Start" onClick={() => openModal('Start')}>Start Work (Bypass)</MenuItem>
        )}
        {menuReq?.status === 'Technician Assigned' && (
          <MenuItem key="Start" onClick={() => openModal('Start')}>Start Work</MenuItem>
        )}
        {menuReq?.status === 'In Progress' && (
          <MenuItem key="Resolve" onClick={() => openModal('Resolve')}>Resolve</MenuItem>
        )}
        {(isManager || isAdmin) && menuReq?.status !== 'Resolved' && (
          <MenuItem key="Assign" onClick={() => openModal('Assign')}>Assign Technician</MenuItem>
        )}
      </Menu>

      {/* Action Modal */}
      <Dialog open={actionModal.open} onClose={() => setActionModal({ open: false, type: '', request: null })} fullWidth maxWidth="sm">
        <DialogTitle>{actionModal.type} Request {actionModal.request?.id}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {actionModal.type === 'Assign' && (
            <FormControl fullWidth>
              <InputLabel>Technician</InputLabel>
              <Select
                value={selectedTech}
                label="Technician"
                onChange={(e) => setSelectedTech(e.target.value)}
              >
                {employees.map(emp => (
                  <MenuItem key={emp._id} value={emp.employee?._id}>{emp.employee?.name} ({emp.user?.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionModal({ open: false, type: '', request: null })}>Cancel</Button>
          <Button variant="contained" onClick={submitAction}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Raise Request Modal */}
      <Dialog open={raiseOpen} onClose={() => setRaiseOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Raise Maintenance Request</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Asset</InputLabel>
            <Select
              value={raiseData.assetId}
              label="Asset"
              onChange={(e) => setRaiseData({ ...raiseData, assetId: e.target.value })}
            >
              {assets.map(a => (
                <MenuItem key={a._id} value={a._id}>{a.name} ({a.assetTag})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={raiseData.priority}
              label="Priority"
              onChange={(e) => setRaiseData({ ...raiseData, priority: e.target.value })}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Issue Description"
            fullWidth
            multiline
            rows={3}
            value={raiseData.issueDescription}
            onChange={(e) => setRaiseData({ ...raiseData, issueDescription: e.target.value })}
          />
          <TextField
            label="Image URL (Optional)"
            fullWidth
            value={raiseData.imageUrl}
            onChange={(e) => setRaiseData({ ...raiseData, imageUrl: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRaiseOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleRaiseSubmit}
            disabled={!raiseData.assetId || raiseData.issueDescription.trim().length < 5}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
