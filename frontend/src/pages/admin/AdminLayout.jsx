import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../config';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminDrivers from './AdminDrivers';
import AdminRides from './AdminRides';
import AdminRevenue from './AdminRevenue';
import AdminLiveMap from './AdminLiveMap';
import AdminSettings from './AdminSettings';
import AdminAnalytics from './AdminAnalytics';
import AdminNotifications from './AdminNotifications';
import AdminIntelligenceCenter from './AdminIntelligenceCenter';


export default function AdminLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copilotSubTab, setCopilotSubTab] = useState('copilot');
  const [isCopilotExpanded, setIsCopilotExpanded] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [theme, setTheme] = useState(localStorage.getItem('ola-theme') || 'dark');

  // RBAC Auth Guard State
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('ridex_admin_authed') === 'true'
  );
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Live Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Badges State for Drivers and Notifications
  const [driverBadgeCount, setDriverBadgeCount] = useState(null);
  const [notifBadgeCount, setNotifBadgeCount] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSidebarBadges = async () => {
      try {
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setDriverBadgeCount(statsData.stats.totalDrivers || 0);
        }

        const notifRes = await fetch(`${API_BASE}/api/admin/notifications`);
        const notifData = await notifRes.json();
        if (notifData.success && notifData.notifications) {
          const savedRead = localStorage.getItem('ridex_admin_read_notifs');
          const savedDismissed = localStorage.getItem('ridex_admin_dismissed_notifs');
          const readSet = savedRead ? new Set(JSON.parse(savedRead)) : new Set();
          const dismissedSet = savedDismissed ? new Set(JSON.parse(savedDismissed)) : new Set();
          const unreadCount = notifData.notifications.filter(n => !dismissedSet.has(n.id) && !readSet.has(n.id)).length;
          setNotifBadgeCount(unreadCount);
        }
      } catch (err) {
        console.error('Error fetching sidebar badges:', err);
      }
    };

    fetchSidebarBadges();
    const interval = setInterval(fetchSidebarBadges, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('ola-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    if (!inputPin || !inputPin.trim()) {
      setPinError('Please enter the Admin passcode.');
      return;
    }

    setIsAuthenticating(true);
    setPinError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: inputPin.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('ridex_admin_authed', 'true');
        setIsAuthenticated(true);
        setPinError('');
      } else {
        setPinError(data.message || 'Access Denied: Invalid Admin Passcode.');
      }
    } catch (err) {
      console.error('Admin Auth error:', err);
      setPinError('Server connection error. Please verify backend is running.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLockPortal = () => {
    sessionStorage.removeItem('ridex_admin_authed');
    setIsAuthenticated(false);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('ridex_admin_authed');
    setIsAuthenticated(false);
  };

  // If not authenticated as Admin, show RBAC Passcode Guard screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          background: 'rgba(22, 24, 34, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          padding: '36px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', margin: '0 auto 16px'
          }}>
            🔐
          </div>

          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Admin Portal Access</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
            Role-Based Access Control (RBAC): Enter your security passcode to access <code>/admin</code> dashboard.
          </p>

          {pinError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
              marginTop: '16px', fontWeight: 600
            }}>
              {pinError}
            </div>
          )}

          <form onSubmit={handleAdminAuthSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Enter Admin PIN (Default: 1234)"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              style={{
                width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '12px',
                color: '#fff', fontSize: '16px', textAlign: 'center', letterSpacing: '4px',
                outline: 'none', boxSizing: 'border-box'
              }}
              autoFocus
            />

            <button
              type="submit"
              disabled={isAuthenticating}
              style={{
                padding: '14px', background: isAuthenticating ? 'rgba(108,99,255,0.4)' : 'linear-gradient(135deg, #6c63ff, #a855f7)',
                color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800,
                fontSize: '15px', cursor: isAuthenticating ? 'not-allowed' : 'pointer', boxShadow: '0 8px 25px rgba(108,99,255,0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {isAuthenticating ? '⌛ Verifying...' : '🚀 Verify & Enter Admin Panel'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <button
              onClick={() => navigate('/home')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}
            >
              ← Back to Passenger App
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🛸' },
    {
      id: 'copilot',
      label: 'AI Copilot',
      icon: '🤖',
      badge: 'AI',
      hasChildren: true,
      children: [
        { id: 'copilot-chat', subTab: 'copilot', label: 'AI Copilot', icon: '🤖' },
        { id: 'forecast', subTab: 'forecast', label: 'Demand Forecast', icon: '🔮' },
        { id: 'incidents', subTab: 'incidents', label: 'Incident Center', icon: '🚨' },
        { id: 'simulator', subTab: 'simulator', label: 'What-If Simulator', icon: '🧩' },
      ]
    },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'drivers', label: 'Drivers', icon: '🚗', badge: driverBadgeCount !== null ? String(driverBadgeCount) : undefined },
    { id: 'rides', label: 'Rides Log', icon: '🚕' },
    { id: 'live-map', label: 'Live Monitoring', icon: '🗺️' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: notifBadgeCount !== null && notifBadgeCount > 0 ? String(notifBadgeCount) : undefined },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];


  return (
    <div className={`admin-app-wrapper ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* ── 3D COLLAPSIBLE SIDEBAR ── */}
      <aside className={`admin-3d-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">🚗</span>
            {!isSidebarCollapsed && <span className="sidebar-brand-name">RideX Admin</span>}
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? '❯' : '❮'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isParentActive = activeTab === item.id || (item.id === 'copilot' && (activeTab === 'copilot' || activeTab === 'intelligence' || activeTab === 'forecast' || activeTab === 'incidents' || activeTab === 'simulator'));
            return (
              <div key={item.id} className="sidebar-group">
                <button
                  className={`sidebar-item ${isParentActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.hasChildren) {
                      setIsCopilotExpanded(!isCopilotExpanded);
                    }
                  }}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                  {!isSidebarCollapsed && item.badge && <span className="sidebar-badge">{item.badge}</span>}
                  {!isSidebarCollapsed && item.hasChildren && (
                    <span 
                      className="sidebar-chevron" 
                      style={{ 
                        marginLeft: 'auto', 
                        fontSize: '10px', 
                        opacity: 0.7, 
                        transition: 'transform 0.2s', 
                        transform: isCopilotExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                      }}
                    >
                      ▼
                    </span>
                  )}
                </button>

                {!isSidebarCollapsed && item.hasChildren && isCopilotExpanded && (
                  <div className="sidebar-submenu">
                    {item.children.map(child => {
                      const isSubActive = isParentActive && copilotSubTab === child.subTab;
                      return (
                        <button
                          key={child.id}
                          className={`sidebar-subitem ${isSubActive ? 'active' : ''}`}
                          onClick={() => {
                            setActiveTab('copilot');
                            setCopilotSubTab(child.subTab);
                          }}
                        >
                          <span style={{ fontSize: '13px' }}>{child.icon}</span>
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-item"
            style={{ color: '#ef4444', width: '100%' }}
            onClick={handleAdminLogout}
          >
            <span className="sidebar-icon">🚪</span>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN WRAPPER ── */}
      <div className="admin-main-wrapper">
        {/* TOPBAR HEADER */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="topbar-search">
              <span className="search-3d-icon">🔍</span>
              <input type="text" placeholder="Search bookings, drivers, riders..." />
              <kbd className="search-key-badge">⌘K</kbd>
            </div>
            <div className="live-clock-badge">
              ⏱️ {currentTime}
            </div>
          </div>

          <div className="topbar-actions">
            <div style={{ position: 'relative' }}>
              <button
                className="topbar-icon-btn"
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                title="Notifications"
              >
                🔔
                <span className="notif-dot"></span>
              </button>

              {/* Notification Drawer Dropdown */}
              {showNotifDrawer && (
                <div className="notif-drawer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>System Notifications</span>
                    <button
                      onClick={() => { setActiveTab('notifications'); setShowNotifDrawer(false); }}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      View All
                    </button>
                  </div>
                  <div className="notif-item">
                    <div className="notif-title">🪪 Driver Verification Req.</div>
                    <div className="notif-msg">Vikram Sharma submitted DL documents.</div>
                    <div className="notif-time">10m ago</div>
                  </div>
                  <div className="notif-item">
                    <div className="notif-title">🚨 Driver Cancellation</div>
                    <div className="notif-msg">Ride #BK-9810 cancelled by driver.</div>
                    <div className="notif-time">25m ago</div>
                  </div>
                </div>
              )}
            </div>

            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark / Light Theme">
              <span className="btn-3d-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
              <span className="btn-3d-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <button className="admin-logout-btn" onClick={handleLockPortal} title="Lock Admin Portal">
              <span className="btn-3d-icon">🔒</span>
              <span className="btn-3d-label">Lock</span>
            </button>

            <div style={{ position: 'relative' }}>
              <div
                className="admin-profile-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title="Click for Admin Master Options"
              >
                <div className="admin-profile-avatar">
                  A
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Admin Master</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Super Operations ▾</span>
                </div>
              </div>

              {/* 3D Interactive Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div className="admin-profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="admin-profile-avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Admin Master</div>
                      <div style={{ fontSize: '10px', color: '#38bdf8' }}>Super Operations · Active</div>
                    </div>
                  </div>

                  <button
                    className="profile-dropdown-item"
                    onClick={() => { setActiveTab('settings'); setShowProfileDropdown(false); }}
                  >
                    <span>⚙️</span> Admin Settings
                  </button>

                  <button
                    className="profile-dropdown-item"
                    onClick={() => { setActiveTab('live-map'); setShowProfileDropdown(false); }}
                  >
                    <span>🗺️</span> Fleet Live Map
                  </button>

                  <button
                    className="profile-dropdown-item"
                    onClick={() => { handleLockPortal(); setShowProfileDropdown(false); }}
                  >
                    <span>🔒</span> Lock Portal
                  </button>

                  <button
                    className="profile-dropdown-item danger"
                    onClick={() => { handleAdminLogout(); setShowProfileDropdown(false); }}
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TAB BODY VIEWS */}
        <main className="admin-main-body">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {(activeTab === 'copilot' || activeTab === 'intelligence' || activeTab === 'forecast' || activeTab === 'incidents' || activeTab === 'simulator') && (
            <AdminIntelligenceCenter initialSubTab={copilotSubTab} onNavigateToMap={(zone) => setActiveTab('live-map')} />
          )}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'drivers' && <AdminDrivers />}
          {activeTab === 'rides' && <AdminRides />}
          {activeTab === 'revenue' && <AdminRevenue />}
          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'notifications' && <AdminNotifications />}
          {activeTab === 'live-map' && <AdminLiveMap />}
          {activeTab === 'settings' && <AdminSettings theme={theme} toggleTheme={toggleTheme} />}
        </main>


        <footer className="admin-footer">
          RideX Mobility Operations Center · 3D Glassmorphism System · MongoDB Engine · Google Maps & Leaflet JS
        </footer>
      </div>
    </div>
  );
}
