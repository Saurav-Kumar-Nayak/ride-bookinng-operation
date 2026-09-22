import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import BottomNav from '../../components/passenger/BottomNav.jsx';
import { getCurrentFestiveData } from '../../utils/festiveOffers.js';
import '../../passenger.css';
import './ProfilePage.css';

const savedAddresses = [
  { icon: '🏠', label: 'Home',    address: 'Plot 42, Jayadev Vihar, Bhubaneswar, Odisha - 751013' },
  { icon: '💼', label: 'Work',    address: 'Infocity IT Park, Patia, Bhubaneswar, Odisha - 751024' },
  { icon: '🏋️', label: 'Gym',     address: 'Saheed Nagar, Bhubaneswar, Odisha - 751007' },
  { icon: '🎓', label: 'College', address: 'KIIT University Campus 6, Patia, Bhubaneswar - 751024' },
];

const transactions = [
  { icon: '📥', label: 'Added via UPI', amount: '+₹500', date: 'Jul 30', color: '#10b981' },
  { icon: '🚗', label: 'RideX Sedan',  amount: '-₹107', date: 'Aug 1',  color: '#ef4444' },
  { icon: '📥', label: 'Cashback',      amount: '+₹15',  date: 'Jul 28', color: '#10b981' },
  { icon: '🚗', label: 'Auto Ride',     amount: '-₹68',  date: 'Jul 27', color: '#ef4444' },
];

const offers = [
  { code: 'RIDEX150', disc: '₹150 off', min: '₹200', expiry: 'Aug 15', color: '#00edff' },
  { code: 'FLAT50',   disc: '₹50 off',  min: '₹100', expiry: 'Aug 10', color: '#a855f7' },
  { code: 'WEEKENDX', disc: '20% off',  min: '₹150', expiry: 'Aug 31', color: '#34d399' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const [section, setSection] = useState('details');

  const getCleanName = () => {
    if (clerkUser?.fullName) return clerkUser.fullName;
    const raw = localStorage.getItem('ridex_user_name');
    if (!raw || raw.startsWith('Passenger (')) {
      return 'Saurav Kumar Nayak';
    }
    return raw;
  };

  const getCleanEmail = () => {
    if (clerkUser?.primaryEmailAddress?.emailAddress) return clerkUser.primaryEmailAddress.emailAddress;
    return localStorage.getItem('ridex_user_email') || 'nayaksauravkumar830@gmail.com';
  };

  const [name, setName] = useState(getCleanName());
  const [email, setEmail] = useState(getCleanEmail());
  const [phone, setPhone] = useState(localStorage.getItem('ridex_user_phone') || '+91 98765 43210');
  const [avatar, setAvatar] = useState(clerkUser?.imageUrl || localStorage.getItem('ridex_user_avatar') || '');

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [copied, setCopied] = useState('');

  const [showRidesModal, setShowRidesModal] = useState(false);
  const [showSpentModal, setShowSpentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userStats, setUserStats] = useState({ rides: 64, spent: 8240, rating: '4.9' });

  useEffect(() => {
    if (clerkUser) {
      if (clerkUser.fullName) setName(clerkUser.fullName);
      if (clerkUser.primaryEmailAddress?.emailAddress) setEmail(clerkUser.primaryEmailAddress.emailAddress);
      if (clerkUser.imageUrl) setAvatar(clerkUser.imageUrl);
    }
  }, [clerkUser]);

  useEffect(() => {
    async function calculateDynamicStats() {
      try {
        const savedStats = JSON.parse(localStorage.getItem('ridex_user_stats') || 'null');
        const API_BASE = (await import('../../config')).default;
        const res = await fetch(`${API_BASE}/api/bookings?limit=50`);
        const data = await res.json();
        let apiRidesCount = 0;
        let apiFareSum = 0;
        if (data.bookings && Array.isArray(data.bookings)) {
          const completed = data.bookings.filter(b => b.status !== 'Cancelled');
          apiRidesCount = completed.length;
          apiFareSum = completed.reduce((sum, b) => sum + (Number(b.fare) || 120), 0);
        }

        const baseRides = savedStats?.rides || 64;
        const baseSpent = savedStats?.spent || 8240;
        const baseRating = savedStats?.rating || '4.9';

        setUserStats({
          rides: baseRides + apiRidesCount,
          spent: baseSpent + apiFareSum,
          rating: baseRating
        });
      } catch (e) {
        console.warn('Stats fetch warning:', e.message);
      }
    }
    calculateDynamicStats();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Please select an image smaller than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        setAvatar(base64Data);
        localStorage.setItem('ridex_user_avatar', base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = (field, currentVal) => {
    setEditingField(field);
    setTempValue(currentVal);
  };

  const handleSaveEdit = (field) => {
    if (field === 'name') {
      setName(tempValue);
      localStorage.setItem('ridex_user_name', tempValue);
    } else if (field === 'phone') {
      setPhone(tempValue);
      localStorage.setItem('ridex_user_phone', tempValue);
    } else if (field === 'email') {
      setEmail(tempValue);
      localStorage.setItem('ridex_user_email', tempValue);
    }
    setEditingField(null);
  };

  const handleSignOut = () => {
    if (signOut) {
      signOut(() => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
      });
    } else {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    }
  };

  const copyPromo = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', background: '#090a10', minHeight: '100vh', maxWidth: 480, margin: '0 auto', color: '#f8fafc', paddingBottom: 90, position: 'relative' }}>
      
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />

      {/* ── App Top Header ── */}
      <div style={{ padding: '50px 20px 20px', background: 'linear-gradient(145deg, #0d111d 0%, #161b2e 50%, #090b14 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 237, 255, 0.2)', boxShadow: '0 15px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/home')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(19, 24, 36, 0.85)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>My Profile</div>
            <div style={{ fontSize: 11, color: '#00edff', fontFamily: 'monospace', fontWeight: 800 }}>Clerk Authenticated</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid rgba(239, 68, 68, 0.4)', borderRadius: 999, color: '#ef4444', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
          🚪 Sign Out
        </button>
      </div>

      {/* Profile Card Header */}
      <div style={{ padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(19, 24, 36, 0.95) 0%, rgba(11, 14, 24, 0.98) 100%)', borderRadius: 24, border: '1.5px solid rgba(0, 237, 255, 0.3)', padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Click to Choose Profile Photo from Gallery"
              style={{ cursor: 'pointer', position: 'relative', width: 76, height: 76, borderRadius: 24, background: 'linear-gradient(135deg, #00edff, #8b5cf6)', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 10px 25px rgba(0, 237, 255, 0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {avatar && (avatar.startsWith('data:image') || avatar.startsWith('http')) ? (
                <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: 22, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 36 }}>👨🏽‍💻</span>
              )}
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: '#00edff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, boxShadow: '0 0 14px #00edff', border: '2px solid #0f172a' }}>
                📷
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc' }}>{name}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', marginTop: 2 }}>{email}</div>
              <button onClick={() => fileInputRef.current?.click()} style={{ marginTop: 8, background: 'rgba(0, 237, 255, 0.15)', border: '1.5px solid rgba(0, 237, 255, 0.4)', borderRadius: 999, padding: '4px 12px', color: '#00edff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                📷 Change Photo
              </button>
            </div>
          </div>

          {/* Dynamic Interactive Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
            {/* 1. Rides Card */}
            <div
              onClick={() => setShowRidesModal(true)}
              title="Click to view Rides Analytics"
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(11, 14, 24, 0.95))',
                padding: '14px 8px', borderRadius: 18, textAlign: 'center',
                border: '1.5px solid rgba(0, 237, 255, 0.3)', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 237, 255, 0.15)', transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: '#00edff', fontFamily: 'monospace' }}>
                {userStats.rides}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                Rides <span>➔</span>
              </div>
            </div>

            {/* 2. Spent Card */}
            <div
              onClick={() => setShowSpentModal(true)}
              title="Click to view Spend & Wallet Analytics"
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(11, 14, 24, 0.95))',
                padding: '14px 8px', borderRadius: 18, textAlign: 'center',
                border: '1.5px solid rgba(52, 211, 153, 0.3)', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(52, 211, 153, 0.15)', transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>
                ₹{userStats.spent.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                Spent <span>💳</span>
              </div>
            </div>

            {/* 3. Rating Card */}
            <div
              onClick={() => setShowRatingModal(true)}
              title="Click to view Uber Passenger Rating Scorecard"
              style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(11, 14, 24, 0.95))',
                padding: '14px 8px', borderRadius: 18, textAlign: 'center',
                border: '1.5px solid rgba(251, 191, 36, 0.3)', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(251, 191, 36, 0.15)', transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
                {userStats.rating} ⭐
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                Rating <span>🏆</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { id: 'details',   icon: '👤', label: 'Personal Details' },
          { id: 'addresses', icon: '📍', label: 'Saved Addresses' },
          { id: 'wallet',    icon: '👛', label: 'Wallet & Transactions' },
          { id: 'offers',    icon: '🏷️', label: 'Offers & Coupons' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => item.id === 'offers' ? navigate('/offers') : setSection(item.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
              background: section === item.id 
                ? 'linear-gradient(135deg, rgba(0, 237, 255, 0.22), rgba(59, 130, 246, 0.22))' 
                : 'linear-gradient(145deg, rgba(19, 24, 39, 0.9), rgba(11, 14, 24, 0.95))',
              borderRadius: 20, 
              border: section === item.id ? '1.5px solid #00edff' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer', color: section === item.id ? '#00edff' : '#f8fafc', fontWeight: 800, fontSize: 14,
              boxShadow: section === item.id ? '0 10px 25px rgba(0, 237, 255, 0.2)' : '0 8px 18px rgba(0,0,0,0.3)',
              transition: 'all 0.25s ease',
            }}
          >
            <span style={{ fontSize: 22, filter: section === item.id ? 'drop-shadow(0 0 8px #00edff)' : 'none' }}>{item.icon}</span>
            <span style={{ flex: 1, textAlign: 'left', fontWeight: section === item.id ? 900 : 700 }}>{item.label}</span>
            <span style={{ fontSize: 18, color: section === item.id ? '#00edff' : '#64748b' }}>›</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div style={{ padding: 20 }}>
        {section === 'details' && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(19, 24, 39, 0.95), rgba(10, 14, 26, 0.98))',
            borderRadius: 24,
            border: '1.5px solid rgba(0, 237, 255, 0.35)',
            padding: 22,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 30px rgba(0, 237, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient Background Glow */}
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(0,237,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>👤</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>Personal Details</span>
              </div>
              <div
                onClick={() => setShowVerificationModal(true)}
                title="Click to view Uber Passenger Safety & Verification Status"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(52, 211, 153, 0.15)', border: '1.5px solid rgba(52, 211, 153, 0.5)',
                  borderRadius: 999, padding: '5px 12px', color: '#34d399', fontSize: 11, fontWeight: 900,
                  cursor: 'pointer', boxShadow: '0 0 15px rgba(52, 211, 153, 0.25)', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>🛡️ Verified Rider</span>
              </div>
            </div>
            
            {/* 1. Full Name Field Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(0, 237, 255, 0.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 14, boxShadow: '0 8px 18px rgba(0,0,0,0.3)', transition: 'all 0.25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#00edff', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                  FULL NAME
                </div>
                {editingField !== 'name' ? (
                  <button onClick={() => handleStartEdit('name', name)} style={{ background: 'none', border: 'none', color: '#00edff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✏️ Edit
                  </button>
                ) : (
                  <button onClick={() => handleSaveEdit('name')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#ffffff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                    ✓ Save
                  </button>
                )}
              </div>
              {editingField === 'name' ? (
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{ width: '100%', marginTop: 8, background: '#0b0e17', border: '1px solid #00edff', borderRadius: 10, padding: '8px 12px', color: '#ffffff', fontWeight: 700, fontSize: 14, outline: 'none' }}
                  autoFocus
                />
              ) : (
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', marginTop: 4, letterSpacing: '-0.01em' }}>
                  {name}
                </div>
              )}
            </div>

            {/* 2. Mobile Number Field Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(0, 237, 255, 0.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 14, boxShadow: '0 8px 18px rgba(0,0,0,0.3)', transition: 'all 0.25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#00edff', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                  MOBILE NUMBER
                </div>
                {editingField !== 'phone' ? (
                  <button onClick={() => handleStartEdit('phone', phone)} style={{ background: 'none', border: 'none', color: '#00edff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✏️ Edit
                  </button>
                ) : (
                  <button onClick={() => handleSaveEdit('phone')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#ffffff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                    ✓ Save
                  </button>
                )}
              </div>
              {editingField === 'phone' ? (
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{ width: '100%', marginTop: 8, background: '#0b0e17', border: '1px solid #00edff', borderRadius: 10, padding: '8px 12px', color: '#ffffff', fontWeight: 700, fontSize: 14, outline: 'none' }}
                  autoFocus
                />
              ) : (
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', marginTop: 4, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {phone}
                </div>
              )}
            </div>

            {/* 3. Email Address Field Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(0, 237, 255, 0.2)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 8px 18px rgba(0,0,0,0.3)', transition: 'all 0.25s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#00edff', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                  EMAIL ADDRESS
                </div>
                {editingField !== 'email' ? (
                  <button onClick={() => handleStartEdit('email', email)} style={{ background: 'none', border: 'none', color: '#00edff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✏️ Edit
                  </button>
                ) : (
                  <button onClick={() => handleSaveEdit('email')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#ffffff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                    ✓ Save
                  </button>
                )}
              </div>
              {editingField === 'email' ? (
                <input
                  type="email"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{ width: '100%', marginTop: 8, background: '#0b0e17', border: '1px solid #00edff', borderRadius: 10, padding: '8px 12px', color: '#ffffff', fontWeight: 700, fontSize: 14, outline: 'none' }}
                  autoFocus
                />
              ) : (
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginTop: 4, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {email}
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'addresses' && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(19, 24, 39, 0.95), rgba(10, 14, 26, 0.98))',
            borderRadius: 24, border: '1.5px solid rgba(0, 237, 255, 0.35)', padding: 22,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📍</span> Saved Favorite Locations
            </div>
            {savedAddresses.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 16, marginBottom: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(0,237,255,0.15)', border: '1px solid rgba(0,237,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc' }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{a.address}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {section === 'wallet' && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(19, 24, 39, 0.95), rgba(10, 14, 26, 0.98))',
            borderRadius: 24, border: '1.5px solid rgba(52, 211, 153, 0.35)', padding: 22,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            {/* 3D Metallic Wallet Card */}
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', borderRadius: 20, padding: 20, color: '#ffffff', marginBottom: 20, boxShadow: '0 12px 30px rgba(16,185,129,0.35)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.9, fontFamily: 'monospace' }}>
                💳 RIDEX PASSENGER WALLET
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 6, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                ₹850.00
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, opacity: 0.85 }}>
                ● Auto-pay enabled for instant rides
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RECENT WALLET TRANSACTIONS
            </div>
            {transactions.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 14, marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.date}</div>
                </div>
                <div style={{ fontWeight: 900, color: t.color, fontSize: 15, fontFamily: 'monospace' }}>{t.amount}</div>
              </div>
            ))}
          </div>
        )}

        {section === 'offers' && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(19, 24, 39, 0.95), rgba(10, 14, 26, 0.98))',
            borderRadius: 24, border: '1.5px solid rgba(251, 191, 36, 0.35)', padding: 22,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.02em' }}>
              <span>🏷️</span> {getCurrentFestiveData().festivalName}
            </div>
            {getCurrentFestiveData().festiveOffers.map((o, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'rgba(15, 23, 42, 0.75)', borderRadius: 16, marginBottom: 10, border: `1.5px solid ${o.color}`, boxShadow: '0 8px 18px rgba(0,0,0,0.3)' }}>
                <div>
                  <div style={{ fontWeight: 900, color: o.color, fontSize: 18, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{o.code}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{o.disc} · Exp {o.expiry}</div>
                </div>
                <button onClick={() => copyPromo(o.code)} style={{ padding: '8px 16px', background: o.color, border: 'none', borderRadius: 12, color: '#0f172a', fontWeight: 900, cursor: 'pointer', fontSize: 13, boxShadow: `0 4px 14px ${o.color}66` }}>
                  {copied === o.code ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3D Uber Rides Summary Popup Modal ── */}
      {showRidesModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 7, 12, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)', border: '2px solid rgba(0, 237, 255, 0.5)', borderRadius: 28, padding: '28px 22px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0, 237, 255, 0.25)', animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#00edff', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: 6 }}>
              🚗 UBER RIDES & TRIP TELEMETRY
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#00edff', fontFamily: 'monospace' }}>
              {userStats.rides} Rides
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>
              Total completed passenger trips on RideX
            </div>

            {/* Rides Telemetry Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '20px 0 16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 6px', borderRadius: 14, border: '1px solid rgba(0, 237, 255, 0.15)' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>{userStats.rides - 2}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Completed</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 6px', borderRadius: 14, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>2</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Cancelled</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 6px', borderRadius: 14, border: '1px solid rgba(251, 191, 36, 0.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24', fontFamily: 'sans-serif' }}>Auto 🛺</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Top Choice</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowRidesModal(false); navigate('/history'); }} style={{ flex: 1.5, padding: '14px', background: 'linear-gradient(135deg, #00edff, #3b82f6)', border: 'none', borderRadius: 16, color: '#0f172a', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,237,255,0.4)' }}>
                📜 View Full History
              </button>
              <button onClick={() => setShowRidesModal(false)} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, color: '#f8fafc', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3D Uber Spend Analytics Popup Modal ── */}
      {showSpentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 7, 12, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)', border: '2px solid rgba(52, 211, 153, 0.5)', borderRadius: 28, padding: '28px 22px', textAlign: 'center', boxShadow: '0 25px 60px rgba(52, 211, 153, 0.25)', animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#34d399', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: 6 }}>
              💳 UBER SPEND & RIDE ANALYTICS
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
              ₹{userStats.spent.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>
              Lifetime total spent across {userStats.rides} rides
            </div>

            {/* Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '20px 0 16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 6px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>₹{Math.round(userStats.spent / (userStats.rides || 1))}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Avg / Ride</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 6px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#00edff', fontFamily: 'monospace' }}>{userStats.rides}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Total Rides</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 6px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>₹1,420</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Promos Saved</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowSpentModal(false); setSection('wallet'); }} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 16, color: '#ffffff', fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>
                👛 Manage Wallet
              </button>
              <button onClick={() => setShowSpentModal(false)} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, color: '#f8fafc', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3D Uber Passenger Rating Scorecard Popup Modal ── */}
      {showRatingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 7, 12, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)', border: '2px solid rgba(251, 191, 36, 0.5)', borderRadius: 28, padding: '28px 22px', textAlign: 'center', boxShadow: '0 25px 60px rgba(251, 191, 36, 0.25)', animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: 6 }}>
              ⭐ UBER PASSENGER SCORECARD
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
              {userStats.rating} ⭐
            </div>
            <div style={{ fontSize: 12, color: '#34d399', marginTop: 2, fontWeight: 800 }}>
              🏆 Top 5% Rated Rider in Odisha
            </div>

            {/* Ratings Breakdown Bar */}
            <div style={{ margin: '20px 0 16px', background: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}>DRIVER RATING BREAKDOWN</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', width: 30 }}>5 ★</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '95%', height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#f8fafc', width: 36, textAlign: 'right' }}>95%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', width: 30 }}>4 ★</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '5%', height: '100%', background: '#38bdf8', borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#f8fafc', width: 36, textAlign: 'right' }}>5%</span>
              </div>
            </div>

            {/* Uber Rider Perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,237,255,0.08)', padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(0,237,255,0.2)', fontSize: 12, fontWeight: 700, color: '#00edff', textAlign: 'left' }}>
                <span>⚡</span> Priority Driver Dispatch Enabled
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(52,211,153,0.08)', padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(52,211,153,0.2)', fontSize: 12, fontWeight: 700, color: '#34d399', textAlign: 'left' }}>
                <span>🛡️</span> Zero Cancellation Fee Eligibility
              </div>
            </div>

            <button onClick={() => setShowRatingModal(false)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: 'none', borderRadius: 16, color: '#0f172a', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(251,191,36,0.3)' }}>
              ✓ Close Scorecard
            </button>
          </div>
        </div>
      )}

      {/* ── 3D Uber Passenger Safety & Verification Center Popup Modal ── */}
      {showVerificationModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 7, 12, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)', border: '2px solid rgba(52, 211, 153, 0.5)', borderRadius: 28, padding: '28px 22px', textAlign: 'center', boxShadow: '0 25px 60px rgba(52, 211, 153, 0.25)', animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#ffffff', boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)' }}>
              🛡️
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#34d399', letterSpacing: '0.15em', fontFamily: 'monospace', marginBottom: 6 }}>
              SAFETY & IDENTITY CENTER
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc' }}>
              Verified Rider Account
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>
              Your profile is 100% verified & protected by Uber Shield
            </div>

            {/* Verification Checklist */}
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15, 23, 42, 0.75)', padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <span style={{ color: '#34d399', fontSize: 18, fontWeight: 900 }}>✓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>Government Photo ID</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Aadhaar / Passport Authenticated</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '2px 8px', borderRadius: 999 }}>ACTIVE</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15, 23, 42, 0.75)', padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <span style={{ color: '#34d399', fontSize: 18, fontWeight: 900 }}>✓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>Mobile Phone OTP</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{phone}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '2px 8px', borderRadius: 999 }}>VERIFIED</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15, 23, 42, 0.75)', padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <span style={{ color: '#34d399', fontSize: 18, fontWeight: 900 }}>✓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>Emergency Contacts & SOS</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>24/7 Police & Family Alert Ready</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '2px 8px', borderRadius: 999 }}>READY</span>
              </div>
            </div>

            <button onClick={() => setShowVerificationModal(false)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 16, color: '#ffffff', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>
              ✓ Close Safety Center
            </button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}
