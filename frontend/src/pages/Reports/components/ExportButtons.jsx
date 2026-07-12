import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { Download as DownloadIcon, PictureAsPdf as PdfIcon, TableChart as CsvIcon } from '@mui/icons-material';

export default function ExportButtons() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button 
        variant="outlined" 
        color="primary" 
        startIcon={<DownloadIcon />} 
        onClick={handleClick}
        sx={{ borderRadius: '8px' }}
      >
        Export Report
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleClose}><PdfIcon sx={{ mr: 1, color: 'error.main' }} /> Export as PDF</MenuItem>
        <MenuItem onClick={handleClose}><CsvIcon sx={{ mr: 1, color: 'success.main' }} /> Export as CSV</MenuItem>
      </Menu>
    </>
  );
}
