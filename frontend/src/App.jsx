import { useState } from 'react'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminFooter from './components/AdminFooter'
import AdminNavbar from './components/AdminNavbar'
import RecepNavbar from './components/RecepNavbar'
import About from './components/About'
import Services from './components/Services'
import Profile from './components/Profile'
import {Routes, Route, useLocation} from 'react-router-dom'
import ProtectedRoutes from './components/ProtectedRoutes'
import PasswordResetRequest from './components/PasswordResetRequest'
import PasswordReset from './components/PasswordReset'
import AdminLogin from './components/AdminLogin'
import Appointment from './components/Appointment'
import AppointmentForm from './components/AppointmentForm'
import AdminDashboard from './components/AdminDashboard'
import AdminAppointments from './components/AdminAppointments'
import AdminPatients from './components/AdminPatients'
import AdminAuditLog from './components/AdminAuditLog'
import AdminManage from './components/AdminManage'
import AppointmentScheduler from './components/AppointmentScheduler'
import MyAppointmentsPage from './components/MyAppointmentsPage'
import ReceptionistDashboard from './components/ReceptionistDashboard'
import ExternalNavbar from './components/ExternalNavbar'

function App() {
  const location = useLocation();

  // Routes where no navbar should be shown
  const noNavbar =
    location.pathname === '/register' ||
    location.pathname === '/' ||
    location.pathname.includes('password') ||
    location.pathname === '/admin';

  // Routes where admin navbar should be shown
  const adminNavbar = location.pathname.startsWith('/admin/dashboard') ||
                      location.pathname.startsWith('/admin/billing') ||
                      location.pathname.startsWith('/admin/payments') ||
                      location.pathname.startsWith('/admin/patients') ||
                      location.pathname.startsWith('/admin/reports') ||
                      location.pathname.startsWith('/admin/audit') ||
                      location.pathname.startsWith('/admin/manage') ||
                      location.pathname.startsWith('/admin/appointments');
  
  const recepNavbar = location.pathname.startsWith('/recep/dashboard') ||
                      location.pathname.startsWith('/recep/billing') ||
                      location.pathname.startsWith('/recep/payments') ||
                      location.pathname.startsWith('/recep/patients') ||
                      location.pathname.startsWith('/recep/appointments');

  return (
    <>
      {noNavbar ? (
        <ExternalNavbar 
          content={
            <>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/request/password_reset" element={<PasswordResetRequest />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/password_reset/:token" element={<PasswordReset />} />
              </Routes>
              <Footer/>
            </>
          }
        />
      ) : recepNavbar ? (
        <RecepNavbar
          content={
            <>
              <Routes>
                <Route path="/recep/dashboard" element={<ReceptionistDashboard />} />
              </Routes>
              <AdminFooter/>
            </>
          }
        />
      ) : adminNavbar ? (
        <AdminNavbar
          content={
            <>
              <Routes>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/appointments" element={<AdminAppointments />} />
                <Route path="/admin/patients" element={<AdminPatients />} />
                <Route path="/admin/audit" element={<AdminAuditLog />} />
                <Route path="/admin/manage" element={<AdminManage />} />
              </Routes>
              <AdminFooter/>
            </>
          }
        />
      ) : (
        <Navbar
          content={
            <>
              <Routes>
                <Route element={<ProtectedRoutes />}>
                  <Route path="home/" element={<Home />} />
                  <Route path="profile/" element={<Profile />} />
                  <Route path="about/" element={<About />} />
                  <Route path="services/" element={<Services />} />
                  <Route path='calendar/' element={<AppointmentScheduler/>} />
                  <Route path="appointments/" element={<MyAppointmentsPage />} />
                </Route>
              </Routes>
              <Footer/>
            </>
          }
        />
      )}
    </>
  );
}

export default App;

