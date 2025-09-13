import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/LoginPage';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MapView from './pages/MapView';
import CustomerMapView from './pages/CustomerMapView';
import StaffManagement from './pages/StaffManagement';
import CustomerView from './pages/CustomerView';
import AnalyticsView from './pages/AnalyticsView';
import MyProfile from './pages/MyProfile';
import ProtectedRoute from './components/common/ProtectedRoute';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/staff" element={
                <ProtectedRoute>
                  <StaffDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/map" element={
                <ProtectedRoute>
                  <MapView />
                </ProtectedRoute>
              } />
              <Route path="/customer-map" element={
                <ProtectedRoute>
                  <CustomerMapView />
                </ProtectedRoute>
              } />
              <Route path="/staff-management" element={
                <ProtectedRoute>
                  <StaffManagement />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute>
                  <CustomerView />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AnalyticsView />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <PWAInstallPrompt />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
