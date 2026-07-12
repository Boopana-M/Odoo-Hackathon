import React, { useState, useEffect } from 'react';
import departmentService from '../../services/departmentService';
import categoryService from '../../services/categoryService';
import employeeService from '../../services/employeeService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Menu,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Lists state
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Dialog open controls
  const [deptOpen, setDeptOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  // Selected item / form state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [deptForm, setDeptForm] = useState({ id: null, name: '', manager: '', parent: '', status: 'Active' });
  const [catForm, setCatForm] = useState({ id: null, name: '', description: '', warranty: '', status: 'Active' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, catRes] = await Promise.all([
        departmentService.list(),
        categoryService.list(),
      ]);
      setDepartments(deptRes.departments || []);
      setCategories(catRes.categories || []);

      const currentUserStr = localStorage.getItem('user');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      if (currentUser && currentUser.role === 'Admin') {
        const empRes = await employeeService.list();
        setEmployees(empRes.users || []);
      }
    } catch (err) {
      console.error('Failed to load organization settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
  };

  // Add or Edit Department Action
  const handleAddDept = async () => {
    try {
      if (deptForm.id) {
        await departmentService.update(deptForm.id, {
          name: deptForm.name,
          isActive: deptForm.status === 'Active',
          parentDepartmentId: deptForm.parent || null
        });
      } else {
        await departmentService.create({
          name: deptForm.name,
          isActive: deptForm.status === 'Active',
          parentDepartmentId: deptForm.parent || null
        });
      }
      setDeptOpen(false);
      setDeptForm({ id: null, name: '', manager: '', parent: '', status: 'Active' });
      loadData();
    } catch (err) {
      console.error('Failed to save department', err);
    }
  };

  // Add or Edit Category Action
  const handleAddCat = async () => {
    try {
      if (catForm.id) {
        await categoryService.update(catForm.id, {
          name: catForm.name,
          description: catForm.description,
          isActive: catForm.status === 'Active',
        });
      } else {
        await categoryService.create({
          name: catForm.name,
          description: catForm.description,
          isActive: catForm.status === 'Active',
          fieldDefinitions: [
            { key: 'warranty', label: 'Warranty (Months)', type: 'string', required: false }
          ]
        });
      }
      setCatOpen(false);
      setCatForm({ id: null, name: '', description: '', warranty: '', status: 'Active' });
      loadData();
    } catch (err) {
      console.error('Failed to save category', err);
    }
  };

  // Role Promotion Action
  const handlePromoteRole = async () => {
    if (selectedEmployee) {
      try {
        await employeeService.updateRole(selectedEmployee.id, selectedRole);
        loadData();
      } catch (err) {
        console.error('Failed to promote user role', err);
      }
    }
    setRoleOpen(false);
    setSelectedEmployee(null);
  };

  // Action Menu anchor logic
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);

  const handleMenuClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setMenuTarget(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

  const handleEditOpen = () => {
    if (!menuTarget) return;
    if (activeTab === 0) {
      // Department
      setDeptForm({
        id: menuTarget._id,
        name: menuTarget.name,
        manager: menuTarget.departmentHeadId?._id || '',
        parent: menuTarget.parentDepartmentId?._id || '',
        status: menuTarget.isActive ? 'Active' : 'Inactive'
      });
      setDeptOpen(true);
    } else if (activeTab === 1) {
      // Category
      const warrantyField = menuTarget.fieldDefinitions?.find(f => f.key === 'warranty');
      setCatForm({
        id: menuTarget._id,
        name: menuTarget.name,
        description: menuTarget.description,
        warranty: warrantyField?.label || '36 Months',
        status: menuTarget.isActive ? 'Active' : 'Inactive'
      });
      setCatOpen(true);
    }
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    if (!menuTarget) return;
    try {
      const newStatus = !menuTarget.isActive;
      if (activeTab === 0) {
        await departmentService.update(menuTarget._id, { isActive: newStatus });
      } else if (activeTab === 1) {
        await categoryService.update(menuTarget._id, { isActive: newStatus });
      }
      loadData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Organization Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage system departments, custom asset categories, and assign employee roles.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#e3f2fd', color: '#1976d2' }}>
                <BusinessIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{departments.length}</Typography>
                <Typography variant="body2" color="text.secondary">Departments Configured</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#e8f5e9', color: '#2e7d32' }}>
                <CategoryIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{categories.length}</Typography>
                <Typography variant="body2" color="text.secondary">Asset Categories</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f3e5f5', color: '#9c27b0' }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{employees.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total Employees Directory</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Container */}
      <Card sx={{ minHeight: '500px' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Tabs header & filter bar */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              pt: 2.5,
              pb: 1.5,
              borderBottom: '1px solid #e2e8f0',
              gap: 2,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                },
              }}
            >
              <Tab label="Departments" />
              <Tab label="Asset Categories" />
              <Tab label="Employee Registry" />
            </Tabs>

            {/* Actions & Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                placeholder="Search..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: { xs: '100%', sm: '200px' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              {activeTab === 0 && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                  setDeptForm({ id: null, name: '', manager: '', parent: '', status: 'Active' });
                  setDeptOpen(true);
                }}>
                  Add Dept
                </Button>
              )}
              {activeTab === 1 && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                  setCatForm({ id: null, name: '', description: '', warranty: '', status: 'Active' });
                  setCatOpen(true);
                }}>
                  Add Category
                </Button>
              )}
            </Box>
          </Box>

          {/* TAB 1: DEPARTMENTS */}
          {activeTab === 0 && (
            <TableContainer sx={{ p: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Dept ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Manager / Head</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Parent Unit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments
                    .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((dept) => (
                      <TableRow key={dept._id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{dept._id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{dept.name}</TableCell>
                        <TableCell>{dept.departmentHeadId?.name || 'Unassigned'}</TableCell>
                        <TableCell>{dept.parentDepartmentId?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={dept.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={dept.isActive ? 'success' : 'default'}
                            icon={dept.isActive ? <CheckCircleIcon style={{ fontSize: 14 }} /> : <CancelIcon style={{ fontSize: 14 }} />}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuClick(e, dept)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 2: ASSET CATEGORIES */}
          {activeTab === 1 && (
            <TableContainer sx={{ p: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Category ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Base Warranty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories
                    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((cat) => {
                      const warrantyField = cat.fieldDefinitions?.find(f => f.key === 'warranty');
                      const warrantyVal = warrantyField?.label || '36 Months';
                      return (
                        <TableRow key={cat._id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{cat._id.slice(-6).toUpperCase()}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cat.description}
                          </TableCell>
                          <TableCell>{warrantyVal}</TableCell>
                          <TableCell>
                            <Chip
                              label={cat.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={cat.isActive ? 'success' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={(e) => handleMenuClick(e, cat)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 3: EMPLOYEES */}
          {activeTab === 2 && (
            <TableContainer sx={{ p: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Corporate Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>System Access Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Manage Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees
                    .filter((item) => {
                      const name = item.employee?.name || 'Unassigned';
                      const email = item.user?.email || '';
                      return name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map((item) => {
                      const emp = item.employee;
                      const usr = item.user;
                      const empName = emp?.name || 'Unassigned';
                      const deptName = departments.find(d => d._id === emp?.departmentId)?.name || 'Unassigned';
                      return (
                        <TableRow key={usr._id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{emp?._id?.slice(-6).toUpperCase() || usr._id.slice(-6).toUpperCase()}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{empName}</TableCell>
                          <TableCell>{usr.email}</TableCell>
                          <TableCell>{deptName}</TableCell>
                          <TableCell>
                            <Chip
                              label={usr.role}
                              size="small"
                              variant="outlined"
                              color={usr.role === 'Admin' || usr.role === 'Asset Manager' ? 'primary' : 'default'}
                              icon={<ShieldIcon style={{ fontSize: 13 }} />}
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={usr.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={usr.isActive ? 'success' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon sx={{ fontSize: 12 }} />}
                              onClick={() => {
                                setSelectedEmployee({ id: usr._id, name: empName, email: usr.email });
                                setSelectedRole(usr.role);
                                setRoleOpen(true);
                              }}
                              sx={{ fontSize: '0.75rem', py: 0.25 }}
                            >
                              Access
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Row context Action menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditOpen}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Modify Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleStatus} sx={{ color: menuTarget?.isActive ? 'error.main' : 'success.main' }}>
          <ListItemIcon>
            {menuTarget?.isActive ? <CancelIcon fontSize="small" color="error" /> : <CheckCircleIcon fontSize="small" color="success" />}
          </ListItemIcon>
          <ListItemText>{menuTarget?.isActive ? 'Set Inactive' : 'Set Active'}</ListItemText>
        </MenuItem>
      </Menu>

      {/* DIALOG 1: ADD DEPARTMENT */}
      <Dialog open={deptOpen} onClose={() => setDeptOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{deptForm.id ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Department Name"
            fullWidth
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />
          <TextField
            label="Manager Name (Not Used Yet)"
            fullWidth
            value={deptForm.manager}
            disabled
            helperText="Manager assignment relies on Employee Object IDs."
            onChange={(e) => setDeptForm({ ...deptForm, manager: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Parent Department</InputLabel>
            <Select
              value={deptForm.parent}
              label="Parent Department"
              onChange={(e) => setDeptForm({ ...deptForm, parent: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {departments.filter(d => d._id !== deptForm.id).map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeptOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDept} variant="contained">{deptForm.id ? 'Save Changes' : 'Create Department'}</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 2: ADD CATEGORY */}
      <Dialog open={catOpen} onClose={() => setCatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{catForm.id ? 'Edit Asset Category' : 'Add Asset Category'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Category Name"
            fullWidth
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
          />
          <TextField
            label="Warranty Period (e.g. 36 Months)"
            fullWidth
            value={catForm.warranty}
            onChange={(e) => setCatForm({ ...catForm, warranty: e.target.value })}
          />
          <TextField
            label="Category Description"
            fullWidth
            multiline
            rows={3}
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCatOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCat} variant="contained">{catForm.id ? 'Save Changes' : 'Create Category'}</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 3: ROLE PROMOTION assignment */}
      <Dialog open={roleOpen} onClose={() => setRoleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Manage System Access Role</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedEmployee && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedEmployee.name}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedEmployee.email}</Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel>System Access Level</InputLabel>
            <Select
              value={selectedRole}
              label="System Access Level"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="Employee">Employee</MenuItem>
              <MenuItem value="Department Head">Department Head</MenuItem>
              <MenuItem value="Asset Manager">Asset Manager</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRoleOpen(false)}>Cancel</Button>
          <Button onClick={handlePromoteRole} variant="contained">Update Privileges</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
