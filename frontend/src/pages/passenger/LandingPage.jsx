import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import '../../passenger.css';

const testimonials = [
  { name: 'Priya Sharma', text: 'Booked a cab in under 30 seconds. The driver arrived in 4 minutes. Absolutely love the experience!', rating: 5, avatar: '👩🏽' },
  { name: 'Arjun Mehta',  text: 'The live tracking feature gives me peace of mind. Way better than other apps — cleaner UI, faster booking.', rating: 5, avatar: '👨🏻' },
  { name: 'Kavya Nair',   text: 'RideX saved my day on multiple occasions. Affordable fares, safe rides, and excellent drivers.', rating: 5, avatar: '👩🏽‍💼' },
  { name: 'Rohit Singh',  text: 'The app is incredibly smooth and beautiful. Booking a premium SUV was just 3 taps!', rating: 4, avatar: '👦🏽' },
];

const features = [
  { icon: '⚡', title: 'Instant Booking', desc: 'Book a ride in under 30 seconds with our zero-friction flow.' },
  { icon: '📍', title: 'Live Tracking',   desc: 'Watch your driver approach on a real-time map with GPS accuracy.' },
  { icon: '🔒', title: 'Safe Rides',      desc: 'Driver background checks, SOS button, and trip sharing built-in.' },
  { icon: '💰', title: 'Best Fares',      desc: 'Transparent pricing, promo codes, and multi-payment support.' },
  { icon: '🚗', title: '7 Ride Types',    desc: 'Bike, Auto, Mini, Sedan, SUV, Electric — you choose.' },
  { icon: '⭐', title: 'Top Drivers',     desc: 'Only 4.5+ rated drivers on our platform, always.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('ridex-theme') || 'dark');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('ridex-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '0 24px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6c63ff,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🚗</div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>RideX</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 999, padding: '7px 14px', color: '#fff',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg,#6c63ff,#a855f7)',
              border: 'none', borderRadius: 999, padding: '9px 22px',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(108,99,255,0.45)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Sign In
          </button>
          <button onClick={() => navigate('/driver/login')}
            title="Driver Partner Portal"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, rgba(0, 237, 255, 0.15), rgba(59, 130, 246, 0.2))',
              border: '1.5px solid rgba(0, 237, 255, 0.45)',
              borderRadius: 999, padding: '8px 18px', color: '#00edff', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s ease',
              boxShadow: '0 4px 14px rgba(0, 237, 255, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <span>🏎️</span>
            <span>Driver</span>
          </button>
          <button onClick={() => navigate('/admin')}
            title="Admin Dashboard Portal"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.2))',
              border: '1.5px solid rgba(255,215,0,0.45)',
              borderRadius: 999, padding: '8px 18px', color: '#ffd700', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s ease',
              boxShadow: '0 4px 14px rgba(255,215,0,0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <span>👑</span>
            <span>Admin</span>
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Glowing orbs */}
        {[
          { top: '10%', left: '10%', size: 350, color: 'rgba(108,99,255,0.25)', delay: '0s' },
          { top: '60%', right: '5%', left: 'auto', size: 280, color: 'rgba(168,85,247,0.20)', delay: '1s' },
          { bottom: '10%', left: '30%', size: 200, color: 'rgba(34,211,238,0.15)', delay: '2s' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
            width: orb.size, height: orb.size,
            borderRadius: '50%', background: orb.color, filter: 'blur(80px)',
            animation: `float 6s ease-in-out ${orb.delay} infinite`,
          }} />
        ))}

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(108,99,255,0.18)', border: '1px solid rgba(108,99,255,0.35)',
          borderRadius: 999, padding: '8px 20px', marginBottom: 24,
          animation: 'fadeInDown 0.6s ease forwards',
        }}>
          <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em' }}>
            🎉 LAUNCHING IN YOUR CITY
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800,
          color: '#fff', lineHeight: 1.1, marginBottom: 24,
          animation: 'fadeInUp 0.7s ease 0.1s both',
          maxWidth: 800,
        }}>
          Your Ride,<br />
          <span style={{
            background: 'linear-gradient(135deg,#6c63ff,#a855f7,#22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            On Demand.
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.65)',
          maxWidth: 540, marginBottom: 40, lineHeight: 1.7,
          animation: 'fadeInUp 0.7s ease 0.2s both',
        }}>
          Book a ride in seconds. Track in real-time. Arrive safely.<br />
          RideX — premium rides, effortlessly.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
          animation: 'fadeInUp 0.7s ease 0.3s both',
        }}>
          <button onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg,#6c63ff,#a855f7)',
              border: 'none', borderRadius: 999, padding: '16px 36px',
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(108,99,255,0.5)',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            🚀 Book Your First Ride
          </button>
          <button onClick={() => navigate('/driver/login')}
            style={{
              background: 'linear-gradient(135deg, rgba(0,237,255,0.18), rgba(59,130,246,0.22))',
              border: '1.5px solid #00edff',
              borderRadius: 999, padding: '16px 32px',
              color: '#00edff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 237, 255, 0.22)',
              transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', gap: 8
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            🚗 Drive with RideX →
          </button>
        </div>

        {/* Car animation */}
        <div style={{
          marginTop: 60, fontSize: 80,
          animation: 'float 3s ease-in-out infinite',
          filter: 'drop-shadow(0 20px 40px rgba(108,99,255,0.5))',
        }}>🚗</div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 40, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeInUp 0.7s ease 0.5s both',
        }}>
          {[['2M+','Happy Passengers'],['50K+','Daily Rides'],['4.9★','Average Rating'],['98%','On-time Arrival']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Map Preview ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', marginBottom: 12 }}>LIVE COVERAGE</p>
          <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
            Available Across India
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 17 }}>
            Real-time driver tracking powered by Google Maps
          </p>
          <div style={{
            borderRadius: 28, overflow: 'hidden', boxShadow: '0 24px 80px rgba(108,99,255,0.2)',
            border: '1px solid var(--border-color)', position: 'relative', height: 460
          }}>
            <GoogleLiveLocationMap height="460px" showSearchInputs={false} showSummaryBar={false} showAddressCard={false} />
            {/* Overlay bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 60%, transparent 100%)',
              padding: '30px 24px 20px',
              display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
              zIndex: 450,
            }}>
              {['🟢 Mumbai', '🟢 Delhi', '🟢 Bangalore', '🟢 Hyderabad', '🟢 Chennai'].map(city => (
                <span key={city} style={{ color: '#fff', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 16px' }}>{city}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', marginBottom: 12 }}>WHY RIDEX</p>
          <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 48 }}>
            Everything You Need, Nothing You Don't
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{
                animationDelay: `${i * 100}ms`,
                background: 'var(--bg-card)', borderRadius: 24,
                padding: 32, border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease', cursor: 'default',
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', marginBottom: 12 }}>TESTIMONIALS</p>
          <h2 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 48 }}>
            Loved by Millions
          </h2>
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
            {testimonials.map((t, i) => (
              <div key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  flex: '0 0 280px',
                  background: 'var(--bg-card)',
                  border: `2px solid ${i === activeTestimonial ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  borderRadius: 24, padding: 28, textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: i === activeTestimonial ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: i === activeTestimonial ? '0 8px 32px rgba(108,99,255,0.2)' : 'none',
                }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{t.avatar}</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                  "{t.text}"
                </p>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{t.name}</div>
                <div style={{ color: '#f59e0b', fontSize: 13, marginTop: 4 }}>{'★'.repeat(t.rating)}</div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                style={{
                  width: i === activeTestimonial ? 24 : 8, height: 8,
                  borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: i === activeTestimonial ? 'var(--brand-primary)' : 'var(--border-color)',
                  transition: 'all 0.3s ease',
                }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>📱</div>
          <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            Download the App
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, marginBottom: 40 }}>
            Get RideX on iOS and Android. Book rides, track drivers, and manage your account on the go.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '🍎', label: 'App Store', sub: 'Download on the' },
              { icon: '🤖', label: 'Google Play', sub: 'Get it on' },
            ].map(btn => (
              <div key={btn.label} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 16, padding: '14px 28px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <span style={{ fontSize: 32 }}>{btn.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{btn.sub}</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{btn.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: '#0a0a0f', padding: '32px 24px',
        textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ marginBottom: 12, fontSize: 20, fontWeight: 800, color: '#fff' }}>RideX</div>
        <p>© 2026 RideX Technologies Pvt. Ltd. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {['Privacy Policy','Terms of Service','Safety','Help Center'].map(l => (
            <span key={l} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#6c63ff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
