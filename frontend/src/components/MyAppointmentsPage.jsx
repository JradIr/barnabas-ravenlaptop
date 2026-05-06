// src/pages/user/MyAppointmentsPage.jsx
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
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Avatar,
  Badge,
  Stack,
  useMediaQuery,
  useTheme,
  Fade,
  Grow,
  Skeleton
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  MedicalServices as ServiceIcon,
  CheckCircle as ConfirmedIcon,
  Pending as PendingIcon,
  Cancel as CancelledIcon,
  EventAvailable as CompletedIcon,
  Info as InfoIcon,
  DeleteOutline as CancelIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

// Status configuration
const statusConfig = {
  pending: {
    label: 'Pending',
    color: '#ff9800',
    bgColor: '#fff3e0',
    icon: <PendingIcon sx={{ fontSize: 20 }} />,
    description: 'Awaiting admin confirmation'
  },
  confirmed: {
    label: 'Confirmed',
    color: '#4caf50',
    bgColor: '#e8f5e9',
    icon: <ConfirmedIcon sx={{ fontSize: 20 }} />,
    description: 'Your appointment has been confirmed'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#f44336',
    bgColor: '#ffebee',
    icon: <CancelledIcon sx={{ fontSize: 20 }} />,
    description: 'This appointment has been cancelled'
  },
  completed: {
    label: 'Completed',
    color: '#2196f3',
    bgColor: '#e3f2fd',
    icon: <CompletedIcon sx={{ fontSize: 20 }} />,
    description: 'Appointment completed'
  },
  no_show: {
    label: 'No Show',
    color: '#9e9e9e',
    bgColor: '#f5f5f5',
    icon: <WarningIcon sx={{ fontSize: 20 }} />,
    description: 'Missed appointment'
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
};

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialog, setCancelDialog] = useState({ open: false, appointment: null });
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AxiosInstance.get("/appointments/");
      const appointmentsData = Array.isArray(response.data) ? response.data : [];
      
      // Sort by date (newest first for upcoming, oldest first for history)
      const sorted = [...appointmentsData].sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.time || '').localeCompare(a.time || '');
      });
      
      setAppointments(sorted);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setError(error.response?.status === 401 ? "Please login again" : "Failed to load appointments");
      showToast("Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
    setTimeout(() => setToast(prev => ({ ...prev, open: false })), 4000);
  };

  const handleCancelAppointment = async () => {
    const { appointment } = cancelDialog;
    if (!appointment) return;
    
    setLoading(true);
    try {
      await AxiosInstance.delete(`/appointments/${appointment.id}/`);
      showToast("Appointment cancelled successfully", "success");
      await fetchAppointments();
      setCancelDialog({ open: false, appointment: null });
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      showToast(error.response?.data?.error || "Failed to cancel appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      return app.status !== 'completed' && app.status !== 'cancelled' && appDate >= today;
    });
  };

  const getPastAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      return app.status === 'completed' || app.status === 'cancelled' || appDate < today;
    });
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: config.color
          }
        }}
      />
    );
  };

  const renderAppointmentCard = (app, index) => {
    const status = app.status || 'pending';
    const statusInfo = statusConfig[status];
    const isCancellable = status === 'pending';
    const isConfirmed = status === 'confirmed';
    
    return (
      <Grow in={true} timeout={300 * (index % 5)} key={app.id}>
        <Card sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          {/* Status Bar at top */}
          <Box sx={{ height: 4, bgcolor: statusInfo.color }} />
          
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="flex-start">
              {/* Left section - Icon */}
              <Grid item xs={12} sm={2} md={1.5}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: statusInfo.bgColor,
                      color: statusInfo.color,
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    {statusInfo.icon}
                  </Avatar>
                  {getStatusBadge(status)}
                </Box>
              </Grid>
              
              {/* Middle section - Details */}
              <Grid item xs={12} sm={7} md={8}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {app.service_display || app.service || app.other_concern || 'Dental Appointment'}
                </Typography>
                
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon sx={{ fontSize: 18, color: '#00695c' }} />
                    <Typography variant="body2">
                      {formatDate(app.date)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon sx={{ fontSize: 18, color: '#00695c' }} />
                    <Typography variant="body2">
                      {formatTime(app.time)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <ServiceIcon sx={{ fontSize: 18, color: '#00695c' }} />
                    <Typography variant="body2">
                      {app.service_display || app.service || 'General Consultation'}
                    </Typography>
                  </Box>
                </Stack>
                
                {app.other_concern && app.other_concern !== app.service && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: {app.other_concern}
                  </Typography>
                )}
              </Grid>
              
              {/* Right section - Actions */}
              <Grid item xs={12} sm={3} md={2.5}>
                <Stack spacing={1}>
                  {isCancellable && (
                    <Tooltip title="Cancel this appointment">
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setCancelDialog({ open: true, appointment: app })}
                        startIcon={<CancelIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                    </Tooltip>
                  )}
                  
                  {isConfirmed && (
                    <Tooltip title="Appointment confirmed">
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        disabled
                        sx={{ bgcolor: '#4caf50', borderRadius: 2 }}
                      >
                        Confirmed
                      </Button>
                    </Tooltip>
                  )}
                  
                  {status === 'completed' && (
                    <Tooltip title="Appointment completed">
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        disabled
                        sx={{ bgcolor: '#2196f3', borderRadius: 2 }}
                      >
                        Completed
                      </Button>
                    </Tooltip>
                  )}
                  
                  {status === 'cancelled' && (
                    <Tooltip title="Appointment cancelled">
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        disabled
                        sx={{ borderColor: '#f44336', color: '#f44336', borderRadius: 2 }}
                      >
                        Cancelled
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              </Grid>
            </Grid>
            
            {/* Additional Info for pending appointments */}
            {status === 'pending' && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="caption" color="#ff9800" display="flex" alignItems="center" gap={0.5}>
                  <InfoIcon sx={{ fontSize: 14 }} />
                  This appointment is pending confirmation. You will be notified once confirmed.
                </Typography>
              </Box>
            )}
            
            {status === 'confirmed' && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                <Typography variant="caption" color="#4caf50" display="flex" alignItems="center" gap={0.5}>
                  <ConfirmedIcon sx={{ fontSize: 14 }} />
                  Your appointment has been confirmed. Please arrive on time.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grow>
    );
  };

  const upcomingApps = getUpcomingAppointments();
  const pastApps = getPastAppointments();
  const displayApps = tabValue === 0 ? upcomingApps : pastApps;

  if (loading && appointments.length === 0) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1a237e' }}>
          My Appointments
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 2 }} />
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={180} sx={{ mb: 2, borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#1a237e' }}>
          My Appointments
        </Typography>
        <Typography variant="body2" color="textSecondary">
          View and manage all your dental appointments
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0', borderRadius: 2 }}>
            <PendingIcon sx={{ color: '#ff9800', fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">{appointments.filter(a => a.status === 'pending').length}</Typography>
            <Typography variant="caption" color="textSecondary">Pending</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9', borderRadius: 2 }}>
            <ConfirmedIcon sx={{ color: '#4caf50', fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">{appointments.filter(a => a.status === 'confirmed').length}</Typography>
            <Typography variant="caption" color="textSecondary">Confirmed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd', borderRadius: 2 }}>
            <CompletedIcon sx={{ color: '#2196f3', fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">{appointments.filter(a => a.status === 'completed').length}</Typography>
            <Typography variant="caption" color="textSecondary">Completed</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            bgcolor: '#f5f5f5',
            '& .MuiTab-root': { py: 1.5 },
            '& .Mui-selected': { color: '#00695c', fontWeight: 'bold' },
            '& .MuiTabs-indicator': { bgcolor: '#00695c' }
          }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon fontSize="small" />
                Upcoming
                {upcomingApps.length > 0 && (
                  <Badge badgeContent={upcomingApps.length} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#00695c' } }} />
                )}
              </Box>
            }
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <TimeIcon fontSize="small" />
                History
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchAppointments}
          disabled={loading}
          sx={{ color: '#00695c' }}
        >
          Refresh
        </Button>
      </Box>

      {/* Loading Indicator */}
      {loading && (
        <LinearProgress sx={{ mb: 2, borderRadius: 2, bgcolor: '#e0f2f1', '& .MuiLinearProgress-bar': { bgcolor: '#00695c' } }} />
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Appointments List */}
      {displayApps.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 3 }}>
          <CalendarIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No appointments found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {tabValue === 0 ? "You don't have any upcoming appointments" : "No past appointments found"}
          </Typography>
          {tabValue === 0 && (
            <Button
              variant="contained"
              onClick={() => navigate('/book')}
              sx={{ bgcolor: '#00695c', '&:hover': { bgcolor: '#004d40' } }}
            >
              Book an Appointment
            </Button>
          )}
        </Paper>
      ) : (
        <Box>
          {displayApps.map((app, idx) => renderAppointmentCard(app, idx))}
        </Box>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, appointment: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: '#c62828' }}>
          Cancel Appointment
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to cancel this appointment?
          </Typography>
          {cancelDialog.appointment && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {formatDate(cancelDialog.appointment.date)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatTime(cancelDialog.appointment.time)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {cancelDialog.appointment.service_display || cancelDialog.appointment.service || 'Dental Appointment'}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The time slot will become available for other patients.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, appointment: null })}>
            Keep Appointment
          </Button>
          <Button
            onClick={handleCancelAppointment}
            variant="contained"
            color="error"
          >
            Yes, Cancel
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
        <Alert severity={toast.severity} sx={{ fontSize: '1rem' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}