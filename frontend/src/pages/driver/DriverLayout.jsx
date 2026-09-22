import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BellRing,
  Car,
  TrendingUp,
  History,
  User,
  LogOut,
  Menu,
  X,
  Star,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import API_BASE from '../../config';
import './DriverLayout.css';

export default function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [driver, setDriver] = useState(null);
  const [availability, setAvailability] = useState('Available');
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRideCount, setActiveRideCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Check driver session & role on mount
  useEffect(() => {
    const token = localStorage.getItem('ridex_driver_token');
    const storedUser = localStorage.getItem('ridex_driver_user');

    if (!token && !storedUser) {
      navigate('/driver/login', { replace: true });
      return;
    }

    let parsedUser = null;
    if (storedUser) {
      try { parsedUser = JSON.parse(storedUser); } catch (e) {}
    }

    if (parsedUser) {
      setDriver(parsedUser);
      setAvailability(parsedUser.driverDetails?.availability || 'Available');
    }

    // Fetch latest profile & status from backend
    fetchDriverStatus(token || parsedUser?.id);
  }, []);

  const fetchDriverStatus = async (tokenOrId) => {
    try {
      const res = await fetch(`${API_BASE}/api/driver/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenOrId || localStorage.getItem('ridex_driver_token')}`
        }
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setDriver(data.profile);
        setAvailability(data.profile.driverDetails?.availability || 'Available');
        localStorage.setItem('ridex_driver_user', JSON.stringify(data.profile));
      }
    } catch (err) {
      console.warn('Fetch driver profile notice:', err);
    }
  };

  // Poll for active ride & requests count
  useEffect(() => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    const checkRides = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/driver/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.dashboard) {
          if (data.dashboard.activeRide) {
            setActiveRideCount(1);
          } else {
            setActiveRideCount(0);
          }
          if (data.dashboard.driver?.availability) {
            setAvailability(data.dashboard.driver.availability);
          }
        }

        // Also check pending requests count for badge
        const reqRes = await fetch(`${API_BASE}/api/driver/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const reqData = await reqRes.json();
        if (reqData.success && reqData.requests) {
          setPendingRequestsCount(reqData.requests.length);
        }
      } catch (e) {}
    };

    checkRides();
    const interval = setInterval(checkRides, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async () => {
    if (availability === 'On Trip') {
      alert('You are currently on an active trip! Complete your ride before changing status.');
      return;
    }

    const nextStatus = availability === 'Available' ? 'Offline' : 'Available';
    setIsTogglingStatus(true);

    try {
      const token = localStorage.getItem('ridex_driver_token');
      const res = await fetch(`${API_BASE}/api/driver/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: nextStatus })
      });

      const data = await res.json();
      if (data.success) {
        setAvailability(nextStatus);
        setDriver(prev => ({
          ...prev,
          driverDetails: { ...prev?.driverDetails, availability: nextStatus }
        }));
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      alert('Network error updating driver status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('ridex_driver_token');
    localStorage.removeItem('ridex_driver_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    setDriver(null);
    navigate('/driver/login', { replace: true });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/driver/requests')) return 'Ride Requests';
    if (path.includes('/driver/active-ride')) return 'Active Ride Tracking';
    if (path.includes('/driver/earnings')) return 'Driver Earnings & Analytics';
    if (path.includes('/driver/history')) return 'Trip History';
    if (path.includes('/driver/profile')) return 'Driver Profile & Vehicle';
    if (path.includes('/driver/notifications')) return 'Notifications';
    return 'Driver Control Center';
  };

  return (
    <div className="driver-layout-container">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 9, 19, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 99
          }}
        />
      )}

      {/* 1. PREMIUM LEFT SIDEBAR MATCHING REFERENCE DESIGN */}
      <aside className={`driver-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Brand Logo Header */}
        <div
          className="driver-sidebar-brand"
          onClick={() => navigate('/')}
          title="Go to RideX Home Page"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          <div className="driver-logo-badge">
            <Car size={24} color="#ffffff" />
          </div>
          <div>
            <div className="driver-brand-title">RideX</div>
            <div className="driver-brand-subtitle">Smart Rides. Better Cities.</div>
          </div>
        </div>

        {/* Driver Profile Card */}
        <div
          className="driver-sidebar-profile"
          onClick={() => {
            setMobileMenuOpen(false);
            navigate('/driver/profile');
          }}
          title="View Driver Profile & Vehicle Specs"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/driver/profile')}
        >
          <div className="driver-avatar-circle">
            <User size={22} color="#00edff" />
            <span className={`driver-online-dot ${availability.toLowerCase().replace(' ', '-')}`} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {driver?.name || 'Driver Partner'}
            </div>
            <div style={{ fontSize: 11, color: '#00edff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Star size={11} fill="#00edff" color="#00edff" />
              <span>{driver?.driverDetails?.rating || driver?.rating || 4.8}</span>
              <span style={{ color: '#64748b' }}>·</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{driver?.driverDetails?.vehicleNumber || 'DL 01 AB 1234'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="driver-nav-menu">
          <NavLink
            to="/driver/dashboard"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><LayoutDashboard size={18} /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/driver/requests"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><Radio size={18} /></span>
            <span>Ride Requests</span>
            {pendingRequestsCount > 0 && <span className="driver-nav-badge">{pendingRequestsCount}</span>}
          </NavLink>

          <NavLink
            to="/driver/active-ride"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><Car size={18} /></span>
            <span>Active Ride</span>
            {activeRideCount > 0 && <span className="driver-nav-badge warning">ONGOING</span>}
          </NavLink>

          <NavLink
            to="/driver/earnings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><TrendingUp size={18} /></span>
            <span>Earnings & Performance</span>
          </NavLink>

          <NavLink
            to="/driver/history"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><History size={18} /></span>
            <span>Trip History</span>
          </NavLink>

          <NavLink
            to="/driver/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><ShieldCheck size={18} /></span>
            <span>Profile & Vehicle</span>
          </NavLink>

          <NavLink
            to="/driver/notifications"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `driver-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="driver-nav-icon"><BellRing size={18} /></span>
            <span>Notifications</span>
          </NavLink>
        </nav>

        {/* 3D CITY SKYLINE ART CARD (BOTTOM OF SIDEBAR IN IMAGE 2) */}
        <div style={{
          margin: '12px 14px 8px 14px',
          padding: '12px',
          borderRadius: '16px',
          background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.9) 0%, rgba(8, 12, 22, 0.95) 100%), url("/sidebar_skyline_3d.png") bottom/cover no-repeat',
          border: '1px solid rgba(0, 237, 255, 0.3)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>System Online</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>RideX</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>Operations Center</div>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="driver-sidebar-footer">
          <button
            onClick={handleLogout}
            className="driver-logout-btn"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="driver-main-wrapper">
        {/* TOP HEADER */}
        <header className="driver-header">
          <div className="driver-header-left">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 22,
                cursor: 'pointer',
                display: 'none',
                marginRight: 8
              }}
              className="driver-mobile-hamburger"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1 className="driver-page-title">{getPageTitle()}</h1>
              <div className="driver-header-subtitle">
                Welcome back, {driver?.name?.split(' ')[0] || 'Partner'} · RideX Operations Control
              </div>
            </div>
          </div>

          <div className="driver-header-actions">
            {/* Availability Toggle */}
            <div className="driver-status-toggle">
              <span className="driver-status-label">AVAILABILITY:</span>
              <button
                onClick={handleToggleStatus}
                disabled={isTogglingStatus || availability === 'On Trip'}
                className={`driver-toggle-btn ${availability.toLowerCase().replace(' ', '-')}`}
              >
                {isTogglingStatus ? (
                  <span>Updating...</span>
                ) : availability === 'Available' ? (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }} />
                    <span>ONLINE</span>
                  </>
                ) : availability === 'On Trip' ? (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }} />
                    <span>ON TRIP</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
                    <span>OFFLINE</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Notification Icon Button */}
            <div
              className="driver-header-icon-btn"
              onClick={() => navigate('/driver/notifications')}
              title="Notifications"
            >
              <BellRing size={19} />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT OUTLET */}
        <main className="driver-page-content">
          <Outlet context={{ driver, availability, setAvailability, fetchDriverStatus }} />
        </main>
      </div>
    </div>
  );
}
