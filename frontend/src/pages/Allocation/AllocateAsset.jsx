import React, { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Autocomplete, Alert } from '@mui/material';

export default function AllocateAsset() {
  const [asset, setAsset] = useState(null);
  const [assignee, setAssignee] = useState(null);

  const mockAssets = [
    { label: 'AF-0114 - Dell Laptop', id: 'AF-0114', allocatedTo: 'Priya Shah (Engineering)' },
    { label: 'AF-0201 - Office Chair', id: 'AF-0201', allocatedTo: null }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h4" fontWeight="600" mb={3}>Allocate Asset</Typography>
      
      <Card sx={{ p: 3, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Autocomplete
          options={mockAssets}
          value={asset}
          onChange={(e, val) => setAsset(val)}
          renderInput={(params) => <TextField {...params} label="Select Asset" fullWidth sx={{ mb: 2 }} />}
        />

        {asset && asset.allocatedTo && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Already Allocated to {asset.allocatedTo}. Direct re-allocation is blocked. Submit a transfer request instead.
          </Alert>
        )}

        <TextField 
          fullWidth 
          label="Allocate To (Employee / Department)" 
          disabled={asset?.allocatedTo ? true : false}
          sx={{ mb: 3 }}
        />

        <Button 
          variant="contained" 
          color="primary" 
          disabled={!asset || asset.allocatedTo}
          sx={{ borderRadius: '8px' }}
        >
          Submit Allocation
        </Button>
      </Card>
    </Box>
  );
}
