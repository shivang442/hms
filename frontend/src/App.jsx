import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout & Protected Route
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientManagement from './pages/admin/PatientManagement';
import AuditLogsPage from './pages/admin/AuditLogsPage';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAvailabilityPage from './pages/doctor/DoctorAvailabilityPage';

import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorListPage from './pages/doctors/DoctorListPage';
import BookAppointmentPage from './pages/appointments/BookAppointmentPage';
import AppointmentManagementPage from './pages/appointments/AppointmentManagementPage';
import AppointmentHistoryPage from './pages/appointments/AppointmentHistoryPage';

import UserProfilePage from './pages/profile/UserProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';

import ForbiddenPage from './pages/error/ForbiddenPage';
import NotFoundPage from './pages/error/NotFoundPage';

// Root redirector based on authenticated user's role
function RoleRedirector() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'DOCTOR':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'PATIENT':
    default:
      return <Navigate to="/patient/dashboard" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Dashboard Shell */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Root role dispatcher */}
            <Route path="/" element={<RoleRedirector />} />

            {/* Admin Exclusive Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DoctorManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patients"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PatientManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/availability"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorAvailabilityPage />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared Clinic & Appointment Features */}
            <Route path="/doctors" element={<DoctorListPage />} />
            <Route
              path="/book-appointment"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <BookAppointmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-appointment/:doctorId"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <BookAppointmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/manage"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <AppointmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="/appointments/history" element={<AppointmentHistoryPage />} />

            {/* User Account Settings & Notification Feed */}
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Error Pages */}
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
