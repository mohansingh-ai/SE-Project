import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import JobPostingForm from './pages/JobPostingForm';
import JobDetail from './pages/JobDetail';
import CandidateProfile from './pages/CandidateProfile';

/** Redirect based on user role after login */
function RoleRedirect() {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'recruiter') return <Navigate to="/recruiter" replace />;
  if (userRole === 'candidate') return <Navigate to="/candidate" replace />;
  return <LandingPage />;
}

/** Guard: require authentication */
function PrivateRoute({ children, requiredRole }) {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (requiredRole && userRole !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={currentUser ? <RoleRedirect /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Recruiter */}
      <Route path="/recruiter" element={
        <PrivateRoute requiredRole="recruiter"><RecruiterDashboard /></PrivateRoute>
      } />
      <Route path="/recruiter/jobs/new" element={
        <PrivateRoute requiredRole="recruiter"><JobPostingForm /></PrivateRoute>
      } />
      <Route path="/recruiter/jobs/:jobId" element={
        <PrivateRoute requiredRole="recruiter"><JobDetail /></PrivateRoute>
      } />
      <Route path="/recruiter/jobs/:jobId/edit" element={
        <PrivateRoute requiredRole="recruiter"><JobPostingForm /></PrivateRoute>
      } />

      {/* Candidate */}
      <Route path="/candidate" element={
        <PrivateRoute requiredRole="candidate"><CandidateDashboard /></PrivateRoute>
      } />
      <Route path="/candidate/profile" element={
        <PrivateRoute requiredRole="candidate"><CandidateProfile /></PrivateRoute>
      } />
      <Route path="/candidate/jobs" element={
        <PrivateRoute requiredRole="candidate"><CandidateDashboard /></PrivateRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
