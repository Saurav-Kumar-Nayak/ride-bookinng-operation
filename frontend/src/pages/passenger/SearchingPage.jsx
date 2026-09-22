import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../config';
import '../../passenger.css';

const nearbyDrivers = [
  { angle: 30,  dist: 0.7 },
  { angle: 120, dist: 1.1 },
  { angle: 200, dist: 0.5 },
  { angle: 300, dist: 1.4 },
];

export default function SearchingPage() {
  const navigate = useNavigate();
  const [dots, setDots] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Finding nearest top-rated driver...');

  const [bookingDetails, setBookingDetails] = useState({
    pickup: '📍 Patia, Bhubaneswar',
    drop: '🏁 Master Canteen, Bhubaneswar',
    vehicle: 'Mini',
    vehicleIcon: '🚗',
    fare: '₹346',
    paymentMethod: 'UPI'
  });

  useEffect(() => {
    // Direct 0ms instant transition to assigned driver
    navigate('/driver-assigned', { replace: true });
  }, [navigate]);

  if (cancelled) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 24 }}>😢</div>
        <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Ride Cancelled</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>No worries! Book again anytime.</p>
        <button onClick={() => navigate('/home')}
          style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', border: 'none', borderRadius: 999, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const handleCancel = async () => {
    setCancelled(true);
    const activeBookingId = sessionStorage.getItem('ridex_booking_id');
    if (activeBookingId) {
      try {
        await fetch(`${API_BASE}/api/bookings/${activeBookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Cancelled', cancelReason: 'User cancelled during search' })
        });
      } catch (e) {}
    }
    sessionStorage.removeItem('ridex_current_booking');
    sessionStorage.removeItem('ridex_current_driver');
    sessionStorage.removeItem('ridex_booking_id');
  };

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0c29 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background animated blur orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,237,255,0.12)', filter: 'blur(60px)', animation: 'float 5s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(168,85,247,0.12)', filter: 'blur(50px)', animation: 'float 7s ease-in-out 1s infinite' }} />

      {/* Searching Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeInDown 0.6s ease' }}>
        <div style={{ fontSize: 11, color: '#00edff', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          ● LIVE UBER RADAR MATCHING
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          Finding Drivers{dots}
        </h1>
        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>
          {statusMessage}
        </div>
      </div>

      {/* Interactive Radar animation */}
      <div style={{ position: 'relative', width: 240, height: 240, marginBottom: 40 }}>
        {/* Radar rings */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '100%', height: '100%',
            borderRadius: '50%',
            border: '1.5px solid rgba(0,237,255,0.5)',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: `radar 2.5s ease-out ${i * 0.8}s infinite`,
          }} />
        ))}

        {/* Center vehicle badge */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 76, height: 76, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00edff, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, boxShadow: '0 0 45px rgba(0,237,255,0.7)',
          animation: 'pulse 1.8s ease-in-out infinite',
          border: '3px solid #00edff',
          zIndex: 10,
        }}>
          {bookingDetails.vehicleIcon}
        </div>

        {/* Nearby driver pins */}
        {nearbyDrivers.map((d, i) => {
          const rad = (d.angle * Math.PI) / 180;
          const r = 90 * d.dist;
          const x = 120 + r * Math.cos(rad) - 14;
          const y = 120 + r * Math.sin(rad) - 14;
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid #00edff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, animation: `float ${2.5 + i * 0.4}s ease-in-out ${i * 0.2}s infinite`,
              boxShadow: '0 0 15px rgba(0,237,255,0.4)',
            }}>
              {bookingDetails.vehicleIcon}
            </div>
          );
        })}
      </div>

      {/* Dynamic Route Info Pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeInUp 0.6s ease 0.2s both' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(0, 237, 255, 0.25)',
          borderRadius: 999, padding: '8px 16px',
          color: '#f8fafc', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          📍 {bookingDetails.pickup}
        </div>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(0, 237, 255, 0.25)',
          borderRadius: 999, padding: '8px 16px',
          color: '#00edff', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {bookingDetails.vehicleIcon} {bookingDetails.vehicle}
        </div>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(0, 237, 255, 0.25)',
          borderRadius: 999, padding: '8px 16px',
          color: '#34d399', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          💳 {bookingDetails.fare} ({bookingDetails.paymentMethod})
        </div>
      </div>

      {/* Animated Loading Bar */}
      <div style={{ width: '80%', height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 36 }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: 'linear-gradient(135deg, #00edff, #3b82f6, #8b5cf6)',
          animation: 'shimmer 1.8s ease-in-out infinite',
          backgroundSize: '200% 100%',
          width: '70%',
        }} />
      </div>

      {/* Cancel Ride Button */}
      <button onClick={handleCancel}
        style={{
          padding: '14px 36px', background: 'rgba(239, 68, 68, 0.1)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)', borderRadius: 999,
          color: '#ef4444', fontWeight: 800, fontSize: 14,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s ease',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
      >
        ✕ Cancel Ride
      </button>
    </div>
  );
}
