import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import EmergencyModal from '../../components/passenger/EmergencyModal.jsx';
import { VehicleIcon } from '../../components/passenger/VehicleIcons.jsx';
import { getCoordinatesFromLocationText } from '../../utils/locationGeocoder.js';
import API_BASE from '../../config';
import '../../passenger.css';

const DRIVER_POOL = [
  { id: 1, name: 'Vikram Singh', avatar: '👨🏽‍✈️', rating: '4.95', rides: '4,120', since: '2020', vehicleIcon: '🏍️', vehicleName: 'TVS Apache RTR', vehicleNum: 'DL 3S AK 8921', phone: '+91 98112 34567' },
  { id: 2, name: 'Sandeep Verma', avatar: '👨🏼‍✈️', rating: '4.92', rides: '2,890', since: '2021', vehicleIcon: '🚗', vehicleName: 'Maruti WagonR (Mini)', vehicleNum: 'DL 8S MM 4512', phone: '+91 98765 43210' },
  { id: 3, name: 'Manoj Kumar', avatar: '👨🏿‍✈️', rating: '4.88', rides: '3,450', since: '2019', vehicleIcon: '🏍️', vehicleName: 'Hero Splendor+', vehicleNum: 'UP 16 B 9012', phone: '+91 99100 88776' },
  { id: 4, name: 'Amit Sharma', avatar: '👨🏻‍✈️', rating: '4.97', rides: '5,670', since: '2018', vehicleIcon: '🏎️', vehicleName: 'Swift Dzire', vehicleNum: 'DL 4C AB 7890', phone: '+91 98101 22334' },
  { id: 5, name: 'Rahul Choudhary', avatar: '👨🏽‍✈️', rating: '4.89', rides: '1,980', since: '2022', vehicleIcon: '🏍️', vehicleName: 'Honda CB Shine', vehicleNum: 'HR 26 BK 4411', phone: '+91 97111 44332' },
  { id: 6, name: 'Pankaj Yadav', avatar: '👨🏻‍✈️', rating: '4.94', rides: '3,210', since: '2021', vehicleIcon: '🛺', vehicleName: 'Bajaj RE Auto', vehicleNum: 'DL 1R TT 4321', phone: '+91 98990 11223' },
  { id: 7, name: 'Rakesh Sharma', avatar: '👨🏽‍✈️', rating: '4.91', rides: '2,400', since: '2020', vehicleIcon: '⚡', vehicleName: 'Tigor EV', vehicleNum: 'DL 12 C 8877', phone: '+91 98223 99887' },
];

const getVehiclePlate = (d) => d?.vehicleNum || d?.vehicleNumber || d?.plateNumber || d?.plate || d?.vehicleNo || 'DL 8S MM 4512';


const CANCEL_REASONS = [
  "⌛ Driver is taking too long to arrive",
  "📍 Driver is moving in wrong direction",
  "🚗 Driver requested to cancel ride",
  "🔄 Entered wrong pickup or dropoff location",
  "💡 Changed my mind / Ride no longer needed"
];

// Web Audio API Ringtone Generator for In-App Driver Call
const playRingSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();

    let isPlaying = true;

    const playPulse = () => {
      if (!isPlaying || ctx.state === 'closed') return;

      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.3);
        osc2.stop(ctx.currentTime + 1.3);
      } catch (e) {}
    };

    playPulse();
    const timer = setInterval(playPulse, 2500);

    return {
      stop: () => {
        isPlaying = false;
        clearInterval(timer);
        try { ctx.close(); } catch (e) {}
      }
    };
  } catch (e) {
    return null;
  }
};

const playConnectedBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);

    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 450);
  } catch (e) {}
};

// Web Speech API Voice Synthesizer for Driver Call Reply
const speakDriverResponse = (text) => {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('india') || v.lang.includes('IN'));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Driver voice synthesis notice:', e);
  }
};

export default function DriverAssignedPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [eta, setEta] = useState(247);
  const [showSOS, setShowSOS] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [showMatchToast, setShowMatchToast] = useState(true);
  const [selectedReason, setSelectedReason] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [driver, setDriver] = useState(DRIVER_POOL[0]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    const toastTimer = setTimeout(() => setShowMatchToast(false), 3000);
    return () => clearTimeout(toastTimer);
  }, []);

  // Generate or retrieve 4-digit Ride Safety PIN
  const [ridePin] = useState(() => {
    const saved = sessionStorage.getItem('ridex_trip_pin');
    if (saved) return saved;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    sessionStorage.setItem('ridex_trip_pin', pin);
    return pin;
  });

  const isCancelledRef = useRef(false);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchEnd - touchStart;
    if (diff > 30) {
      setIsCollapsed(true);
    } else if (diff < -30) {
      setIsCollapsed(false);
    }
    setTouchStart(null);
  };

  // Call State
  const [callDuration, setCallDuration] = useState(0);
  const [callConnected, setCallConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [driverSpeechText, setDriverSpeechText] = useState('');

  // Live Rapido Telemetry State
  const [liveTelemetry, setLiveTelemetry] = useState({ distanceText: '1.8 km away', etaText: '5 mins' });

  // Dynamic Booking Info
  const [bookingInfo, setBookingInfo] = useState({
    pickup: 'Parliament St.',
    drop: 'Noida Sec 18',
    fare: '₹107'
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  // 1. Load Dynamic Pickup & Drop Locations + Dynamic Driver
  useEffect(() => {
    let savedBooking = sessionStorage.getItem('ridex_current_booking');
    let bookingId = sessionStorage.getItem('ridex_booking_id');

    if (!savedBooking || !bookingId) {
      bookingId = `RIDEX-${Math.floor(100000 + Math.random() * 900000)}`;
      const defaultBookingObj = {
        bookingId,
        pickup: 'Patia, Bhubaneswar',
        drop: 'Master Canteen, Bhubaneswar',
        fare: '₹147',
        rawFare: 147,
        vehicle: 'Mini',
        vehicleIcon: '🚗',
        distKm: 6.4,
        tripDuration: 16,
        vehicleEta: 4,
        status: 'Confirmed'
      };
      sessionStorage.setItem('ridex_booking_id', bookingId);
      sessionStorage.setItem('ridex_current_booking', JSON.stringify(defaultBookingObj));
      savedBooking = JSON.stringify(defaultBookingObj);
    }

    const pAddr = sessionStorage.getItem('pickupLocation') || 'Patia';
    const dAddr = sessionStorage.getItem('destLocation') || 'Master Canteen';
    const savedPCoords = sessionStorage.getItem('pickupCoords');
    const savedDCoords = sessionStorage.getItem('destCoords');

    let pObj = null;
    let dObj = null;

    if (savedPCoords) {
      try { pObj = JSON.parse(savedPCoords); } catch (e) {}
    }
    if (!pObj || !pObj.lat) {
      pObj = getCoordinatesFromLocationText(pAddr, 20.3562, 85.8188, 'Patia');
    }
    setPickupCoords(pObj);

    if (savedDCoords) {
      try { dObj = JSON.parse(savedDCoords); } catch (e) {}
    }
    if (!dObj || !dObj.lat) {
      dObj = getCoordinatesFromLocationText(dAddr, 20.2980, 85.8350, 'Master Canteen');
    }
    setDestCoords(dObj);

    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        setBookingInfo({
          pickup: parsed.pickup ? parsed.pickup.split(',')[0] : 'Current Location',
          drop: parsed.drop ? parsed.drop.split(',')[0] : 'Destination',
          fare: parsed.fare || '₹120',
          distKm: parsed.distKm || 4.4,
          tripDuration: parsed.tripDuration || 11,
          vehicleEta: parsed.vehicleEta || 3
        });
        if (parsed.vehicleEta) {
          const initDist = (parsed.vehicleEta * 0.5).toFixed(1);
          setLiveTelemetry({
            distanceText: `${initDist} km away`,
            etaText: `${parsed.vehicleEta} mins`
          });
        }
      } catch (e) {}
    } else if (pAddr || dAddr) {
      setBookingInfo({
        pickup: pAddr ? pAddr.split(',')[0] : 'Current Location',
        drop: dAddr ? dAddr.split(',')[0] : 'Destination',
        fare: '₹120'
      });
    }

    let savedDriver = sessionStorage.getItem('ridex_current_driver');
    let currentDriver;

    if (savedDriver) {
      try {
        currentDriver = JSON.parse(savedDriver);
      } catch (e) {}
    }

    if (!currentDriver) {
      let vName = 'Mini';
      let vIcon = '🚗';
      if (savedBooking) {
        try {
          const b = JSON.parse(savedBooking);
          if (b.vehicle) vName = b.vehicle;
          if (b.vehicleIcon) vIcon = b.vehicleIcon;
        } catch (e) {}
      }

      const matchedInPool = DRIVER_POOL.find(d => d.vehicleIcon === vIcon || d.vehicleName.toLowerCase().includes(vName.toLowerCase()));
      if (matchedInPool) {
        currentDriver = matchedInPool;
      } else {
        currentDriver = {
          id: 99,
          name: 'Amit Sharma',
          avatar: '👨🏻‍✈️',
          rating: '4.97',
          rides: '5,670',
          since: '2018',
          vehicleIcon: vIcon,
          vehicleName: `${vName} Vehicle`,
          vehicleNum: 'DL 4C AB 7890',
          phone: '+91 98101 22334'
        };
      }
      sessionStorage.setItem('ridex_current_driver', JSON.stringify(currentDriver));
    }

    setDriver(currentDriver);

    setChatMessages([
      { id: 1, sender: 'driver', text: `Namaste! I am ${currentDriver.name}. I am on my way with ${currentDriver.vehicleName} (${currentDriver.vehicleNum}). See you soon! 🚗`, time: 'Just now' }
    ]);
  }, []);

  // ETA countdown
  useEffect(() => {
    const tick = setInterval(() => setEta(e => Math.max(0, e - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  // Active In-App Call Timer & Real Phone Ringing Audio + Voice Reply
  useEffect(() => {
    let callTimer;
    let connectTimeout;
    let ringHandle = null;

    if (showCall) {
      setCallDuration(0);
      setCallConnected(false);
      setDriverSpeechText('');

      // Start standard phone ringback tone ("Trrrn... Trrrn...")
      ringHandle = playRingSound();

      connectTimeout = setTimeout(() => {
        if (ringHandle) ringHandle.stop();
        playConnectedBeep();
        setCallConnected(true);

        const pickupLocName = bookingInfo.pickup ? bookingInfo.pickup.split(',')[0] : 'Patia';
        const etaValue = bookingInfo.vehicleEta || 3;
        const msg = `Namaste! Main ${driver?.name || 'Aapka Driver'} bol raha hu. Main abhi ${pickupLocName} ke paas hu aur bas ${etaValue} minutes me aapke location par reach kar raha hu. Ready rahiyega!`;

        setDriverSpeechText(msg);
        speakDriverResponse(msg);
      }, 3000);

      callTimer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (ringHandle) ringHandle.stop();
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      clearInterval(callTimer);
      clearTimeout(connectTimeout);
    };
  }, [showCall, driver?.name, bookingInfo]);

  const fmtCallTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSendMessage = (textToSend) => {
    const msgText = textToSend || inputMsg;
    if (!msgText.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: msgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMsg('');

    setTimeout(() => {
      const driverReplies = [
        "Got it! Reaching your pickup location in 2 mins.",
        "Yes sir, I am near your pickup landmark. Please look for my vehicle.",
        "Okay, I am right outside now! 📍 Share your PIN to start.",
        "Thanks for informing!"
      ];
      const randomReply = driverReplies[Math.floor(Math.random() * driverReplies.length)];
      setChatMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'driver', text: randomReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1200);
  };

  const handleConfirmCancelRide = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    isCancelledRef.current = true;
    setIsCancelling(true);

    const activeBookingId = sessionStorage.getItem('ridex_booking_id');
    if (activeBookingId) {
      fetch(`${API_BASE}/api/bookings/${activeBookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', cancelReason: CANCEL_REASONS[selectedReason] || 'User cancelled' })
      }).catch(err => console.warn('Cancel API error:', err));
    }

    sessionStorage.removeItem('ridex_current_booking');
    sessionStorage.removeItem('ridex_current_driver');
    sessionStorage.removeItem('ridex_booking_id');
    sessionStorage.removeItem('ridex_trip_pin');

    setShowCancelModal(false);
    setIsCancelling(false);
    navigate('/home', { replace: true });
  };

  const handleStartTrip = () => {
    const activeBookingId = sessionStorage.getItem('ridex_booking_id');
    if (activeBookingId) {
      fetch(`${API_BASE}/api/bookings/${activeBookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress' })
      }).catch(err => console.warn('Start trip API notice:', err));
    }
    sessionStorage.setItem('ridex_trip_started', 'true');
    navigate('/live-ride');
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', maxWidth: 480, margin: '0 auto', height: '100vh', position: 'relative', overflow: 'hidden', background: '#090a10' }}>

      {/* ── Embedded Google / Leaflet Live Map ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GoogleLiveLocationMap
          height="100%"
          mode="driver_assigned"
          driver={driver}
          pickupLocation={pickupCoords}
          destinationLocation={destCoords}
          onDriverProgress={(data) => {
            if (isCancelledRef.current) return;
            setLiveTelemetry(data);
            
            // Trigger Arrival Modal when vehicle comes close (progress >= 95% or Arrived)
            if ((data.progressPercent >= 95 || data.isArrived) && !showArrivalModal && !isCancelledRef.current) {
              setShowArrivalModal(true);
            }
          }}
          showSearchInputs={false}
          showSummaryBar={false}
        />
      </div>

      {/* Top Floating Telemetry Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(9,10,16,0.95) 0%, rgba(9,10,16,0) 100%)',
        padding: '50px 16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ background: 'rgba(19, 24, 36, 0.92)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: '12px 18px', border: '1.5px solid rgba(0, 237, 255, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)' }}>DRIVER ETA</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>⏱️ {liveTelemetry.etaText}</div>
          </div>
          <div style={{ width: 1.5, height: 32, background: 'rgba(0, 237, 255, 0.3)' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>DISTANCE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#34d399' }}>📏 {liveTelemetry.distanceText}</div>
          </div>
        </div>

        <button onClick={() => setShowSOS(!showSOS)}
          style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: 999, color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', animation: 'pulse 2s ease-in-out infinite', boxShadow: '0 6px 20px rgba(239,68,68,0.5)' }}>
          🆘 SOS
        </button>
      </div>

      {showMatchToast && (
        <div style={{
          position: 'absolute', top: 118, left: 16, right: 16, zIndex: 25,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
          backdropFilter: 'blur(16px)', borderRadius: 16, padding: '10px 16px',
          color: '#fff', fontWeight: 900, fontSize: 13, textAlign: 'center',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
          animation: 'fadeInDown 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <span>🎉</span> <span>Booking Confirmed! <b>{driver.name}</b> is on the way ({driver.vehicleNum})</span>
        </div>
      )}

      {/* Floating Map View Toggle Button */}
      <button onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute', right: 16, top: 115, zIndex: 15,
          padding: '10px 16px', background: 'rgba(19, 24, 36, 0.9)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 237, 255, 0.4)', borderRadius: 999,
          color: '#00edff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.25s ease',
        }}
      >
        {isCollapsed ? '📋 Driver Info' : '🗺️ Hide & View Map'}
      </button>

      {/* ── DRIVER ARRIVAL & PIN CONFIRMATION MODAL (Triggered when vehicle reaches nearby) ── */}
      {showArrivalModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(5, 7, 12, 0.92)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, animation: 'fadeIn 0.35s ease'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #131824 0%, #090a10 100%)',
            borderRadius: 32, padding: '30px 24px', width: '100%', maxWidth: 400,
            textAlign: 'center', border: '2px solid #00edff',
            boxShadow: '0 0 50px rgba(0, 237, 255, 0.5)',
            animation: 'scaleUp 0.35s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Arrival Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0, 237, 255, 0.15)', border: '1px solid #00edff',
              padding: '6px 16px', borderRadius: 999, color: '#00edff',
              fontSize: 12, fontWeight: 900, letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)', marginBottom: 16
            }}>
              📍 DRIVER ARRIVED NEARBY
            </div>

            <div style={{ fontSize: 50, marginBottom: 10 }}>🚗✨</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', marginBottom: 6 }}>
              {driver.name} is Here!
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Look out for <strong>{driver.vehicleName}</strong> (<span style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{driver.vehicleNum}</span>)
            </p>

            {/* 4-Digit Security PIN Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)', border: '1.5px dashed #00edff',
              borderRadius: 20, padding: '16px', marginBottom: 24,
              boxShadow: '0 0 20px rgba(0,237,255,0.2)'
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.15em', marginBottom: 8 }}>
                SHARE SAFETY PIN WITH DRIVER TO START
              </div>
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 12,
                fontSize: 32, fontWeight: 900, color: '#00edff',
                fontFamily: 'var(--font-mono)', letterSpacing: '4px'
              }}>
                {ridePin.split('').map((digit, idx) => (
                  <span key={idx} style={{
                    width: 44, height: 50, background: 'rgba(0, 237, 255, 0.12)',
                    border: '1.5px solid #00edff', borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(0, 237, 255, 0.3)'
                  }}>
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            {/* Confirm & Start Ride Action Button */}
            <button onClick={() => { setShowArrivalModal(false); handleStartTrip(); }}
              style={{
                width: '100%', padding: '17px',
                background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)',
                border: 'none', borderRadius: 18, color: '#0f172a',
                fontWeight: 900, fontSize: 16, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '0 8px 30px rgba(0, 237, 255, 0.6)'
              }}>
              🚀 Confirm Vehicle Arrived & Start Trip
            </button>
          </div>
        </div>
      )}

      {/* SOS Overlay */}
      <EmergencyModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
        driver={driver}
        pickupLocation={pickupCoords}
        destinationLocation={destCoords}
      />

      {/* ── Cancel Ride Modal ── */}
      {showCancelModal && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 999, background: 'rgba(5,7,12,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.3s ease', pointerEvents: 'auto' }}>
          <div style={{
            width: '100%', background: 'linear-gradient(180deg, #131824 0%, #090a10 100%)',
            borderTop: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '32px 32px 0 0',
            padding: '24px 20px 36px', boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
            animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 44, height: 4, borderRadius: 999, background: 'rgba(239, 68, 68, 0.5)' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>Cancel Your Ride?</h2>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Select a reason to help us improve your experience</p>
            </div>

            {/* Reasons Selector List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {CANCEL_REASONS.map((reason, index) => (
                <div key={index} onClick={() => setSelectedReason(index)}
                  style={{
                    padding: '14px 16px', background: selectedReason === index ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1.5px solid ${selectedReason === index ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s'
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${selectedReason === index ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
                    background: selectedReason === index ? '#ef4444' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900
                  }}>
                    {selectedReason === index ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: selectedReason === index ? '#f8fafc' : '#94a3b8' }}>
                    {reason}
                  </span>
                </div>
              ))}
            </div>

            {/* Uber Free Cancellation Policy Notice */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 14, padding: '10px 14px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>
                ⚡ FREE CANCELLATION: No fee charged for cancelling within 2 minutes.
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCancelModal(false)}
                style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, color: '#f8fafc', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                ↩️ Keep Ride
              </button>
              <button onClick={handleConfirmCancelRide} disabled={isCancelling}
                style={{ flex: 1.2, padding: '16px', background: isCancelling ? 'rgba(239, 68, 68, 0.5)' : 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: 16, color: '#fff', fontWeight: 900, fontSize: 14, cursor: isCancelling ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)' }}>
                {isCancelling ? '⏳ Cancelling...' : '❌ Cancel Ride'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3D Uber In-App Calling Screen Overlay ── */}
      {showCall && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 60,
          background: 'linear-gradient(180deg, #090a10 0%, #0d121f 50%, #05070c 100%)',
          backdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          padding: '60px 24px 48px',
          animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Top Security Branding */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#00edff', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              🔒 UBER PRIVATE MASKED CALL
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
              {callConnected ? '● Connected · HD Voice' : 'Ringing driver...'}
            </div>
          </div>

          {/* Center Driver Profile Pulse Animation */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{
                position: 'absolute', inset: -15, borderRadius: '50%',
                background: 'rgba(0, 237, 255, 0.15)', border: '2px solid rgba(0, 237, 255, 0.4)',
                animation: 'pulse 1.8s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute', inset: -30, borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)',
                animation: 'pulse 2.5s ease-in-out 0.4s infinite'
              }} />

              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: 'linear-gradient(135deg, #00edff, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 54, border: '4px solid #00edff',
                boxShadow: '0 0 30px rgba(0, 237, 255, 0.6)', zIndex: 2
              }}>
                {driver.avatar}
              </div>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', marginBottom: 4, letterSpacing: '-0.5px' }}>
              {driver.name}
            </h2>
            <div style={{ fontSize: 14, color: '#00edff', fontWeight: 700, marginBottom: 8 }}>
              {driver.vehicleIcon} {driver.vehicleName} ({driver.vehicleNum})
            </div>

            <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
              {callConnected ? fmtCallTimer(callDuration) : 'Connecting...'}
            </div>

            {/* Live Driver Voice Response Card */}
            {callConnected && driverSpeechText && (
              <div style={{
                background: 'rgba(0, 237, 255, 0.1)',
                border: '1.5px solid rgba(0, 237, 255, 0.4)',
                borderRadius: 20,
                padding: '12px 16px',
                marginTop: 16,
                maxWidth: 320,
                boxShadow: '0 8px 25px rgba(0, 237, 255, 0.25)',
                animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: '#00edff', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                  <span>🗣️ DRIVER VOICE RESPONSE</span>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 1s infinite' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', lineHeight: 1.45, fontStyle: 'italic' }}>
                  "{driverSpeechText}"
                </div>
              </div>
            )}
          </div>

          {/* Call Controls & Action Buttons */}
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(19, 24, 36, 0.85)', padding: '16px', borderRadius: 24, border: '1px solid rgba(0, 237, 255, 0.2)' }}>
              <button onClick={() => setIsMuted(!isMuted)}
                style={{ width: 56, height: 56, borderRadius: '50%', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                {isMuted ? '🎙️' : '🎤'}
              </button>

              <button onClick={() => setIsSpeaker(!isSpeaker)}
                style={{ width: 56, height: 56, borderRadius: '50%', background: isSpeaker ? '#00edff' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: isSpeaker ? '#0f172a' : '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                🔊
              </button>

              <a href={`tel:${driver.phone}`}>
                <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📱
                </button>
              </a>
            </div>

            <button onClick={() => setShowCall(false)}
              style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none', borderRadius: 20, color: '#fff', fontWeight: 900, fontSize: 16,
                cursor: 'pointer', boxShadow: '0 8px 30px rgba(239, 68, 68, 0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
              }}>
              🔴 End Call
            </button>
          </div>
        </div>
      )}

      {/* ── 3D Driver Chat Modal ── */}
      {showChat && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(9, 10, 16, 0.95)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Chat Header */}
          <div style={{ padding: '50px 20px 16px', background: 'linear-gradient(135deg, #131824, #0b0e18)', borderBottom: '1px solid rgba(0,237,255,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #00edff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '2px solid #00edff', boxShadow: '0 0 12px rgba(0,237,255,0.5)' }}>
              {driver.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>{driver.name}</div>
              <div style={{ fontSize: 11, color: '#00edff', fontWeight: 700 }}>
                ● ONLINE · {driver.vehicleName} ({driver.vehicleNum})
              </div>
            </div>
            <button onClick={() => setShowChat(false)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          {/* Chat Messages Body */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chatMessages.map(msg => (
              <div key={msg.id} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #00edff 0%, #3b82f6 100%)' : 'rgba(19, 24, 36, 0.95)',
                color: msg.sender === 'user' ? '#0f172a' : '#f8fafc',
                border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{msg.text}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{msg.time}</div>
              </div>
            ))}
          </div>

          {/* Quick Reaction Chips */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto', background: 'rgba(11, 14, 24, 0.8)' }}>
            {[
              "📍 I'm waiting at pickup location",
              "⌛ Arriving in 2 mins",
              "👕 Wearing black jacket",
              "🗺️ Where are you right now?"
            ].map((chip, idx) => (
              <button key={idx} onClick={() => handleSendMessage(chip)}
                style={{ padding: '6px 12px', background: 'rgba(0, 237, 255, 0.1)', border: '1px solid rgba(0, 237, 255, 0.25)', borderRadius: 999, color: '#00edff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Footer */}
          <div style={{ padding: 16, background: '#0b0e18', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Message driver..."
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              style={{ flex: 1, padding: '12px 16px', background: 'rgba(19, 24, 36, 0.9)', border: '1px solid rgba(0, 237, 255, 0.2)', borderRadius: 14, color: '#fff', outline: 'none', fontSize: 14 }}
            />
            <button onClick={() => handleSendMessage()}
              style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #00edff, #3b82f6)', border: 'none', borderRadius: 14, color: '#0f172a', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>
              🚀 Send
            </button>
          </div>
        </div>
      )}

      {/* ── 3D Uber Glassmorphic Driver Card (Dynamic Collapsible Drawer) ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(180deg, rgba(19, 24, 36, 0.97) 0%, rgba(9, 10, 16, 0.99) 100%)',
        backdropFilter: 'blur(24px)',
        borderTop: '1.5px solid rgba(0, 237, 255, 0.4)',
        borderRadius: '32px 32px 0 0',
        boxShadow: '0 -15px 50px rgba(0,0,0,0.85)',
        transform: isCollapsed ? 'translateY(calc(100% - 80px))' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Dynamic Handle Bar Header (Clickable & Draggable Arrow Handle) */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: 'pointer',
            paddingTop: 12,
            paddingBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            userSelect: 'none',
            background: isCollapsed ? 'rgba(0, 237, 255, 0.08)' : 'transparent',
            borderRadius: '32px 32px 0 0',
            transition: 'background 0.2s ease',
          }}
        >
          {/* Animated Handle Bar Pill */}
          <div style={{
            width: 54,
            height: 5,
            borderRadius: 999,
            background: isCollapsed ? '#00edff' : 'rgba(0, 237, 255, 0.5)',
            boxShadow: isCollapsed ? '0 0 14px rgba(0, 237, 255, 0.9)' : 'none',
            transition: 'all 0.3s ease',
          }} />

          {/* Dynamic Interactive Arrow Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
            fontSize: 11,
            fontWeight: 800,
            color: '#00edff',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ fontSize: 13, transition: 'transform 0.3s', transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>▼</span>
            <span>{isCollapsed ? 'TAP / SWIPE UP TO SHOW DETAILS' : 'TAP / SWIPE DOWN TO VIEW MAP'}</span>
            <span style={{ fontSize: 13, transition: 'transform 0.3s', transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>▼</span>
          </div>
        </div>

        <div style={{ padding: '8px 20px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#00edff', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              ● UBER DRIVER ASSIGNED
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Your rider partner is approaching your pickup</div>
          </div>

          {/* Safety PIN Badge Box */}
          <div style={{
            background: 'rgba(0, 237, 255, 0.12)', border: '1.5px dashed #00edff',
            borderRadius: 16, padding: '10px 16px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔐</span> RIDE VERIFICATION PIN:
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#00edff', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
              {ridePin}
            </div>
          </div>

          {/* Dynamic Driver Info Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '16px', background: 'rgba(15, 23, 42, 0.85)', borderRadius: 20, border: '1px solid rgba(0, 237, 255, 0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            {/* Avatar */}
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #00edff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, border: '3px solid #00edff', boxShadow: '0 0 18px rgba(0, 237, 255, 0.5)', flexShrink: 0 }}>
              {driver.avatar}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {driver.name}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>
                Rides: {driver.rides} · Member since {driver.since}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i} style={{ color: '#fbbf24', fontSize: 13 }}>★</span>
                ))}
                <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc', marginLeft: 4 }}>{driver.rating}</span>
              </div>
            </div>

            {/* Vehicle & High-Security Registration Plate Badge */}
            <div style={{ textAlign: 'center', background: 'rgba(9, 10, 16, 0.95)', padding: '10px 14px', borderRadius: 18, border: '1px solid rgba(0, 237, 255, 0.35)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 124, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
              <VehicleIcon type={driver.vehicleIcon || driver.vehicleName} size={38} />
              <div style={{ fontSize: 12, fontWeight: 900, color: '#00edff', marginTop: 4, whiteSpace: 'nowrap' }}>
                {driver.vehicleName}
              </div>
              
              {/* High-Security Indian License Plate Badge */}
              <div style={{
                marginTop: 6,
                background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)',
                border: '1.5px solid #ca8a04',
                borderRadius: 6,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(234, 179, 8, 0.45)',
              }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: '#1e3a8a', fontFamily: 'var(--font-mono)', borderRight: '1px solid #ca8a04', paddingRight: 4, lineHeight: 1 }}>
                  IND
                </span>
                <span style={{ fontSize: 11, color: '#0f172a', fontFamily: 'var(--font-mono)', fontWeight: 900, letterSpacing: '1px', lineHeight: 1 }}>
                  {getVehiclePlate(driver)}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Trip Info Stat Tiles */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 237, 255, 0.15)', borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>📍</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)' }}>PICKUP</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={bookingInfo.pickup}>
                {bookingInfo.pickup}
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>🏁</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>DROPOFF</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={bookingInfo.drop}>
                {bookingInfo.drop}
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>💰</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>FARE</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#00edff' }}>
                {bookingInfo.fare}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setShowCall(true)}
              style={{ flex: 1, padding: '14px', background: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid rgba(16, 185, 129, 0.4)', borderRadius: 16, color: '#34d399', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              📞 Call
            </button>
            <button onClick={() => setShowChat(true)}
              style={{ flex: 1, padding: '14px', background: 'rgba(0, 237, 255, 0.15)', border: '1.5px solid rgba(0, 237, 255, 0.4)', borderRadius: 16, color: '#00edff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 237, 255, 0.2)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              💬 Chat
            </button>
            <button onClick={() => setShowArrivalModal(true)}
              style={{ flex: 1.2, padding: '14px', background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)', border: 'none', borderRadius: 16, color: '#0f172a', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 6px 20px rgba(0, 237, 255, 0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.color = '#0f172a'; }}
            >
              🚀 Start Trip
            </button>
          </div>

          {/* Cancel Ride Button */}
          <button onClick={() => setShowCancelModal(true)}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 16, color: '#ef4444', fontWeight: 900, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
          >
            ✕ Cancel Ride
          </button>
        </div>
      </div>
    </div>
  );
}
