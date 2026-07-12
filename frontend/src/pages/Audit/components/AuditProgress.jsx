import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

export default function AuditProgress({ verified, total }) {
  const percentage = Math.round((verified / total) * 100);
  
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="500">Audit Progress</Typography>
        <Typography variant="body2" color="text.secondary">{verified} / {total} Assets ({percentage}%)</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ 
          height: 10, 
          borderRadius: 5,
          backgroundColor: '#e2e8f0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: percentage === 100 ? '#2e7d32' : '#1976d2'
          }
        }} 
      />
    </Box>
  );
}
