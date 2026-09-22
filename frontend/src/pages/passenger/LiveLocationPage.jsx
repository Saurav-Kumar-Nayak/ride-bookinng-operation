import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveLocationMap from '../../components/passenger/LiveLocationMap.jsx';
import BottomNav from '../../components/passenger/BottomNav.jsx';
import '../../passenger.css';

export default function LiveLocationPage() {
  const navigate = useNavigate();
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleUsePickup = () => {
    if (selectedLoc?.address) {
      sessionStorage.setItem('pickupLocation', selectedLoc.address);
    } else if (selectedLoc?.lat) {
      sessionStorage.setItem('pickupLocation', `GPS: ${selectedLoc.lat.toFixed(4)}, ${selectedLoc.lng.toFixed(4)}`);
    } else {
      sessionStorage.setItem('pickupLocation', '📍 Current Location');
    }
    navigate('/book');
  };

  const handleShareLocation = () => {
    if (selectedLoc?.lat) {
      const shareUrl = `https://www.openstreetmap.org/?mlat=${selectedLoc.lat}&mlon=${selectedLoc.lng}#map=16/${selectedLoc.lat}/${selectedLoc.lng}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div style={{
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      background: 'var(--bg-primary, #0c0e12)',
      minHeight: '100vh',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
      color: 'var(--text-primary, #fff)',
      paddingBottom: 90,
    }}>
      {/* ── Top Header ── */}
      <div style={{
        padding: '52px 20px 20px',
        background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
      }}>
        <button onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}>
          ←
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Live Location Map</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Powered by Leaflet & OpenStreetMap</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
          ● Real-Time
        </div>
      </div>

      {/* ── Main Map Card ── */}
      <div style={{ padding: '16px' }}>
        <LiveLocationMap
          height="420px"
          showAddressCard={true}
          onLocationSelect={(loc) => setSelectedLoc(loc)}
        />

        {/* ── Quick Action Buttons ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <button onClick={handleUsePickup}
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
              color: '#fff', border: 'none', borderRadius: 16, padding: '14px',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(108,99,255,0.35)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            🚗 Set as Pickup
          </button>

          <button onClick={handleShareLocation}
            style={{
              background: 'var(--bg-card, #161822)',
              color: 'var(--text-primary, #fff)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
              borderRadius: 16, padding: '14px', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            {copied ? '✅ Link Copied!' : '🔗 Share Link'}
          </button>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
