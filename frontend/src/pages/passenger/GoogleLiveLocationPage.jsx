import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import BottomNav from '../../components/passenger/BottomNav.jsx';
import '../../passenger.css';

export default function GoogleLiveLocationPage() {
  const navigate = useNavigate();

  const [selectionMode, setSelectionMode] = useState('pickup'); // 'pickup' | 'destination'
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const handleBookRide = () => {
    const pAddr = pickup?.address || '📍 Current GPS Location';
    const dAddr = destination?.address || '🏁 Destination Location';
    const estFare = routeData?.estimatedFare ? `₹${routeData.estimatedFare}` : '₹120';

    sessionStorage.setItem('pickupLocation', pAddr);
    sessionStorage.setItem('destLocation', dAddr);
    sessionStorage.setItem('ridex_current_booking', JSON.stringify({
      pickup: pAddr,
      drop: dAddr,
      fare: estFare
    }));
    navigate('/book');
  };

  return (
    <div style={{
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      background: '#090a10',
      minHeight: '100vh',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
      color: '#f8fafc',
      paddingBottom: 100,
    }}>
      {/* ── Top App Bar ── */}
      <div style={{
        padding: '50px 20px 20px',
        background: 'linear-gradient(145deg, #0d111d 0%, #161b2e 50%, #090b14 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        borderBottom: '1px solid rgba(0, 237, 255, 0.2)',
        boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
      }}>
        <button onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(19, 24, 36, 0.85)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}>
          ←
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.3px' }}>
            🗺️ Live 3D Location Map
          </div>
          <div style={{ fontSize: 11, color: '#00edff', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            ● REAL-TIME GPS & UBER FLEET
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/admin')}
            title="Admin Dashboard Portal"
            className="profile-admin-crown-3d"
            style={{ position: 'relative', top: 0, right: 0 }}
          >
            👑
          </button>
        </div>
      </div>

      {/* ── Control Panel (Pickup & Destination Address Display) ── */}
      <div style={{ padding: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(19, 24, 36, 0.94) 0%, rgba(11, 14, 24, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 237, 255, 0.25)',
          borderRadius: 22, padding: 16, marginBottom: 16,
          boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
        }}>
          {/* Mode Selector Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: 'rgba(15, 23, 42, 0.85)', padding: 4, borderRadius: 14 }}>
            <button onClick={() => setSelectionMode('pickup')}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: selectionMode === 'pickup' ? 'linear-gradient(135deg, #00edff, #3b82f6)' : 'transparent',
                color: selectionMode === 'pickup' ? '#0f172a' : '#94a3b8',
                fontWeight: 900, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: selectionMode === 'pickup' ? '0 4px 14px rgba(0, 237, 255, 0.4)' : 'none'
              }}>
              <span>📍</span> Set Pickup
            </button>
            <button onClick={() => setSelectionMode('destination')}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: selectionMode === 'destination' ? '#ef4444' : 'transparent',
                color: selectionMode === 'destination' ? '#fff' : '#94a3b8',
                fontWeight: 900, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: selectionMode === 'destination' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none'
              }}>
              <span>🏁</span> Set Drop-off
            </button>
          </div>

          {/* Pickup Address */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, border: '1px solid rgba(0, 237, 255, 0.15)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00edff', boxShadow: '0 0 10px #00edff', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#00edff', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Pickup Location (A)</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pickup?.address || 'Click map or drag green pin to set pickup'}
              </div>
            </div>
          </div>

          {/* Destination Address */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Drop-off Destination (B)</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {destination?.address || 'Click map or drag red pin to set drop-off'}
              </div>
            </div>
          </div>
        </div>

        {/* ── GOOGLE / LEAFLET MAP CONTAINER ── */}
        <GoogleLiveLocationMap
          height="480px"
          selectionMode={selectionMode}
          pickupLocation={pickup}
          setPickupLocation={setPickup}
          destinationLocation={destination}
          setDestinationLocation={setDestination}
          onRouteCalculated={(info) => setRouteData(info)}
        />

        {/* ── CONFIRM RIDE BUTTON ── */}
        <button onClick={handleBookRide}
          style={{
            width: '100%', padding: '16px', marginTop: 16,
            background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)',
            color: '#0f172a', border: 'none', borderRadius: 18,
            fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 10px 30px rgba(0, 237, 255, 0.4)', transition: 'all 0.25s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.color = '#0f172a'; }}
        >
          🚀 Confirm Route & Book Ride {routeData ? `(₹${routeData.estimatedFare})` : ''}
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
