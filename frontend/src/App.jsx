import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TripPlannerPage from './pages/TripPlannerPage';
import ActivityLogPage from './pages/ActivityLogPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CoachingPage from './pages/CoachingPage';
import CommunityPage from './pages/CommunityPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="border-4 border-slate-200 border-t-emerald-600 h-10 w-10 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading CarbonLens...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <GoogleMapsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Endpoint */}
            <Route path="/login" element={<AuthPage />} />

            {/* Protected Core Layout routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="trip-planner" element={<TripPlannerPage />} />
              <Route path="activity-log" element={<ActivityLogPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="coaching" element={<CoachingPage />} />
              <Route path="community" element={<CommunityPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GoogleMapsProvider>
    </AuthProvider>
  );
}
