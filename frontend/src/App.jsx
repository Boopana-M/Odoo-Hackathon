import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import enterpriseTheme from './components/layout/theme';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import OrganizationSetup from './pages/Organization/OrganizationSetup';
import { AuthProvider, useAuth } from './components/layout/AuthContext';

// Import Developer 2 (FE-2) pages
import AssetDirectory from './pages/Assets/AssetDirectory';
import AllocateAsset from './pages/Allocation/AllocateAsset';
import ResourceBooking from './pages/Booking/ResourceBooking';
import MaintenanceKanban from './pages/Maintenance/MaintenanceKanban';
import AuditCycles from './pages/Audit/AuditCycles';
import AnalyticsDashboard from './pages/Reports/AnalyticsDashboard';
import NotificationCenter from './pages/Notifications/NotificationCenter';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f8' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={enterpriseTheme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Enterprise ERP Layout Wrapper */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Developer 1 Owned Pages */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="organization" element={<OrganizationSetup />} />

              {/* Developer 2 Owned Business Pages */}
              <Route path="assets" element={<AssetDirectory />} />
              <Route path="allocation" element={<AllocateAsset />} />
              <Route path="booking" element={<ResourceBooking />} />
              <Route path="maintenance" element={<MaintenanceKanban />} />
              <Route path="audit" element={<AuditCycles />} />
              <Route path="reports" element={<AnalyticsDashboard />} />
              <Route path="notifications" element={<NotificationCenter />} />
            </Route>

            {/* Catch-all Fallback Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
