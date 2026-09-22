import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// ---- Admin System ----
import AdminLayout from './pages/admin/AdminLayout.jsx';

// ---- Driver System ----
import DriverLayout from './pages/driver/DriverLayout.jsx';
import DriverLoginPage from './pages/driver/DriverLoginPage.jsx';
import DriverDashboard from './pages/driver/DriverDashboard.jsx';
import DriverRequests from './pages/driver/DriverRequests.jsx';
import DriverActiveRide from './pages/driver/DriverActiveRide.jsx';
import DriverEarnings from './pages/driver/DriverEarnings.jsx';
import DriverHistory from './pages/driver/DriverHistory.jsx';
import DriverProfile from './pages/driver/DriverProfile.jsx';
import DriverNotifications from './pages/driver/DriverNotifications.jsx';

// ---- Passenger Pages ----
import LandingPage       from './pages/passenger/LandingPage.jsx';
import LoginPage         from './pages/passenger/LoginPage.jsx';
import HomePage          from './pages/passenger/HomePage.jsx';
import BookRidePage      from './pages/passenger/BookRidePage.jsx';
import SearchingPage     from './pages/passenger/SearchingPage.jsx';
import DriverAssignedPage from './pages/passenger/DriverAssignedPage.jsx';
import LiveRidePage      from './pages/passenger/LiveRidePage.jsx';
import PaymentPage       from './pages/passenger/PaymentPage.jsx';
import RideHistoryPage   from './pages/passenger/RideHistoryPage.jsx';
import ProfilePage       from './pages/passenger/ProfilePage.jsx';
import OffersPage        from './pages/passenger/OffersPage.jsx';
import LiveLocationPage  from './pages/passenger/LiveLocationPage.jsx';
import GoogleLiveLocationPage from './pages/passenger/GoogleLiveLocationPage.jsx';

function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const hasLocalSession = !!localStorage.getItem('token') || !!localStorage.getItem('ridex_token') || !!localStorage.getItem('riidex_token') || !!localStorage.getItem('ridex_user_name') || !!localStorage.getItem('ridex_user_phone');

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00edff', fontFamily: 'sans-serif' }}>
        Authenticating...
      </div>
    );
  }

  if (!isSignedIn && !hasLocalSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* ---- ADMIN SYSTEM ---- */}
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="/admin"   element={<AdminLayout />} />

        {/* ---- DRIVER SYSTEM ---- */}
        <Route path="/driver/login" element={<DriverLoginPage />} />
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="requests" element={<DriverRequests />} />
          <Route path="active-ride" element={<DriverActiveRide />} />
          <Route path="earnings" element={<DriverEarnings />} />
          <Route path="history" element={<DriverHistory />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="notifications" element={<DriverNotifications />} />
        </Route>

        {/* ---- PASSENGER PUBLIC ---- */}
        <Route path="/"      element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ---- PASSENGER PROTECTED ---- */}
        <Route path="/home"           element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/live-location"  element={<ProtectedRoute><GoogleLiveLocationPage /></ProtectedRoute>} />
        <Route path="/google-live-location" element={<ProtectedRoute><GoogleLiveLocationPage /></ProtectedRoute>} />
        <Route path="/osm-live-location" element={<ProtectedRoute><LiveLocationPage /></ProtectedRoute>} />
        <Route path="/book"           element={<ProtectedRoute><BookRidePage /></ProtectedRoute>} />
        <Route path="/map-select"     element={<ProtectedRoute><BookRidePage /></ProtectedRoute>} />
        <Route path="/searching"      element={<Navigate to="/driver-assigned" replace />} />
        <Route path="/driver-assigned" element={<ProtectedRoute><DriverAssignedPage /></ProtectedRoute>} />
        <Route path="/live-ride"      element={<ProtectedRoute><LiveRidePage /></ProtectedRoute>} />
        <Route path="/payment"        element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/history"        element={<ProtectedRoute><RideHistoryPage /></ProtectedRoute>} />
        <Route path="/rides"          element={<ProtectedRoute><RideHistoryPage /></ProtectedRoute>} />
        <Route path="/offers"         element={<ProtectedRoute><OffersPage /></ProtectedRoute>} />
        <Route path="/notifications"  element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

