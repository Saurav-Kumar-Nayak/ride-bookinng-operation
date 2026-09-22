import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../passenger.css';

// 3D Visual Logos & Icons
const PhonePeLogo = () => (
  <div style={{
    width: 38, height: 38, borderRadius: 12,
    background: 'linear-gradient(135deg, #7b2cbf 0%, #5f259f 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(95, 37, 159, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
    flexShrink: 0
  }}>
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48.5 28C43.8 28 40 31.8 40 36.5V43H33.5V51H40V72H49.5V51H58.5C66.8 51 73 44.5 73 36.5C73 28 66.5 28 58.5 28H48.5ZM49.5 43V36H57.5C61 36 63.5 38 63.5 39.5C63.5 41 61 43 57.5 43H49.5Z" fill="#FFFFFF"/>
      <path d="M66.5 23L60.5 28H69.5L73.5 23H66.5Z" fill="#FFFFFF"/>
    </svg>
  </div>
);

const GPayLogo = () => (
  <div style={{
    width: 38, height: 38, borderRadius: 12,
    background: '#FFFFFF', border: '1px solid #E2E8F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.8)',
    flexShrink: 0
  }}>
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.4 25.2L10.7 17.1C9.1 14.3 5.6 13.3 2.8 14.9C0 16.5 -0.9 20 0.7 22.8L5.4 30.9L15.4 25.2Z" fill="#EA4335"/>
      <path d="M17.6 29.1L12.9 21C11.3 18.2 7.8 17.2 5 18.8L2.8 20.1L7.7 28.7L17.6 29.1Z" fill="#34A853"/>
      <path d="M28 22.3L23.3 14.2C21.7 11.4 18.2 10.4 15.4 12L5.6 17.7L10.5 26.3L15.4 23.5L20.1 31.6C21.7 34.4 25.2 35.4 28 33.8C30.8 32.2 31.7 28.7 30.1 25.9L28 22.3Z" fill="#4285F4"/>
      <path d="M23.3 31.2L18.4 22.6L13.5 25.4L8.6 16.8L3.7 19.6C0.9 21.2 -0.1 24.7 1.5 27.5L6.2 35.6C7.8 38.4 11.3 39.4 14.1 37.8L23.3 31.2Z" fill="#FBBC05"/>
    </svg>
  </div>
);

const PaytmLogo = () => (
  <div style={{
    width: 38, height: 38, borderRadius: 12,
    background: 'linear-gradient(135deg, #002e6e 0%, #001f4d 100%)',
    border: '1.5px solid #00BAF2', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(0, 186, 242, 0.35), inset 0 1px 1px rgba(255,255,255,0.2)',
    flexShrink: 0
  }}>
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8h5.5c2.2 0 3.5 1.2 3.5 2.8 0 1.6-1.3 2.8-3.5 2.8H7v6H4V8zm3 3.5h2.2c.8 0 1.3-.4 1.3-1 0-.6-.5-1-1.3-1H7v2z" fill="#00BAF2"/>
      <path d="M13.5 13.6c0-2 1.5-3.6 3.8-3.6 2.3 0 3.8 1.6 3.8 3.6v6h-2.8v-1c-.5.7-1.3 1.2-2.3 1.2-1.8 0-2.8-1.2-2.8-2.6 0-1.6 1.2-2.5 3.5-2.5h1.6v-.5c0-.8-.6-1.3-1.5-1.3-.8 0-1.4.4-1.6.9l-2.5-.7zm4.8 3.6h-1.3c-.9 0-1.4.4-1.4 1 0 .5.4.9 1.1.9.8 0 1.6-.5 1.6-1.3v-.6z" fill="#00BAF2"/>
      <path d="M21.5 10.2h2.8l1.7 4.8 1.7-4.8h2.8l-3.3 8.2c-.7 1.8-1.8 2.6-3.4 2.6-.5 0-1.1-.1-1.5-.2l.4-2.3c.3.1.6.1.8.1.7 0 1.2-.3 1.5-1.1l-3.5-7.3z" fill="#00BAF2"/>
    </svg>
  </div>
);

const BhimLogo = () => (
  <div style={{
    width: 38, height: 38, borderRadius: 12,
    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
    border: '1.5px solid #F97316', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(249, 115, 22, 0.35), inset 0 1px 1px rgba(255,255,255,0.2)',
    flexShrink: 0
  }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3L13 12L4 21H9L18 12L9 3H4Z" fill="#F97316"/>
      <path d="M10 3L19 12L10 21H15L24 12L15 3H10Z" fill="#10B981"/>
    </svg>
  </div>
);

// 3D Custom Tab Icons
const Upi3DIcon = () => (
  <div style={{
    width: 46, height: 30, borderRadius: 8,
    background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(56, 189, 248, 0.5), inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 0 #1d4ed8',
    transform: 'translateY(-1px)'
  }}>
    <div style={{ width: 10, height: 7, background: '#f59e0b', borderRadius: 2, position: 'absolute', left: 5, top: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    <span style={{ fontSize: 11, fontWeight: 900, color: '#ffffff', position: 'absolute', right: 5, bottom: 4, letterSpacing: '0.5px' }}>UPI</span>
  </div>
);

const Wallet3DIcon = () => (
  <div style={{
    fontSize: 32,
    filter: 'drop-shadow(0 8px 12px rgba(236,72,153,0.35))',
    display: 'inline-block',
    transform: 'translateY(-2px)'
  }}>
    👛
  </div>
);

const Card3DIcon = () => (
  <div style={{
    fontSize: 32,
    filter: 'drop-shadow(0 8px 12px rgba(245,158,11,0.35))',
    display: 'inline-block',
    transform: 'translateY(-2px)'
  }}>
    💰
  </div>
);

const Cash3DIcon = () => (
  <div style={{
    fontSize: 32,
    filter: 'drop-shadow(0 8px 12px rgba(16,185,129,0.35))',
    display: 'inline-block',
    transform: 'translateY(-2px)'
  }}>
    💵
  </div>
);

export default function PaymentPage() {
  const navigate = useNavigate();

  // Read dynamic booking fare & distance from session
  const getBookingDetails = () => {
    try {
      const saved = sessionStorage.getItem('ridex_current_booking');
      if (saved) {
        const parsed = JSON.parse(saved);
        const fareVal = parseInt(parsed.rawFare || (parsed.fare ? parsed.fare.replace(/\D/g, '') : '166'), 10) || 166;
        const distVal = parseFloat(parsed.distKm || '12') || 12;
        const pickupStr = parsed.pickup ? parsed.pickup.split(',')[0].toLowerCase() : 'trident';
        const dropStr = parsed.drop ? parsed.drop.split(',')[0].toLowerCase() : 'urban';
        return { fare: fareVal, dist: distVal, pickup: pickupStr, drop: dropStr };
      }
    } catch (e) {}
    return { fare: 166, dist: 12, pickup: 'trident', drop: 'urban' };
  };

  const booking = getBookingDetails();
  const TOTAL = booking.fare;
  const baseFare = Math.round(TOTAL * 0.45);
  const distFare = Math.round(TOTAL * 0.40);
  const platformFee = Math.round(TOTAL * 0.10);
  const gstFee = Math.max(1, TOTAL - baseFare - distFare - platformFee);

  const fareBreakdown = [
    { label: 'Base Fare', amount: `₹${baseFare}` },
    { label: `Distance (${booking.dist} km)`, amount: `₹${distFare}` },
    { label: 'Platform & Tech Fee', amount: `₹${platformFee}` },
    { label: 'GST (5%)', amount: `₹${gstFee}` },
  ];

  const [tab, setTab]                 = useState('upi');
  const [selectedApp, setSelectedApp] = useState('paytm');
  const [upiId, setUpiId]             = useState('paytm@upi');
  const [showUpiPinModal, setShowUpiPinModal] = useState(false);
  const [upiPin, setUpiPin]           = useState(['', '', '', '']);

  const handleKeypadPress = (val) => {
    setUpiPin(prev => {
      if (val === 'CLEAR') {
        return ['', '', '', ''];
      }
      if (val === 'BACKSPACE') {
        const copy = [...prev];
        const lastIndex = copy.findLastIndex(d => d !== '');
        if (lastIndex !== -1) {
          copy[lastIndex] = '';
        }
        return copy;
      }
      const emptyIndex = prev.findIndex(d => d === '');
      if (emptyIndex !== -1) {
        const copy = [...prev];
        copy[emptyIndex] = val;
        return copy;
      }
      return prev;
    });
  };

  useEffect(() => {
    if (!showUpiPinModal) return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('BACKSPACE');
      } else if (e.key === 'Escape') {
        setShowUpiPinModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUpiPinModal]);

  const [cardNum, setCardNum]   = useState('');
  const [expiry, setExpiry]     = useState('');
  const [cvv, setCvv]           = useState('');
  const [cardFlipped, setFlip]  = useState(false);
  const [paying, setPaying]     = useState(false);
  const [paid, setPaid]         = useState(false);
  const [showBreakdown, setBreakdown] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // Dynamic RideX Wallet Balance State
  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('ridex_wallet_balance');
      return saved ? parseFloat(saved) : 850;
    } catch (e) {
      return 850;
    }
  });

  const [toastMsg, setToastMsg] = useState(null);

  const handleAddWalletMoney = (amt) => {
    setWalletBalance(prev => {
      const updated = prev + amt;
      try {
        localStorage.setItem('ridex_wallet_balance', updated.toString());
      } catch (e) {}
      return updated;
    });
    setToastMsg(`⚡ +₹${amt} added to RideX Wallet!`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const upiAppsList = [
    { id: 'phonepe', name: 'PhonePe', Logo: PhonePeLogo, handle: '9876543210@ybl', border: '#8b5cf6', accent: '#a855f7' },
    { id: 'gpay', name: 'Google Pay', Logo: GPayLogo, handle: 'saurav@okicici', border: '#3b82f6', accent: '#60a5fa' },
    { id: 'paytm', name: 'Paytm', Logo: PaytmLogo, handle: 'paytm@upi', border: '#00edff', accent: '#38bdf8' },
    { id: 'bhim', name: 'BHIM', Logo: BhimLogo, handle: 'saurav@bhim', border: '#f97316', accent: '#fb923c' },
  ];

  const clearRideSession = () => {
    sessionStorage.removeItem('ridex_current_booking');
    sessionStorage.removeItem('ridex_current_driver');
    sessionStorage.removeItem('ridex_booking_id');
    sessionStorage.removeItem('pickupLocation');
    sessionStorage.removeItem('destLocation');
    sessionStorage.removeItem('pickupCoords');
    sessionStorage.removeItem('destCoords');
  };

  const handlePayClick = () => {
    if (tab === 'upi') {
      setUpiPin(['', '', '', '']);
      setShowUpiPinModal(true);
    } else {
      handlePay();
    }
  };

  const handlePay = async () => {
    setShowUpiPinModal(false);
    setPaying(true);

    const activeBookingId = sessionStorage.getItem('ridex_booking_id');
    if (activeBookingId) {
      try {
        const API_BASE = (await import('../../config')).default;
        await fetch(`${API_BASE}/api/bookings/${activeBookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed', driverRating: 5.0, customerRating: 5.0 })
        });
      } catch (e) {
        console.warn('Failed to update booking status:', e.message);
      }
    }

    clearRideSession();

    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      setConfetti(true);
      setTimeout(() => {
        clearRideSession();
        navigate('/history', { replace: true });
      }, 3500);
    }, 1800);
  };

  const fmtCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp  = (val) => { const v = val.replace(/\D/g, '').slice(0, 4); return v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v; };

  // 3D Success view
  if (paid) {
    return (
      <div style={{
        minHeight: '100vh', maxWidth: 480, margin: '0 auto', background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', padding: 32, position: 'relative', overflow: 'hidden'
      }}>
        {/* Confetti particles */}
        {confetti && Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${Math.random() * 35}%`,
            left: `${Math.random() * 100}%`,
            width: 10, height: 10,
            borderRadius: Math.random() > 0.5 ? '50%' : '3px',
            background: ['#00edff','#6c63ff','#a855f7','#34d399','#f59e0b'][Math.floor(Math.random() * 5)],
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            animation: `confetti-fall ${1 + Math.random() * 2}s ease ${Math.random() * 0.5}s forwards`,
          }} />
        ))}

        {/* 3D Success Checkmark Sphere */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #34d399 0%, #10b981 50%, #047857 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, fontSize: 52, color: '#ffffff',
          boxShadow: '0 20px 50px rgba(16,185,129,0.45), 0 0 0 16px rgba(16,185,129,0.12), inset 0 2px 4px rgba(255,255,255,0.6)',
          animation: 'scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)'
        }}>✓</div>

        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
          Payment Successful!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 600, marginBottom: 6, animation: 'fadeInUp 0.5s ease 0.3s both' }}>
          ₹{TOTAL} paid via {tab.toUpperCase()}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 36, animation: 'fadeInUp 0.5s ease 0.4s both' }}>
          Redirecting to your completed rides...
        </p>

        {/* 3D Tactile Buttons */}
        <div style={{ display: 'flex', gap: 14, width: '100%', animation: 'fadeInUp 0.5s ease 0.5s both' }}>
          <button onClick={() => { clearRideSession(); navigate('/history', { replace: true }); }}
            style={{
              flex: 1, padding: '16px 20px',
              background: 'linear-gradient(135deg, #6c63ff 0%, #a855f7 100%)',
              border: 'none', borderRadius: 20, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: '0 10px 30px rgba(108,99,255,0.4), inset 0 1px 1px rgba(255,255,255,0.4)'
            }}>
            📋 Invoice
          </button>
          <button onClick={() => { clearRideSession(); navigate('/home', { replace: true }); }}
            style={{
              flex: 1, padding: '16px 20px',
              background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
              borderRadius: 20, color: 'var(--text-primary)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.2)'
            }}>
            🏠 Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 110 }}>

      {/* 3D Sleek Deep Navy Header Card */}
      <div style={{
        background: 'linear-gradient(145deg, #090b16 0%, #15182e 60%, #1b1f3b 100%)',
        padding: '48px 22px 34px',
        borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
        boxShadow: '0 20px 50px rgba(9, 11, 22, 0.55), inset 0 1px 1px rgba(255,255,255,0.15)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Ambient Radial Lighting Effect */}
        <div style={{
          position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)', filter: 'blur(25px)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 2 }}>
          {/* 3D Circular Back Button */}
          <button onClick={() => navigate('/live-ride')} style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.18)', color: '#ffffff', fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.3)',
            transition: 'all 0.2s ease'
          }}>←</button>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.4px' }}>Payment</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{booking.pickup}</span>
              <span style={{ fontSize: 11, color: '#38bdf8' }}>➔</span>
              <span>{booking.drop}</span>
            </div>
          </div>

          {/* Glowing 3D Glass Total Badge */}
          <div style={{
            marginLeft: 'auto', textAlign: 'center',
            background: 'linear-gradient(145deg, rgba(30, 41, 75, 0.7), rgba(15, 23, 42, 0.9))',
            padding: '12px 20px', borderRadius: 24, border: '1.5px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.45), 0 0 20px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255,255,255,0.25)'
          }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 }}>TOTAL</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', textShadow: '0 2px 12px rgba(56,189,248,0.6)', marginTop: 1 }}>₹{TOTAL}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>

        {/* 3D Fare Breakdown Pill Card */}
        <div style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 28, border: '1.5px solid rgba(226, 232, 240, 0.8)', marginBottom: 24, overflow: 'hidden',
          boxShadow: '0 12px 28px rgba(0,0,0,0.06), 0 4px 0 #e2e8f0, inset 0 1px 1px #ffffff',
          transition: 'all 0.3s ease'
        }}>
          <button onClick={() => setBreakdown(!showBreakdown)}
            style={{
              width: '100%', padding: '18px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>🧾</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: '#0f172a' }}>Fare Breakdown</span>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              transform: showBreakdown ? 'rotate(180deg)' : 'none', color: '#64748b', fontSize: 12
            }}>▼</div>
          </button>
          {showBreakdown && (
            <div style={{ padding: '0 24px 22px', borderTop: '1px solid #f1f5f9', animation: 'fadeInUp 0.3s ease' }}>
              {fareBreakdown.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < fareBreakdown.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 14 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>{f.label}</span>
                  <span style={{ fontWeight: 800, color: f.color || '#0f172a' }}>{f.amount}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 4, borderTop: '2px solid #e2e8f0' }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>Total Fare</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: '#4f46e5' }}>₹{TOTAL}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3D Tactile Payment Selection Grid Cards (matching screenshot style with 3D elevation) */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 26
        }}>
          {[
            { id: 'upi',    Icon: Upi3DIcon,    label: 'UPI',    activeBg: 'linear-gradient(145deg, #4f46e5 0%, #4338ca 100%)', activeBevel: '#312e81', activeGlow: 'rgba(79, 70, 229, 0.45)' },
            { id: 'wallet', Icon: Wallet3DIcon, label: 'Wallet', activeBg: 'linear-gradient(145deg, #db2777 0%, #be185d 100%)', activeBevel: '#831843', activeGlow: 'rgba(219, 39, 119, 0.45)' },
            { id: 'card',   Icon: Card3DIcon,   label: 'Card',   activeBg: 'linear-gradient(145deg, #d97706 0%, #b45309 100%)', activeBevel: '#78350f', activeGlow: 'rgba(217, 119, 6, 0.45)' },
            { id: 'cash',   Icon: Cash3DIcon,   label: 'Cash',   activeBg: 'linear-gradient(145deg, #059669 0%, #047857 100%)', activeBevel: '#064e3b', activeGlow: 'rgba(5, 150, 105, 0.45)' },
          ].map(m => {
            const isActive = tab === m.id;
            const IconComp = m.Icon;
            return (
              <button key={m.id} onClick={() => setTab(m.id)}
                style={{
                  padding: '20px 8px 16px',
                  background: isActive
                    ? m.activeBg
                    : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  border: isActive ? `2px solid ${m.activeBevel}` : '2px solid #e2e8f0',
                  borderBottom: isActive ? `5px solid ${m.activeBevel}` : '5px solid #cbd5e1',
                  borderRadius: 26, cursor: 'pointer', fontFamily: 'inherit',
                  color: isActive ? '#ffffff' : '#334155',
                  fontWeight: 900, fontSize: 13,
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isActive
                    ? `0 14px 30px ${m.activeGlow}, inset 0 2px 2px rgba(255,255,255,0.4)`
                    : '0 8px 18px rgba(0,0,0,0.05), inset 0 1px 1px #ffffff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                  position: 'relative'
                }}>
                <IconComp />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Payment Method Sub-Panels */}

        {/* 1. UPI PANEL */}
        {tab === 'upi' && (
          <div style={{
            background: '#ffffff', borderRadius: 30, padding: 26,
            border: '2px solid #e2e8f0', borderBottom: '6px solid #cbd5e1',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08), inset 0 1px 1px #ffffff',
            animation: 'fadeInUp 0.35s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: '#64748b', fontWeight: 900, letterSpacing: '0.5px' }}>ENTER UPI ID</label>
              <span style={{ fontSize: 11, color: '#059669', fontWeight: 900, background: 'rgba(16,185,129,0.12)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.3)' }}>
                ✓ NPCI Verified
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: 22 }}>
              <input
                placeholder="yourname@upi or 9876543210@paytm"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                style={{
                  width: '100%', padding: '17px 48px 17px 20px',
                  background: '#0f172a',
                  border: '2px solid #38bdf8',
                  borderRadius: 20, fontSize: 15, fontWeight: 900, color: '#f8fafc',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), 0 0 18px rgba(56,189,248,0.2)'
                }}
              />
              <span style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 22, filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.8))' }}>⚡</span>
            </div>

            {/* Fast 3D UPI App Selector Buttons */}
            <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: 1, marginBottom: 14 }}>FAST UPI CHECKOUT APPS:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
              {upiAppsList.map(app => {
                const isActive = selectedApp === app.id;
                const LogoComponent = app.Logo;
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app.id);
                      setUpiId(app.handle);
                    }}
                    style={{
                      padding: '16px 16px',
                      background: isActive ? '#0f172a' : '#ffffff',
                      border: `2px solid ${isActive ? app.border : '#e2e8f0'}`,
                      borderBottom: `4px solid ${isActive ? app.border : '#cbd5e1'}`,
                      borderRadius: 22,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all 0.2s ease',
                      transform: isActive ? 'translateY(-2px)' : 'none',
                      boxShadow: isActive ? `0 10px 24px ${app.border}40, inset 0 1px 1px rgba(255,255,255,0.2)` : '0 4px 12px rgba(0,0,0,0.04)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <LogoComponent />
                    <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: isActive ? '#ffffff' : '#0f172a' }}>{app.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? app.accent : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.handle}</div>
                    </div>
                    {isActive && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: app.border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ffffff', fontSize: 12, fontWeight: 900, flexShrink: 0
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3D Verified Badge */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.06))',
              border: '1.5px solid rgba(16, 185, 129, 0.3)', borderRadius: 20, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 6px 18px rgba(16,185,129,0.08)'
            }}>
              <div style={{ fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.8))' }}>🟢</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#059669' }}>Verified: Saurav Kumar Nayak</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>Direct Instant Payment · Encrypted by NPCI UPI 3D Gateway</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. WALLET PANEL */}
        {tab === 'wallet' && (
          <div style={{
            background: '#ffffff', borderRadius: 30, padding: 26,
            border: '2px solid #e2e8f0', borderBottom: '6px solid #cbd5e1',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)', animation: 'fadeInUp 0.35s ease'
          }}>
            {/* 3D Metallic Wallet Balance Card */}
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
              borderRadius: 24, padding: '26px 24px', marginBottom: 22, textAlign: 'center',
              boxShadow: '0 16px 40px rgba(79, 70, 229, 0.4), inset 0 2px 2px rgba(255,255,255,0.4)',
              borderBottom: '5px solid #312e81', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5 }}>RIDEX WALLET BALANCE</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#ffffff', margin: '10px 0', textShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
                ₹{walletBalance.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                Remaining after trip: <b>₹{Math.max(0, walletBalance - TOTAL).toFixed(2)}</b>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', letterSpacing: 1, marginBottom: 12 }}>QUICK TOP-UP WALLET:</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[50, 100, 200, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleAddWalletMoney(amt)}
                  style={{
                    flex: 1, padding: '14px 8px', background: '#f8fafc',
                    border: '2px solid #e2e8f0', borderBottom: '4px solid #cbd5e1', borderRadius: 18,
                    fontSize: 14, fontWeight: 900, color: '#4f46e5', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.04)'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. CARD PANEL */}
        {tab === 'card' && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>
            {/* 3D Flipping Credit Card Container */}
            <div style={{ perspective: 1000, marginBottom: 24, height: 220 }}>
              <div style={{
                position: 'relative', width: '100%', height: 220,
                transformStyle: 'preserve-3d', transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                transform: cardFlipped ? 'rotateY(180deg)' : 'none'
              }}>
                {/* Front Card */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #090b16 0%, #1e1b4b 50%, #311b92 100%)',
                  borderRadius: 28, padding: '28px 28px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.45), inset 0 2px 2px rgba(255,255,255,0.25)',
                  border: '1.5px solid rgba(255,255,255,0.2)', overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: 1 }}>RideX</span>
                    <div style={{ width: 48, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #fef08a, #ca8a04)', border: '1px solid #facc15', boxShadow: '0 4px 12px rgba(202,138,4,0.5)' }} />
                  </div>

                  <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: 4, marginBottom: 26, fontFamily: 'monospace', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                    {cardNum || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5 }}>CARD HOLDER</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', marginTop: 3 }}>SAURAV KUMAR NAYAK</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5 }}>EXPIRES</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', marginTop: 3 }}>{expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* Back Card */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #090b16 100%)',
                  borderRadius: 28, padding: '26px', border: '1.5px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.45)'
                }}>
                  <div style={{ height: 48, background: '#0a0a0f', borderRadius: 8, margin: '10px -26px 26px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 8 }} />
                    <div style={{ width: 68, height: 40, background: '#ffffff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{cvv || '•••'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 28, padding: 24, border: '2px solid #e2e8f0', borderBottom: '6px solid #cbd5e1', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 900, color: '#64748b', display: 'block', marginBottom: 8 }}>Card Number</label>
                <input placeholder="1234 5678 9012 3456" value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))}
                  style={{ width: '100%', padding: '16px 20px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16, fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', letterSpacing: 2 }} />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 900, color: '#64748b', display: 'block', marginBottom: 8 }}>Expiry Date</label>
                  <input placeholder="MM/YY" value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))}
                    style={{ width: '100%', padding: '16px 20px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 900, color: '#64748b', display: 'block', marginBottom: 8 }}>CVV</label>
                  <input placeholder="•••" type="password" maxLength="3" value={cvv} onChange={e => { setCvv(e.target.value.replace(/\D/,'').slice(0,3)); }}
                    onFocus={() => setFlip(true)} onBlur={() => setFlip(false)}
                    style={{ width: '100%', padding: '16px 20px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16, fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', letterSpacing: 4 }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CASH PANEL */}
        {tab === 'cash' && (
          <div style={{
            background: '#ffffff', borderRadius: 30, padding: 34,
            border: '2px solid rgba(16,185,129,0.3)', borderBottom: '6px solid #059669', textAlign: 'center',
            boxShadow: '0 18px 45px rgba(16,185,129,0.15)', animation: 'fadeInUp 0.35s ease'
          }}>
            <div style={{ fontSize: 72, marginBottom: 16, filter: 'drop-shadow(0 10px 20px rgba(16,185,129,0.3))' }}>💵</div>
            <h3 style={{ fontWeight: 900, fontSize: 24, color: '#0f172a', marginBottom: 8 }}>Pay Cash on Arrival</h3>
            <p style={{ color: '#64748b', fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Please keep exact change of</p>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#059669', textShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>₹{TOTAL}</div>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 16, fontWeight: 600 }}>Hand cash directly to your driver when ride ends</p>
          </div>
        )}

        {/* 3D Uber CTA Pay Button */}
        <button onClick={handlePayClick} disabled={paying}
          style={{
            width: '100%', padding: '20px', marginTop: 26,
            background: paying
              ? '#4f46e5'
              : 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #6366f1 100%)',
            border: 'none', borderBottom: paying ? 'none' : '5px solid #1d4ed8',
            borderRadius: 24, color: '#ffffff', fontWeight: 900, fontSize: 19,
            cursor: paying ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: '0 14px 38px rgba(0,237,255,0.4), inset 0 2px 2px rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'all 0.2s ease',
            transform: paying ? 'none' : 'translateY(0)'
          }}>
          {paying ? (
            <><div style={{ width: 26, height: 26, border: '3.5px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Processing Payment...</>
          ) : (
            `🔐 Pay ₹${TOTAL} via ${selectedApp.toUpperCase()}`
          )}
        </button>

        {/* 3D NPCI UPI PIN Prompt Modal */}
        {showUpiPinModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5,7,12,0.92)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '100%', maxWidth: 390,
              background: 'linear-gradient(145deg, #131824, #0b0e18)',
              border: '2.5px solid rgba(0,237,255,0.5)', borderRadius: 36,
              padding: '30px 26px', textAlign: 'center',
              boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)',
              animation: 'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#00edff', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>
                NPCI SECURE 3D UPI GATEWAY
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginBottom: 6 }}>
                ENTER 4-DIGIT UPI PIN
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 22 }}>
                Paying ₹{TOTAL} to RideX via <b style={{ color: '#00edff' }}>{upiId}</b>
              </p>

              {/* Dynamic 3D Digit Boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
                {[0, 1, 2, 3].map((i) => {
                  const hasVal = upiPin[i] !== '';
                  return (
                    <div
                      key={i}
                      style={{
                        width: 58, height: 62, borderRadius: 20,
                        background: hasVal ? 'rgba(0, 237, 255, 0.2)' : 'rgba(15,23,42,0.9)',
                        border: `2.5px solid ${hasVal ? '#00edff' : 'rgba(0,237,255,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 900, color: '#00edff',
                        boxShadow: hasVal ? '0 0 20px rgba(0,237,255,0.5), inset 0 1px 1px rgba(255,255,255,0.4)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {hasVal ? '●' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Interactive NPCI Numeric Keypad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') handleKeypadPress('CLEAR');
                      else if (k === '⌫') handleKeypadPress('BACKSPACE');
                      else handleKeypadPress(k);
                    }}
                    style={{
                      padding: '15px',
                      background: k === 'C' || k === '⌫' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                      border: k === 'C' || k === '⌫' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 18, color: k === 'C' || k === '⌫' ? '#f87171' : '#ffffff',
                      fontSize: 20, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.15s ease'
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowUpiPinModal(false)} style={{ flex: 1, padding: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 18, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handlePay} style={{ flex: 1.5, padding: 16, background: 'linear-gradient(135deg,#00edff,#3b82f6)', border: 'none', borderRadius: 18, color: '#0f172a', fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,237,255,0.45)' }}>
                  ✓ Submit PIN
                </button>
              </div>
            </div>
          </div>
        )}

        {toastMsg && (
          <div style={{
            position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #090b16 0%, #1e1b4b 100%)',
            border: '1.5px solid #00edff', color: '#ffffff',
            padding: '14px 24px', borderRadius: 999, fontWeight: 800, fontSize: 14,
            boxShadow: '0 12px 36px rgba(0, 237, 255, 0.45)', zIndex: 10000,
            animation: 'fadeInUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            {toastMsg}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20, fontWeight: 700 }}>
          🔒 256-bit SSL encrypted · PCI DSS 3D Secured
        </p>
      </div>
    </div>
  );
}
