import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../../components/passenger/BottomNav.jsx';
import { getCurrentFestiveData } from '../../utils/festiveOffers.js';
import '../../passenger.css';

export default function OffersPage() {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState('');
  const [appliedNotice, setAppliedNotice] = useState('');
  const { festivalName, festiveOffers } = getCurrentFestiveData();

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleApplyAndBook = (code) => {
    sessionStorage.setItem('ridex_applied_promo', code);
    setAppliedNotice(code);
    setTimeout(() => {
      navigate('/book');
    }, 600);
  };

  return (
    <div style={{
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      background: '#090a10',
      minHeight: '100vh',
      maxWidth: 480,
      margin: '0 auto',
      color: '#f8fafc',
      paddingBottom: 90,
      position: 'relative'
    }}>

      {/* ── App Top Header ── */}
      <div style={{
        padding: '50px 20px 20px',
        background: 'linear-gradient(145deg, #0d111d 0%, #161b2e 50%, #090b14 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 237, 255, 0.2)',
        boxShadow: '0 15px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(19, 24, 36, 0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>Offers & Coupons</div>
            <div style={{ fontSize: 11, color: '#fbbf24', fontFamily: 'monospace', fontWeight: 800 }}>
              Festive Deals & Savings
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/book')}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #00edff, #3b82f6)',
            border: 'none',
            borderRadius: 999,
            color: '#0f172a',
            fontSize: 12,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 237, 255, 0.3)'
          }}
        >
          🚀 Book Ride
        </button>
      </div>

      {/* Applied Toast Banner */}
      {appliedNotice && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#ffffff',
          padding: '12px 20px',
          margin: '16px 20px 0',
          borderRadius: 16,
          fontWeight: 900,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span>🎉 Code <strong>{appliedNotice}</strong> applied! Redirecting to booking...</span>
          <span>⚡</span>
        </div>
      )}

      {/* Festive Banner Card */}
      <div style={{ padding: 20 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderRadius: 24,
          border: '1.5px solid rgba(251, 191, 36, 0.4)',
          padding: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -20, right: -20,
            width: 100, height: 100,
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            fontSize: 11,
            fontWeight: 900,
            color: '#fbbf24',
            letterSpacing: '0.12em',
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}>
            FESTIVE DISCOUNTS ACTIVE
          </div>

          <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', marginTop: 6, lineHeight: 1.3 }}>
            {festivalName}
          </div>

          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 600 }}>
            Exclusive discounts for all rides in Bhubaneswar & Odisha. Tap any coupon to copy or auto-apply!
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 900,
          color: '#00edff',
          letterSpacing: '0.05em',
          fontFamily: 'monospace',
          textTransform: 'uppercase'
        }}>
          AVAILABLE PROMO CODES ({festiveOffers.length})
        </div>

        {festiveOffers.map((o, index) => (
          <div
            key={index}
            style={{
              background: 'linear-gradient(145deg, rgba(19, 24, 39, 0.95), rgba(11, 14, 24, 0.98))',
              borderRadius: 20,
              border: `1.5px solid ${o.color}`,
              padding: 18,
              boxShadow: `0 10px 25px rgba(0,0,0,0.4), 0 0 15px ${o.color}22`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Corner Decor Pill */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: o.color,
              color: '#0f172a',
              fontSize: 10,
              fontWeight: 900,
              padding: '4px 12px',
              borderRadius: '0 18px 0 12px',
              fontFamily: 'monospace'
            }}>
              {o.expiry}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 70 }}>
              <div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: o.color,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em'
                }}>
                  {o.code}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                  {o.disc}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 12,
              color: '#94a3b8',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Min Booking: <strong style={{ color: '#f8fafc' }}>{o.min}</strong></span>
              <span>Applicable on all vehicles</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
              <button
                onClick={() => handleCopyCode(o.code)}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: `1.5px solid ${copiedCode === o.code ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 14,
                  color: copiedCode === o.code ? '#10b981' : '#f8fafc',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedCode === o.code ? '✓ Copied Code' : '📋 Copy Code'}
              </button>

              <button
                onClick={() => handleApplyAndBook(o.code)}
                style={{
                  flex: 1.3,
                  padding: '11px',
                  background: `linear-gradient(135deg, ${o.color}, #3b82f6)`,
                  border: 'none',
                  borderRadius: 14,
                  color: '#0f172a',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px ${o.color}55`,
                  transition: 'all 0.2s ease'
                }}
              >
                ⚡ Apply & Book Ride
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Wallet Cashback Rewards */}
      <div style={{ padding: 20 }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(11, 14, 24, 0.95))',
          borderRadius: 20,
          border: '1.5px solid rgba(52, 211, 153, 0.3)',
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'rgba(52, 211, 153, 0.2)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            👛
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#34d399' }}>
              RideX Wallet Cashback
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Get ₹15 guaranteed cashback on every 3rd ride paid via RideX Wallet or UPI.
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
