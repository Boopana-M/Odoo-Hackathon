import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Typography, Grid, Paper, Select, MenuItem, 
  FormControl, InputLabel, TextField, Button, Alert, List, ListItem, ListItemText, Divider, CircularProgress 
} from '@mui/material';
import assetService from '../../services/assetService';
import bookingService from '../../services/bookingService';

export default function ResourceBooking() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  
  const [bookings, setBookings] = useState([]);
  
  // New booking form
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

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
      const msg = err.response?.data?.error?.message || err.message || 'Double booking / overlap detected.';
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
                  return (
                    <Paper key={booking._id} sx={{ p: 2, mb: 2, bgcolor: '#f8fafc', borderLeft: '4px solid #1976d2', borderRadius: '4px' }}>
                      <Typography variant="subtitle2" fontWeight="600">{booking.purpose || 'Reserved Slot'}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Scheduled: {startStr} - {endStr}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.2, fontWeight: 500 }}>
                        Reserved by: {userName} (Status: {booking.status})
                      </Typography>
                    </Paper>
                  );
                })
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
