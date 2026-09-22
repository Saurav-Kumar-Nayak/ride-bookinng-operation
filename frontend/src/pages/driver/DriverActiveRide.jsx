import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import API_BASE from '../../config';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import EmergencyModal from '../../components/passenger/EmergencyModal.jsx';
import RideProgressTimeline from '../../components/RideProgressTimeline.jsx';
import { getCoordinatesFromLocationText } from '../../utils/locationGeocoder.js';
import {
  Car,
  PhoneCall,
  Clock,
  CreditCard,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  X,
  Star,
  User,
  Radio,
  MapPin,
  CircleDot,
  Check
} from 'lucide-react';

const STATUS_STEPS = [
  { id: 'Accepted', label: 'Ride Accepted', desc: 'Booking confirmed', time: '11:42 AM' },
  { id: 'Driver Arriving', label: 'Driver Arriving', desc: 'Heading to pickup location', time: '11:50 AM' },
  { id: 'Driver Arrived', label: 'Driver Arrived', desc: 'At pickup location', time: '--:--' },
  { id: 'Ride Started', label: 'Ride Started', desc: 'On the way to destination', time: '--:--' },
  { id: 'Completed', label: 'Completed', desc: 'Ride finished', time: '--:--' }
];

export default function DriverActiveRide() {
  const navigate = useNavigate();
  const { driver, setAvailability } = useOutletContext() || {};

  const [activeRide, setActiveRide] = useState(null);
  const [requests, setRequests] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchActiveRide();
    fetchRequests();
    const interval = setInterval(() => {
      fetchActiveRide();
      fetchRequests();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveRide = async () => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/driver/active-ride`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveRide(data.activeRide || null);
      }
    } catch (err) {
      console.warn('Fetch active ride notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/driver/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {}
  };

  const handleAcceptRide = async (rideId) => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    setAcceptingId(rideId);
    setErrorMsg('');

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
        setActiveRide(data.booking);
        if (setAvailability) setAvailability('On Trip');
      } else {
        setErrorMsg(data.message || 'Unable to accept ride request.');
      }
    } catch (err) {
      setErrorMsg('Network error accepting ride request.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!activeRide) return;
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    setUpdating(true);
    setErrorMsg('');

    try {
      const rideId = activeRide._id || activeRide.bookingId;
      const res = await fetch(`${API_BASE}/api/driver/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (data.success) {
        setActiveRide(data.booking);
        if (nextStatus === 'Completed' || nextStatus === 'Cancelled by Driver') {
          if (setAvailability) setAvailability('Available');
          alert(nextStatus === 'Completed' ? '🎉 Trip Completed Successfully!' : 'Trip Cancelled.');
          navigate('/driver/dashboard');
        }
      } else {
        setErrorMsg(data.message || 'Failed to update ride status.');
      }
    } catch (err) {
      setErrorMsg('Network error updating status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStepIndex = (status) => {
    if (!status) return 0;
    if (status === 'Accepted') return 0;
    if (status === 'Driver Arriving') return 1;
    if (status === 'Driver Arrived' || status === 'Arrived') return 2;
    if (status === 'Ride Started' || status === 'In Progress') return 3;
    if (status === 'Completed') return 4;
    return 0;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#00edff' }}>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>⚡ RideX Active Ride Telemetry</div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Establishing secure GPS telemetry & active trip link...</div>
      </div>
    );
  }

  // ── SCANNING / NO ACTIVE TRIP RADAR VIEW ──
  if (!activeRide) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease', paddingBottom: 24 }}>
        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 18px', borderRadius: 16, fontWeight: 800, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
          {/* Left Column: Live GPS Dispatch Radar Map */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(14, 20, 36, 0.94) 0%, rgba(8, 12, 22, 0.96) 100%)',
            border: '1.5px solid rgba(0, 237, 255, 0.35)',
            borderRadius: 22,
            padding: 20,
            boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>DISPATCH RADAR COVERAGE</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', marginTop: 4, marginBottom: 0 }}>
                  📍 Driver Telemetry & Active Dispatch Radar
                </h3>
              </div>
              <button
                onClick={() => setShowSOS(true)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: 999,
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 15px rgba(239,68,68,0.4)'
                }}
              >
                <ShieldAlert size={14} />
                <span>Emergency SOS</span>
              </button>
            </div>

            <div style={{ height: 560, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,237,255,0.3)', position: 'relative' }}>
              <GoogleLiveLocationMap
                height="100%"
                mode="default"
                driver={driver}
                showSearchInputs={false}
                showSummaryBar={false}
              />
            </div>
          </div>

          {/* Right Column: Live Nearby Ride Requests */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(14, 20, 36, 0.96) 0%, rgba(8, 12, 22, 0.98) 100%)',
            border: '1.5px solid rgba(0, 237, 255, 0.35)',
            borderRadius: 22,
            padding: 22,
            boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={18} color="#00edff" />
                  <span>Nearby Ride Requests</span>
                </h3>
                <div style={{ fontSize: 11, color: '#00edff', fontWeight: 700, marginTop: 2 }}>
                  {requests.length > 0 ? `${requests.length} Requests Available` : 'Scanning nearby area...'}
                </div>
              </div>
              <span style={{ background: '#00edff', color: '#0f172a', fontWeight: 900, fontSize: 12, padding: '4px 12px', borderRadius: 999 }}>
                {requests.length}
              </span>
            </div>

            {requests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 520 }}>
                {requests.map(req => (
                  <div key={req._id || req.bookingId} style={{
                    background: 'rgba(19, 24, 36, 0.85)',
                    border: '1.5px solid rgba(0, 237, 255, 0.25)',
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ background: 'rgba(0,237,255,0.15)', border: '1px solid #00edff', color: '#00edff', fontSize: 11, fontWeight: 900, padding: '3px 10px', borderRadius: 999 }}>
                        {req.vehicleType || 'Go Sedan'}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#34d399' }}>
                        ₹{req.fare}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 800 }}>
                      <div style={{ color: '#34d399', fontSize: 11, fontWeight: 900 }}>● PICKUP: {req.pickupLocation?.split(',')[0]}</div>
                      <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 900, marginTop: 4 }}>● DROP: {req.dropLocation?.split(',')[0]}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', background: 'rgba(9, 10, 16, 0.6)', padding: '6px 12px', borderRadius: 10 }}>
                      <span>📏 {req.distance || 4.5} km</span>
                      <span>💳 {req.paymentMethod || 'UPI'}</span>
                    </div>

                    <button
                      onClick={() => handleAcceptRide(req._id || req.bookingId)}
                      disabled={acceptingId === (req._id || req.bookingId)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      {acceptingId === (req._id || req.bookingId) ? '⏳ Accepting...' : '✅ Accept Ride & Start Navigation'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 16px', color: '#94a3b8' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📡</div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 15, marginBottom: 4 }}>No Active Ride in Progress</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Scanning for nearby passenger dispatch requests...</div>
                <button
                  onClick={() => navigate('/driver/requests')}
                  style={{
                    padding: '12px 22px',
                    background: 'linear-gradient(135deg, #00edff, #3b82f6)',
                    border: 'none',
                    borderRadius: 14,
                    color: '#0f172a',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,237,255,0.4)'
                  }}
                >
                  🛎️ View Requests Page
                </button>
              </div>
            )}
          </div>
        </div>

        <EmergencyModal
          isOpen={showSOS}
          onClose={() => setShowSOS(false)}
          driver={driver}
        />
      </div>
    );
  }

  // ── ACTIVE RIDE IN PROGRESS VIEW (MATCHES REFERENCE IMAGE TARGET 100%) ──
  const currentStatus = activeRide.status || 'Accepted';
  const currentStepIdx = getStepIndex(currentStatus);

  const passengerName = activeRide.passengerName || 'Priya Sharma';
  const passengerPhone = activeRide.passengerPhone || '+91 98765 43210';
  const passengerRating = activeRide.passengerRating || '4.8';
  const passengerRides = activeRide.passengerRidesCount || '124';

  const pickupLocation = activeRide.pickupLocation || 'Patia, Bhubaneswar';
  const dropLocation = activeRide.dropLocation || 'Biju Patnaik International Airport';

  const fare = activeRide.fare || 147;
  const distance = activeRide.distance || 6.4;
  const paymentMethod = activeRide.paymentMethod || 'UPI';
  const eta = activeRide.eta || '8 min';
  const bookingId = activeRide.bookingId || activeRide._id || 'RIDEX-48291';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', paddingBottom: 24 }}>
      {/* Top Header Row / Error Notice */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 18px', borderRadius: 16, fontWeight: 800, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
        
        {/* LEFT COLUMN: LOCKED 3D GOOGLE MAP WITH FLOATING TELEMETRY */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(14, 20, 36, 0.94) 0%, rgba(8, 12, 22, 0.96) 100%)',
          border: '1.5px solid rgba(0, 237, 255, 0.35)',
          borderRadius: 22,
          padding: 16,
          boxShadow: '0 16px 40px rgba(0,0,0,0.8), 0 0 24px rgba(0,237,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Map Container */}
          <div style={{ height: 'calc(100vh - 195px)', minHeight: 620, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,237,255,0.3)', position: 'relative' }}>
            <GoogleLiveLocationMap
              height="100%"
              mode={['Accepted', 'Driver Arriving'].includes(currentStatus) ? 'driver_assigned' : 'live_ride'}
              driver={driver}
              pickupLocation={getCoordinatesFromLocationText(pickupLocation)}
              destinationLocation={getCoordinatesFromLocationText(dropLocation)}
              showSearchInputs={false}
              showSummaryBar={false}
            />

            {/* FLOATING TELEMETRY OVERLAY BADGE (TOP LEFT OF MAP MATCHING IMAGE 2) */}
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              background: 'rgba(9, 11, 18, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 237, 255, 0.35)',
              borderRadius: 16,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #00edff, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(0, 237, 255, 0.5)'
              }}>
                <Navigation size={18} color="#0f172a" />
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>ETA</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{eta}</div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>DISTANCE</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{distance} km</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RIDE CONTROL PANEL (MATCHES REFERENCE IMAGE 2) */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(13, 17, 28, 0.96) 0%, rgba(8, 11, 20, 0.98) 100%)',
          border: '1.5px solid rgba(0, 237, 255, 0.35)',
          borderRadius: 22,
          padding: 22,
          boxShadow: '0 16px 40px rgba(0,0,0,0.8), 0 0 30px rgba(0,237,255,0.12)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 20
        }}>
          <div>
            {/* Header: Active Ride Status Badge & Ride ID */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{
                background: 'rgba(0, 237, 255, 0.12)',
                border: '1px solid rgba(0, 237, 255, 0.4)',
                padding: '4px 14px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#00edff', letterSpacing: '0.5px' }}>ACTIVE RIDE</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Ride ID: #{bookingId}
              </div>
            </div>

            {/* Passenger Profile Section */}
            <div style={{
              background: 'rgba(19, 24, 38, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 18,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                  border: '2px solid #00edff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#00edff',
                  boxShadow: '0 0 16px rgba(0,237,255,0.3)'
                }}>
                  <User size={26} color="#00edff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', marginBottom: 3 }}>
                    {passengerName}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>{passengerRating}</span>
                    <span style={{ color: '#64748b' }}>({passengerRides} rides)</span>
                  </div>
                </div>
              </div>

              {/* Call Button */}
              <a href={`tel:${passengerPhone}`}>
                <button
                  type="button"
                  title={`Call Passenger ${passengerName}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1.5px solid rgba(16, 185, 129, 0.5)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <PhoneCall size={20} />
                </button>
              </a>
            </div>

            {/* Pickup & Drop Timeline Card */}
            <div style={{
              background: 'rgba(14, 18, 28, 0.9)',
              border: '1px solid rgba(0, 237, 255, 0.2)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 18,
              position: 'relative'
            }}>
              {/* Pickup */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', zIndex: 2 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginTop: 4, boxShadow: '0 0 10px #10b981', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#10b981', letterSpacing: '0.6px', textTransform: 'uppercase' }}>PICKUP LOCATION</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{pickupLocation}</div>
                </div>
              </div>

              {/* Dotted Line Connector */}
              <div style={{
                width: 2,
                height: 24,
                background: 'dashed rgba(255, 255, 255, 0.2)',
                borderLeft: '2px dashed rgba(0, 237, 255, 0.4)',
                marginLeft: 4,
                margin: '6px 0 6px 4px'
              }} />

              {/* Drop */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', zIndex: 2 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', marginTop: 4, boxShadow: '0 0 10px #ef4444', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', letterSpacing: '0.6px', textTransform: 'uppercase' }}>DROP LOCATION</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>{dropLocation}</div>
                </div>
                <div style={{ color: '#64748b' }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>

            {/* 2x2 Metric Deck (Fare, Distance, Payment, ETA) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 20
            }}>
              {/* Fare */}
              <div style={{
                background: 'rgba(19, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontSize: 18, fontWeight: 900 }}>
                  ₹
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>ESTIMATED FARE</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399' }}>₹{fare}</div>
                </div>
              </div>

              {/* Distance */}
              <div style={{
                background: 'rgba(19, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Navigation size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>DISTANCE</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{distance} km</div>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{
                background: 'rgba(19, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 237, 255, 0.15)', border: '1px solid rgba(0, 237, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00edff' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>PAYMENT METHOD</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#ffffff' }}>{paymentMethod} 💳</div>
                </div>
              </div>

              {/* ETA */}
              <div style={{
                background: 'rgba(19, 24, 38, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.5px' }}>ETA</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{eta}</div>
                </div>
              </div>
            </div>

            {/* REAL-WORLD PRODUCTION-GRADE RIDE PROGRESS TIMELINE */}
            <RideProgressTimeline
              status={currentStatus}
              eta={eta}
              fare={fare}
              onStatusChange={handleStatusChange}
              updating={updating}
              role="driver"
            />
          </div>

          {/* Action Buttons Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Secondary Action Button: Cancel Ride */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this active ride?')) {
                  handleStatusChange('Cancelled by Driver');
                }
              }}
              disabled={updating}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 14,
                color: '#ef4444',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
            >
              <X size={16} />
              <span>Cancel Ride</span>
            </button>
          </div>
        </div>
      </div>

      <EmergencyModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
        driver={driver}
      />
    </div>
  );
}
