// src/pages/admin/AdminAuditLog.jsx
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
  Tooltip,
  Snackbar,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stack,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

// Action display configuration
const actionConfig = {
  create: { label: 'Create', color: '#4caf50', bgColor: '#e8f5e9', icon: '➕' },
  update: { label: 'Update', color: '#2196f3', bgColor: '#e3f2fd', icon: '✏️' },
  delete: { label: 'Delete', color: '#f44336', bgColor: '#ffebee', icon: '🗑️' },
  view: { label: 'View', color: '#ff9800', bgColor: '#fff3e0', icon: '👁️' },
  login: { label: 'Login', color: '#9c27b0', bgColor: '#f3e5f5', icon: '🔐' },
  logout: { label: 'Logout', color: '#757575', bgColor: '#f5f5f5', icon: '🚪' },
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm:ss a');
  } catch {
    return 'Invalid Date';
  }
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [expandedRow, setExpandedRow] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, log: null });
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [stats, setStats] = useState({
    total: 0,
    create: 0,
    update: 0,
    delete: 0,
    view: 0,
    login: 0,
    logout: 0,
  });

  const rowsPerPage = 20;

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterAction !== 'all') params.append('action', filterAction);
      if (filterModel !== 'all') params.append('model_name', filterModel);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('page', page);
      params.append('page_size', rowsPerPage);
      
      const response = await AxiosInstance.get(`/audit-logs/?${params.toString()}`);
      
      const logsData = response.data.results || response.data;
      const logsArray = Array.isArray(logsData) ? logsData : [];
      
      setLogs(logsArray);
      setTotalCount(response.data.count || logsArray.length);
      setTotalPages(Math.ceil((response.data.count || logsArray.length) / rowsPerPage));
      
      // Calculate stats from all logs
      const allLogsResponse = await AxiosInstance.get(`/audit-logs/?page_size=1000`);
      const allLogs = allLogsResponse.data.results || allLogsResponse.data || [];
      
      setStats({
        total: allLogs.length,
        create: allLogs.filter(l => l.action === 'create').length,
        update: allLogs.filter(l => l.action === 'update').length,
        delete: allLogs.filter(l => l.action === 'delete').length,
        view: allLogs.filter(l => l.action === 'view').length,
        login: allLogs.filter(l => l.action === 'login').length,
        logout: allLogs.filter(l => l.action === 'logout').length,
      });
      
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setError(error.response?.data?.message || "Failed to load audit logs");
      showToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterAction, filterModel, dateRange, page]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, open: false })), 4000);
  };

  const handleSearch = () => {
    setPage(1);
    fetchAuditLogs();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterAction("all");
    setFilterModel("all");
    setDateRange({ start: "", end: "" });
    setPage(1);
    setTimeout(() => fetchAuditLogs(), 100);
  };

  const getActionChip = (action) => {
    const config = actionConfig[action] || { label: action, color: '#757575', bgColor: '#f5f5f5', icon: '📋' };
    return (
      <Chip
        icon={<span>{config.icon}</span>}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgColor,
          color: config.color,
          fontWeight: 500,
          '& .MuiChip-icon': {
            color: config.color,
            marginLeft: 0.5,
          }
        }}
      />
    );
  };

  const getChangesSummary = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return 'No changes';
    const keys = Object.keys(changes);
    if (keys.length > 3) return `${keys.length} fields changed`;
    return keys.join(', ');
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
      background: color, 
      color: 'white', 
      borderRadius: 2,
      '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
    }}>
      <CardContent sx={{ py: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>{title}</Typography>
            <Typography variant="h5" fontWeight="bold">{value}</Typography>
          </Box>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #004d40 0%, #00695c 50%, #00796b 100%)',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
          Audit Log
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Track all administrative actions performed in the system
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Total Actions" value={stats.total} icon={<HistoryIcon />} color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Creates" value={stats.create} icon={<span>➕</span>} color="linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Updates" value={stats.update} icon={<span>✏️</span>} color="linear-gradient(135deg, #2196f3 0%, #1565c0 100%)" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Deletes" value={stats.delete} icon={<span>🗑️</span>} color="linear-gradient(135deg, #f44336 0%, #c62828 100%)" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Views" value={stats.view} icon={<span>👁️</span>} color="linear-gradient(135deg, #ff9800 0%, #f57c00 100%)" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Logins/Logouts" value={stats.login + stats.logout} icon={<span>🔐</span>} color="linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)" />
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'white' }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearFilters}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                label="Action"
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="view">View</MenuItem>
                <MenuItem value="login">Login</MenuItem>
                <MenuItem value="logout">Logout</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Model</InputLabel>
              <Select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                label="Model"
              >
                <MenuItem value="all">All Models</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Appointment">Appointment</MenuItem>
                <MenuItem value="Invoice">Invoice</MenuItem>
                <MenuItem value="Payment">Payment</MenuItem>
                <MenuItem value="Dashboard">Dashboard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAuditLogs}
              disabled={loading}
              sx={{ borderColor: '#00695c', color: '#00695c' }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
        
        {/* Clear Filters Button */}
        {(searchTerm || filterAction !== 'all' || filterModel !== 'all' || dateRange.start || dateRange.end) && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={handleClearFilters} startIcon={<ClearIcon />}>
              Clear All Filters
            </Button>
          </Box>
        )}
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#80cbc4' } }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, textAlign: 'center' }}>
            Loading audit logs...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Audit Logs Table */}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#e0f2f1' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Model</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Object ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40' }}>Changes</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#004d40', textAlign: 'center' }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <HistoryIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No audit logs found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm || filterAction !== 'all' || filterModel !== 'all' ? "Try different filters" : "No admin actions have been recorded yet"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => {
                  const isExpanded = expandedRow === log.id;
                  
                  return (
                    <React.Fragment key={log.id || idx}>
                      <TableRow 
                        sx={{ 
                          '&:hover': { bgcolor: '#f5f5f5' },
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatDate(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon sx={{ fontSize: 16, color: '#00695c' }} />
                            <Typography variant="body2">
                              {log.user_details?.username || log.user?.username || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getActionChip(log.action)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.model_name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {log.object_id || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="textSecondary">
                            {getChangesSummary(log.changes)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsDialog({ open: true, log });
                              }}
                              sx={{ color: '#00695c' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row for Change Details */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
                              <Typography variant="subtitle2" sx={{ color: '#00695c', mb: 1 }}>
                                Change Details
                              </Typography>
                              {log.changes && Object.keys(log.changes).length > 0 ? (
                                <Stack spacing={1}>
                                  {Object.entries(log.changes).map(([key, value]) => (
                                    <Box key={key} sx={{ 
                                      display: 'flex', 
                                      flexWrap: 'wrap', 
                                      gap: 1,
                                      p: 1,
                                      bgcolor: 'white',
                                      borderRadius: 1,
                                      border: '1px solid #e0e0e0'
                                    }}>
                                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                                        {key}:
                                      </Typography>
                                      {typeof value === 'object' && value.from !== undefined ? (
                                        <>
                                          <Typography variant="body2" color="error">
                                            {value.from || 'null'}
                                          </Typography>
                                          <Typography variant="body2">→</Typography>
                                          <Typography variant="body2" color="success.main">
                                            {value.to || 'null'}
                                          </Typography>
                                        </>
                                      ) : (
                                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </Typography>
                                      )}
                                    </Box>
                                  ))}
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No change details available for this action
                                </Typography>
                              )}
                              
                              {log.ip_address && (
                                <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                                  <Typography variant="caption" color="textSecondary">
                                    IP Address: {log.ip_address}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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

      {/* Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#00695c', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Audit Log Details</span>
          <IconButton size="small" onClick={() => setDetailsDialog({ open: false, log: null })} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.log && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Timestamp</Typography>
                  <Typography variant="body1">{formatDate(detailsDialog.log.timestamp)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">User</Typography>
                  <Typography variant="body1">{detailsDialog.log.user_details?.username || detailsDialog.log.user?.username || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Action</Typography>
                  <Box mt={0.5}>{getActionChip(detailsDialog.log.action)}</Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Model</Typography>
                  <Typography variant="body1">{detailsDialog.log.model_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Object ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{detailsDialog.log.object_id || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">IP Address</Typography>
                  <Typography variant="body1">{detailsDialog.log.ip_address || '—'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Changes</Typography>
                  <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                    {detailsDialog.log.changes && Object.keys(detailsDialog.log.changes).length > 0 ? (
                      <Stack spacing={1}>
                        {Object.entries(detailsDialog.log.changes).map(([key, value]) => (
                          <Box key={key} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                              {key}:
                            </Typography>
                            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </pre>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="textSecondary">No change details available</Typography>
                    )}
                  </Box>
                </Grid>
                {detailsDialog.log.user_agent && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">User Agent</Typography>
                    <Typography variant="body2" sx={{ fontSize: '11px', wordBreak: 'break-all' }}>
                      {detailsDialog.log.user_agent}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, log: null })}>Close</Button>
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