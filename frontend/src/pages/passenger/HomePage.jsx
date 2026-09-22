import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/passenger/BottomNav.jsx';
import { VehicleIcon } from '../../components/passenger/VehicleIcons.jsx';
import { getCurrentFestiveData } from '../../utils/festiveOffers.js';
import '../../passenger.css';
import './HomePage.css';

const rideCategories = [
  { id: 'bike',     emoji: '🏍️', name: 'Bike',   fare: '₹30–60',   eta: '2 min' },
  { id: 'auto',     emoji: '🛺', name: 'Auto',   fare: '₹50–90',   eta: '3 min' },
  { id: 'mini',     emoji: '🚗', name: 'Mini',   fare: '₹80–130',  eta: '4 min' },
  { id: 'sedan',    emoji: '🚙', name: 'Sedan',  fare: '₹120–200', eta: '5 min' },
  { id: 'suv',      emoji: '🚐', name: 'SUV',    fare: '₹180–300', eta: '6 min' },
  { id: 'prime',    emoji: '✨', name: 'Prime',  fare: '₹250–400', eta: '8 min' },
  { id: 'electric', emoji: '⚡', name: 'EV',     fare: '₹70–120',  eta: '5 min' },
];

const savedPlaces = [
  { icon: '🏠', label: 'Home',   address: 'Jayadev Vihar, Bhubaneswar, Odisha' },
  { icon: '💼', label: 'Work',   address: 'Infocity, Patia, Bhubaneswar, Odisha' },
];

const recent = [
  { icon: '🏥', name: 'AMRI Hospital',       addr: 'Khandagiri, Bhubaneswar, Odisha', time: 'Yesterday' },
  { icon: '🛒', name: 'Esplanade One Mall',  addr: 'Rasulgarh, Bhubaneswar, Odisha',  time: '2 days ago' },
  { icon: '✈️', name: "Biju Patnaik Airport", addr: 'Airport Rd, Bhubaneswar, Odisha', time: '5 days ago' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [pickup, setPickup]     = useState('');
  const [destination, setDest]  = useState('');
  const [selectedCat, setCat]   = useState('mini');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [hasUnread, setHasUnread]           = useState(true);
  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'GOOD MORNING 🌅';
    } else if (hour >= 12 && hour < 17) {
      return 'GOOD AFTERNOON ☀️';
    } else if (hour >= 17 && hour < 22) {
      return 'GOOD EVENING 🌆';
    } else {
      return 'GOOD NIGHT 🌙';
    }
  };

  const [greeting, setGreeting] = useState(getDynamicGreeting());

  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getDynamicGreeting());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getInitialUser = () => {
    try {
      const stored = localStorage.getItem('riidex_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  };

  const initialUser = getInitialUser();
  
  const getCleanName = () => {
    const raw = localStorage.getItem('ridex_user_name') || initialUser?.name;
    if (!raw || raw.startsWith('Passenger (')) {
      localStorage.setItem('ridex_user_name', 'Saurav Kumar Nayak');
      return 'Saurav Kumar Nayak';
    }
    return raw;
  };

  const [userName, setUserName] = useState(getCleanName());
  const [avatar, setAvatar]     = useState(
    initialUser?.avatar || localStorage.getItem('ridex_user_avatar') || ''
  );

  useEffect(() => {
    const updateUserData = () => {
      const userObj = getInitialUser();
      let storedName = localStorage.getItem('ridex_user_name') || userObj?.name;
      if (!storedName || storedName.startsWith('Passenger (')) {
        storedName = 'Saurav Kumar Nayak';
        localStorage.setItem('ridex_user_name', 'Saurav Kumar Nayak');
      }
      const storedAvatar = userObj?.avatar || localStorage.getItem('ridex_user_avatar') || '';
      setUserName(storedName);
      setAvatar(storedAvatar);
    };
    updateUserData();
    window.addEventListener('focus', updateUserData);
    return () => window.removeEventListener('focus', updateUserData);
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
        try {
          const stored = JSON.parse(localStorage.getItem('riidex_user') || '{}');
          stored.avatar = base64Data;
          localStorage.setItem('riidex_user', JSON.stringify(stored));
        } catch (err) {}
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBook = () => {
    if (pickup) sessionStorage.setItem('pickupLocation', pickup);
    if (destination) sessionStorage.setItem('destLocation', destination);

    sessionStorage.setItem('selectedVehicleCategory', selectedCat);
    const catObj = rideCategories.find(c => c.id === selectedCat);
    if (catObj) {
      sessionStorage.setItem('selectedCategoryDetails', JSON.stringify(catObj));
    }

    navigate('/book');
  };

  return (
    <div className="home-page-3d-container">
      {/* Hidden File Input for Direct Gallery Photo Selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />

      {/* 3D Glass Hero Banner */}
      <header className="home-hero-3d">
        <div className="home-hero-glow-3d" />

        <div className="home-header-row">
          <div className="user-badge-3d">
            {/* Clickable Profile Avatar to Choose Photo from Gallery */}
            <div
              className="avatar-ring-3d"
              onClick={() => fileInputRef.current?.click()}
              title="Click to Choose Profile Photo from Gallery"
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {avatar && (avatar.startsWith('data:image') || avatar.startsWith('http')) ? (
                <img
                  src={avatar}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className="avatar-inner-3d">👨🏽‍💻</div>
              )}

              {/* Camera Badge Icon */}
              <div style={{
                position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%',
                background: '#00edff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900, boxShadow: '0 0 10px #00edff', border: '1.5px solid #0f172a'
              }}>
                📷
              </div>
            </div>
            <div>
              <div className="greeting-text-3d">{greeting},</div>
              <h1 className="user-name-3d">{userName} 👋</h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="header-icon-btn-3d" onClick={() => setShowNotifModal(true)} title="View Notifications">
              🔔
              {hasUnread && <span className="notif-dot-3d" />}
            </button>
            <button className="header-icon-btn-3d" onClick={() => navigate('/profile')} title="View Profile">
              👤
            </button>
          </div>
        </div>
      </header>

      {/* Floating 3D Booking Card */}
      <div className="home-booking-card-3d">
        <div className="booking-header-3d">
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>Book a Ride</div>
          <button
            onClick={() => navigate('/live-location')}
            className="booking-badge-3d"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34d399',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.25s ease',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            title="Click to view Live GPS Cabs on Map"
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#10b981',
              boxShadow: '0 0 8px #10b981', animation: 'pulse 1.5s infinite ease-in-out'
            }} />
            LIVE GPS ACTIVE ⚡
          </button>
        </div>

        <div className="input-container-3d">
          <div className="input-wrapper-3d">
            <span className="input-icon-3d" style={{ color: '#00edff' }}>🟢</span>
            <input
              type="text"
              placeholder="Enter Pickup Location (Current GPS)"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
              className="home-input-3d"
            />
          </div>

          <div className="input-wrapper-3d">
            <span className="input-icon-3d" style={{ color: '#ef4444' }}>🔴</span>
            <input
              type="text"
              placeholder="Where to? (Enter Destination)"
              value={destination}
              onChange={e => setDest(e.target.value)}
              className="home-input-3d"
            />
          </div>
        </div>

        <button className="home-book-btn-3d" onClick={handleBook}>
          🔍 Search Available Rides
        </button>
      </div>

      {/* 3D Category Scroll Carousel */}
      <section className="home-section-3d">
        <div className="section-title-3d">
          <span>Choose Vehicle Category</span>
          <span className="section-sub-3d">UBER FLEET ⚡</span>
        </div>

        <div className="cat-scroll-wrapper-3d">
          {rideCategories.map(cat => (
            <div
              key={cat.id}
              onClick={() => setCat(cat.id)}
              className={`home-cat-chip-3d ${selectedCat === cat.id ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                <VehicleIcon type={cat.id} size={42} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: '#00edff', fontWeight: 800, marginTop: 2 }}>{cat.fare}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>⏱ {cat.eta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Saved Places */}
      <section className="home-section-3d">
        <div className="section-title-3d">
          <span>Saved Places</span>
        </div>
        <div className="saved-places-grid-3d">
          {savedPlaces.map((place, i) => (
            <div key={i} className="saved-place-card-3d" onClick={() => { setDest(place.address); handleBook(); }}>
              <div style={{ fontSize: 24 }}>{place.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>{place.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{place.address}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Trips */}
      <section className="home-section-3d">
        <div className="section-title-3d">
          <span>Recent Destinations</span>
        </div>
        <div className="recent-list-3d">
          {recent.map((item, i) => (
            <div key={i} className="recent-item-3d" onClick={() => { setDest(item.addr); handleBook(); }}>
              <div style={{ fontSize: 22 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.addr}</div>
              </div>
              <div style={{ fontSize: 11, color: '#00edff', fontWeight: 700 }}>{item.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3D Uber Rider Notification Center Popup Modal ── */}
      {showNotifModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 7, 12, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)', border: '2px solid rgba(0, 237, 255, 0.5)', borderRadius: 28, padding: '24px 20px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0, 237, 255, 0.25)', animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>Notifications</span>
                {hasUnread && (
                  <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999 }}>
                    3 NEW
                  </span>
                )}
              </div>
              <button onClick={() => { setHasUnread(false); }} style={{ background: 'none', border: 'none', color: '#00edff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                ✓ Mark all read
              </button>
            </div>

            {/* Notification Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
              {getCurrentFestiveData().notificationsList.map(notif => (
                <div key={notif.id} style={{ background: `${notif.color}10`, border: `1px solid ${notif.border}`, borderRadius: 16, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: notif.color }}>{notif.title}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{notif.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>
                    {notif.desc}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowNotifModal(false)} style={{ width: '100%', marginTop: 16, padding: '14px', background: 'linear-gradient(135deg, #00edff, #3b82f6)', border: 'none', borderRadius: 16, color: '#0f172a', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,237,255,0.3)' }}>
              ✕ Close Notifications
            </button>
          </div>
        </div>
      )}

      <BottomNav active="home" />
    </div>
  );
}
