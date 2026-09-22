import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import EmergencyModal from '../../components/passenger/EmergencyModal.jsx';
import { VehicleIcon } from '../../components/passenger/VehicleIcons.jsx';
import API_BASE from '../../config';
import '../../passenger.css';

const CANCEL_REASONS = [
  "⌛ Driver is taking too long",
  "📍 Driver is moving in wrong direction",
  "🚗 Emergency / Safety issue",
  "🔄 Entered wrong dropoff location",
  "💡 Changed my mind / Ride no longer needed"
];

const getVehiclePlate = (d) => d?.vehicleNum || d?.vehicleNumber || d?.plateNumber || d?.plate || d?.vehicleNo || 'DL 8S MM 4512';


export default function LiveRidePage() {
  const navigate = useNavigate();
  const [eta, setEta] = useState(1240); // seconds
  const [progress, setProgress] = useState(35); // %
  const [shared, setShared] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const [isCancelledRef] = useState({ current: false });

  // Interactive Dynamic Rating State & Rider Feedback
  const [userRating, setUserRating] = useState(5);
  const [selectedTip, setSelectedTip] = useState(0);
  const [selectedBadges, setSelectedBadges] = useState(['Great Driving 🚗', 'Polite Driver 🤝']);
  const [riderComment, setRiderComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const handleProceedToPaymentAndSaveRating = async () => {
    if (!userRating || userRating < 1 || userRating > 5) {
      setFeedbackError('Please select a star rating (1-5 stars) for your driver.');
      return;
    }

    if (riderComment.length > 500) {
      setFeedbackError('Feedback comment cannot exceed 500 characters.');
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError('');

    try {
      const activeBookingId = sessionStorage.getItem('ridex_booking_id') || 'BK_8921';
      const riderName = localStorage.getItem('ridex_user_name') || 'Saurav Kumar Nayak';
      const userToken = localStorage.getItem('token') || localStorage.getItem('ridex_token') || localStorage.getItem('driverToken');

      const headers = { 'Content-Type': 'application/json' };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      // Send feedback to Backend API
      const res = await fetch(`${API_BASE}/api/bookings/${activeBookingId}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating: userRating,
          comment: riderComment,
          badges: selectedBadges,
          tipAmount: selectedTip,
          riderName
        })
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.message?.includes('already'))) {
        setFeedbackError(data.message || 'Unable to submit feedback. Please try again.');
        setIsSubmittingFeedback(false);
        return;
      }

      // Also update local storage cache for passenger stats
      const rawFare = String(bookingInfo.fare || '150').replace(/[^0-9]/g, '');
      const numFare = Number(rawFare) || 150;

      const existingRatings = JSON.parse(localStorage.getItem('ridex_user_ratings_list') || '[]');
      existingRatings.push({
        rating: userRating,
        comment: riderComment,
        tip: selectedTip,
        badges: selectedBadges,
        fare: numFare + selectedTip,
        date: new Date().toISOString(),
        driver: driver.name,
      });
      localStorage.setItem('ridex_user_ratings_list', JSON.stringify(existingRatings));

      const currentStats = JSON.parse(localStorage.getItem('ridex_user_stats') || '{"rides":64,"spent":8240,"rating":"4.9"}');
      currentStats.rides = (currentStats.rides || 64) + 1;
      currentStats.spent = (currentStats.spent || 8240) + numFare + selectedTip;
      
      const allRatings = existingRatings.map(r => r.rating);
      const totalStars = allRatings.reduce((sum, r) => sum + r, 0) + (64 * 4.9);
      const totalCount = allRatings.length + 64;
      currentStats.rating = (totalStars / totalCount).toFixed(1);

      localStorage.setItem('ridex_user_stats', JSON.stringify(currentStats));

      // Show success state modal
      setFeedbackSubmitted(true);
      setTimeout(() => {
        navigate('/payment');
      }, 2200);

    } catch (e) {
      console.warn('Backend feedback notice:', e.message);
      setFeedbackError('Unable to connect to feedback server. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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

  const [driver, setDriver] = useState({
    name: 'Vikram Singh',
    avatar: '👨🏽‍✈️',
    rating: '4.95',
    vehicleIcon: '🏍️',
    vehicleName: 'TVS Apache RTR',
    vehicleNum: 'DL 3S AK 8921',
    phone: '+91 98112 34567'
  });

  // Live Rapido Telemetry State
  const [liveTelemetry, setLiveTelemetry] = useState({ distanceText: '6.8 km away', etaText: '14 mins' });
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  const handleDriverProgress = (data) => {
    if (!data) return;
    setLiveTelemetry(data);
    if (data.progressPercent !== undefined) {
      setProgress(data.progressPercent);
    }

    // Trigger Completion Modal & Backend Status Update on Arrival / 98%+ Progress
    if ((data.progressPercent >= 98 || data.isArrived) && !showCompletedModal && !isCancelledRef.current) {
      setShowCompletedModal(true);

      const activeBookingId = sessionStorage.getItem('ridex_booking_id');
      if (activeBookingId) {
        fetch(`${API_BASE}/api/bookings/${activeBookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Completed' })
        }).catch(err => console.warn('Complete ride API notice:', err));
      }
    }
  };

  const [bookingInfo, setBookingInfo] = useState({
    pickup: 'Parliament St.',
    drop: 'Noida Sec 18',
    fare: '₹107'
  });

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  useEffect(() => {
    const savedBooking = sessionStorage.getItem('ridex_current_booking');
    const bookingId = sessionStorage.getItem('ridex_booking_id');

    if (!savedBooking && !bookingId) {
      navigate('/home', { replace: true });
      return;
    }

    const pAddr = sessionStorage.getItem('pickupLocation');
    const dAddr = sessionStorage.getItem('destLocation');
    const savedPCoords = sessionStorage.getItem('pickupCoords');
    const savedDCoords = sessionStorage.getItem('destCoords');

    if (savedPCoords) {
      try { setPickupCoords(JSON.parse(savedPCoords)); } catch (e) {}
    }
    if (savedDCoords) {
      try { setDestCoords(JSON.parse(savedDCoords)); } catch (e) {}
    }

    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        setBookingInfo({
          pickup: parsed.pickup ? parsed.pickup.split(',')[0] : 'Pickup',
          drop: parsed.drop ? parsed.drop.split(',')[0] : 'Destination',
          fare: parsed.fare || '₹120'
        });
      } catch (e) {}
    } else if (pAddr || dAddr) {
      setBookingInfo({
        pickup: pAddr ? pAddr.split(',')[0] : 'Pickup',
        drop: dAddr ? dAddr.split(',')[0] : 'Destination',
        fare: '₹120'
      });
    }

    const savedDriver = sessionStorage.getItem('ridex_current_driver');
    if (savedDriver) {
      try {
        const parsed = JSON.parse(savedDriver);
        setDriver(parsed);
        setChatMessages([
          { id: 1, sender: 'driver', text: `Hi! I am ${parsed.name}. We are on our way to ${bookingInfo.drop}. Let me know if you need any assistance! 🚦`, time: 'Just now' }
        ]);
      } catch (e) {}
    }

    const tick = setInterval(() => {
      setEta(e => Math.max(0, e - 1));
      setProgress(p => Math.min(100, p + 0.04));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Active In-App Call Timer
  useEffect(() => {
    let callTimer;
    let connectTimeout;

    if (showCall) {
      setCallDuration(0);
      setCallConnected(false);

      connectTimeout = setTimeout(() => {
        setCallConnected(true);
      }, 2000);

      callTimer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(callTimer);
      clearTimeout(connectTimeout);
    };
  }, [showCall]);

  const fmtEta = (s) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}m ${String(sec).padStart(2, '0')}s`;
  };

  const fmtCallTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSendMessage = (textToSend) => {
    const msgText = textToSend || inputMsg;
    if (!msgText.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: msgText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMsg('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'driver', text: `Understood sir! Navigating smoothly to ${bookingInfo.drop}.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
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

    setShowCancelModal(false);
    setIsCancelling(false);
    navigate('/home', { replace: true });
  };

  const waypoints = [
    { name: bookingInfo.pickup, done: true },
    { name: 'En Route Expressway', done: true },
    { name: 'City Center Transit', done: false },
    { name: bookingInfo.drop, done: false },
  ];

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', maxWidth: 480, margin: '0 auto', height: '100vh', position: 'relative', overflow: 'hidden', background: '#090a10' }}>

      {/* Google / Leaflet Maps Live Location Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GoogleLiveLocationMap
          height="100%"
          mode="live_ride"
          driver={driver}
          pickupLocation={pickupCoords}
          destinationLocation={destCoords}
          onDriverProgress={(data) => {
            if (isCancelledRef.current) return;
            handleDriverProgress(data);
          }}
          showSearchInputs={false}
          showSummaryBar={false}
        />
      </div>

      {/* Top Progress Telemetry Strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(180deg, rgba(9,10,16,0.95) 0%, rgba(9,10,16,0) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 237, 255, 0.2)', padding: '50px 16px 16px',
      }}>
        {/* Progress Bar */}
        <div style={{ height: 6, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 999, marginBottom: 12, overflow: 'hidden', border: '1px solid rgba(0, 237, 255, 0.2)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(135deg, #00edff, #3b82f6, #a855f7)', borderRadius: 999, transition: 'width 1s linear', boxShadow: '0 0 16px rgba(0, 237, 255, 0.8)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)' }}>RIDE IN PROGRESS</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc' }}>{driver.vehicleIcon} Live Navigation</div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>REMAINING DISTANCE</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399' }}>📏 {liveTelemetry.distanceText}</div>
            </div>
            <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)' }}>ESTIMATED ETA</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#00edff' }}>⏱️ {liveTelemetry.etaText}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Overlay */}
      <EmergencyModal
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
        driver={driver}
        pickupLocation={pickupCoords}
        destinationLocation={destCoords}
      />

      {/* ── Interactive 3D Uber Cancel Ride Modal ── */}
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

      {/* ── Interactive 3D Driver Chat Modal ── */}
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
                ● DRIVING · {driver.vehicleName} ({driver.vehicleNum})
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

      {/* Floating Action Buttons */}
      <div style={{ position: 'absolute', right: 16, top: '35%', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ padding: '10px 14px', background: 'rgba(19, 24, 36, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,237,255,0.4)', borderRadius: 999, color: '#00edff', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,0,0,0.6)' }}>
          {isCollapsed ? '📋 Ride Info' : '🗺️ Hide & View Map'}
        </button>
        <button onClick={() => setShowSOS(true)}
          style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', backdropFilter: 'blur(10px)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', boxShadow: '0 6px 20px rgba(239,68,68,0.5)', animation: 'pulse 2s ease-in-out infinite', alignSelf: 'flex-end' }}>
          🆘
        </button>
        <button onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }}
          style={{ width: 50, height: 50, borderRadius: '50%', background: shared ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(19, 24, 36, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,237,255,0.3)', color: '#fff', fontSize: 18, cursor: 'pointer', transition: 'all 0.3s', alignSelf: 'flex-end' }}>
          {shared ? '✓' : '📤'}
        </button>
      </div>

      {/* ── 3D Uber Glass Bottom Info Card (Dynamic Collapsible Drawer) ── */}
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

        <div style={{ padding: '8px 20px 36px' }}>
          {/* Driver mini card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 14px', background: 'rgba(15, 23, 42, 0.85)', borderRadius: 18, border: '1px solid rgba(0, 237, 255, 0.2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #00edff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '2px solid #00edff' }}>
              {driver.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {driver.name}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <VehicleIcon type={driver.vehicleIcon || driver.vehicleName} size={22} />
                <span>{driver.vehicleName || 'Mini Ride'}</span>
                {/* HSRP License Plate Badge */}
                <span style={{
                  background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)',
                  border: '1px solid #ca8a04',
                  borderRadius: 4,
                  padding: '2px 6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)',
                }}>
                  <span style={{ fontSize: 7, fontWeight: 900, color: '#1e3a8a', fontFamily: 'var(--font-mono)', borderRight: '1px solid #ca8a04', paddingRight: 3, lineHeight: 1 }}>IND</span>
                  <span style={{ fontSize: 10, color: '#0f172a', fontFamily: 'var(--font-mono)', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1 }}>{getVehiclePlate(driver)}</span>
                </span>
                <span style={{ color: '#fbbf24', fontWeight: 800 }}>⭐ {driver.rating}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCall(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', cursor: 'pointer', fontSize: 16 }}>📞</button>
              <button onClick={() => setShowChat(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,237,255,0.2)', border: '1px solid rgba(0,237,255,0.4)', color: '#00edff', cursor: 'pointer', fontSize: 16 }}>💬</button>
            </div>
          </div>

          {/* Dynamic Waypoints */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>ROUTE PROGRESS TELEMETRY</div>
            {waypoints.map((wp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < waypoints.length - 1 ? 8 : 0 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: wp.done ? 'linear-gradient(135deg, #00edff, #3b82f6)' : 'rgba(15, 23, 42, 0.8)',
                  border: wp.done ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: wp.done ? '#0f172a' : '#fff', fontWeight: 900,
                }}>
                  {wp.done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: wp.done ? 600 : 800, color: wp.done ? '#64748b' : '#f8fafc', textDecoration: wp.done ? 'line-through' : 'none' }}>
                  {wp.name}
                </span>
                {i === 1 && !waypoints[2].done && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#00edff', background: 'rgba(0,237,255,0.15)', border: '1px solid rgba(0,237,255,0.3)', borderRadius: 999, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>LIVE</span>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCompletedModal(true)}
              style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)', border: 'none', borderRadius: 16, color: '#0f172a', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 25px rgba(0, 237, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              🏁 Complete Ride
            </button>
            <button onClick={() => setShowCancelModal(true)}
              style={{ flex: 1, padding: '14px', background: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid rgba(239, 68, 68, 0.4)', borderRadius: 16, color: '#ef4444', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ── Uber Ride Completed Celebration Modal ── */}
      {showCompletedModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 7, 12, 0.92)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px', overflowY: 'auto', animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{
            width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
            background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)',
            border: '2px solid rgba(0, 237, 255, 0.5)', borderRadius: 28,
            padding: '28px 22px', textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,237,255,0.4)',
            animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxSizing: 'border-box'
          }}>
            {/* Animated Check Circle */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, color: '#ffffff', boxShadow: '0 0 35px rgba(16, 185, 129, 0.8)',
              animation: 'pulse 2s infinite'
            }}>
              ✓
            </div>

            <div style={{ fontSize: 11, fontWeight: 900, color: '#00edff', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              ● DESTINATION REACHED
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', marginTop: 4, marginBottom: 8 }}>
              Ride Completed! 🎉
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              You have safely arrived at {bookingInfo.drop}
            </p>

            {/* Fare & Driver Summary Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(0, 237, 255, 0.25)',
              borderRadius: 20, padding: 16, marginBottom: 20, textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>TOTAL FARE</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#34d399' }}>{bookingInfo.fare}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>DRIVER</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{driver.name}</div>
                </div>
              </div>

              {/* Interactive Dynamic Star Rating */}
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#00edff', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  RATE DRIVER · {driver.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 32, cursor: 'pointer', marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <span
                      key={starVal}
                      onClick={() => setUserRating(starVal)}
                      style={{
                        color: starVal <= userRating ? '#fbbf24' : '#334155',
                        filter: starVal <= userRating ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))' : 'none',
                        transform: starVal === userRating ? 'scale(1.25)' : 'scale(1)',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        userSelect: 'none'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 800, marginBottom: 12 }}>
                  {userRating === 5 && '🌟 Excellent & Outstanding!'}
                  {userRating === 4 && '😊 Very Good Experience!'}
                  {userRating === 3 && '🙂 Good Ride'}
                  {userRating === 2 && '😐 Below Average'}
                  {userRating === 1 && '😞 Poor Experience'}
                </div>

                {/* Uber Compliment Badges */}
                <div style={{ margin: '12px 0' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.05em' }}>
                    {userRating >= 4 ? 'WHAT WENT GREAT?' : 'WHAT COULD BE IMPROVED?'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {(userRating >= 4
                      ? ['🧼 Clean Car', '🚗 Smooth Driving', '💬 Polite Driver', '⏱️ On Time', '🎵 Good Music']
                      : ['📍 Wrong Route', '🚗 Reckless Driving', '🔊 Loud Audio', '🗣️ Rude Behavior']
                    ).map(badge => {
                      const isSelected = selectedBadges.includes(badge);
                      return (
                        <button
                          key={badge}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedBadges(selectedBadges.filter(b => b !== badge));
                            } else {
                              setSelectedBadges([...selectedBadges, badge]);
                            }
                          }}
                          style={{
                            padding: '5px 10px', borderRadius: 999,
                            background: isSelected ? 'rgba(0, 237, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                            border: isSelected ? '1px solid #00edff' : '1px solid rgba(255,255,255,0.12)',
                            color: isSelected ? '#00edff' : '#94a3b8',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{badge}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Driver Tipping Options */}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}>ADD DRIVER TIP (OPTIONAL)</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {[0, 20, 50, 100].map(tipAmount => (
                      <button
                        key={tipAmount}
                        onClick={() => setSelectedTip(tipAmount)}
                        style={{
                          padding: '6px 12px', borderRadius: 12,
                          background: selectedTip === tipAmount ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.08)',
                          border: selectedTip === tipAmount ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
                          color: selectedTip === tipAmount ? '#ffffff' : '#94a3b8',
                          fontWeight: 800, fontSize: 12, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tipAmount === 0 ? 'No Tip' : `+₹${tipAmount}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 💬 Rider Feedback Comment Section */}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 14, marginTop: 14, textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💬</span>
                      <span>Share your experience</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: riderComment.length >= 480 ? '#ef4444' : '#00edff', fontFamily: 'var(--font-mono)' }}>
                      {riderComment.length}/500
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                    Tell us about your ride
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="How was your ride? Share your feedback..."
                    value={riderComment}
                    onChange={(e) => setRiderComment(e.target.value.slice(0, 500))}
                    disabled={isSubmittingFeedback || feedbackSubmitted}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(7, 16, 30, 0.95)',
                      border: '1.5px solid rgba(0, 237, 255, 0.3)',
                      borderRadius: 14,
                      color: '#ffffff',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {feedbackError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid #ef4444',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 16,
                textAlign: 'center'
              }}>
                ⚠️ {feedbackError}
              </div>
            )}

            {/* Success Confirmation Card */}
            {feedbackSubmitted ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid #10b981',
                borderRadius: 18,
                padding: '18px 16px',
                marginBottom: 10,
                textAlign: 'center',
                animation: 'scaleIn 0.3s ease'
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#34d399', marginBottom: 4 }}>
                  Thanks for your feedback!
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  Your feedback helps us improve RideX.
                </div>
              </div>
            ) : (
              <button
                onClick={handleProceedToPaymentAndSaveRating}
                disabled={isSubmittingFeedback || !userRating}
                style={{
                  width: '100%', padding: '16px',
                  background: isSubmittingFeedback
                    ? 'rgba(59, 130, 246, 0.5)'
                    : 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)',
                  border: 'none', borderRadius: 18, color: '#0f172a', fontWeight: 900,
                  fontSize: 16, cursor: isSubmittingFeedback ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 10px 30px rgba(0, 237, 255, 0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmittingFeedback ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '2px solid #0f172a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <span>→</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
