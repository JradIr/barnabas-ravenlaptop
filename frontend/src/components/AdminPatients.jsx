// src/pages/admin/AdminPatients.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Drawer,
  Divider,
  Grid,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Clear as ClearIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  LocalHospital as LocalHospitalIcon,
  Description as DescriptionIcon,
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

export default function AdminPatients() {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [actionDialog, setActionDialog] = useState({ open: false, type: "", user: null });
  const [detailsDrawer, setDetailsDrawer] = useState({ open: false, user: null });

  const rowsPerPage = 10;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('role', 'patient'); // Only fetch patients
      if (filterStatus !== 'all') params.append('is_active', filterStatus === 'active' ? 'true' : 'false');
      params.append('page', page);
      params.append('page_size', rowsPerPage);
      
      const response = await AxiosInstance.get(`/users/?${params.toString()}`);
      
      const usersData = response.data.results || response.data;
      const usersArray = Array.isArray(usersData) ? usersData : [];
      
      setPatients(usersArray);
      setTotalCount(response.data.count || usersArray.length);
      setTotalPages(Math.ceil((response.data.count || usersArray.length) / rowsPerPage));
      
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setError(error.response?.data?.message || "Failed to load patients");
      showToast("Failed to load patients", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, open: false })), 4000);
  };

  const handleSearch = () => {
    setPage(1);
    fetchPatients();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
    setTimeout(() => fetchPatients(), 100);
  };

  const handleViewUser = (user) => {
    if (user && user.id) {
      setDetailsDrawer({ open: true, user: user });
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user || !user.id) return;
    
    try {
      const newStatus = !user.is_active;
      await AxiosInstance.patch(`/users/${user.id}/`, {
        is_active: newStatus
      });
      
      showToast(
        `Patient account ${newStatus ? 'activated' : 'deactivated'} successfully`,
        "success"
      );
      fetchPatients();
      setActionDialog({ open: false, type: "", user: null });
    } catch (error) {
      console.error("Failed to toggle status:", error);
      showToast("Failed to update patient status", "error");
    }
  };

  const getStatusChip = (isActive) => {
    return (
      <Chip
        label={isActive ? "Active" : "Inactive"}
        size="small"
        sx={{
          bgcolor: isActive ? '#c8e6c9' : '#ffcdd2',
          color: isActive ? '#2e7d32' : '#c62828',
          fontWeight: 500
        }}
      />
    );
  };

  const getFullName = (user) => {
    if (!user) return 'N/A';
    if (user.full_name) return user.full_name;
    const firstName = user.firstname || '';
    const lastName = user.lastname || '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    return user.username || 'N/A';
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
          Patient Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          View and manage all registered patient accounts
        </Typography>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'white' }} elevation={2}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ flex: 2, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, bgcolor: '#f5f5f5', borderRadius: 2, p: 0.5 }}>
            <Button
              variant={filterStatus === 'all' ? 'contained' : 'text'}
              onClick={() => { setFilterStatus('all'); setPage(1); }}
              sx={{ 
                borderRadius: 1.5,
                bgcolor: filterStatus === 'all' ? '#00695c' : 'transparent',
                color: filterStatus === 'all' ? 'white' : '#666',
                '&:hover': {
                  bgcolor: filterStatus === 'all' ? '#004d40' : '#e0e0e0'
                }
              }}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'contained' : 'text'}
              onClick={() => { setFilterStatus('active'); setPage(1); }}
              sx={{ 
                borderRadius: 1.5,
                bgcolor: filterStatus === 'active' ? '#00695c' : 'transparent',
                color: filterStatus === 'active' ? 'white' : '#666',
                '&:hover': {
                  bgcolor: filterStatus === 'active' ? '#004d40' : '#e0e0e0'
                }
              }}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'contained' : 'text'}
              onClick={() => { setFilterStatus('inactive'); setPage(1); }}
              sx={{ 
                borderRadius: 1.5,
                bgcolor: filterStatus === 'inactive' ? '#00695c' : 'transparent',
                color: filterStatus === 'inactive' ? 'white' : '#666',
                '&:hover': {
                  bgcolor: filterStatus === 'inactive' ? '#004d40' : '#e0e0e0'
                }
              }}
            >
              Inactive
            </Button>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPatients}
            disabled={loading}
            sx={{ 
              borderColor: '#00695c',
              color: '#00695c',
              '&:hover': {
                borderColor: '#004d40',
                bgcolor: 'rgba(0,105,92,0.04)'
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Stats Summary */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5, backdropFilter: 'blur(10px)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Total Patients</Typography>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>{totalCount}</Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5, backdropFilter: 'blur(10px)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Active</Typography>
          <Typography variant="h5" sx={{ color: '#a5d6a7', fontWeight: 'bold' }}>{patients.filter(p => p.is_active !== false).length}</Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5, backdropFilter: 'blur(10px)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Inactive</Typography>
          <Typography variant="h5" sx={{ color: '#ef9a9a', fontWeight: 'bold' }}>{patients.filter(p => p.is_active === false).length}</Typography>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#80cbc4' } }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, textAlign: 'center' }}>
            Loading patients...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Patients Table */}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#e0f2f1' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Registered</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <MedicalIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No patients found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm ? "Try a different search term" : "No patients have registered yet"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((user, idx) => {
                  if (!user) return null;
                  
                  const isActive = user.is_active !== false;
                  const fullName = getFullName(user);
                  
                  return (
                    <TableRow 
                      key={user.id || idx}
                      sx={{ 
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar 
                            src={user.profile_picture}
                            sx={{ 
                              bgcolor: '#00695c',
                              width: 40,
                              height: 40
                            }}
                          >
                            {fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {fullName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              @{user.username || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {user.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {user.phone_number ? (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon sx={{ fontSize: 14, color: '#00695c' }} />
                              {user.phone_number}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">No phone</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(isActive)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.date_joined)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {user.id}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewUser(user)}
                              sx={{ color: '#00695c' }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isActive ? "Deactivate Account" : "Activate Account"}>
                            <IconButton
                              size="small"
                              onClick={() => setActionDialog({ 
                                open: true, 
                                type: isActive ? 'deactivate' : 'activate', 
                                user: user 
                              })}
                              sx={{ color: isActive ? '#f44336' : '#4caf50' }}
                            >
                              {isActive ? <BlockIcon /> : <ActiveIcon />}
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
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'white',
                '&.Mui-selected': {
                  bgcolor: '#00695c',
                  color: 'white'
                }
              }
            }}
          />
        </Box>
      )}

      {/* Patient Details Drawer */}
      <Drawer
        anchor="right"
        open={detailsDrawer.open}
        onClose={() => setDetailsDrawer({ open: false, user: null })}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500 },
            bgcolor: '#f5f5f5',
            borderRadius: { sm: '16px 0 0 16px' }
          }
        }}
      >
        {detailsDrawer.user && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ 
              bgcolor: '#00695c', 
              color: 'white', 
              p: 3,
              position: 'relative'
            }}>
              <IconButton
                onClick={() => setDetailsDrawer({ open: false, user: null })}
                sx={{ 
                  position: 'absolute', 
                  right: 8, 
                  top: 8, 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
              
              <Box display="flex" alignItems="center" gap={2} mt={2}>
                <Avatar 
                  src={detailsDrawer.user.profile_picture}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: '#004d40',
                    border: '3px solid rgba(255,255,255,0.3)'
                  }}
                >
                  {getFullName(detailsDrawer.user)?.[0]?.toUpperCase() || 'P'}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {getFullName(detailsDrawer.user)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    @{detailsDrawer.user.username}
                  </Typography>
                  {getStatusChip(detailsDrawer.user.is_active !== false)}
                </Box>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
              <Typography variant="h6" sx={{ color: '#00695c', mb: 2, fontWeight: 'bold' }}>
                Personal Information
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <EmailIcon sx={{ color: '#00695c' }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Email Address</Typography>
                      <Typography variant="body2">{detailsDrawer.user.email || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <PhoneIcon sx={{ color: '#00695c' }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Phone Number</Typography>
                      <Typography variant="body2">{detailsDrawer.user.phone_number || 'Not provided'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {detailsDrawer.user.address && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                      <HomeIcon sx={{ color: '#00695c' }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">Address</Typography>
                        <Typography variant="body2">{detailsDrawer.user.address}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <CalendarIcon sx={{ color: '#00695c' }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Date of Birth</Typography>
                      <Typography variant="body2">{detailsDrawer.user.birthday ? formatDate(detailsDrawer.user.birthday) : 'Not provided'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <BadgeIcon sx={{ color: '#00695c' }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Member Since</Typography>
                      <Typography variant="body2">{formatDate(detailsDrawer.user.date_joined)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <BadgeIcon sx={{ color: '#00695c' }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">User ID</Typography>
                      <Typography variant="body2">#{detailsDrawer.user.id}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ color: '#00695c', mb: 2, fontWeight: 'bold' }}>
                Account Status
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant={detailsDrawer.user.is_active !== false ? 'contained' : 'outlined'}
                  color="success"
                  size="small"
                  disabled={detailsDrawer.user.is_active !== false}
                  onClick={() => {
                    setDetailsDrawer({ open: false, user: null });
                    setActionDialog({ 
                      open: true, 
                      type: 'activate', 
                      user: detailsDrawer.user 
                    });
                  }}
                  sx={{ flex: 1 }}
                >
                  Active
                </Button>
                <Button
                  variant={detailsDrawer.user.is_active === false ? 'contained' : 'outlined'}
                  color="error"
                  size="small"
                  disabled={detailsDrawer.user.is_active === false}
                  onClick={() => {
                    setDetailsDrawer({ open: false, user: null });
                    setActionDialog({ 
                      open: true, 
                      type: 'deactivate', 
                      user: detailsDrawer.user 
                    });
                  }}
                  sx={{ flex: 1 }}
                >
                  Inactive
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ color: '#00695c', mb: 2, fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<MedicalIcon />}
                  fullWidth
                  sx={{ borderColor: '#00695c', color: '#00695c' }}
                  onClick={() => {
                    setDetailsDrawer({ open: false, user: null });
                    navigate(`/admin/patients/${detailsDrawer.user.id}`);
                  }}
                >
                  View Full Patient Record
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Status Change Confirmation Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog({ open: false, type: "", user: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: actionDialog.type === 'deactivate' ? '#ffebee' : '#e8f5e9',
          color: actionDialog.type === 'deactivate' ? '#c62828' : '#2e7d32'
        }}>
          {actionDialog.type === 'deactivate' ? 'Deactivate Account' : 'Activate Account'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to {actionDialog.type === 'deactivate' ? 'deactivate' : 'activate'} the account for:
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
            {getFullName(actionDialog.user)} (@{actionDialog.user?.username || 'N/A'})
          </Typography>
          {actionDialog.type === 'deactivate' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Deactivated patients will not be able to book appointments or access their account.
            </Alert>
          )}
          {actionDialog.type === 'activate' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              The patient will regain full access to their account.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: "", user: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleToggleStatus(actionDialog.user)}
            variant="contained"
            color={actionDialog.type === 'deactivate' ? 'error' : 'success'}
          >
            {actionDialog.type === 'deactivate' ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast.type} sx={{ fontSize: '1rem' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}