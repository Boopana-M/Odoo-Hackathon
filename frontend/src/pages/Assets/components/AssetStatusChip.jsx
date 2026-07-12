import React from 'react';
import { Chip } from '@mui/material';

export default function AssetStatusChip({ status }) {
  let color = 'default';
  
  switch (status) {
    case 'Available':
      color = 'success';
      break;
    case 'Allocated':
    case 'Reserved':
      color = 'primary';
      break;
    case 'Under Maintenance':
      color = 'warning';
      break;
    case 'Lost':
    case 'Retired':
    case 'Disposed':
      color = 'error';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip 
      label={status} 
      color={color} 
      size="small" 
      sx={{ borderRadius: '4px', fontWeight: 500 }} 
    />
  );
}
