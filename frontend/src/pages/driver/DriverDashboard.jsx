import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  IndianRupee,
  Car,
  Clock,
  Star,
  MapPin,
  ShieldAlert,
  Navigation,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Radio,
  Zap,
  CreditCard,
  Compass,
  AlertTriangle,
  History,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import API_BASE from '../../config';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import EmergencyModal from '../../components/passenger/EmergencyModal.jsx';
import { getCoordinatesFromLocationText } from '../../utils/locationGeocoder.js';
import './DriverDashboard.css';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { driver, availability, setAvailability } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [showSOS, setShowSOS] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);

  // Fetch Dashboard Telemetry, Requests & Feedback
  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    try {
      // 1. Fetch Dashboard telemetry
      const res = await fetch(`${API_BASE}/api/driver/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.dashboard) {
        setDashboardData(data.dashboard);
        setActiveRide(data.dashboard.activeRide || null);
      }

      // 2. Fetch pending ride requests
      const reqRes = await fetch(`${API_BASE}/api/driver/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();
      if (reqData.success && reqData.requests) {
        setRequests(reqData.requests);
      }

      // 3. Fetch Rider Feedback for logged-in driver
      const fbRes = await fetch(`${API_BASE}/api/driver/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fbData = await fbRes.json();
      if (fbData.success) {
        setFeedbackList(fbData.feedbacks || []);
        setFeedbackStats(fbData.stats || null);
      }
    } catch (err) {
      console.warn('Dashboard load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId) => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    setAcceptingId(rideId);
    setStatusMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/driver/rides/${rideId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg('🎉 Ride accepted! Redirecting to live tracking...');
        if (setAvailability) setAvailability('On Trip');
        setTimeout(() => {
          navigate('/driver/active-ride');
        }, 1000);
      } else {
        setStatusMsg(`⚠️ ${data.message || 'Unable to accept ride. Complete your current trip first.'}`);
        loadDashboard();
      }
    } catch (err) {
      alert('Network error accepting ride request.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectRide = (rideId) => {
    setRequests(prev => prev.filter(r => r._id !== rideId && r.bookingId !== rideId));
  };

  const kpis = dashboardData?.kpis || {
    todayEarnings: 0,
    todayRides: 0,
    onlineHours: '0.0 hrs',
    rating: driver?.driverDetails?.rating || driver?.rating || 4.8,
    totalRides: driver?.driverDetails?.totalTrips || 0,
    lifetimeEarnings: driver?.driverDetails?.totalEarnings || 0
  };

  return (
    <div style={{ animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Status Alert Banner */}
      {statusMsg && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: 18,
          fontWeight: 800,
          fontSize: 14,
          marginBottom: 24,
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} />
            <span>{statusMsg}</span>
          </div>
          <button
            onClick={() => setStatusMsg('')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Status Warning Banner */}
      {availability === 'Offline' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.15) 100%)',
          border: '1.5px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 22,
          padding: '16px 24px',
          marginBottom: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc' }}>You are currently OFFLINE</div>
              <div style={{ fontSize: 12.5, color: '#cbd5e1', marginTop: 2 }}>
                Switch your status to <strong>ONLINE</strong> from the header to start receiving live ride requests in your vicinity.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI / STATISTICS CARDS DECK */}
      <div className="driver-dashboard-grid">
        <div className="driver-kpi-card">
          <div className="driver-kpi-icon">
            <IndianRupee size={24} color="#00edff" />
          </div>
          <div>
            <div className="driver-kpi-value">₹{kpis.todayEarnings}</div>
            <div className="driver-kpi-label">Today's Earnings</div>
          </div>
        </div>

        <div className="driver-kpi-card">
          <div className="driver-kpi-icon">
            <Car size={24} color="#00edff" />
          </div>
          <div>
            <div className="driver-kpi-value">{kpis.todayRides}</div>
            <div className="driver-kpi-label">Completed Today</div>
          </div>
        </div>

        <div className="driver-kpi-card">
          <div className="driver-kpi-icon">
            <Clock size={24} color="#00edff" />
          </div>
          <div>
            <div className="driver-kpi-value">{kpis.onlineHours}</div>
            <div className="driver-kpi-label">Online Duration</div>
          </div>
        </div>

        <div className="driver-kpi-card">
          <div className="driver-kpi-icon">
            <Star size={24} color="#00edff" fill="#00edff" />
          </div>
          <div>
            <div className="driver-kpi-value">{kpis.rating}</div>
            <div className="driver-kpi-label">Driver Rating</div>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD SPLIT GRID (LEFT WORKSPACE + RIGHT REQUESTS FEED) */}
      <div className="driver-dashboard-main-grid">
        {/* LEFT COLUMN: ACTIVE RIDE CARD + LOCKED GOOGLE MAP + RECENT TRIPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

          {/* 4. ACTIVE RIDE SECTION */}
          {activeRide && (
            <div className="driver-active-ride-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="driver-active-ride-badge">
                  <Navigation size={12} />
                  ACTIVE RIDE IN PROGRESS · {activeRide.status.toUpperCase()}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  #{activeRide.bookingId}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={18} color="#10b981" />
                    <span>{activeRide.pickupLocation?.split(',')[0]}</span>
                    <ArrowRight size={16} color="#64748b" />
                    <MapPin size={18} color="#ef4444" />
                    <span>{activeRide.dropLocation?.split(',')[0]}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
                    Passenger: <strong style={{ color: '#f8fafc' }}>{activeRide.passengerName || 'Passenger'}</strong> · Category: <strong style={{ color: '#00edff' }}>{activeRide.vehicleType}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#34d399', letterSpacing: '-0.5px' }}>
                  ₹{activeRide.fare}
                </div>
              </div>

              <button
                onClick={() => navigate('/driver/active-ride')}
                className="driver-active-ride-cta"
              >
                <Navigation size={18} />
                <span>Open Live Active Ride Controller →</span>
              </button>
            </div>
          )}

          {/* 6. GOOGLE MAP CONTAINER SHELL (LOCKED MAP INTEGRATION) */}
          <div className="driver-map-outer-card">
            <div className="driver-map-header">
              <div>
                <h3 className="driver-map-title">
                  <Compass size={20} color="#00edff" />
                  <span>Live Driver Location Telemetry</span>
                </h3>
                <div className="driver-map-subtitle">Real-time GPS positioning & dispatch coverage map</div>
              </div>

              {/* 7. SOS / EMERGENCY BUTTON */}
              <button
                onClick={() => setShowSOS(true)}
                className="driver-sos-btn"
                title="Trigger Emergency SOS Protocol"
              >
                <ShieldAlert size={16} />
                <span>SOS Emergency</span>
              </button>
            </div>

            {/* LOCKED MAP WRAPPER SHELL */}
            <div className="driver-map-view-shell">
              <GoogleLiveLocationMap
                height="100%"
                mode={activeRide ? (['Accepted', 'Driver Arriving'].includes(activeRide.status) ? 'driver_assigned' : 'live_ride') : 'default'}
                driver={driver}
                pickupLocation={activeRide?.pickupLocation ? getCoordinatesFromLocationText(activeRide.pickupLocation) : null}
                destinationLocation={activeRide?.dropLocation ? getCoordinatesFromLocationText(activeRide.dropLocation) : null}
                showSearchInputs={false}
                showSummaryBar={false}
              />
            </div>
          </div>

          {/* RECENT TRIP HISTORY SUMMARY */}
          <div className="driver-history-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={20} color="#00edff" />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Recent Trips</h3>
              </div>
              <button
                onClick={() => navigate('/driver/history')}
                style={{ background: 'none', border: 'none', color: '#00edff', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {dashboardData?.recentRides && dashboardData.recentRides.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dashboardData.recentRides.map(ride => (
                  <div key={ride._id || ride.bookingId} className="driver-history-item">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>
                        {ride.pickupLocation?.split(',')[0]} → {ride.dropLocation?.split(',')[0]}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>#{ride.bookingId}</span>
                        <span>·</span>
                        <span>{new Date(ride.bookingDate).toLocaleDateString()}</span>
                        <span>·</span>
                        <span style={{ color: ride.status === 'Completed' ? '#34d399' : '#ef4444', fontWeight: 800 }}>
                          {ride.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: ride.status === 'Completed' ? '#34d399' : '#ef4444' }}>
                      ₹{ride.fare}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: 13 }}>
                No recent trips found in database telemetry.
              </div>
            )}
          </div>

          {/* RIDER FEEDBACK CARDS SECTION */}
          <div className="driver-history-card" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageSquare size={20} color="#00edff" />
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Rider Feedback</h3>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Ratings & reviews from completed trips</div>
                </div>
              </div>
              {feedbackStats && (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontWeight: 900,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>★ {feedbackStats.averageRating || '4.9'}</span>
                  <span>·</span>
                  <span>{feedbackStats.totalFeedbackCount} Reviews</span>
                </div>
              )}
            </div>

            {feedbackList && feedbackList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {feedbackList.map((fb) => (
                  <div key={fb._id || fb.rideId} style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(0, 237, 255, 0.15)',
                    borderRadius: 16,
                    padding: 16,
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}>
                    {/* Header Row: Rider Info & Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #00edff, #3b82f6)',
                          color: '#0f172a',
                          fontWeight: 900,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 10px rgba(0, 237, 255, 0.3)'
                        }}>
                          {fb.riderAvatar ? (
                            <img src={fb.riderAvatar} alt={fb.riderName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                          ) : (
                            (fb.riderName || 'R')[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>
                            {fb.riderName || 'Passenger'}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {fb.createdAt ? new Date(fb.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recent'}
                          </div>
                        </div>
                      </div>

                      {/* Rating Display */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>
                          {'★'.repeat(fb.rating || 5)}{'☆'.repeat(5 - (fb.rating || 5))}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
                          {fb.rating || 5}.0 / 5.0
                        </div>
                      </div>
                    </div>

                    {/* Comment Bubble */}
                    {fb.comment && (
                      <div style={{
                        background: 'rgba(7, 16, 30, 0.9)',
                        border: '1px dashed rgba(0, 237, 255, 0.25)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        color: '#e2e8f0',
                        fontSize: 13,
                        fontStyle: 'italic',
                        marginTop: 6,
                        marginBottom: 8,
                        lineHeight: 1.4
                      }}>
                        "{fb.comment}"
                      </div>
                    )}

                    {/* Badges / Tip Details */}
                    {(fb.badges?.length > 0 || fb.tipAmount > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {fb.badges?.map((badge, idx) => (
                          <span key={idx} style={{
                            background: 'rgba(0, 237, 255, 0.1)',
                            border: '1px solid rgba(0, 237, 255, 0.25)',
                            color: '#00edff',
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999
                          }}>
                            {badge}
                          </span>
                        ))}
                        {fb.tipAmount > 0 && (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 999
                          }}>
                            💰 +₹{fb.tipAmount} Tip
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'rgba(0, 237, 255, 0.1)',
                  border: '1px solid rgba(0, 237, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px auto', color: '#00edff'
                }}>
                  <MessageSquare size={24} />
                </div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 15, marginBottom: 4 }}>
                  No rider feedback yet
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Feedback from completed rides will appear here.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 5. LIVE RIDE REQUESTS PANEL */}
        <div className="driver-requests-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio size={20} color="#00edff" />
                <span>Live Ride Requests</span>
              </h3>
              <div style={{ fontSize: 12, color: '#00edff', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: availability === 'Available' ? '#10b981' : '#ef4444', boxShadow: availability === 'Available' ? '0 0 8px #10b981' : 'none' }} />
                <span>{availability === 'Available' ? `${requests.length} Available Nearby` : 'Go ONLINE to accept rides'}</span>
              </div>
            </div>
            <span style={{
              background: requests.length > 0 ? '#00edff' : 'rgba(255,255,255,0.08)',
              color: requests.length > 0 ? '#070913' : '#94a3b8',
              fontWeight: 900,
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 999,
              boxShadow: requests.length > 0 ? '0 0 12px rgba(0, 237, 255, 0.4)' : 'none'
            }}>
              {requests.length}
            </span>
          </div>

          {/* Ride Request Cards List */}
          {availability === 'Offline' ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ef4444' }}>
                <AlertTriangle size={30} />
              </div>
              <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 16, marginBottom: 6 }}>You are currently offline</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                Switch to Available status in the header to view and accept real-time passenger requests.
              </div>
            </div>
          ) : requests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {requests.map(req => (
                <div key={req._id || req.bookingId} className="driver-request-card">
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{
                      background: 'rgba(0, 237, 255, 0.12)',
                      border: '1px solid rgba(0, 237, 255, 0.4)',
                      color: '#00edff',
                      fontSize: 11,
                      fontWeight: 900,
                      padding: '4px 12px',
                      borderRadius: 999,
                      letterSpacing: '0.3px'
                    }}>
                      {req.vehicleType || 'Go Sedan'}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#34d399', letterSpacing: '-0.3px' }}>
                      ₹{req.fare}
                    </span>
                  </div>

                  {/* Route Hierarchy */}
                  <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <MapPin size={16} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>PICKUP LOCATION</div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f8fafc', marginTop: 1 }}>{req.pickupLocation}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <MapPin size={16} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>DESTINATION</div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f8fafc', marginTop: 1 }}>{req.dropLocation}</div>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Payment Metadata */}
                  <div style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(8, 11, 20, 0.75)',
                    padding: '10px 14px',
                    borderRadius: 14,
                    marginBottom: 16,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Navigation size={13} color="#00edff" />
                      <span>Dist: <strong style={{ color: '#f8fafc' }}>{req.distance || 4.5} km</strong></span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={13} color="#34d399" />
                      <span>Pay: <strong style={{ color: '#34d399' }}>{req.paymentMethod || 'UPI'}</strong></span>
                    </span>
                  </div>

                  {/* Accept / Decline CTA Buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleRejectRide(req._id || req.bookingId)}
                      className="driver-decline-btn"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRide(req._id || req.bookingId)}
                      disabled={acceptingId === (req._id || req.bookingId)}
                      className="driver-accept-btn"
                    >
                      {acceptingId === (req._id || req.bookingId) ? (
                        <span>⏳ Accepting...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Accept Ride</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(0, 237, 255, 0.1)',
                border: '1px solid rgba(0, 237, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#00edff',
                animation: 'radarScan 3s infinite ease-in-out'
              }}>
                <Radio size={30} />
              </div>
              <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 16, marginBottom: 6 }}>Searching for nearby requests...</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
                New passenger requests in your dispatch zone will appear here automatically.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. SOS EMERGENCY MODAL */}
      <EmergencyModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
        driver={driver}
      />
    </div>
  );
}
