import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignIn, SignUp } from '@clerk/clerk-react';
import '../../passenger.css';

const clerkAppearance = {
  elements: {
    card: { background: 'transparent', boxShadow: 'none', border: 'none' },
    headerTitle: { color: '#ffffff', fontSize: '20px', fontWeight: '800' },
    headerSubtitle: { color: '#cbd5e1', fontSize: '14px' },
    socialButtonsBlockButton: { borderColor: 'rgba(0, 237, 255, 0.4)', color: '#ffffff', background: 'rgba(255, 255, 255, 0.08)' },
    socialButtonsBlockButtonText: { color: '#ffffff', fontWeight: '700' },
    dividerLine: { background: 'rgba(255, 255, 255, 0.2)' },
    dividerText: { color: '#cbd5e1', fontWeight: '700' },
    formFieldLabel: { color: '#ffffff !important', fontWeight: '700', fontSize: '14px' },
    formFieldLabelRow: { color: '#ffffff !important' },
    formFieldInput: { background: '#0f172a', borderColor: 'rgba(0, 237, 255, 0.4)', color: '#ffffff', fontWeight: '600' },
    formButtonPrimary: { background: 'linear-gradient(135deg, #00edff, #3b82f6)', color: '#0f172a', fontWeight: '900', fontSize: '15px' },
    footerActionText: { color: '#cbd5e1' },
    footerActionLink: { color: '#00edff', fontWeight: '700' },
    identityPreviewText: { color: '#ffffff' },
    identityPreviewEditButton: { color: '#00edff' },
    formHeaderTitle: { color: '#ffffff' },
    formHeaderSubtitle: { color: '#cbd5e1' }
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (clerkUser) {
        localStorage.setItem('ridex_user_name', clerkUser.fullName || clerkUser.firstName || 'Saurav Kumar Nayak');
        if (clerkUser.primaryEmailAddress?.emailAddress) {
          localStorage.setItem('ridex_user_email', clerkUser.primaryEmailAddress.emailAddress);
        }
      }
      navigate('/home', { replace: true });
    }
  }, [isLoaded, isSignedIn, clerkUser, navigate]);

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'radial-gradient(circle at 50% 20%, #171b30 0%, #0a0c16 80%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', padding: '24px 16px', position: 'relative', overflowX: 'hidden',
    }}>
      {/* Background ambient glowing orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(0, 237, 255, 0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* ── 3D Uber Glassmorphic Main Card ── */}
      <div style={{
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
        background: 'linear-gradient(180deg, rgba(22, 27, 44, 0.92) 0%, rgba(11, 14, 24, 0.96) 100%)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        border: '1.5px solid rgba(0, 237, 255, 0.25)',
        borderRadius: 36, padding: '36px 28px',
        boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 50px rgba(0, 237, 255, 0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 22,
            background: 'linear-gradient(135deg, #00edff, #3b82f6, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, margin: '0 auto 12px', border: '3px solid #00edff',
            boxShadow: '0 0 30px rgba(0, 237, 255, 0.6)',
          }}>
            🚕
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px' }}>RideX</div>
          <div style={{ fontSize: 12, color: '#00edff', marginTop: 4, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
            PREMIUM RIDE SUITE
          </div>
        </div>

        {/* Sign In / Sign Up Toggle */}
        <div style={{
          display: 'flex', width: '100%', background: 'rgba(9, 10, 16, 0.8)',
          borderRadius: 999, padding: 4, marginBottom: 20,
          border: '1.5px solid rgba(0, 237, 255, 0.2)',
        }}>
          <button onClick={() => setTab('login')}
            style={{
              flex: 1, padding: '10px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.3s ease',
              background: tab === 'login' ? 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)' : 'transparent',
              color: tab === 'login' ? '#0f172a' : 'rgba(255,255,255,0.6)',
              boxShadow: tab === 'login' ? '0 4px 16px rgba(0, 237, 255, 0.4)' : 'none',
            }}>
            Sign In
          </button>
          <button onClick={() => setTab('signup')}
            style={{
              flex: 1, padding: '10px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.3s ease',
              background: tab === 'signup' ? 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)' : 'transparent',
              color: tab === 'signup' ? '#0f172a' : 'rgba(255,255,255,0.6)',
              boxShadow: tab === 'signup' ? '0 4px 16px rgba(0, 237, 255, 0.4)' : 'none',
            }}>
            Sign Up
          </button>
        </div>

        {/* ── Official Clerk Component Container ── */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {tab === 'login' ? (
            <SignIn
              routing="virtual"
              redirectUrl="/home"
              appearance={clerkAppearance}
            />
          ) : (
            <SignUp
              routing="virtual"
              redirectUrl="/home"
              appearance={clerkAppearance}
            />
          )}
        </div>
      </div>
    </div>
  );
}
