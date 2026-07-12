import React, { useState } from 'react';
import { 
  Box, Card, Typography, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  InputAdornment, IconButton
} from '@mui/material';
import { Search, Add, FilterList } from '@mui/icons-material';
import AssetStatusChip from './components/AssetStatusChip';
import AssetDetailsDrawer from './AssetDetailsDrawer';

const mockAssets = [
  { id: 'AF-0012', name: 'Dell Laptop XPS 15', category: 'Electronics', status: 'Allocated', location: 'Bengaluru, Desk 12', cost: 1200 },
  { id: 'AF-0062', name: 'Sony Projector 4K', category: 'Electronics', status: 'Under Maintenance', location: 'HQ Floor 2', cost: 800 },
  { id: 'AF-0201', name: 'Ergonomic Office Chair', category: 'Furniture', status: 'Available', location: 'Warehouse A', cost: 250 },
  { id: 'AF-0334', name: 'Company Van', category: 'Vehicles', status: 'Allocated', location: 'Field Ops East', cost: 25000 },
];

export default function AssetDirectory() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600" color="text.primary">
          Asset Directory
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
        >
          Register Asset
        </Button>
      </Box>

      <Card sx={{ borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eee' }}>
          <TextField
            fullWidth
            placeholder="Search by tag, serial, or QR code..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }}
          />
          <Button variant="outlined" startIcon={<FilterList />} sx={{ textTransform: 'none' }}>
            Filters
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tag ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockAssets.map((asset) => (
                <TableRow 
                  key={asset.id} 
                  hover 
                  onClick={() => handleRowClick(asset)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell fontWeight="500">{asset.id}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell><AssetStatusChip status={asset.status} /></TableCell>
                  <TableCell>{asset.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={mockAssets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      <AssetDetailsDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        asset={selectedAsset} 
      />
    </Box>
  );
}
