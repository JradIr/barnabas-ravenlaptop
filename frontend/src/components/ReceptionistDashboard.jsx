// src/pages/receptionist/ReceptionistDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "./AxiosInstance";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Badge,
  Alert,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Pending as PendingIcon,
  CheckCircle as ConfirmedIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  EventNote as EventIcon,
  MedicalServices as ServiceIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { format, startOfWeek, endOfWeek, isToday } from "date-fns";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
};

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalPatients: 0,
    totalRevenue: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      // Fetch appointments
      const [appointmentsRes, pendingRes, confirmedRes, completedRes, cancelledRes, patientsRes] =
        await Promise.all([
          AxiosInstance.get(`/appointments/?date=${today}`),
          AxiosInstance.get("/appointments/pending/"),
          AxiosInstance.get("/appointments/confirmed/"),
          AxiosInstance.get("/appointments/completed/"),
          AxiosInstance.get("/appointments/cancelled/"),
          AxiosInstance.get("/patients/"),
        ]);

      const todayApps = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      const pendingApps = Array.isArray(pendingRes.data) ? pendingRes.data : [];
      const confirmedApps = Array.isArray(confirmedRes.data) ? confirmedRes.data : [];
      const completedApps = Array.isArray(completedRes.data) ? completedRes.data : [];
      const cancelledApps = Array.isArray(cancelledRes.data) ? cancelledRes.data : [];
      const patients = Array.isArray(patientsRes.data) ? patientsRes.data : [];

      // Get upcoming appointments for the week
      const allApps = await AxiosInstance.get("/appointments/");
      const allAppointments = Array.isArray(allApps.data) ? allApps.data : [];
      const upcoming = allAppointments.filter((app) => {
        const appDate = new Date(app.date);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return appDate >= todayDate && app.status !== "cancelled" && app.status !== "completed";
      });

      // Calculate total revenue (from completed appointments)
      const totalRevenue = completedApps.reduce((sum, app) => {
        const price = parseFloat(app.service_price) || 0;
        return sum + price;
      }, 0);

      setStats({
        todayAppointments: todayApps.length,
        pendingAppointments: pendingApps.length,
        confirmedAppointments: confirmedApps.length,
        completedAppointments: completedApps.length,
        cancelledAppointments: cancelledApps.length,
        totalPatients: patients.length,
        totalRevenue: totalRevenue,
      });

      setTodayAppointments(todayApps.slice(0, 10));
      setUpcomingAppointments(upcoming.slice(0, 10));
      setRecentPatients(patients.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusChip = (status) => {
    const config = {
      pending: { label: "Pending", color: "#ff9800", bgColor: "#fff3e0" },
      confirmed: { label: "Confirmed", color: "#4caf50", bgColor: "#e8f5e9" },
      completed: { label: "Completed", color: "#2196f3", bgColor: "#e3f2fd" },
      cancelled: { label: "Cancelled", color: "#f44336", bgColor: "#ffebee" },
    };
    const c = config[status] || { label: status, color: "#757575", bgColor: "#f5f5f5" };
    return (
      <Chip
        label={c.label}
        size="small"
        sx={{ bgcolor: c.bgColor, color: c.color, fontWeight: 500, fontSize: "11px", height: 22 }}
      />
    );
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.95)",
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: color, bgcolor: `${color}10`, borderRadius: 2, p: 1 }}>{icon}</Box>
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #004d40 0%, #00695c 50%, #00796b 100%)",
          p: 3,
        }}
      >
        <LinearProgress sx={{ bgcolor: "rgba(255,255,255,0.2)", "& .MuiLinearProgress-bar": { bgcolor: "#80cbc4" } }} />
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 2, textAlign: "center" }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #004d40 0%, #00695c 50%, #00796b 100%)",
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: "white", mb: 1 }}>
          Receptionist Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
          Welcome back! Here's what's happening today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<CalendarIcon sx={{ fontSize: 24 }} />}
            color="#2ca6a4"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Pending"
            value={stats.pendingAppointments}
            icon={<PendingIcon sx={{ fontSize: 24 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Confirmed"
            value={stats.confirmedAppointments}
            icon={<ConfirmedIcon sx={{ fontSize: 24 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<PeopleIcon sx={{ fontSize: 24 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            title="Revenue Today"
            value={`₱${stats.totalRevenue.toLocaleString()}`}
            icon={<MoneyIcon sx={{ fontSize: 24 }} />}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* Refresh Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{ borderColor: "#80cbc4", color: "#80cbc4", "&:hover": { borderColor: "white", color: "white" } }}
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            bgcolor: "#e0f2f1",
            "& .MuiTab-root": { color: "#004d40", fontWeight: 500 },
            "& .Mui-selected": { color: "#00695c", fontWeight: "bold" },
            "& .MuiTabs-indicator": { bgcolor: "#00695c" },
          }}
        >
          <Tab label="Today's Appointments" />
          <Tab label="Upcoming Appointments" />
        </Tabs>
      </Paper>

      {/* Appointments Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: "#e0f2f1" }}>
              <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Service</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? todayAppointments : upcomingAppointments).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <EventIcon sx={{ fontSize: 48, color: "#bdbdbd", mb: 1 }} />
                  <Typography variant="body2" color="textSecondary">
                    No appointments found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (tabValue === 0 ? todayAppointments : upcomingAppointments).map((app) => (
                <TableRow key={app.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#00695c" }}>
                        {app.user_username?.[0]?.toUpperCase() || "P"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {app.user_username || "Patient"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {app.user_email || ""}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <ServiceIcon sx={{ fontSize: 14, color: "#00695c" }} />
                      <Typography variant="body2">{app.service || "Consultation"}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(app.date)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <TimeIcon sx={{ fontSize: 14, color: "#00695c" }} />
                      <Typography variant="body2">{formatTime(app.time)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(app.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Recent Patients */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 2, bgcolor: "#e0f2f1", borderBottom: "1px solid #c8e6c9" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#004d40" }}>
            Recent Patients
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#004d40" }}>Registered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: "#bdbdbd", mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      No patients found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentPatients.map((patient) => (
                  <TableRow key={patient.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#00695c" }}>
                          {patient.username?.[0]?.toUpperCase() || "P"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {patient.username}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {patient.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.phone_number || "No phone"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(patient.date_joined)}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}