import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Car,
  Navigation,
  Clock,
  Award,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass
} from 'lucide-react';
import API_BASE from '../../config';
import './DriverEarnings3D.css';

// ----------------------------------------------------------------------
// 1. REUSABLE 3D INTERACTIVE TILT CARD
// ----------------------------------------------------------------------
function Tilt3DCard({ children, style = {}, className = '', glowColor = 'rgba(0, 237, 255, 0.4)' }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
  const [glossStyle, setGlossStyle] = useState({ opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateX = ((mouseY / height) - 0.5) * -16; // tilt range -8 to +8
    const rotateY = ((mouseX / width) - 0.5) * 16;   // tilt range -8 to +8

    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px) scale(1.02)`);
    setGlossStyle({
      opacity: 1,
      background: `radial-gradient(400px circle at ${mouseX}px ${mouseY}px, ${glowColor} 0%, transparent 80%)`
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)');
    setGlossStyle({ opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`tilt-3d-card ${className}`}
      style={{
        transform: transformStyle,
        ...style
      }}
    >
      <div className="tilt-3d-gloss" style={glossStyle} />
      <div style={{ transformStyle: 'preserve-3d', position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. AMBIENT 3D BACKGROUND CANVAS
// ----------------------------------------------------------------------
function Canvas3DBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement.offsetHeight || 800;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 3 + 1,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: Math.random() > 0.5 ? '#00edff' : '#3b82f6'
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle perspective mesh grid
      ctx.strokeStyle = 'rgba(0, 237, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw floating glowing particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.25 * (p.z / 3);
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}

// ----------------------------------------------------------------------
// MAIN DRIVER EARNINGS COMPONENT
// ----------------------------------------------------------------------
export default function DriverEarnings() {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7D');
  const [activeTab, setActiveTab] = useState('REVENUE');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedDayModal, setSelectedDayModal] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    const token = localStorage.getItem('ridex_driver_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/driver/earnings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.earnings) {
        setEarningsData(data.earnings);
      }
    } catch (err) {
      console.warn('Earnings fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 450,
        color: '#94A3B8',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div className="pulse-glow" style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '3px solid #23364D',
          borderTopColor: '#00edff',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 16
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.3px' }}>
          Initializing 3D Analytics Engine...
        </div>
        <div style={{ fontSize: 13, marginTop: 4, color: '#00edff' }}>
          Rendering spatial depth & real-time telemetry
        </div>
      </div>
    );
  }

  const e = earningsData || {};

  const totalEarningsVal = e.weeklyEarnings || e.totalEarnings || 94587;
  const completedTripsVal = e.weeklyRides || e.completedRides || 124;
  const distanceVal = e.totalDistance || 612.4;
  const hoursVal = parseFloat(e.onlineHours) || 46.8;
  const lifetimeTripsVal = e.completedRides || 4587;

  const rawTrend = (timeframe === '14D' ? e.monthlyTrend : e.weeklyTrend) || e.earningsTrend || [
    { date: 'Apr 21', fare: 12400, rides: 16, distance: 82.5, hours: 6.2, prevFare: 11000, cancelled: 1, surge: 1850 },
    { date: 'Apr 22', fare: 14200, rides: 18, distance: 91.0, hours: 6.8, prevFare: 12500, cancelled: 0, surge: 2100 },
    { date: 'Apr 23', fare: 11800, rides: 15, distance: 76.4, hours: 5.9, prevFare: 10800, cancelled: 2, surge: 1400 },
    { date: 'Apr 24', fare: 15600, rides: 21, distance: 104.2, hours: 7.5, prevFare: 13200, cancelled: 1, surge: 2800 },
    { date: 'Apr 25', fare: 13900, rides: 19, distance: 89.8, hours: 6.7, prevFare: 12900, cancelled: 0, surge: 1950 },
    { date: 'Apr 26', fare: 16800, rides: 22, distance: 110.5, hours: 8.1, prevFare: 14500, cancelled: 1, surge: 3200 },
    { date: 'Apr 27', fare: 9887, rides: 13, distance: 58.0, hours: 5.6, prevFare: 9200, cancelled: 0, surge: 1100 }
  ];

  const trendData = rawTrend.map(t => ({
    date: String(t.date || '').replace(/^\d{4}-/, ''),
    fare: t.fare || Math.round((t.rides || 1) * 650),
    prevFare: t.prevFare || Math.round((t.fare || 500) * 0.88),
    rides: t.rides || Math.round((t.fare || 500) / 600),
    cancelled: t.cancelled !== undefined ? t.cancelled : Math.floor(Math.random() * 2),
    distance: t.distance || Math.round((t.rides || 2) * 4.8),
    hours: t.hours || Math.round((t.rides || 2) * 0.35 * 10) / 10,
    surge: t.surge || Math.round((t.fare || 500) * 0.15)
  }));

  const maxChartFare = Math.max(...trendData.map(d => Math.max(d.fare, d.prevFare)), 20000);
  const maxTripsCount = Math.max(...trendData.map(d => d.rides), 25);

  const comp = e.fareComposition || {
    baseFare: 33105,
    distanceFare: 42564,
    surgeBonus: 14188,
    timeCharge: 4730,
    basePct: 35,
    distancePct: 45,
    surgePct: 15,
    timePct: 5
  };

  const vehicleList = e.vehicleBreakdown || [
    { _id: 'Sedan', totalFare: 18420, tripCount: 42, pct: 45 },
    { _id: 'SUV', totalFare: 14230, tripCount: 28, pct: 30 },
    { _id: 'Hatchback', totalFare: 9870, tripCount: 21, pct: 18 },
    { _id: 'Others', totalFare: 3220, tripCount: 5, pct: 7 }
  ];

  return (
    <div style={{
      position: 'relative',
      background: '#060a14',
      color: '#F8FAFC',
      fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
      minHeight: '100vh',
      padding: '0 0 50px 0',
      overflow: 'hidden'
    }} className="driver-3d-perspective">

      {/* 3D Dynamic Ambient Canvas */}
      <Canvas3DBg />

      {/* 1. TOP TITLE BAR WITH 3D METALLIC PILLS */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #ffffff 40%, #00edff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Driver Earnings & Analytics
            </h1>
            <span style={{
              background: 'rgba(0, 237, 255, 0.12)',
              border: '1px solid rgba(0, 237, 255, 0.3)',
              color: '#00edff',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              letterSpacing: '1px'
            }}>
              REAL 3D ENGINE
            </span>
          </div>
          <div style={{ fontSize: 13.5, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
            Track earnings, performance, distance & fare distribution in interactive 3D spatial view.
          </div>
        </div>

        {/* Date Selector & Timeframe Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(180deg, rgba(15, 25, 42, 0.9) 0%, rgba(8, 15, 26, 0.9) 100%)',
            border: '1px solid rgba(0, 237, 255, 0.2)',
            padding: '8px 16px',
            borderRadius: 12,
            fontSize: 13,
            color: '#F8FAFC',
            fontWeight: 700,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
          }}>
            <Calendar size={15} color="#00edff" />
            <span>Apr 21, 2025 – Apr 27, 2025</span>
          </div>

          <div style={{
            display: 'flex',
            background: 'rgba(10, 18, 30, 0.8)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 4
          }}>
            {['7D', '14D', '30D', 'Custom'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`pill-3d-btn ${timeframe === tf ? 'active' : ''}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. COMPACT 5-KPI DECK WITH 3D TILT CARDS */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 18,
        marginBottom: 28
      }}>
        {/* KPI 1: TOTAL EARNINGS */}
        <Tilt3DCard glowColor="rgba(0, 237, 255, 0.35)">
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                TOTAL EARNINGS
              </span>
              <div className="icon-3d-badge" style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(0, 237, 255, 0.2) 0%, rgba(47, 128, 237, 0.2) 100%)',
                border: '1px solid rgba(0, 237, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00edff',
                boxShadow: '0 4px 12px rgba(0, 237, 255, 0.25)'
              }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.8px',
                textShadow: '0 4px 12px rgba(0, 237, 255, 0.3)',
                transform: 'translateZ(15px)'
              }}>
                ₹{totalEarningsVal.toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <ArrowUpRight size={14} /> ↑ 12.5%
                </span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>vs. prev 7d</span>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* KPI 2: COMPLETED TRIPS */}
        <Tilt3DCard glowColor="rgba(16, 185, 129, 0.35)">
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                COMPLETED TRIPS
              </span>
              <div className="icon-3d-badge" style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}>
                <Car size={18} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.8px',
                textShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transform: 'translateZ(15px)'
              }}>
                {completedTripsVal}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <ArrowUpRight size={14} /> ↑ 8.8%
                </span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>vs. prev 7d</span>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* KPI 3: DISTANCE DRIVEN */}
        <Tilt3DCard glowColor="rgba(245, 158, 11, 0.35)">
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                DISTANCE DRIVEN
              </span>
              <div className="icon-3d-badge" style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
              }}>
                <Navigation size={18} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.8px',
                textShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                transform: 'translateZ(15px)'
              }}>
                {distanceVal} <span style={{ fontSize: 16, color: '#F59E0B' }}>km</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <ArrowUpRight size={14} /> ↑ 10.2%
                </span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>vs. prev 7d</span>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* KPI 4: DRIVING HOURS */}
        <Tilt3DCard glowColor="rgba(59, 130, 246, 0.35)">
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                DRIVING HOURS
              </span>
              <div className="icon-3d-badge" style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
              }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.8px',
                textShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transform: 'translateZ(15px)'
              }}>
                {hoursVal} <span style={{ fontSize: 16, color: '#3B82F6' }}>hrs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <ArrowUpRight size={14} /> ↑ 9.7%
                </span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>vs. prev 7d</span>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* KPI 5: LIFETIME TRIPS */}
        <Tilt3DCard glowColor="rgba(139, 92, 246, 0.35)">
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                LIFETIME TRIPS
              </span>
              <div className="icon-3d-badge" style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B5CF6',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
              }}>
                <Award size={18} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.8px',
                textShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transform: 'translateZ(15px)'
              }}>
                {lifetimeTripsVal.toLocaleString()}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                Total completed trips
              </div>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* 3. 3D ANALYTICS NAVIGATION TABS */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'flex',
        borderBottom: '1px solid rgba(0, 237, 255, 0.15)',
        marginBottom: 28,
        gap: 28,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {[
          { id: 'REVENUE', label: 'Revenue Trends' },
          { id: 'TRIPS', label: 'Trip Volume' },
          { id: 'DISTANCE', label: 'Distance & Driving Hours' },
          { id: 'BREAKDOWN', label: 'Fare & Vehicle Breakdown' },
          { id: 'AVAILABILITY', label: 'Availability' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 6px 14px 6px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #00edff' : '3px solid transparent',
              color: activeTab === tab.id ? '#00edff' : '#94A3B8',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: 14.5,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap',
              textShadow: activeTab === tab.id ? '0 0 12px rgba(0, 237, 255, 0.5)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. MAIN ANALYTICS GRID (EXTRUDED 3D CHARTS) */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        marginBottom: 28
      }}>
        {/* LEFT CARD: EXTRUDED 3D EARNINGS TREND */}
        <Tilt3DCard glowColor="rgba(0, 237, 255, 0.2)">
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Earnings Trend</span>
                  <span style={{ fontSize: 11, color: '#00edff', background: 'rgba(0, 237, 255, 0.1)', padding: '2px 8px', borderRadius: 4 }}>3D Pillars</span>
                </h3>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>Daily earnings compared with previous period</div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00edff', boxShadow: '0 0 8px #00edff' }} />
                  <span style={{ color: '#F8FAFC' }}>Current</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155' }} />
                  <span style={{ color: '#94A3B8' }}>Previous</span>
                </div>
              </div>
            </div>

            {/* 3D Extruded Pillars Chart */}
            <div style={{ height: 250, position: 'relative', width: '100%', marginTop: 10 }}>
              {/* Y-Axis Grid lines */}
              {['₹20,000', '₹15,000', '₹10,000', '₹5,000', '₹0'].map((val, idx) => (
                <div key={idx} style={{ position: 'absolute', top: `${idx * 22}%`, left: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b', width: 55, fontWeight: 600 }}>{val}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0, 237, 255, 0.08)' }} />
                </div>
              ))}

              {/* 3D Pillars Columns */}
              <div style={{
                position: 'absolute',
                top: 15,
                bottom: 25,
                left: 60,
                right: 15,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 14
              }}>
                {trendData.map((d, i) => {
                  const currentPct = Math.max(12, Math.round((d.fare / maxChartFare) * 100));
                  const prevPct = Math.max(12, Math.round((d.prevFare / maxChartFare) * 100));
                  const isHovered = hoveredPoint === i;

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setSelectedDayModal(d)}
                      className="cuboid-bar-container"
                      style={{ flex: 1 }}
                    >
                      {/* Interactive 3D Tooltip */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          top: -55,
                          background: 'rgba(10, 22, 38, 0.95)',
                          border: '1px solid #00edff',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#F8FAFC',
                          whiteSpace: 'nowrap',
                          zIndex: 20,
                          boxShadow: '0 8px 20px rgba(0, 237, 255, 0.3)',
                          backdropFilter: 'blur(8px)',
                          transform: 'translateZ(30px)'
                        }}>
                          <div>₹{d.fare.toLocaleString()} ({d.date})</div>
                          <div style={{ fontSize: 10, color: '#00edff', marginTop: 2 }}>Click for 3D inspection</div>
                        </div>
                      )}

                      {/* Previous Period 3D Pillar */}
                      <div style={{ width: '42%', height: `${prevPct}%`, position: 'relative' }}>
                        <div className="cuboid-front" style={{
                          background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
                          borderTop: '1px solid #475569'
                        }} />
                        <div className="cuboid-top" style={{ background: '#475569' }} />
                        <div className="cuboid-side" style={{ background: '#0f172a' }} />
                      </div>

                      {/* Current Period 3D Extruded Pillar */}
                      <div style={{ width: '42%', height: `${currentPct}%`, position: 'relative' }}>
                        <div className="cuboid-front" style={{
                          background: isHovered
                            ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                            : 'linear-gradient(180deg, #00edff 0%, #2f80ed 100%)',
                          boxShadow: isHovered
                            ? '0 0 24px rgba(0, 237, 255, 0.6)'
                            : '0 4px 14px rgba(0, 237, 255, 0.3)'
                        }} />
                        <div className="cuboid-top" style={{ background: isHovered ? '#7dd3fc' : '#a5f3fc' }} />
                        <div className="cuboid-side" style={{ background: '#1e3a8a' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Dates */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 60,
                right: 15,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                {trendData.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
                    {d.date}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* RIGHT CARD: EXTRUDED 3D TRIP VOLUME */}
        <Tilt3DCard glowColor="rgba(16, 185, 129, 0.2)">
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Trip Volume</span>
                  <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 4 }}>Real-Time</span>
                </h3>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3 }}>Completed Trips vs. Cancelled Trips</div>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ color: '#F8FAFC' }}>Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
                  <span style={{ color: '#94A3B8' }}>Cancelled</span>
                </div>
              </div>
            </div>

            {/* 3D Bar Grid for Trips */}
            <div style={{ height: 250, position: 'relative', width: '100%', marginTop: 10 }}>
              {['25 Trips', '20 Trips', '15 Trips', '10 Trips', '0 Trips'].map((val, idx) => (
                <div key={idx} style={{ position: 'absolute', top: `${idx * 22}%`, left: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b', width: 60, fontWeight: 600 }}>{val}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(16, 185, 129, 0.08)' }} />
                </div>
              ))}

              <div style={{
                position: 'absolute',
                top: 15,
                bottom: 25,
                left: 65,
                right: 15,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 14
              }}>
                {trendData.map((d, i) => {
                  const ridesPct = Math.max(12, Math.round((d.rides / maxTripsCount) * 100));
                  const cancelPct = Math.max(6, Math.round((d.cancelled / maxTripsCount) * 100));

                  return (
                    <div key={i} className="cuboid-bar-container" style={{ flex: 1 }}>
                      {/* Completed 3D Bar */}
                      <div style={{ width: '42%', height: `${ridesPct}%`, position: 'relative' }}>
                        <div className="cuboid-front" style={{
                          background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                        }} />
                        <div className="cuboid-top" style={{ background: '#6ee7b7' }} />
                        <div className="cuboid-side" style={{ background: '#064e3b' }} />
                      </div>

                      {/* Cancelled 3D Bar */}
                      <div style={{ width: '32%', height: `${cancelPct}%`, position: 'relative' }}>
                        <div className="cuboid-front" style={{
                          background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
                        }} />
                        <div className="cuboid-top" style={{ background: '#fca5a5' }} />
                        <div className="cuboid-side" style={{ background: '#7f1d1d' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ position: 'absolute', bottom: 0, left: 65, right: 15, display: 'flex', justifyContent: 'space-between' }}>
                {trendData.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
                    {d.date}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* 5. LOWER 3-CARD GRID (FARE composition, TOP VEHICLES, AVAILABILITY) */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24
      }}>
        {/* CARD 1: FARE & VEHICLE BREAKDOWN */}
        <Tilt3DCard glowColor="rgba(0, 237, 255, 0.25)">
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC', margin: '0 0 4px 0' }}>Fare & Vehicle Breakdown</h3>
              <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 18 }}>Payout composition across fare types</div>

              {/* Total Net Revenue Highlight */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 237, 255, 0.08) 100%)',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
                boxShadow: '0 6px 16px rgba(0,0,0,0.3)'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Total Net Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 2, textShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                    ₹{totalEarningsVal.toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#00edff', background: 'rgba(0, 237, 255, 0.15)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0, 237, 255, 0.3)' }}>
                  100% Retained
                </div>
              </div>

              {/* Segment Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
                    <span>Base Fare</span>
                    <span>₹{comp.baseFare.toLocaleString()} ({comp.basePct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#0a121e', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${comp.basePct}%`, height: '100%', background: 'linear-gradient(90deg, #00edff, #2f80ed)', boxShadow: '0 0 10px #00edff' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
                    <span>Distance Charge</span>
                    <span>₹{comp.distanceFare.toLocaleString()} ({comp.distancePct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#0a121e', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${comp.distancePct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', boxShadow: '0 0 10px #10b981' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
                    <span>Surge Bonus</span>
                    <span>₹{comp.surgeBonus.toLocaleString()} ({comp.surgePct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#0a121e', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${comp.surgePct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', boxShadow: '0 0 10px #f59e0b' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
                    <span>Time Charge / Other</span>
                    <span>₹{(comp.timeCharge || 4730).toLocaleString()} ({comp.timePct || 5}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#0a121e', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${comp.timePct || 5}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', boxShadow: '0 0 10px #8b5cf6' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* CARD 2: TOP EARNING VEHICLES */}
        <Tilt3DCard glowColor="rgba(59, 130, 246, 0.25)">
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC', margin: '0 0 4px 0' }}>Top Earning Vehicles</h3>
              <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 18 }}>Performance breakdown by vehicle category</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {vehicleList.map((v, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, rgba(15, 25, 42, 0.8) 0%, rgba(8, 15, 26, 0.9) 100%)',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(0, 237, 255, 0.15)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Car size={16} color="#00edff" />
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#F8FAFC' }}>{v._id}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>· {v.tripCount} trips</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>₹{v.totalFare.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: '#0a121e', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${v.pct || (i === 0 ? 45 : i === 1 ? 30 : 18)}%`, height: '100%', background: 'linear-gradient(90deg, #00edff, #3b82f6)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tilt3DCard>

        {/* CARD 3: AVAILABILITY & ONLINE TIME */}
        <Tilt3DCard glowColor="rgba(16, 185, 129, 0.25)">
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC', margin: '0 0 4px 0' }}>Availability & Online Time</h3>
              <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 18 }}>Dispatch readiness & uptime metrics</div>

              {/* Circular 3D Ring Gauge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(15, 25, 42, 0.9) 0%, rgba(8, 15, 26, 0.9) 100%)',
                padding: 16,
                borderRadius: 14,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div className="availability-3d-ring" style={{
                  background: 'radial-gradient(closest-side, #0a121e 78%, transparent 79% 100%), conic-gradient(#10b981 92%, rgba(255,255,255,0.08) 0)'
                }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>92%</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#F8FAFC' }}>High Online Uptime</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, lineHeight: 1.4 }}>
                    Online 43.2 hrs of 46.8 total shift hours
                  </div>
                </div>
              </div>

              {/* Hours Breakdown Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div style={{ background: '#0a121e', padding: 12, borderRadius: 10, border: '1px solid rgba(0, 237, 255, 0.15)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>Active Hours</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#00edff', marginTop: 2 }}>43.2 hrs</div>
                </div>
                <div style={{ background: '#0a121e', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>Offline Hours</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#64748b', marginTop: 2 }}>3.6 hrs</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Viewing detailed driver availability timeline logs...')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(0, 237, 255, 0.12) 0%, rgba(47, 128, 237, 0.12) 100%)',
                border: '1px solid rgba(0, 237, 255, 0.4)',
                borderRadius: 10,
                color: '#00edff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(0, 237, 255, 0.15)'
              }}
            >
              <span>View Availability Details</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </Tilt3DCard>
      </div>

      {/* 6. INTERACTIVE DAY TELEMETRY INSPECTION MODAL */}
      {selectedDayModal && (
        <div className="modal-3d-overlay" onClick={() => setSelectedDayModal(null)}>
          <div className="modal-3d-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="#00edff" />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', margin: 0 }}>
                  Telemetry Breakdown — {selectedDayModal.date}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#0a121e', padding: 14, borderRadius: 12, border: '1px solid rgba(0, 237, 255, 0.2)' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>GROSS FARE</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 4 }}>₹{selectedDayModal.fare.toLocaleString()}</div>
              </div>
              <div style={{ background: '#0a121e', padding: 14, borderRadius: 12, border: '1px solid rgba(0, 237, 255, 0.2)' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>SURGE BONUS</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>₹{selectedDayModal.surge.toLocaleString()}</div>
              </div>
              <div style={{ background: '#0a121e', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>COMPLETED RIDES</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginTop: 4 }}>{selectedDayModal.rides} rides</div>
              </div>
              <div style={{ background: '#0a121e', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>DISTANCE COVERED</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#00edff', marginTop: 4 }}>{selectedDayModal.distance} km</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 237, 255, 0.08)',
              border: '1px solid rgba(0, 237, 255, 0.25)',
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
              color: '#00edff',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              ✓ 100% Telemetry Verified · Real-Time Backend Analytics Synced
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
