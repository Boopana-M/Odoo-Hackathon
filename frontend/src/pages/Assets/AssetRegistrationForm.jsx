import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, MenuItem, Typography, Box, CircularProgress
} from '@mui/material';
import assetService from '../../services/assetService';
import categoryService from '../../services/categoryService';

export default function AssetRegistrationForm({ open, onClose, onAssetCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    categoryId: '',
    location: '',
    acquisitionCost: ''
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  React.useEffect(() => {
    async function loadCategories() {
      try {
        const data = await categoryService.list();
        if (data && data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    if (open) {
      loadCategories();
    }
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await assetService.create({
        ...formData,
        acquisitionCost: Number(formData.acquisitionCost)
      });
      onAssetCreated(); // Refresh the parent list
      onClose(); // Close the modal
    } catch (error) {
      console.error('Failed to register asset', error);
      alert('Failed to register asset. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
        Register New Asset
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Asset Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. MacBook Pro M3"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Asset Tag"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleChange}
                placeholder="e.g. AF-LAP-001"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                required
                fullWidth
                label="Category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={loadingCategories || categories.length === 0}
                helperText={categories.length === 0 && !loadingCategories ? "No categories found. Create one in Organization Setup first." : ""}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. HQ Building A"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Acquisition Cost ($)"
                name="acquisitionCost"
                value={formData.acquisitionCost}
                onChange={handleChange}
                placeholder="0.00"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Register Asset
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
