import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'home',    icon: '🏠', label: 'Home',    path: '/home' },
  { id: 'history', icon: '🕐', label: 'Rides',   path: '/history' },
  { id: 'offers',  icon: '🎁', label: 'Offers',  path: '/offers' },
  { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveId = () => {
    if (active) return active;
    if (location.pathname === '/home') return 'home';
    if (location.pathname === '/history' || location.pathname === '/rides') return 'history';
    if (location.pathname === '/offers') return 'offers';
    if (location.pathname === '/profile') return 'profile';
    return 'home';
  };

  const currentActive = getActiveId();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      height: 70,
      background: 'rgba(11, 14, 24, 0.92)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1.5px solid rgba(0, 237, 255, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 237, 255, 0.15)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxSizing: 'border-box'
    }}>
      {navItems.map(item => {
        const isActive = currentActive === item.id;
        return (
          <button key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '8px 16px', cursor: 'pointer',
              background: isActive ? 'rgba(0, 237, 255, 0.16)' : 'transparent',
              border: isActive ? '1px solid rgba(0, 237, 255, 0.4)' : '1px solid transparent',
              borderRadius: 18, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              transform: isActive ? 'translateY(-4px)' : 'none',
              boxShadow: isActive ? '0 6px 20px rgba(0, 237, 255, 0.3)' : 'none',
            }}>
            <span style={{
              fontSize: 22,
              filter: isActive ? 'drop-shadow(0 0 10px rgba(0,237,255,0.8))' : 'none',
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
              display: 'block',
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: 11, fontWeight: isActive ? 900 : 600,
              color: isActive ? '#00edff' : '#94a3b8',
              transition: 'all 0.2s ease',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
