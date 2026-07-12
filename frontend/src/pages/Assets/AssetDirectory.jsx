import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Typography, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { Search, Add, FilterList } from '@mui/icons-material';
import AssetStatusChip from './components/AssetStatusChip';
import AssetDetailsDrawer from './AssetDetailsDrawer';
import assetService from '../../services/assetService';

export default function AssetDirectory() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await assetService.list({
        search,
        page: page + 1,
        limit: rowsPerPage
      });
      if (res && res.assets) {
        const mapped = res.assets.map(asset => ({
          id: asset.assetTag,
          rawId: asset._id,
          name: asset.name,
          category: asset.categoryId?.name || 'Unassigned',
          status: asset.lifecycleStatus,
          location: asset.location || 'Unknown',
          cost: asset.acquisitionCost || 0,
          acquisitionDate: asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString() : 'N/A'
        }));
        setAssets(mapped);
        setTotal(res.total || res.assets.length);
      }
    } catch (err) {
      console.error('Failed to fetch assets list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, page, rowsPerPage]);

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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No assets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow 
                      key={asset.id} 
                      hover 
                      onClick={() => handleRowClick(asset)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{asset.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{asset.name}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell><AssetStatusChip status={asset.status} /></TableCell>
                      <TableCell>{asset.location}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={total}
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
