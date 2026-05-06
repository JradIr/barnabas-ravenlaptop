// src/pages/admin/Manage.jsx
import React, { useState, useEffect, useCallback } from "react";
import AxiosInstance from "./AxiosInstance";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Pagination,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Clear as ClearIcon,
  PersonAdd as AddIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  People as StaffIcon,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material";

// Local formatDate function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return 'Invalid Date';
  }
};

export default function AdminManage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [actionDialog, setActionDialog] = useState({ open: false, type: "", user: null });
  const [createDialog, setCreateDialog] = useState({ open: false });
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    staff: 0,
    active: 0,
    inactive: 0
  });

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "staff"
  });

  const rowsPerPage = 10;

  // Role display names and colors
  const roleConfig = {
    staff: { label: 'Receptionist', icon: <StaffIcon sx={{ fontSize: 14 }} />, color: '#ff9800', bgColor: '#fff3e0' },
    admin: { label: 'Superuser', icon: <AdminIcon sx={{ fontSize: 14 }} />, color: '#9c27b0', bgColor: '#f3e5f5' }
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active' ? 'true' : 'false');
      params.append('page', page);
      params.append('page_size', rowsPerPage);
      
      const response = await AxiosInstance.get(`/users/?${params.toString()}`);
      
      const usersData = response.data.results || response.data;
      let usersArray = Array.isArray(usersData) ? usersData : [];
      
      // Filter for staff and admin roles only (exclude regular patients)
      usersArray = usersArray.filter(u => u.role === 'staff' || u.role === 'admin');
      
      setStaff(usersArray);
      setTotalCount(usersArray.length);
      setTotalPages(Math.ceil(usersArray.length / rowsPerPage));
      
      setStats({
        total: usersArray.length,
        admins: usersArray.filter(u => u.role === 'admin').length,
        staff: usersArray.filter(u => u.role === 'staff').length,
        active: usersArray.filter(u => u.is_active !== false).length,
        inactive: usersArray.filter(u => u.is_active === false).length
      });
      
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      setError(error.response?.data?.message || "Failed to load staff accounts");
      showToast("Failed to load staff accounts", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, filterStatus, page]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, open: false })), 4000);
  };

  const handleCreateStaff = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    
    if (formData.password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    
    if (!formData.username) {
      showToast("Username is required", "error");
      return;
    }
    
    if (!formData.email) {
      showToast("Email is required", "error");
      return;
    }
    
    setLoading(true);
    try {
      // Use the same register endpoint
      await AxiosInstance.post(`/register/`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      // Find the newly created user and update their role
      const usersResponse = await AxiosInstance.get(`/users/?search=${formData.email}`);
      const users = usersResponse.data.results || usersResponse.data;
      const newUser = users.find(u => u.email === formData.email);
      
      if (newUser) {
        // Update role based on selection
        await AxiosInstance.patch(`/users/${newUser.id}/`, {
          role: formData.role
        });
      }
      
      showToast(`${formData.role === 'admin' ? 'Superuser' : 'Receptionist'} account created successfully`, "success");
      setCreateDialog({ open: false });
      setFormData({ username: "", email: "", password: "", confirmPassword: "", role: "staff" });
      fetchStaff();
    } catch (error) {
      console.error("Failed to create staff:", error);
      const errorMsg = error.response?.data?.username?.[0] || 
                       error.response?.data?.email?.[0] || 
                       error.response?.data?.password?.[0] ||
                       "Failed to create account";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active;
      await AxiosInstance.patch(`/users/${user.id}/`, {
        is_active: newStatus
      });
      
      showToast(`Account ${newStatus ? 'activated' : 'deactivated'} successfully`, "success");
      fetchStaff();
      setActionDialog({ open: false, type: "", user: null });
    } catch (error) {
      console.error("Failed to toggle status:", error);
      showToast("Failed to update account status", "error");
    }
  };

  const handleDeleteStaff = async (user) => {
    setLoading(true);
    try {
      await AxiosInstance.delete(`/users/${user.id}/`);
      showToast(`Account deleted successfully`, "success");
      fetchStaff();
      setActionDialog({ open: false, type: "", user: null });
    } catch (error) {
      console.error("Failed to delete staff:", error);
      showToast("Failed to delete account", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (isActive) => {
    return (
      <Chip
        label={isActive ? "Active" : "Inactive"}
        size="small"
        sx={{
          bgcolor: isActive ? '#e0f2f1' : '#ffebee',
          color: isActive ? '#00695c' : '#c62828',
          fontWeight: 500,
        }}
      />
    );
  };

  const getRoleChip = (role) => {
    const config = roleConfig[role] || { label: role || 'Staff', icon: <StaffIcon sx={{ fontSize: 14 }} />, color: '#757575', bgColor: '#f5f5f5' };
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgColor,
          color: config.color,
          fontWeight: 500,
          '& .MuiChip-icon': {
            color: config.color
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #004d40 0%, #00695c 50%, #00796b 100%)',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
          User Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Create and manage staff and superuser accounts
        </Typography>
      </Box>

      {/* Stats Row */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 3, 
        flexWrap: 'wrap',
        pb: 2,
        borderBottom: '1px solid rgba(255,255,255,0.15)'
      }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Total Users</Typography>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{stats.total}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Superusers</Typography>
          <Typography variant="h5" sx={{ color: '#80cbc4', fontWeight: 'bold' }}>{stats.admins}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Receptionists</Typography>
          <Typography variant="h5" sx={{ color: '#80cbc4', fontWeight: 'bold' }}>{stats.staff}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Active</Typography>
          <Typography variant="h5" sx={{ color: '#a5d6a7', fontWeight: 'bold' }}>{stats.active}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Inactive</Typography>
          <Typography variant="h5" sx={{ color: '#ef9a9a', fontWeight: 'bold' }}>{stats.inactive}</Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog({ open: true })}
          sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#00695c' } }}
        >
          Create Account
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchStaff}
          disabled={loading}
          sx={{ borderColor: '#80cbc4', color: '#80cbc4', '&:hover': { borderColor: 'white', color: 'white' } }}
        >
          Refresh
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'white' }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchTerm(""); setPage(1); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                label="Role"
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="staff">Receptionists</MenuItem>
                <MenuItem value="admin">Superusers</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchStaff}
              disabled={loading}
              sx={{ bgcolor: '#00897b', '&:hover': { bgcolor: '#00695c' } }}
            >
              Go
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#80cbc4' } }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, textAlign: 'center' }}>
            Loading accounts...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#e0f2f1' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <MedicalIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">No accounts found</Typography>
                    <Typography variant="body2" color="textSecondary">Click "Create Account" to add users</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((user, idx) => {
                  const isActive = user.is_active !== false;
                  
                  return (
                    <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: user.role === 'admin' ? '#9c27b0' : '#ff9800', width: 40, height: 40 }}>
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>{user.username}</Typography>
                            <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>{getStatusChip(isActive)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(user.date_joined)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title={isActive ? "Deactivate Account" : "Activate Account"}>
                            <IconButton
                              size="small"
                              onClick={() => setActionDialog({ open: true, type: isActive ? 'deactivate' : 'activate', user: user })}
                              sx={{ color: isActive ? '#f44336' : '#4caf50' }}
                            >
                              {isActive ? <BlockIcon /> : <ActiveIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Account">
                            <IconButton size="small" onClick={() => setActionDialog({ open: true, type: 'delete', user: user })} sx={{ color: '#f44336' }}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{
              '& .MuiPaginationItem-root': { color: 'white', '&.Mui-selected': { bgcolor: '#00695c', color: 'white' } }
            }}
          />
        </Box>
      )}

      {/* Create Account Dialog */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00695c', color: 'white' }}>Create Account</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3, bgcolor: '#e0f2f1', color: '#00695c' }}>
              {formData.role === 'admin' 
                ? "Superusers have full access to the admin dashboard." 
                : "Receptionists can only access the receptionist portal."}
            </Alert>
            
            <TextField 
              fullWidth 
              label="Username" 
              value={formData.username} 
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
              margin="normal" 
              required 
            />
            
            <TextField 
              fullWidth 
              label="Email Address" 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              margin="normal" 
              required 
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select 
                value={formData.role} 
                onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
                label="Role"
              >
                <MenuItem value="staff">Receptionist</MenuItem>
                <MenuItem value="admin">Superuser</MenuItem>
              </Select>
            </FormControl>
            
            <TextField 
              fullWidth 
              label="Password" 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              margin="normal" 
              required 
              helperText="Minimum 8 characters" 
            />
            
            <TextField 
              fullWidth 
              label="Confirm Password" 
              type="password" 
              value={formData.confirmPassword} 
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
              margin="normal" 
              required 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleCreateStaff} variant="contained" sx={{ bgcolor: '#00695c', '&:hover': { bgcolor: '#004d40' } }}>
            Create Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: "", user: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: actionDialog.type === 'deactivate' ? '#ffebee' : actionDialog.type === 'activate' ? '#e8f5e9' : '#ffebee', 
          color: actionDialog.type === 'deactivate' ? '#c62828' : actionDialog.type === 'activate' ? '#2e7d32' : '#c62828' 
        }}>
          {actionDialog.type === 'deactivate' ? 'Deactivate Account' : actionDialog.type === 'activate' ? 'Activate Account' : 'Delete Account'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to {actionDialog.type === 'deactivate' ? 'deactivate' : actionDialog.type === 'activate' ? 'activate' : 'delete'} the account for:
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
            {actionDialog.user?.username} ({actionDialog.user?.email})
          </Typography>
          {actionDialog.type === 'delete' && (
            <Alert severity="error" sx={{ mt: 2 }}>This action cannot be undone. All data associated with this account will be lost.</Alert>
          )}
          {actionDialog.type === 'deactivate' && (
            <Alert severity="warning" sx={{ mt: 2 }}>Deactivated users will not be able to log in or access their account.</Alert>
          )}
          {actionDialog.type === 'activate' && (
            <Alert severity="info" sx={{ mt: 2 }}>The user will regain full access to their account.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: "", user: null })}>Cancel</Button>
          <Button 
            onClick={() => { 
              if (actionDialog.type === 'delete') handleDeleteStaff(actionDialog.user); 
              else handleToggleStatus(actionDialog.user); 
            }} 
            variant="contained" 
            color={actionDialog.type === 'deactivate' ? 'error' : actionDialog.type === 'activate' ? 'success' : 'error'}
          >
            {actionDialog.type === 'deactivate' ? 'Deactivate' : actionDialog.type === 'activate' ? 'Activate' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast.type} sx={{ fontSize: '1rem' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}