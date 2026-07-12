import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Typography, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  InputAdornment, IconButton, CircularProgress, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Search, Add, FilterList } from '@mui/icons-material';
import AssetStatusChip from './components/AssetStatusChip';
import AssetDetailsDrawer from './AssetDetailsDrawer';
import AssetRegistrationForm from './AssetRegistrationForm';
import assetService from '../../services/assetService';
import employeeService from '../../services/employeeService';
import transferService from '../../services/transferService';
import { usePermission } from '../../hooks/usePermission';

export default function AssetDirectory() {
  const { isManager } = usePermission();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showMyAssets, setShowMyAssets] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState({ assetId: '', destinationEmployeeId: '', reason: '' });
  const [employees, setEmployees] = useState([]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await assetService.list({
        search,
        page: page + 1,
        limit: rowsPerPage,
        myAssets: showMyAssets
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
  }, [search, page, rowsPerPage, showMyAssets]);

  useEffect(() => {
    if (showMyAssets) {
      employeeService.list().then(res => {
        if (res && res.users) setEmployees(res.users);
      }).catch(err => console.error(err));
    }
  }, [showMyAssets]);

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  };

  const handleTransferSubmit = async () => {
    try {
      await transferService.create(transferData);
      setTransferOpen(false);
      setTransferData({ assetId: '', destinationEmployeeId: '', reason: '' });
      alert('Transfer Request Submitted');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to request transfer');
    }
  };

  const openTransferModal = (assetId) => {
    setTransferData({ ...transferData, assetId });
    setTransferOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600" color="text.primary">
          Asset Directory
        </Typography>
        {isManager && (
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setRegisterOpen(true)}
            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
          >
            Register Asset
          </Button>
        )}
      </Box>

      <Card sx={{ borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eee', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search by tag, serial, or QR code..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }
            }}
          />
          <FormControlLabel
            control={<Switch checked={showMyAssets} onChange={(e) => setShowMyAssets(e.target.checked)} />}
            label="My Assets"
          />
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
                  {showMyAssets && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showMyAssets ? 6 : 5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
                      {showMyAssets && (
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); openTransferModal(asset.rawId); }}>
                            Transfer
                          </Button>
                        </TableCell>
                      )}
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

      <AssetRegistrationForm 
        open={registerOpen} 
        onClose={() => setRegisterOpen(false)} 
        onAssetCreated={() => {
          setRegisterOpen(false);
          fetchAssets();
        }}
      />
    </Box>
  );
}
