import React from 'react';
import { Box, Stepper, Step, StepLabel, Typography } from '@mui/material';

const steps = ['Pending Approval', 'Technician Assigned', 'In Progress', 'Resolved'];

export default function MaintenanceTimeline({ currentStepIndex }) {
  return (
    <Box sx={{ width: '100%', mt: 3, mb: 2 }}>
      <Stepper activeStep={currentStepIndex} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>
              <Typography variant="caption" fontWeight="500">{label}</Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
