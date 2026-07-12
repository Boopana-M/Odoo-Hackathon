import React from 'react';
import { Drawer, Box, Typography, Divider, IconButton, Grid, Paper } from '@mui/material';
import { Close, QrCode2 } from '@mui/icons-material';
import AssetStatusChip from './components/AssetStatusChip';

export default function AssetDetailsDrawer({ open, onClose, asset }) {
  if (!asset) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 450, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="600">{asset.id}</Typography>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <AssetStatusChip status={asset.status} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {asset.category}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Name</Typography>
            <Typography variant="body1" fontWeight="500">{asset.name}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="body1" fontWeight="500">{asset.location}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Acquisition Cost</Typography>
            <Typography variant="body1" fontWeight="500">${asset.cost}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Acquisition Date</Typography>
            <Typography variant="body1" fontWeight="500">2023-01-15</Typography>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
          <QrCode2 sx={{ fontSize: 60, color: '#333' }} />
          <Box>
            <Typography variant="subtitle2">Asset QR Badge</Typography>
            <Typography variant="caption" color="text.secondary">Scan to view details or allocate</Typography>
          </Box>
        </Paper>
      </Box>
    </Drawer>
  );
}
