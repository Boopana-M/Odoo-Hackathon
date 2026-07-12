import React from 'react';
import { Chip } from '@mui/material';

export default function PriorityChip({ priority }) {
  let color = 'default';
  
  switch (priority) {
    case 'Critical':
      color = 'error';
      break;
    case 'High':
      color = 'warning';
      break;
    case 'Medium':
      color = 'info';
      break;
    case 'Low':
      color = 'success';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip 
      label={priority} 
      color={color} 
      size="small" 
      sx={{ borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }} 
    />
  );
}
