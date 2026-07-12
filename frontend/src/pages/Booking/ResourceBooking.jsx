import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Typography, Grid, Paper, Select, MenuItem, 
  FormControl, InputLabel, TextField, Button, Alert, List, ListItem, ListItemText, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip
} from '@mui/material';
import { Edit as EditIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../../components/layout/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import assetService from '../../services/assetService';
import bookingService from '../../services/bookingService';

export default function ResourceBooking() {
  const { user } = useAuth();
  const { isManager, isAdmin } = usePermission();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  
  const [bookings, setBookings] = useState([]);
  
  // New booking form
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoading(true);
        // Fetch only assets marked as shared bookable
        const res = await assetService.list({ isSharedBookable: true });
        if (res && res.assets) {
          setBookableAssets(res.assets);
          if (res.assets.length > 0) {
            setSelectedAssetId(res.assets[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load shared assets', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  const fetchBookings = async () => {
    if (!selectedAssetId) return;
    try {
      const res = await bookingService.list({ assetId: selectedAssetId });
      if (res && res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings list', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedAssetId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedAssetId || !startTime || !endTime) {
      setErrorMsg('All fields are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        assetId: selectedAssetId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose: purpose || 'Resource booking'
      };

      await bookingService.create(payload);
      setSuccessMsg('Slot booked successfully!');
      setStartTime('');
      setEndTime('');
      setPurpose('');
      fetchBookings();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg('Conflict: The requested time slot overlaps with an existing booking.');
      } else {
        setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to create booking.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingService.cancel(bookingId);
      setSuccessMsg('Booking cancelled successfully.');
      fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to cancel booking.');
    }
  };

  const openRescheduleModal = (booking) => {
    setSelectedBooking(booking);
    setNewStartTime(new Date(booking.startTime).toISOString().slice(0, 16));
    setNewEndTime(new Date(booking.endTime).toISOString().slice(0, 16));
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!newStartTime || !newEndTime) {
      setErrorMsg('Start and end times are required for rescheduling.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      await bookingService.update(selectedBooking._id, {
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime)
      });
      setSuccessMsg('Booking rescheduled successfully.');
      setRescheduleOpen(false);
      fetchBookings();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg('Conflict: The rescheduled time slot overlaps with an existing booking.');
      } else {
        setErrorMsg(err.response?.data?.error?.message || 'Failed to reschedule booking.');
      }
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

  const selectedAsset = bookableAssets.find(a => a._id === selectedAssetId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Resource Booking</Typography>

      <Grid container spacing={3}>
        {/* Left column: Select Resource & New Booking */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
            <Typography variant="h6" mb={2}>Select Resource</Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Shared Asset</InputLabel>
              <Select
                value={selectedAssetId}
                label="Shared Asset"
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {bookableAssets.length === 0 ? (
                  <MenuItem value="">No bookable resources</MenuItem>
                ) : (
                  bookableAssets.map(asset => (
                    <MenuItem key={asset._id} value={asset._id}>{asset.name} ({asset.assetTag})</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" mb={2}>Reserve Slot</Typography>
            
            {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

            <Box component="form" onSubmit={handleBook}>
              <TextField
                label="Start Date Time"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="End Date Time"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Purpose of Booking"
                fullWidth
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button 
                variant="contained" 
                type="submit" 
                fullWidth
                disabled={!selectedAssetId || submitting}
                sx={{ borderRadius: '8px', py: 1.2 }}
              >
                {submitting ? 'Creating booking...' : 'Confirm Reservation'}
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Right column: Schedule listings */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', minHeight: '400px' }}>
            <Typography variant="h6" mb={2}>
              Schedule for {selectedAsset ? `${selectedAsset.name} (${selectedAsset.assetTag})` : 'Selected Resource'}
            </Typography>
            
            <List sx={{ mt: 2 }}>
              {bookings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No bookings scheduled for this resource.</Typography>
              ) : (
                bookings.map((booking) => {
                  const startStr = new Date(booking.startTime).toLocaleString();
                  const endStr = new Date(booking.endTime).toLocaleString();
                  const userName = booking.bookedByEmployee?.name || 'AssetFlow Actor';
                  
                  const isOwner = booking.bookedBy?._id === user?._id || booking.bookedBy === user?._id;
                  const canModify = (isOwner || isManager || isAdmin) && booking.status !== 'Cancelled';

                  return (
                    <Paper key={booking._id} sx={{ p: 2, mb: 2, bgcolor: booking.status === 'Cancelled' ? '#f5f5f5' : '#f8fafc', borderLeft: booking.status === 'Cancelled' ? '4px solid #9e9e9e' : '4px solid #1976d2', borderRadius: '4px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600" sx={{ textDecoration: booking.status === 'Cancelled' ? 'line-through' : 'none' }}>
                            {booking.purpose || 'Reserved Slot'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Scheduled: {startStr} - {endStr}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.2, fontWeight: 500 }}>
                            Reserved by: {userName}
                          </Typography>
                          <Chip 
                            label={booking.status} 
                            size="small" 
                            color={booking.status === 'Upcoming' || booking.status === 'Ongoing' ? 'primary' : 'default'} 
                            sx={{ mt: 1, height: 20, fontSize: '0.7rem' }} 
                          />
                        </Box>
                        {canModify && (
                          <Box>
                            <IconButton size="small" onClick={() => openRescheduleModal(booking)} color="primary" title="Reschedule">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleCancelBooking(booking._id)} color="error" title="Cancel">
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  );
                })
              )}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Booking</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {errorMsg && rescheduleOpen && <Alert severity="error">{errorMsg}</Alert>}
          <TextField
            label="New Start Date Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newStartTime}
            onChange={(e) => setNewStartTime(e.target.value)}
          />
          <TextField
            label="New End Date Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newEndTime}
            onChange={(e) => setNewEndTime(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRescheduleOpen(false)}>Cancel</Button>
          <Button onClick={handleReschedule} variant="contained" disabled={submitting}>
            {submitting ? 'Updating...' : 'Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
