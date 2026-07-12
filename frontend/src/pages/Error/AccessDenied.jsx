import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Security as SecurityIcon } from '@mui/icons-material';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', p: 3 }}>
      <SecurityIcon sx={{ fontSize: 80, color: '#d32f2f', mb: 2 }} />
      <Typography variant="h3" fontWeight="700" color="text.primary" gutterBottom>
        403 - Access Denied
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 500, mb: 4 }}>
        You do not have the required permissions to view this page. If you believe this is an error, please contact your organization administrator.
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate('/dashboard')} sx={{ borderRadius: 2, textTransform: 'none' }}>
        Return to Dashboard
      </Button>
    </Box>
  );
}
