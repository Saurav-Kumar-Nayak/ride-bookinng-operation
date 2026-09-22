import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import './AdminNotifications.css';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Persistent read and dismissed sets stored in localStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ridex_admin_read_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ridex_admin_dismissed_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications`);
      const json = await res.json();
      if (json.success) {
        // Exclude dismissed notifications & mark read state based on persistent readIds
        const fresh = (json.notifications || [])
          .filter(n => !dismissedIds.has(n.id))
          .map(n => ({
            ...n,
            unread: readIds.has(n.id) ? false : (n.unread !== undefined ? n.unread : true)
          }));
        setNotifications(fresh);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [dismissedIds, readIds]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // 5-second auto-polling for live notifications
  useEffect(() => {
    const timer = setInterval(() => {
      fetchNotifications(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const updatedReadSet = new Set([...readIds, ...allIds]);
    setReadIds(updatedReadSet);
    try {
      localStorage.setItem('ridex_admin_read_notifs', JSON.stringify([...updatedReadSet]));
    } catch (err) {
      console.error('Error saving read notifications:', err);
    }
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markSingleRead = (id) => {
    const updatedReadSet = new Set([...readIds, id]);
    setReadIds(updatedReadSet);
    try {
      localStorage.setItem('ridex_admin_read_notifs', JSON.stringify([...updatedReadSet]));
    } catch (err) {
      console.error('Error saving read notification:', err);
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
  };

  const dismissNotification = (id) => {
    const updatedDismissedSet = new Set([...dismissedIds, id]);
    setDismissedIds(updatedDismissedSet);
    try {
      localStorage.setItem('ridex_admin_dismissed_notifs', JSON.stringify([...updatedDismissedSet]));
    } catch (err) {
      console.error('Error saving dismissed notification:', err);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Unread count
  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'cancellations') {
      return notifications.filter(n => n.type === 'ride_cancellation');
    }
    if (activeFilter === 'drivers') {
      return notifications.filter(n => n.type === 'driver_approval');
    }
    if (activeFilter === 'trips') {
      return notifications.filter(n => n.type === 'live_trip');
    }
    return notifications;
  }, [notifications, activeFilter]);

  const cancellationCount = notifications.filter(n => n.type === 'ride_cancellation').length;
  const driverCount = notifications.filter(n => n.type === 'driver_approval').length;
  const tripCount = notifications.filter(n => n.type === 'live_trip').length;

  return (
    <div className="notif-page-container">
      {/* SECTION HEADER */}
      <div className="admin-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="admin-header-title">🔔 RIDEX Notification Center</h2>
            <span className="admin-live-sync-badge">
              ● LIVE STREAM {lastUpdated && `(${lastUpdated})`}
            </span>
          </div>
          <p className="admin-header-subtitle">
            Real-time MongoDB event stream: driver approval requests, cancellation alerts, active ride diagnostics
          </p>
        </div>

        <button
          className="admin-btn-secondary"
          onClick={markAllRead}
          style={{
            background: unreadCount === 0 ? 'rgba(16, 185, 129, 0.18)' : undefined,
            borderColor: unreadCount === 0 ? 'rgba(16, 185, 129, 0.4)' : undefined,
            color: unreadCount === 0 ? '#34d399' : undefined,
            boxShadow: unreadCount === 0 ? '0 0 12px rgba(16, 185, 129, 0.25)' : undefined,
            transition: 'all 0.3s ease'
          }}
          title={unreadCount === 0 ? 'All notifications are marked as read' : 'Mark all notifications as read'}
        >
          {unreadCount === 0 ? '✓ All Notifications Read' : `✓ Mark All as Read (${unreadCount})`}
        </button>
      </div>

      {/* CATEGORY TABS FILTER BAR */}
      <div className="notif-filter-bar">
        <div className="notif-tabs-group">
          <button
            className={`notif-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>🌐 All Stream</span>
            <span className="notif-tab-count">{notifications.length}</span>
          </button>

          <button
            className={`notif-tab-btn ${activeFilter === 'cancellations' ? 'active' : ''}`}
            onClick={() => setActiveFilter('cancellations')}
          >
            <span>🚨 Cancellations</span>
            <span className="notif-tab-count">{cancellationCount}</span>
          </button>

          <button
            className={`notif-tab-btn ${activeFilter === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveFilter('drivers')}
          >
            <span>🪪 Driver Verification</span>
            <span className="notif-tab-count">{driverCount}</span>
          </button>

          <button
            className={`notif-tab-btn ${activeFilter === 'trips' ? 'active' : ''}`}
            onClick={() => setActiveFilter('trips')}
          >
            <span>⚡ Live Ongoing Trips</span>
            <span className="notif-tab-count">{tripCount}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', background: 'rgba(19, 24, 36, 0.85)', borderRadius: '20px', backdropFilter: 'blur(16px)' }}>
          ⌛ Querying MongoDB event log stream...
        </div>
      ) : (
        <div className="notif-cards-list">
          {filteredNotifications.map(n => {
            const cardTypeClass = n.type === 'ride_cancellation' ? 'type-cancellation' : n.type === 'driver_approval' ? 'type-driver' : 'type-trip';
            const iconTypeClass = n.type === 'ride_cancellation' ? 'cancellation' : n.type === 'driver_approval' ? 'driver' : 'trip';
            const iconEmoji = n.type === 'driver_approval' ? '🪪' : n.type === 'ride_cancellation' ? '🚨' : '⚡';

            return (
              <div
                key={n.id}
                className={`notif-card-3d ${cardTypeClass}`}
                onClick={() => n.unread && markSingleRead(n.id)}
                style={{
                  opacity: n.unread ? 1 : 0.75,
                  cursor: n.unread ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className={`notif-icon-3d ${iconTypeClass}`}>
                    {iconEmoji}
                  </div>

                  <div className="notif-content-wrap">
                    <div className="notif-title-row">
                      <span className="notif-card-title">{n.title}</span>
                      {n.unread && <span className="notif-new-badge">NEW</span>}
                    </div>
                    <p className="notif-card-msg">{n.message}</p>
                  </div>
                </div>

                <div className="notif-meta-col">
                  <span className="notif-time-tag">{n.time}</span>
                  <button
                    className="notif-dismiss-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(n.id);
                    }}
                    title="Dismiss Notification"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', background: 'rgba(19, 24, 36, 0.85)', borderRadius: '20px', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              No system notifications recorded for this view.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
