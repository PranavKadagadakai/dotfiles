import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../core/auth/useAuth";

// Layouts
import MainLayout from "../shared/layouts/MainLayout";
import AuthLayout from "../shared/layouts/AuthLayout";

// Auth pages
import LoginPage from "../features/auth/pages/LoginPage";
import SignupPage from "../features/auth/pages/SignupPage";

// Dashboard pages
import StudentDashboard from "../features/dashboard/pages/StudentDashboard";
import ClubDashboard from "../features/dashboard/pages/ClubDashboard";
import MentorDashboard from "../features/dashboard/pages/MentorDashboard";

// Feature pages
import EventsListPage from "../features/events/pages/EventsListPage";
import EventDetailsPage from "../features/events/pages/EventDetailsPage";
import CertificatesListPage from "../features/certificates/pages/CertificatesListPage";
import PointsLedgerPage from "../features/aicte-points/pages/PointsLedgerPage";
import ProfilePage from "../features/profile/pages/ProfilePage";

// Private Route Component
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Routes Configuration
const AppRoutes = () => {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return "/";

    switch (user.user_type) {
      case "STUDENT":
        return "/student-dashboard";
      case "CLUB_ORGANIZER":
        return "/club-dashboard";
      case "MENTOR":
        return "/mentor-dashboard";
      case "ADMIN":
        return "/admin-dashboard";
      default:
        return "/";
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={<Navigate to={getDashboardRoute()} replace />}
        />

        {/* Dashboard routes */}
        <Route
          path="/student-dashboard"
          element={
            <PrivateRoute roles={["STUDENT"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/club-dashboard"
          element={
            <PrivateRoute roles={["CLUB_ORGANIZER"]}>
              <ClubDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/mentor-dashboard"
          element={
            <PrivateRoute roles={["MENTOR"]}>
              <MentorDashboard />
            </PrivateRoute>
          }
        />

        {/* Feature routes */}
        <Route
          path="/events"
          element={
            <PrivateRoute>
              <EventsListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <PrivateRoute>
              <EventDetailsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/certificates"
          element={
            <PrivateRoute>
              <CertificatesListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/aicte-points"
          element={
            <PrivateRoute>
              <PointsLedgerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        {/* Unauthorized page */}
        <Route
          path="/unauthorized"
          element={
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-red-600">
                Unauthorized Access
              </h1>
              <p className="mt-4">
                You do not have permission to access this page.
              </p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
