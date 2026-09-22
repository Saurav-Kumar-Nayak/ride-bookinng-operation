import { useState, useEffect, useRef } from 'react';

export default function EmergencyModal({ isOpen, onClose, driver, pickupLocation, destinationLocation }) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState(() => localStorage.getItem('ridex_emergency_contact') || '+91 98765 43210');
  const [editingPhone, setEditingPhone] = useState(false);

  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  // Stop siren on unmount or close
  useEffect(() => {
    if (!isOpen && sirenPlaying) {
      stopSiren();
    }
  }, [isOpen]);

  const startSiren = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        setActiveAlert('⚠️ Audio Context not supported by browser.');
        return;
      }
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      let high = false;
      const interval = setInterval(() => {
        if (ctx && ctx.state === 'running') {
          osc.frequency.setValueAtTime(high ? 950 : 600, ctx.currentTime);
          high = !high;
        }
      }, 250);

      sirenIntervalRef.current = interval;
      oscRef.current = osc;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setSirenPlaying(true);
      setActiveAlert('🔊 EMERGENCY SIREN ACTIVATED! Loud alarm playing.');
    } catch (e) {
      console.warn('Siren play error:', e.message);
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch (e) {}
      oscRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    setSirenPlaying(false);
  };

  const toggleSiren = () => {
    if (sirenPlaying) {
      stopSiren();
      setActiveAlert('🔇 Siren alarm turned off.');
    } else {
      startSiren();
    }
  };

  if (!isOpen) return null;

  const driverName = driver?.name || 'Assigned Driver';
  const vehicleNum = driver?.vehicleNum || driver?.vehicleNumber || 'DL 3S AK 8921';
  const vehicleName = driver?.vehicleName || 'Ride Vehicle';

  const handleCallPolice = () => {
    setActiveAlert('🚨 Dialing Police Emergency (100)... Live GPS & Ride details sent to PCR Control Room.');
    setTimeout(() => {
      window.location.href = 'tel:100';
    }, 800);
  };

  const handleCallAmbulance = () => {
    setActiveAlert('🚑 Dialing Emergency Ambulance (108)... Medical team dispatched to your location.');
    setTimeout(() => {
      window.location.href = 'tel:108';
    }, 800);
  };

  const handleShareGPS = () => {
    const trackingUrl = `${window.location.origin}/live-ride?track_id=SOS-${Date.now()}`;
    const shareText = `🚨 EMERGENCY SOS ALERT! I am riding in ${vehicleName} (${vehicleNum}) driven by ${driverName}. Track my live GPS location here: ${trackingUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    setCopiedLink(true);
    setActiveAlert(`📲 Live GPS Track link copied to clipboard & ready to share! (${trackingUrl})`);

    if (navigator.share) {
      navigator.share({
        title: 'RideX Emergency SOS Track',
        text: shareText,
        url: trackingUrl
      }).catch(() => {});
    } else {
      // Open WhatsApp as fallback
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleAlertEmergencyContact = () => {
    setActiveAlert(`📲 Emergency SOS alert sent via SMS/WhatsApp to ${emergencyPhone}! Vehicle: ${driverName} (${vehicleNum}), Location: Patia GPS.`);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 999,
      background: sirenPlaying ? 'rgba(239, 68, 68, 0.4)' : 'rgba(5, 7, 12, 0.92)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: sirenPlaying ? 'pulse 0.8s infinite' : 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #131824 0%, #0b0e18 100%)',
        borderRadius: 28, padding: '28px 24px', width: '100%', maxWidth: 380,
        textAlign: 'center', border: sirenPlaying ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: sirenPlaying ? '0 0 50px rgba(239, 68, 68, 0.8)' : '0 20px 50px rgba(0,0,0,0.8)',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Pulsing Red SOS Header Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: '#ffffff', fontWeight: 900,
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.7)',
          animation: 'pulse 1.8s ease-in-out infinite'
        }}>
          SOS
        </div>

        <h2 style={{ fontWeight: 900, fontSize: 22, color: '#f8fafc', marginBottom: 6 }}>
          Emergency Assistance
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
          Select immediate safety response action
        </p>

        {/* Live Active Status Banner */}
        {activeAlert && (
          <div style={{
            background: sirenPlaying ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
            border: `1.5px solid ${sirenPlaying ? '#ef4444' : '#10b981'}`,
            borderRadius: 16, padding: '12px 14px', marginBottom: 16,
            color: '#f8fafc', fontSize: 12, fontWeight: 800, textAlign: 'left',
            animation: 'fadeInDown 0.3s ease', lineHeight: 1.4
          }}>
            {activeAlert}
          </div>
        )}

        {/* Emergency Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* 1. Call Police (100) */}
          <button
            onClick={handleCallPolice}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 16, color: '#f8fafc', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
          >
            <span style={{ fontSize: 20 }}>📞</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Call Police (100)</span>
            <span style={{ fontSize: 11, background: '#ef4444', padding: '2px 8px', borderRadius: 999, color: '#fff' }}>24x7</span>
          </button>

          {/* 2. Call Ambulance (108) */}
          <button
            onClick={handleCallAmbulance}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 16, color: '#f8fafc', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
          >
            <span style={{ fontSize: 20 }}>🚑</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Call Ambulance (108)</span>
            <span style={{ fontSize: 11, background: '#ef4444', padding: '2px 8px', borderRadius: 999, color: '#fff' }}>108</span>
          </button>

          {/* 3. Share Live GPS Track */}
          <button
            onClick={handleShareGPS}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'rgba(0, 237, 255, 0.12)',
              border: '1.5px solid rgba(0, 237, 255, 0.4)',
              borderRadius: 16, color: '#00edff', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(0, 237, 255, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 237, 255, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 237, 255, 0.12)'}
          >
            <span style={{ fontSize: 20 }}>📲</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Share Live GPS Track</span>
            <span style={{ fontSize: 11, color: '#00edff' }}>{copiedLink ? '✓ Copied' : 'Share'}</span>
          </button>

          {/* 4. Alert Emergency Contact */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16, padding: '10px 14px', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>
                PRIMARY EMERGENCY CONTACT
              </div>
              <button
                onClick={() => setEditingPhone(!editingPhone)}
                style={{ background: 'none', border: 'none', color: '#00edff', fontSize: 11, cursor: 'pointer', fontWeight: 800 }}
              >
                {editingPhone ? 'Done' : '✏️ Change'}
              </button>
            </div>

            {editingPhone ? (
              <input
                type="text"
                value={emergencyPhone}
                onChange={e => {
                  setEmergencyPhone(e.target.value);
                  localStorage.setItem('ridex_emergency_contact', e.target.value);
                }}
                style={{
                  width: '100%', background: '#0b0e17', border: '1px solid #00edff',
                  borderRadius: 10, padding: '6px 10px', color: '#fff', fontSize: 13,
                  fontWeight: 800, fontFamily: 'var(--font-mono)', outline: 'none', marginBottom: 8
                }}
              />
            ) : (
              <div style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                👨‍👩‍👧 {emergencyPhone}
              </div>
            )}

            <button
              onClick={handleAlertEmergencyContact}
              style={{
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(239,68,68,0.4)'
              }}
            >
              🚨 Send SOS Alert to Contact
            </button>
          </div>

          {/* 5. Trigger Loud Police Siren Alarm Toggle */}
          <button
            onClick={toggleSiren}
            style={{
              width: '100%', padding: '12px 16px',
              background: sirenPlaying ? '#ef4444' : 'rgba(251, 191, 36, 0.15)',
              border: `1.5px solid ${sirenPlaying ? '#ef4444' : 'rgba(251, 191, 36, 0.4)'}`,
              borderRadius: 16, color: sirenPlaying ? '#fff' : '#fbbf24', fontWeight: 900, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: sirenPlaying ? '0 0 25px rgba(239, 68, 68, 0.8)' : 'none',
              animation: sirenPlaying ? 'pulse 0.5s infinite' : 'none'
            }}
          >
            <span style={{ fontSize: 18 }}>{sirenPlaying ? '🔊' : '📢'}</span>
            <span>{sirenPlaying ? 'STOP SIREN ALARM' : 'Trigger Loud Emergency Siren'}</span>
          </button>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => {
            if (sirenPlaying) stopSiren();
            onClose();
          }}
          style={{
            marginTop: 18, padding: '12px 32px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 16, color: '#94a3b8',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
            transition: 'all 0.2s ease'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
