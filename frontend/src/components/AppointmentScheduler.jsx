// src/components/AppointmentScheduler.jsx
import React, { useState, useEffect, useCallback } from "react";
import "react-calendar/dist/Calendar.css";
import "./style/AppointmentScheduler.css";
import AxiosInstance from "./AxiosInstance";
import {
  Box, Typography, TextField, Button, Stack, LinearProgress, Alert, Snackbar,
  Chip, Paper, Divider, IconButton, Grid, Container, useMediaQuery, useTheme,
  Fade, Slide, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Card, CardContent, Stepper,
  Step, StepLabel, Badge, List, ListItem, ListItemText, ListItemIcon,
  Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon, Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  MedicalServices as MedicalServicesIcon, Close as CloseIcon,
  Queue as QueueIcon, CheckCircle as CheckCircleIcon, Pending as PendingIcon,
  Notifications as NotificationsIcon, ExpandMore as ExpandMoreIcon,
  EventNote as EventNoteIcon, Warning as WarningIcon
} from "@mui/icons-material";

// Constants
const CLINIC_OPEN = 9, CLINIC_CLOSE = 18, LUNCH_START = 12, LUNCH_END = 13;
const TOTAL_SLOTS_PER_DAY = 10;

const SERVICES = [
  { id: "teeth_cleaning", name: "Teeth Cleaning", duration: 60, price: "₱1,000", description: "Professional dental cleaning" },
  { id: "tooth_extraction", name: "Tooth Extraction", duration: 60, price: "₱1,000", description: "Safe tooth removal" },
  { id: "dental_filling", name: "Dental Filling", duration: 60, price: "₱1,000", description: "Restore decayed teeth" },
  { id: "orthodontic", name: "Braces/Orthodontic", duration: 120, price: "₱50,000", description: "Braces and alignment" }
];

const OTHER_CONCERNS = [
  "Consultation", "Root Canal", "Dental Implant", "Teeth Whitening",
  "Gum Pain", "Sensitive Teeth", "Broken Tooth", "Bad Breath", "Other"
];

const fmtTime = (h, m) => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m.toString().padStart(2,'0')} ${h < 12 ? "AM" : "PM"}`;

export default function AppointmentScheduler({ role = "client" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [appointments, setAppointments] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [notifTabValue, setNotifTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [form, setForm] = useState({ selectedConcern: "", customConcern: "", urgencyLevel: 1 });
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const fetchData = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const [appointmentsRes, myAppointmentsRes, aiRes, waitlistRes, notificationsRes] = await Promise.all([
        AxiosInstance.get("appointments/"),
        AxiosInstance.get("appointments/", { params: { user_id: user?.id } }),
        AxiosInstance.get("appointments/ai_suggestions/"),
        AxiosInstance.get("appointments/waitlist_status/"),
        AxiosInstance.get("notifications/")
      ]);
      
      setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
      setMyAppointments(Array.isArray(myAppointmentsRes.data) ? myAppointmentsRes.data : []);
      setAiSuggestions(aiRes.data?.suggestions || []);
      const waitlistData = waitlistRes.data?.waitlists || waitlistRes.data?.waitlist_entries || [];
      setWaitlistEntries(waitlistData);
      setNotifications(Array.isArray(notificationsRes.data?.notifications) ? notificationsRes.data.notifications : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setAppointments([]);
      setMyAppointments([]);
      setWaitlistEntries([]);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
    setTimeout(() => setToast(prev => ({ ...prev, open: false })), 4000);
  };

  const isPastDate = (y, m, d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(y, m, d) < today;
  };
  
  const isSunday = (y, m, d) => new Date(y, m, d).getDay() === 0;

  const getAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate) return [];
    
    const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2,'0')}-${String(selectedDate.day).padStart(2,'0')}`;
    const serviceId = selectedService?.id || form.selectedConcern?.toLowerCase().replace(/ /g, '_') || "consultation";
    
    try {
      const { data } = await AxiosInstance.get("appointments/get_available_slots/", {
        params: { date: dateStr, service: serviceId }
      });
      return data.available_slots || [];
    } catch (error) {
      console.error("Error fetching slots:", error);
      return [];
    }
  }, [selectedDate, selectedService, form.selectedConcern]);

  const createAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) return;
    setLoading(true);
    try {
      const requestData = {
        date: `${selectedDate.year}-${String(selectedDate.month+1).padStart(2,'0')}-${String(selectedDate.day).padStart(2,'0')}`,
        time: selectedTimeSlot.timeValue,
        service: selectedService?.id || null,
        other_concern: form.selectedConcern === "Other" ? form.customConcern : form.selectedConcern,
        urgency_level: form.urgencyLevel
      };
      
      await AxiosInstance.post("appointments/", requestData);
      showToast("Appointment requested successfully! Awaiting admin confirmation.", "success");
      setSelectedDate(null);
      setSelectedService(null);
      setSelectedTimeSlot(null);
      setActiveStep(0);
      await fetchData();
    } catch (error) {
      console.error("Create appointment error:", error);
      showToast(error.response?.data?.error || error.response?.data?.time || "Error creating appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    setLoading(true);
    try {
      await AxiosInstance.delete(`appointments/${id}/`);
      showToast("Appointment cancelled successfully", "success");
      await fetchData();
    } catch (error) {
      console.error("Cancel error:", error);
      showToast("Error cancelling appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { confirmed: '#4caf50', pending: '#ff9800', cancelled: '#f44336', completed: '#9e9e9e' };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_confirmation': return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'appointment_cancellation': return <CancelIcon sx={{ color: '#f44336' }} />;
      case 'appointment_reminder': return <AccessTimeIcon sx={{ color: '#ff9800' }} />;
      default: return <NotificationsIcon sx={{ color: '#00695c' }} />;
    }
  };

  const handleDateSelect = (day, month, year) => {
    if (isPastDate(year, month, day)) {
      showToast("Cannot book past dates", "warning");
      return;
    }
    if (isSunday(year, month, day)) {
      showToast("Clinic closed on Sundays", "warning");
      return;
    }
    setSelectedDate({ day, month, year });
    setActiveStep(1);
  };

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    
    const getDayStatus = (day) => {
      // Count ONLY confirmed appointments for availability
      const confirmedCount = appointments.filter(a => {
        if (!a?.date) return false;
        const d = new Date(a.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year && 
              a.status === 'confirmed';
      }).length;
      
      const pendingCount = appointments.filter(a => {
        if (!a?.date) return false;
        const d = new Date(a.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year && 
              a.status === 'pending';
      }).length;
      
      return { 
        confirmedCount,
        pendingCount,
        isFullyBooked: confirmedCount >= TOTAL_SLOTS_PER_DAY, 
        isPartiallyBooked: confirmedCount > 0 && confirmedCount < TOTAL_SLOTS_PER_DAY,
        hasPending: pendingCount > 0
      };
    };

    return (
      <Fade in={activeStep === 0} timeout={500}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeftIcon /></IconButton>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" sx={{ color: '#00695c' }}>
              {currentDate.toLocaleString("default", { month: "long" })} {year}
            </Typography>
            <IconButton onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRightIcon /></IconButton>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 2 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <Typography key={day} textAlign="center" fontWeight="bold" fontSize={{ xs: '12px', md: '14px' }}>
                {isMobile ? day[0] : day}
              </Typography>
            ))}
          </Box>
          
          {weeks.map((week, weekIdx) => (
            <Box key={weekIdx} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
              {week.map((day, i) => {
                if (!day) return <Box key={i} sx={{ p: 2 }} />;
                const isPast = isPastDate(year, month, day);
                const isSun = isSunday(year, month, day);
                const { confirmedCount, pendingCount, isFullyBooked, isPartiallyBooked, hasPending } = getDayStatus(day);
                const statusColor = isFullyBooked ? '#f44336' : isPartiallyBooked ? '#ff9800' : '#4caf50';
                
                return (
                  <Paper 
                    key={i} 
                    elevation={0} 
                    onClick={() => handleDateSelect(day, month, year)}
                    sx={{ 
                      p: { xs: 1, md: 2 }, 
                      textAlign: 'center', 
                      cursor: (isPast || isSun || isFullyBooked) ? 'not-allowed' : 'pointer',
                      opacity: (isPast || isSun) ? 0.5 : 1, 
                      bgcolor: isSun ? '#ffebee' : isFullyBooked ? '#ffebee' : isPartiallyBooked ? '#fff3e0' : '#e8f5e9',
                      borderRadius: 2, 
                      transition: 'all 0.3s', 
                      minHeight: { xs: '70px', md: '100px' },
                      border: '1px solid #c8e6c9',
                      position: 'relative',
                      '&:hover': !isPast && !isSun && !isFullyBooked ? { transform: 'translateY(-4px)', boxShadow: 3, bgcolor: '#c8e6c9' } : {}
                    }}>
                    <Typography fontWeight="bold" fontSize={{ xs: '14px', md: '16px' }}>{day}</Typography>
                    {!isPast && !isSun && (
                      <>
                        <Chip 
                          label={isFullyBooked ? "FULL" : `${confirmedCount}/${TOTAL_SLOTS_PER_DAY}`} 
                          size="small" 
                          sx={{ mt: 1, bgcolor: statusColor, color: 'white', fontSize: '10px', height: '20px' }} 
                        />
                        {hasPending && !isFullyBooked && (
                          <Badge 
                            badgeContent={`${pendingCount} pending`} 
                            color="warning"
                            sx={{ position: 'absolute', top: -8, right: -8 }}
                          />
                        )}
                      </>
                    )}
                    {isSun && <Typography fontSize="10px" color="error" sx={{ mt: 0.5 }}>CLOSED</Typography>}
                  </Paper>
                );
              })}
            </Box>
          ))}
        </Paper>
      </Fade>
    );
  };

  const renderServiceSelection = () => (
    <Slide direction="left" in={activeStep === 1} mountOnEnter unmountOnExit timeout={500}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, width: '100%' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => { setSelectedDate(null); setActiveStep(0); }} sx={{ mb: 3 }}>Back to Calendar</Button>
        
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom sx={{ color: '#00695c' }}>
          Select Dental Service
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {SERVICES.map(service => (
            <Grid item xs={12} sm={6} key={service.id}>
              <Card 
                onClick={() => { setSelectedService(service); setActiveStep(2); }}
                sx={{ 
                  cursor: 'pointer', 
                  transition: '0.3s', 
                  border: `2px solid ${selectedService?.id === service.id ? '#00695c' : '#e0e0e0'}`,
                  '&:hover': { transform: 'translateX(8px)', borderColor: '#00695c' }
                }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight="bold">{service.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{service.description}</Typography>
                      <Chip label={`${service.duration} mins`} size="small" sx={{ mt: 1, bgcolor: '#e0f2f1' }} />
                    </Box>
                    <Typography variant="h5" sx={{ color: '#00695c', fontWeight: 'bold' }}>{service.price}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Divider sx={{ my: 3 }}>OR</Divider>
        
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#00695c' }}>Other Dental Concerns</Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select a concern</InputLabel>
          <Select
            value={form.selectedConcern}
            label="Select a concern"
            onChange={(e) => {
              const value = e.target.value;
              setForm({ ...form, selectedConcern: value, customConcern: value === "Other" ? "" : "" });
              if (value !== "Other") {
                setSelectedService(null);
              }
            }}
          >
            {OTHER_CONCERNS.map(concern => (
              <MenuItem key={concern} value={concern}>{concern}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {form.selectedConcern === "Other" && (
          <Fade in={form.selectedConcern === "Other"} timeout={300}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Please describe your concern"
              placeholder="Tell us more about what you need..."
              value={form.customConcern}
              onChange={(e) => setForm({ ...form, customConcern: e.target.value })}
              sx={{ mt: 2 }}
            />
          </Fade>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setWaitlistDialogOpen(true)}
            sx={{ borderColor: '#ff9800', color: '#ff9800' }}
          >
            <QueueIcon sx={{ mr: 1 }} /> Join Waitlist
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedService || form.selectedConcern) {
                setActiveStep(2);
              }
            }} 
            disabled={!selectedService && !form.selectedConcern}
            sx={{ bgcolor: '#00695c', flex: 1, '&:hover': { bgcolor: '#004d40' } }}
          >
            Next Step →
          </Button>
        </Box>
      </Paper>
    </Slide>
  );

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (activeStep === 2 && selectedDate) {
      const loadSlots = async () => {
        setLoadingSlots(true);
        const slots = await getAvailableTimeSlots();
        setAvailableSlots(slots);
        setLoadingSlots(false);
      };
      loadSlots();
    }
  }, [activeStep, selectedDate, selectedService, form.selectedConcern]);

  const renderTimeSlots = () => {
    const selectedServiceName = selectedService?.name || form.selectedConcern;
    
    return (
      <Slide direction="left" in={activeStep === 2} mountOnEnter unmountOnExit timeout={500}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, width: '100%' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => { setSelectedService(null); setActiveStep(1); }} sx={{ mb: 3 }}>Back to Services</Button>
          
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom sx={{ color: '#00695c' }}>
            Select Time Slot
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Service: <strong>{selectedServiceName || "Consultation"}</strong> | Duration: <strong>{selectedService?.duration || 30} minutes</strong>
          </Typography>
          
          {selectedService?.duration > 60 && (
            <Alert severity="info" sx={{ mb: 2, bgcolor: '#e3f2fd' }}>
              ⚠️ Long procedure - needs multiple consecutive slots
            </Alert>
          )}
          
          {loadingSlots ? (
            <LinearProgress sx={{ my: 4 }} />
          ) : (
            <Grid container spacing={2}>
              {availableSlots.map((slot, idx) => (
                <Grid item xs={6} sm={4} md={3} key={idx}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSelectedTimeSlot(slot);
                      setActiveStep(3);
                    }}
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      borderColor: '#00695c',
                      color: '#00695c',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 2, bgcolor: '#e0f2f1' }
                    }}
                  >
                    <Stack alignItems="center">
                      <AccessTimeIcon fontSize="small" />
                      <Typography fontWeight="bold" fontSize={{ xs: '12px', sm: '14px' }}>{slot.time}</Typography>
                    </Stack>
                  </Button>
                </Grid>
              ))}
            </Grid>
          )}
          
          {!loadingSlots && availableSlots.length === 0 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              No available time slots for this service on the selected date. 
              <Button size="small" onClick={() => setWaitlistDialogOpen(true)} sx={{ ml: 2 }}>
                Join Waitlist
              </Button>
            </Alert>
          )}
        </Paper>
      </Slide>
    );
  };

  const renderConfirmation = () => {
    if (!selectedDate || !selectedTimeSlot) return null;
    
    const dateStr = new Date(selectedDate.year, selectedDate.month, selectedDate.day).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const serviceName = selectedService?.name || form.selectedConcern || "Consultation";
    const servicePrice = selectedService?.price || (form.selectedConcern && form.selectedConcern !== "Other" ? "Price upon consultation" : "Price upon consultation");
    
    return (
      <Slide direction="up" in={activeStep === 3} mountOnEnter unmountOnExit timeout={500}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, width: '100%' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => { setSelectedTimeSlot(null); setActiveStep(2); }} sx={{ mb: 3 }}>Back to Time Slots</Button>
          
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom sx={{ color: '#00695c' }}>
            Review Your Appointment
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, my: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#00695c', fontWeight: 'bold' }} gutterBottom>
              📅 Appointment Details
            </Typography>
            <Typography variant="h6">{dateStr}</Typography>
            <Typography variant="h6" sx={{ color: '#00695c', mt: 1 }}>at {selectedTimeSlot.time}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1"><strong>Service:</strong> {serviceName}</Typography>
            {form.customConcern && <Typography variant="body2" sx={{ mt: 1 }}><strong>Details:</strong> {form.customConcern}</Typography>}
            <Typography variant="body2" sx={{ mt: 1, color: '#00695c', fontWeight: 'bold' }}>Price: {servicePrice}</Typography>
          </Paper>
          
          <Alert severity="info" sx={{ mb: 2, bgcolor: '#e3f2fd' }}>
            Your appointment request will be sent to admin for confirmation. You'll receive a notification once confirmed.
          </Alert>
          
          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            onClick={createAppointment} 
            disabled={loading}
            sx={{ bgcolor: '#00695c', '&:hover': { bgcolor: '#004d40' }, py: 1.5 }}
          >
            {loading ? "Processing..." : "Request Appointment"}
          </Button>
        </Paper>
      </Slide>
    );
  };

  const renderSidebar = () => {
    const upcoming = myAppointments.filter(a => a && !["completed", "cancelled"].includes(a.status));
    const history = myAppointments.filter(a => a && ["completed", "cancelled"].includes(a.status));
    const displayList = tabValue === 0 ? upcoming : history;
    
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const readNotifications = notifications.filter(n => n.is_read);

    return (
      <Paper elevation={3} sx={{ p: 2, borderRadius: 4, position: { lg: 'sticky' }, top: 20 }}>
        {/* My Appointments Section */}
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#00695c', mb: 2 }}>
          My Appointments
        </Typography>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label={`Upcoming (${upcoming.length})`} />
          <Tab label={`History (${history.length})`} />
        </Tabs>
        
        {displayList.length === 0 ? (
          <Box textAlign="center" py={3}>
            <EventNoteIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
            <Typography color="text.secondary">No appointments</Typography>
          </Box>
        ) : (
          displayList.map(app => (
            <Paper key={app.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {new Date(app.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {app.formatted_time || app.time}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {app.service || app.other_concern}
                  </Typography>
                  <Chip 
                    label={getStatusLabel(app.status)} 
                    size="small" 
                    sx={{ mt: 0.5, bgcolor: getStatusColor(app.status), color: 'white', fontSize: '10px', height: '20px' }} 
                  />
                </Box>
                {app.status === "pending" && (
                  <IconButton size="small" onClick={() => cancelAppointment(app.id)} sx={{ color: '#f44336' }}>
                    <CancelIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Paper>
          ))
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Notifications Section */}
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#00695c', mb: 2 }}>
          Notifications
          {unreadNotifications.length > 0 && (
            <Badge badgeContent={unreadNotifications.length} color="error" sx={{ ml: 1 }} />
          )}
        </Typography>
        
        <Tabs value={notifTabValue} onChange={(e, v) => setNotifTabValue(v)} sx={{ mb: 2 }} size="small">
          <Tab label={`Unread (${unreadNotifications.length})`} />
          <Tab label={`All (${notifications.length})`} />
        </Tabs>
        
        {notifications.length === 0 ? (
          <Box textAlign="center" py={3}>
            <NotificationsIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          (notifTabValue === 0 ? unreadNotifications : notifications).slice(0, 5).map(notif => (
            <Paper key={notif.id} sx={{ p: 1.5, mb: 1, borderRadius: 2, bgcolor: notif.is_read ? 'white' : '#e3f2fd' }}>
              <Box display="flex" alignItems="center" gap={1}>
                {getNotificationIcon(notif.notification_type)}
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={notif.is_read ? 'normal' : 'bold'}>
                    {notif.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="10px">
                    {new Date(notif.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))
        )}
        
        {notifications.length > 0 && notifTabValue === 0 && unreadNotifications.length > 5 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            +{unreadNotifications.length - 5} more unread
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* Waiting List Section */}
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#00695c', mb: 2 }}>
          Waiting List Status
          {waitlistEntries.filter(w => w.status === 'active').length > 0 && (
            <Badge badgeContent={waitlistEntries.filter(w => w.status === 'active').length} color="warning" sx={{ ml: 1 }} />
          )}
        </Typography>
        
        {waitlistEntries.length === 0 ? (
          <Box textAlign="center" py={3}>
            <QueueIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
            <Typography color="text.secondary">Not on any waitlist</Typography>
            <Button size="small" variant="outlined" onClick={() => setWaitlistDialogOpen(true)} sx={{ mt: 1 }}>
              Join Waitlist
            </Button>
          </Box>
        ) : (
          waitlistEntries.map(entry => (
            <Paper key={entry.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon sx={{ color: entry.urgency_level === 3 ? '#f44336' : entry.urgency_level === 2 ? '#ff9800' : '#4caf50' }} />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {entry.service_needed || 'Dental Service'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Preferred: {new Date(entry.preferred_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Position: #{entry.position || '?'} in queue
                  </Typography>
                  <Chip 
                    label={`Urgency: ${entry.urgency_level === 3 ? 'High' : entry.urgency_level === 2 ? 'Medium' : 'Low'}`}
                    size="small"
                    sx={{ mt: 0.5, fontSize: '10px', height: '20px' }}
                  />
                </Box>
              </Box>
            </Paper>
          ))
        )}
        
        <Button 
          fullWidth 
          variant="outlined" 
          size="small" 
          onClick={() => setWaitlistDialogOpen(true)}
          sx={{ mt: 1, borderColor: '#ff9800', color: '#ff9800' }}
        >
          Join Another Waitlist
        </Button>
      </Paper>
    );
  };

  const joinWaitlist = async () => {
    if (!selectedDate) return showToast("Select a date first", "warning");
    setLoading(true);
    try {
      const requestData = {
        preferred_date: `${selectedDate.year}-${String(selectedDate.month+1).padStart(2,'0')}-${String(selectedDate.day).padStart(2,'0')}`,
        time_start: "09:00",
        time_end: "17:00",
        service: selectedService?.name || form.selectedConcern || "General",
        urgency_level: form.urgencyLevel
      };
      
      const { data } = await AxiosInstance.post("appointments/join_waitlist/", requestData);
      showToast(`Added to waitlist! Position: ${data.position}`, "success");
      setWaitlistDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Waitlist error:", error);
      showToast(error.response?.data?.error || "Error joining waitlist", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant={isMobile ? "h4" : "h3"} textAlign="center" sx={{ my: 3, color: '#00695c', fontWeight: 'bold' }}>
        🦷 Book Your Dental Appointment
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {['Select Date', 'Choose Service', 'Pick Time', 'Review'].map((label, idx) => (
          <Step key={idx}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={activeStep === 0 ? 12 : 8}>
          {activeStep === 0 && renderCalendar()}
          {activeStep === 1 && renderServiceSelection()}
          {activeStep === 2 && renderTimeSlots()}
          {activeStep === 3 && renderConfirmation()}
        </Grid>
        {activeStep === 0 && (
          <Grid item xs={12} lg={4}>
            {renderSidebar()}
          </Grid>
        )}
      </Grid>
      
      {/* AI Panel */}
      {showAIPanel && (
        <Paper sx={{ position: 'fixed', bottom: 80, right: 20, width: 300, p: 2, zIndex: 1000, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight="bold" sx={{ color: '#00695c' }}>🤖 AI Assistant</Typography>
            <IconButton size="small" onClick={() => setShowAIPanel(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {aiSuggestions.map((s, i) => (
              <Paper key={i} sx={{ p: 1, mb: 1, bgcolor: '#f5f5f5' }}>
                <Typography variant="body2">{s.description || s.title || s}</Typography>
              </Paper>
            ))}
            {aiSuggestions.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center">No suggestions available</Typography>
            )}
          </Box>
        </Paper>
      )}
      
      {/* AI Toggle Button */}
      <Button onClick={() => setShowAIPanel(!showAIPanel)} sx={{ position: 'fixed', bottom: 20, right: 20, bgcolor: '#00695c', color: 'white', borderRadius: '50%', minWidth: 'auto', width: 56, height: 56, '&:hover': { bgcolor: '#004d40' }, zIndex: 1000 }}>
        <MedicalServicesIcon />
      </Button>
      
      {/* Waitlist Dialog */}
      <Dialog open={waitlistDialogOpen} onClose={() => setWaitlistDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#00695c', color: 'white' }}>Join Waitlist</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2, mb: 2 }}>No available slots? Join our waitlist and we'll notify you when a slot opens!</Typography>
          <FormControl fullWidth>
            <InputLabel>Urgency Level</InputLabel>
            <Select value={form.urgencyLevel} onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })} label="Urgency Level">
              <MenuItem value={1}>Low - Can wait 2+ weeks</MenuItem>
              <MenuItem value={2}>Medium - Within 2 weeks</MenuItem>
              <MenuItem value={3}>High - Emergency/Urgent</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaitlistDialogOpen(false)}>Cancel</Button>
          <Button onClick={joinWaitlist} variant="contained" sx={{ bgcolor: '#ff9800' }}>Join Waitlist</Button>
        </DialogActions>
      </Dialog>
      
      {/* Toast notifications */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast(prev => ({ ...prev, open: false }))}>{toast.message}</Alert>
      </Snackbar>
      
      {/* Loading bar */}
      {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000 }} />}
    </Container>
  );
}