import React, { useState } from 'react';
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

// Mock Data
const initialDepartments = [
  { id: 'DEP-01', name: 'Engineering', manager: 'Manoj V', parent: 'Operations', status: 'Active' },
  { id: 'DEP-02', name: 'Product Management', manager: 'Alice Vance', parent: 'Operations', status: 'Active' },
  { id: 'DEP-03', name: 'Marketing', manager: 'Sarah Connor', parent: 'Sales & Marketing', status: 'Active' },
  { id: 'DEP-04', name: 'Human Resources', manager: 'Emma Stone', parent: 'Executive', status: 'Active' },
  { id: 'DEP-05', name: 'Finance', manager: 'Frank Castle', parent: 'Executive', status: 'Active' },
];

const initialCategories = [
  { id: 'CAT-01', name: 'IT Hardware', description: 'Laptops, Monitors, Servers and Workstations', warranty: '36 Months', status: 'Active' },
  { id: 'CAT-02', name: 'Office Furniture', description: 'Desks, Chairs, Conference room tables', warranty: '60 Months', status: 'Active' },
  { id: 'CAT-03', name: 'Vehicles', description: 'Company cars and delivery vans', warranty: '48 Months', status: 'Active' },
  { id: 'CAT-04', name: 'Mobile Devices', description: 'Smartphones and tablets', warranty: '24 Months', status: 'Active' },
];

const initialEmployees = [
  { id: 'EMP-001', name: 'Manoj V', email: 'manoj.v@assetflow.com', department: 'Engineering', role: 'Asset Manager', status: 'Active' },
  { id: 'EMP-002', name: 'Alice Vance', email: 'alice.vance@assetflow.com', department: 'Product Management', role: 'Department Head', status: 'Active' },
  { id: 'EMP-003', name: 'Sarah Connor', email: 'sarah.connor@assetflow.com', department: 'Marketing', role: 'Department Head', status: 'Active' },
  { id: 'EMP-004', name: 'John Doe', email: 'john.doe@assetflow.com', department: 'Engineering', role: 'Employee', status: 'Active' },
  { id: 'EMP-005', name: 'Emma Stone', email: 'emma.stone@assetflow.com', department: 'Human Resources', role: 'Department Head', status: 'Active' },
  { id: 'EMP-006', name: 'Frank Castle', email: 'frank.castle@assetflow.com', department: 'Finance', role: 'Employee', status: 'Inactive' },
];

export default function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lists state
  const [departments, setDepartments] = useState(initialDepartments);
  const [categories, setCategories] = useState(initialCategories);
  const [employees, setEmployees] = useState(initialEmployees);

  // Dialog open controls
  const [deptOpen, setDeptOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  // Selected item / form state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [deptForm, setDeptForm] = useState({ name: '', manager: '', parent: '', status: 'Active' });
  const [catForm, setCatForm] = useState({ name: '', description: '', warranty: '', status: 'Active' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm('');
  };

  // Add Department Action
  const handleAddDept = () => {
    const newId = `DEP-0${departments.length + 1}`;
    setDepartments((prev) => [...prev, { id: newId, ...deptForm }]);
    setDeptOpen(false);
    setDeptForm({ name: '', manager: '', parent: '', status: 'Active' });
  };

  // Add Category Action
  const handleAddCat = () => {
    const newId = `CAT-0${categories.length + 1}`;
    setCategories((prev) => [...prev, { id: newId, ...catForm }]);
    setCatOpen(false);
    setCatForm({ name: '', description: '', warranty: '', status: 'Active' });
  };

  // Role Promotion Action
  const handlePromoteRole = () => {
    if (selectedEmployee) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id ? { ...emp, role: selectedRole } : emp
        )
      );
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDeptOpen(true)}>
                  Add Dept
                </Button>
              )}
              {activeTab === 1 && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCatOpen(true)}>
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
                      <TableRow key={dept.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{dept.id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{dept.name}</TableCell>
                        <TableCell>{dept.manager}</TableCell>
                        <TableCell>{dept.parent || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={dept.status}
                            size="small"
                            color={dept.status === 'Active' ? 'success' : 'default'}
                            icon={dept.status === 'Active' ? <CheckCircleIcon style={{ fontSize: 14 }} /> : <CancelIcon style={{ fontSize: 14 }} />}
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
                    .map((cat) => (
                      <TableRow key={cat.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{cat.id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat.description}
                        </TableCell>
                        <TableCell>{cat.warranty}</TableCell>
                        <TableCell>
                          <Chip
                            label={cat.status}
                            size="small"
                            color={cat.status === 'Active' ? 'success' : 'default'}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuClick(e, cat)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    .filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((emp) => (
                      <TableRow key={emp.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{emp.id}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={emp.role}
                            size="small"
                            variant="outlined"
                            color={emp.role === 'Admin' || emp.role === 'Asset Manager' ? 'primary' : 'default'}
                            icon={<ShieldIcon style={{ fontSize: 13 }} />}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.status}
                            size="small"
                            color={emp.status === 'Active' ? 'success' : 'default'}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon sx={{ fontSize: 12 }} />}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setSelectedRole(emp.role);
                              setRoleOpen(true);
                            }}
                            sx={{ fontSize: '0.75rem', py: 0.25 }}
                          >
                            Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Row context Action menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Modify Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Set Inactive</ListItemText>
        </MenuItem>
      </Menu>

      {/* DIALOG 1: ADD DEPARTMENT */}
      <Dialog open={deptOpen} onClose={() => setDeptOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Department</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Department Name"
            fullWidth
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />
          <TextField
            label="Manager Name"
            fullWidth
            value={deptForm.manager}
            onChange={(e) => setDeptForm({ ...deptForm, manager: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Parent Department</InputLabel>
            <Select
              value={deptForm.parent}
              label="Parent Department"
              onChange={(e) => setDeptForm({ ...deptForm, parent: e.target.value })}
            >
              <MenuItem value="Operations">Operations</MenuItem>
              <MenuItem value="Sales & Marketing">Sales & Marketing</MenuItem>
              <MenuItem value="Executive">Executive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeptOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDept} variant="contained">Create Department</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 2: ADD CATEGORY */}
      <Dialog open={catOpen} onClose={() => setCatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Asset Category</DialogTitle>
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
          <Button onClick={handleAddCat} variant="contained">Create Category</Button>
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
