import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../config';

export default function DriverNotifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/driver/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifs(data.notifications || []);
      }
    } catch (err) {
      console.warn('Notifications notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReadStatus = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const deleteNotif = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifs([]);
  };

  // Filtering Logic
  const filteredNotifs = notifs.filter(n => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'dispatch' ? n.category === 'dispatch' :
      activeTab === 'payout' ? (n.category === 'payout' || n.category === 'reward') :
      activeTab === 'rating' ? n.category === 'rating' :
      activeTab === 'system' ? n.category === 'system' : true;

    const matchesSearch = 
      !searchQuery || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.badge?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const unreadCount = notifs.filter(n => n.unread).length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#00edff', fontSize: 16, fontWeight: 800 }}>
        ⚡ Connecting to RideX Telemetry & Dispatch Center...
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: 1000, margin: '0 auto' }}>
      
      {/* ── Top Header Hero & Stats Bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(19, 24, 36, 0.95) 0%, rgba(9, 10, 16, 0.95) 100%)',
        border: '1.5px solid rgba(0, 237, 255, 0.3)',
        borderRadius: 24,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexWrap: 'wrap',
        justify: 'space-between',
        alignItems: 'center',
        gap: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              background: 'linear-gradient(135deg, #00edff, #3b82f6)',
              color: '#090a10',
              fontSize: 11,
              fontWeight: 900,
              padding: '3px 10px',
              borderRadius: 999,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              LIVE DISPATCH FEED
            </span>
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              Connected
            </span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Driver Notifications & Alerts
          </h2>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Real-time trip dispatches, direct bank payout receipts, surge incentives & safety logs
          </div>
        </div>

        {/* Quick Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: 'rgba(0, 237, 255, 0.12)',
                border: '1.5px solid #00edff',
                color: '#00edff',
                padding: '9px 18px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 15px rgba(0, 237, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ✓ Mark {unreadCount} Read
            </button>
          )}

          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '9px 16px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar & Category Filter Tabs ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Alerts', icon: '🔔', count: notifs.length },
            { id: 'dispatch', label: 'Ride Dispatches', icon: '🚗', count: notifs.filter(n => n.category === 'dispatch').length },
            { id: 'payout', label: 'Payouts & Rewards', icon: '💰', count: notifs.filter(n => n.category === 'payout' || n.category === 'reward').length },
            { id: 'rating', label: 'Passenger Ratings', icon: '⭐', count: notifs.filter(n => n.category === 'rating').length },
            { id: 'system', label: 'System & Safety', icon: '🛡️', count: notifs.filter(n => n.category === 'system').length },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 14,
                  border: isActive ? '1.5px solid #00edff' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'linear-gradient(135deg, rgba(0, 237, 255, 0.18), rgba(59, 130, 246, 0.18))' : 'rgba(19, 24, 36, 0.7)',
                  color: isActive ? '#00edff' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: isActive ? 900 : 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: isActive ? '0 0 16px rgba(0, 237, 255, 0.25)' : 'none'
                }}
              >
                <span>{tab.icon} {tab.label}</span>
                {tab.count > 0 && (
                  <span style={{
                    background: isActive ? '#00edff' : 'rgba(255,255,255,0.1)',
                    color: isActive ? '#090a10' : '#fff',
                    padding: '2px 6px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 900
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <input
            type="text"
            placeholder="🔍 Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              background: 'rgba(19, 24, 36, 0.85)',
              border: '1px solid rgba(0, 237, 255, 0.2)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ── Notification Feed List ── */}
      {filteredNotifs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredNotifs.map(n => {
            const catColor = n.color || (n.category === 'dispatch' ? '#00edff' : n.category === 'payout' ? '#10b981' : n.category === 'reward' ? '#f59e0b' : '#38bdf8');

            return (
              <div
                key={n.id}
                style={{
                  background: n.unread 
                    ? 'linear-gradient(135deg, rgba(19, 24, 36, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                    : 'rgba(19, 24, 36, 0.65)',
                  border: n.unread ? `1.5px solid ${catColor}` : '1.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 22,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 18,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: n.unread ? `0 8px 30px rgba(0, 0, 0, 0.5)` : '0 4px 15px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Glowing Left Indicator Strip for Unread */}
                {n.unread && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: 5,
                    background: catColor,
                    boxShadow: `0 0 12px ${catColor}`
                  }} />
                )}

                {/* Avatar Icon Container */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  background: `linear-gradient(135deg, ${catColor}22 0%, rgba(15, 23, 42, 0.8) 100%)`,
                  border: `1.5px solid ${catColor}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                  boxShadow: `0 0 20px ${catColor}33`
                }}>
                  {n.icon || '🔔'}
                </div>

                {/* Content Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: `${catColor}20`,
                        border: `1px solid ${catColor}66`,
                        color: catColor,
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 8,
                        letterSpacing: '0.04em'
                      }}>
                        {n.badge || n.category?.toUpperCase() || 'NOTIFICATION'}
                      </span>

                      {n.amount && (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid #10b981',
                          color: '#34d399',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 8
                        }}>
                          {n.amount}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>⏱️ {n.time}</span>
                      
                      {/* Mark Read Toggle */}
                      <button
                        onClick={() => toggleReadStatus(n.id)}
                        title={n.unread ? 'Mark as Read' : 'Mark as Unread'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: n.unread ? catColor : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: 2
                        }}
                      >
                        {n.unread ? '🟢' : '⚪'}
                      </button>

                      {/* Delete item */}
                      <button
                        onClick={() => deleteNotif(n.id)}
                        title="Delete notification"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: 13,
                          padding: 2
                        }}
                      >
                        ✖
                      </button>
                    </div>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                    {n.title}
                  </h4>

                  <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.5, opacity: 0.9 }}>
                    {n.message}
                  </p>

                  {/* Optional Action Button */}
                  <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                    {n.actionLabel && (
                      <button
                        onClick={() => {
                          if (n.category === 'payout' || n.category === 'reward') {
                            setSelectedNotif(n);
                          } else if (n.actionRoute) {
                            navigate(n.actionRoute);
                          }
                        }}
                        style={{
                          background: `linear-gradient(135deg, ${catColor} 0%, #3b82f6 100%)`,
                          border: 'none',
                          color: '#090a10',
                          padding: '7px 16px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: `0 4px 15px ${catColor}44`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {n.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={{
          background: 'rgba(19, 24, 36, 0.65)',
          border: '1.5px dashed rgba(0, 237, 255, 0.3)',
          borderRadius: 24,
          padding: 60,
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>All Caught Up!</h3>
          <p style={{ fontSize: 13, margin: 0 }}>No driver notifications match your selected filter.</p>
        </div>
      )}

      {/* ── Payout / Detail Modal Drawer ── */}
      {selectedNotif && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(5, 7, 13, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #131824 0%, #090a10 100%)',
            border: '2px solid #00edff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 480,
            padding: 28,
            boxShadow: '0 20px 60px rgba(0, 237, 255, 0.3)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>💳</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', margin: 0 }}>Official Payout Receipt</h3>
                  <div style={{ fontSize: 12, color: '#00edff', fontWeight: 800 }}>REF #RDX-PY-2026-9812</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            <div style={{ background: 'rgba(0,237,255,0.05)', border: '1px solid rgba(0,237,255,0.2)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Payout Amount</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#34d399', marginTop: 4 }}>{selectedNotif.amount || '₹14,250.00'}</div>
              <div style={{ fontSize: 12, color: '#00edff', marginTop: 4 }}>Direct Bank Transfer • Settled to HDFC Bank ****4821</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#cbd5e1', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span>Driver Name:</span>
                <strong style={{ color: '#fff' }}>Rajesh Kumar</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span>Settlement Date:</span>
                <strong style={{ color: '#fff' }}>August 26, 2026</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span>Platform Fee (0%):</span>
                <strong style={{ color: '#34d399' }}>₹0.00 (100% Retained)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status:</span>
                <strong style={{ color: '#34d399' }}>✅ Bank Confirmed & Dispatched</strong>
              </div>
            </div>

            <button
              onClick={() => setSelectedNotif(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #00edff, #3b82f6)',
                border: 'none',
                borderRadius: 14,
                color: '#090a10',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 237, 255, 0.4)'
              }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
