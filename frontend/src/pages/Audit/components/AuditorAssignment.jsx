import React from 'react';
import { Box, Avatar, AvatarGroup, Typography } from '@mui/material';

export default function AuditorAssignment({ auditors }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
      <Typography variant="body2" color="text.secondary" fontWeight="500">
        Assigned Auditors:
      </Typography>
      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.875rem' } }}>
        {auditors.map((auditor, index) => (
          <Avatar key={index} alt={auditor.name}>{auditor.initials}</Avatar>
        ))}
      </AvatarGroup>
    </Box>
  );
}
