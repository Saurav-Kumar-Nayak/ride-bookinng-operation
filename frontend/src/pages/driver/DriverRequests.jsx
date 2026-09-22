import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  RefreshCw,
  MapPin,
  Navigation,
  CreditCard,
  CheckCircle2,
  Search,
  Bell,
  User,
  Shield,
  Users,
  Clock,
  Activity,
  ArrowRight,
  Zap
} from 'lucide-react';
import API_BASE from '../../config';

export default function DriverRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/driver/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.warn('Fetch requests notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId) => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    setAcceptingId(rideId);
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
        navigate('/driver/active-ride');
      } else {
        alert(data.message || 'Ride is no longer available.');
        fetchRequests();
      }
    } catch (err) {
      alert('Error accepting ride request.');
    } finally {
      setAcceptingId(null);
    }
  };

  // Dynamic Vehicle Visual Mapping Helper based on req.vehicleType
  const getVehicleImage = (req, idx) => {
    const rawType = req.vehicleType || (idx % 3 === 2 ? 'SUV' : idx % 3 === 0 ? 'Mini' : 'Sedan');
    const type = rawType.toLowerCase();
    if (type.includes('suv') || type.includes('xuv')) return '/vehicle_suv_3d.png';
    if (type.includes('mini') || type.includes('hatchback') || type.includes('auto') || type.includes('bike')) return '/vehicle_mini_3d.png';
    if (type.includes('prime') || type.includes('sedan') || type.includes('cab')) return '/vehicle_sedan_3d.png';
    return '/vehicle_sedan_3d.png';
  };

  // Filter requests if search query is entered
  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.pickupLocation?.toLowerCase().includes(q) ||
      r.dropLocation?.toLowerCase().includes(q) ||
      r.vehicleType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="driver-ops-force-environment">
      {/* LAYER 5 — COMMAND CENTER AMBIENT LIGHTING & ATMOSPHERIC GLOW */}
      <div className="driver-ops-ambient-lighting" />

      {/* LAYER 2 — DIGITAL CITY ROAD NETWORK (HIGH-VISIBILITY SVG ARTWORK MATCHING IMAGE 2) */}
      <svg className="driver-ops-road-network-canvas" viewBox="0 0 1200 900" fill="none" preserveAspectRatio="none">
        <defs>
          <pattern id="techGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0, 237, 255, 0.12)" strokeWidth="1" />
            <circle cx="60" cy="60" r="1.5" fill="rgba(0, 237, 255, 0.4)" />
          </pattern>
          
          <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00edff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
          </linearGradient>

          <filter id="glowBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#techGrid)" />

        {/* Primary Diagonal Expressway Arteries */}
        <path d="M -100 200 L 1300 700" stroke="url(#cyanLineGrad)" strokeWidth="3" filter="url(#glowBlur)" />
        <path d="M -50 750 L 1250 150" stroke="url(#cyanLineGrad)" strokeWidth="3" filter="url(#glowBlur)" />

        {/* Secondary Curved Arterial Roads */}
        <path d="M 150 -50 Q 600 350 1050 950" stroke="#00edff" strokeWidth="2" strokeDasharray="10 6" opacity="0.7" />
        <path d="M -50 450 Q 550 200 1250 500" stroke="#3b82f6" strokeWidth="2" strokeDasharray="12 8" opacity="0.75" />
        <path d="M 300 950 Q 750 400 1150 -50" stroke="#34d399" strokeWidth="2" strokeDasharray="8 6" opacity="0.65" />

        {/* Outer City Ring Road Bypass Loops */}
        <path d="M 200 150 C 400 50, 800 50, 1000 200 C 1150 350, 1150 650, 950 800 C 750 900, 350 900, 150 750 C 0 600, 0 300, 200 150 Z" stroke="rgba(0, 237, 255, 0.35)" strokeWidth="1.8" strokeDasharray="6 4" />

        {/* Major Intersection Interchanges & Glowing Nodes */}
        <g filter="url(#glowBlur)">
          <circle cx="380" cy="390" r="7" fill="#00edff" />
          <circle cx="380" cy="390" r="16" fill="rgba(0, 237, 255, 0.25)" />

          <circle cx="790" cy="360" r="7" fill="#34d399" />
          <circle cx="790" cy="360" r="16" fill="rgba(52, 211, 153, 0.25)" />

          <circle cx="600" cy="520" r="8" fill="#3b82f6" />
          <circle cx="600" cy="520" r="18" fill="rgba(59, 130, 246, 0.3)" />

          <circle cx="220" cy="620" r="6" fill="#f59e0b" />
          <circle cx="950" cy="580" r="6" fill="#00edff" />
        </g>
      </svg>

      {/* LAYER 1 — HIGH-VISIBILITY NIGHT CITY SKYLINE SILHOUETTE */}
      <div className="driver-ops-city-skyline-layer">
        <svg viewBox="0 0 1200 240" fill="none" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
          <path d="
            M 0 240 L 0 160 L 30 160 L 30 120 L 60 120 L 60 180 
            L 100 180 L 100 90 L 130 90 L 130 60 L 140 30 L 150 60 L 150 90 L 180 90 L 180 170 
            L 220 170 L 220 110 L 270 110 L 270 190 
            L 320 190 L 320 80 L 350 80 L 360 40 L 370 80 L 400 80 L 400 200 
            L 450 200 L 450 130 L 490 130 L 490 70 L 520 70 L 520 210 
            L 570 210 L 570 100 L 610 100 L 610 50 L 620 20 L 630 50 L 630 100 L 670 100 L 670 180 
            L 720 180 L 720 120 L 770 120 L 770 210 
            L 820 210 L 820 90 L 860 90 L 860 150 L 900 150 L 900 80 L 930 45 L 960 80 L 960 190 
            L 1010 190 L 1010 130 L 1060 130 L 1060 170 L 1110 170 L 1110 100 L 1150 100 L 1150 240 Z"
            fill="rgba(8, 16, 32, 0.85)"
            stroke="rgba(0, 237, 255, 0.25)"
            strokeWidth="1"
          />

          <circle cx="140" cy="25" r="3" fill="#ef4444" />
          <circle cx="360" cy="35" r="3" fill="#ef4444" />
          <circle cx="620" cy="15" r="3" fill="#ef4444" />
          <circle cx="930" cy="40" r="3" fill="#ef4444" />

          <rect x="110" y="100" width="12" height="4" fill="#fef08a" opacity="0.9" />
          <rect x="110" y="115" width="12" height="4" fill="#00edff" opacity="0.8" />
          <rect x="110" y="130" width="12" height="4" fill="#ffffff" opacity="0.85" />

          <rect x="335" y="90" width="15" height="5" fill="#00edff" opacity="0.9" />
          <rect x="335" y="110" width="15" height="5" fill="#fef08a" opacity="0.85" />
          <rect x="335" y="130" width="15" height="5" fill="#34d399" opacity="0.8" />
          <rect x="335" y="150" width="15" height="5" fill="#ffffff" opacity="0.9" />

          <rect x="585" y="115" width="16" height="5" fill="#00edff" opacity="0.95" />
          <rect x="585" y="135" width="16" height="5" fill="#fef08a" opacity="0.9" />
          <rect x="585" y="155" width="16" height="5" fill="#ffffff" opacity="0.85" />

          <rect x="835" y="105" width="14" height="4" fill="#34d399" opacity="0.9" />
          <rect x="835" y="125" width="14" height="4" fill="#00edff" opacity="0.85" />
          <rect x="835" y="145" width="14" height="4" fill="#fef08a" opacity="0.8" />
        </svg>
      </div>

      {/* LAYER 3 — CITY LIGHTS & TRAFFIC LIGHT CLUSTERS */}
      <div className="driver-ops-city-lights-layer">
        <div style={{ position: 'absolute', top: '25%', left: '18%', width: 8, height: 8, borderRadius: '50%', background: '#00edff', boxShadow: '0 0 14px 4px #00edff' }} />
        <div style={{ position: 'absolute', top: '25.5%', left: '19%', width: 8, height: 8, borderRadius: '50%', background: '#00edff', boxShadow: '0 0 14px 4px #00edff' }} />
        <div style={{ position: 'absolute', top: '27%', left: '22%', width: 7, height: 7, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px 4px #ef4444' }} />
        
        <div style={{ position: 'absolute', top: '65%', left: '78%', width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 16px 4px #34d399' }} />
        <div style={{ position: 'absolute', top: '68%', left: '81%', width: 8, height: 8, borderRadius: '50%', background: '#00edff', boxShadow: '0 0 16px 4px #00edff' }} />
        <div style={{ position: 'absolute', top: '70%', left: '83%', width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 14px 4px #f59e0b' }} />

        <div style={{ position: 'absolute', top: '48%', left: '48%', width: 9, height: 9, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 18px 5px #3b82f6' }} />
      </div>

      {/* FOREGROUND CONTENT LAYER (CARDS & UI SIT AT Z-INDEX 10) */}
      <div className="driver-ops-foreground-layer">
        {/* 1. TOP HERO OPERATIONS BANNER (MATCHING TARGET IMAGE 2) */}
        <div className="driver-ops-hero-banner">
          <div>
            <h1 className="driver-ops-title">Welcome Back, RideX Operations</h1>
            <p className="driver-ops-subtitle">
              Monitor ride requests, track drivers and keep your city moving
            </p>
          </div>

          <div className="driver-ops-control-group">
            {/* Search Box */}
            <div style={{
              position: 'relative',
              background: 'rgba(10, 16, 28, 0.88)',
              border: '1px solid rgba(0, 237, 255, 0.35)',
              borderRadius: 16,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: 250
            }}>
              <Search size={16} color="#00edff" />
              <input
                type="text"
                placeholder="Search ride, location, or driver..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 12.5,
                  outline: 'none',
                  width: '100%'
                }}
              />
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                background: 'rgba(255,255,255,0.12)',
                color: '#94a3b8',
                padding: '2px 6px',
                borderRadius: 6
              }}>
                Ctrl+K
              </span>
            </div>

            {/* Live Status Pill (Image 2 Match) */}
            <div className="driver-ops-status-pill">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff' }}>Live</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>All Systems Operational</div>
              </div>
            </div>

            {/* Availability Status Pill (Image 2 Match) */}
            <div className="driver-ops-status-pill">
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>Availability</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span><Zap size={12} fill="#34d399" color="#34d399" /></span>
                  <span>High AVAILABLE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN REQUESTS HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'rgba(0, 237, 255, 0.18)',
                border: '1px solid rgba(0, 237, 255, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00edff'
              }}>
                <Radio size={18} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                Available Ride Requests
              </h2>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Accept real-time ride requests from passengers in your dispatch coverage area
            </div>
          </div>

          {/* Refresh Feed Action Button */}
          <button
            onClick={fetchRequests}
            className="driver-refresh-btn"
            title="Poll latest ride requests from backend"
          >
            <RefreshCw size={15} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* 3. REQUESTS GRID & STATES */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8) 0%, rgba(12, 16, 29, 0.85) 100%)',
            borderRadius: 26,
            border: '1.5px solid rgba(0, 237, 255, 0.25)',
            color: '#94a3b8',
            fontSize: 14,
            fontWeight: 700
          }}>
            <div style={{ fontSize: 26, marginBottom: 12 }}>⏳</div>
            <div>Loading live ride requests feed from dispatch server...</div>
          </div>
        ) : filteredRequests.length > 0 ? (
          /* 3-COLUMN DESKTOP RESPONSIVE GRID MATCHING REFERENCE IMAGE 2 */
          <div className="driver-ref-requests-grid">
            {filteredRequests.map((req, idx) => {
              const isPeak = idx % 4 === 1;
              const cardPillText = isPeak ? 'Peak' : 'New';
              const cardPillClass = isPeak ? 'driver-ref-pill-peak' : 'driver-ref-pill-new';
              const vehicleImg = getVehicleImage(req, idx);

              return (
                <div key={req._id || req.bookingId} className="driver-ref-card">
                  <div>
                    {/* CARD HEADER: STATUS BADGE & PROMINENT FARE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className={`driver-ref-pill ${cardPillClass}`}>
                        {cardPillText}
                      </span>
                      <div className="driver-ref-fare">
                        ₹{req.fare}
                      </div>
                    </div>

                    {/* SEAMLESS CARD MIDDLE ZONE (PICKUP/DROP ON LEFT, FLOATING 3D CAR OVER ROUTE SVG ON RIGHT) */}
                    <div className="driver-card-middle-zone">
                      {/* Left: Pickup & Drop Location Hierarchy */}
                      <div className="driver-location-stack">
                        <div className="driver-loc-item">
                          <MapPin size={17} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div className="driver-loc-label">PICKUP LOCATION</div>
                            <div className="driver-loc-name">{req.pickupLocation}</div>
                          </div>
                        </div>

                        <div className="driver-loc-item" style={{ marginTop: 14 }}>
                          <MapPin size={17} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div className="driver-loc-label">DROP LOCATION</div>
                            <div className="driver-loc-name">{req.dropLocation}</div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Floating 3D Car Render over Curved Neon Route SVG (Seamless, Image 2 Parity) */}
                      <div className="driver-route-vehicle-area" title={`Vehicle: ${req.vehicleType || 'Standard'}`}>
                        <svg className="driver-card-route-svg" viewBox="0 0 160 100" fill="none">
                          <path
                            d="M 10 25 Q 70 5, 145 80"
                            stroke="#00edff"
                            strokeWidth="2.5"
                            strokeDasharray="5 4"
                            opacity="0.9"
                          />
                          <circle cx="10" cy="25" r="4.5" fill="#10b981" />
                          <circle cx="145" cy="80" r="4.5" fill="#ef4444" />
                        </svg>

                        <img
                          src={vehicleImg}
                          alt="Ride Vehicle Render"
                          className="driver-card-car-render"
                          onError={(e) => {
                            e.target.src = '/vehicle_sedan_3d.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* DARK EMBEDDED TELEMETRY INFO STRIP */}
                    <div className="driver-ref-info-strip">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Navigation size={14} color="#00edff" />
                        <span>Dist: <strong style={{ color: '#ffffff' }}>{req.distance || 5.3} km</strong></span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CreditCard size={14} color="#34d399" />
                        <span>Pay: <strong style={{ color: '#34d399' }}>{req.paymentMethod || 'UPI'}</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* ACCEPT CTA BUTTON */}
                  <button
                    onClick={() => handleAcceptRide(req._id || req.bookingId)}
                    disabled={acceptingId === (req._id || req.bookingId)}
                    className="driver-ref-accept-btn"
                  >
                    {acceptingId === (req._id || req.bookingId) ? (
                      <span>⏳ Accepting Ride...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Accept Ride Request →</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY SEARCH STATE */
          <div style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8) 0%, rgba(12, 16, 29, 0.85) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 26,
            border: '1.5px solid rgba(0, 237, 255, 0.3)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(0, 237, 255, 0.15)',
              border: '1px solid rgba(0, 237, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              color: '#00edff',
              animation: 'radarScan 3s infinite ease-in-out'
            }}>
              <Radio size={32} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#f8fafc', marginBottom: 6 }}>No Ride Requests Available Right Now</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 460, margin: '0 auto', lineHeight: 1.5 }}>
              New passenger requests in your dispatch coverage area will automatically show up here as bookings are placed.
            </p>
          </div>
        )}

        {/* 4. BOTTOM OPERATIONS METRICS DECK (REFERENCE MATCHING IMAGE 2) */}
        <div className="driver-ops-metrics-deck">
          <div className="driver-ops-metric-card">
            <Shield size={20} color="#00edff" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>Ride Confidence Score</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>92%</div>
              <div className="driver-ops-metric-progress">
                <div className="driver-ops-metric-bar" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          <div className="driver-ops-metric-card">
            <Users size={20} color="#34d399" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>Driver Availability</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399', marginTop: 2 }}>High</div>
              <div className="driver-ops-metric-progress">
                <div className="driver-ops-metric-bar" style={{ width: '85%', background: '#34d399' }} />
              </div>
            </div>
          </div>

          <div className="driver-ops-metric-card">
            <Clock size={20} color="#3b82f6" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>ETA Reliability</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#60a5fa', marginTop: 2 }}>High</div>
              <div className="driver-ops-metric-progress">
                <div className="driver-ops-metric-bar" style={{ width: '88%', background: '#3b82f6' }} />
              </div>
            </div>
          </div>

          <div className="driver-ops-metric-card">
            <Activity size={20} color="#10b981" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800 }}>Route Reliability</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399', marginTop: 2 }}>Good</div>
              <div className="driver-ops-metric-progress">
                <div className="driver-ops-metric-bar" style={{ width: '90%', background: '#10b981' }} />
              </div>
            </div>
          </div>

          <div className="driver-ops-metric-card" style={{
            background: 'linear-gradient(135deg, rgba(8, 14, 26, 0.85) 0%, rgba(5, 10, 20, 0.9) 100%), url("/hero_dispatch_city_bg.png") center/cover no-repeat',
            border: '1px solid rgba(0, 237, 255, 0.4)',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff' }}>Smarter Dispatch.</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#00edff' }}>Happier Rides.</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0, 237, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00edff' }}>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
