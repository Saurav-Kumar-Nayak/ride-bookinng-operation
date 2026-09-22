import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../config';
import '../../passenger.css';

export default function DriverLoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [driverList, setDriverList] = useState([]);

  useEffect(() => {
    // Fetch available driver list for quick selection in demo mode
    fetch(`${API_BASE}/api/driver/list`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.drivers) {
          setDriverList(data.drivers);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e, selectDriverId = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = selectDriverId ? { driverId: selectDriverId } : { phone };
      const res = await fetch(`${API_BASE}/api/driver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('ridex_driver_token', data.token);
        localStorage.setItem('ridex_driver_user', JSON.stringify(data.driver));
        localStorage.setItem('ridex_user_role', 'driver');
        navigate('/driver/dashboard', { replace: true });
      } else {
        setError(data.message || 'Driver login failed.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #0f172a 0%, #090a10 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'linear-gradient(180deg, #131824 0%, #090a10 100%)',
        border: '1.5px solid rgba(0, 237, 255, 0.3)',
        borderRadius: 32,
        padding: '40px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0, 237, 255, 0.15)',
        textAlign: 'center'
      }}>
        {/* Header Branding */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #00edff, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto 20px',
          boxShadow: '0 0 25px rgba(0, 237, 255, 0.5)'
        }}>
          🏎️
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', marginBottom: 6 }}>
          RideX Driver Portal
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>
          Log in to manage ride requests, track live trips & view earnings
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 14,
            padding: '12px',
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 20
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#00edff', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              DRIVER PHONE NUMBER / ID
            </label>
            <input
              type="text"
              placeholder="e.g. 9811122233"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1.5px solid rgba(0, 237, 255, 0.3)',
                borderRadius: 16,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: 16,
              color: '#0f172a',
              fontWeight: 900,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0, 237, 255, 0.4)',
              transition: 'transform 0.2s'
            }}
          >
            {loading ? '⏳ Logging in...' : '🚀 Sign In as Driver'}
          </button>
        </form>

        {/* Quick Driver Account Selector for Demo */}
        {driverList.length > 0 && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 14 }}>
              QUICK DEMO DRIVER ACCOUNTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {driverList.slice(0, 3).map((d) => (
                <button
                  key={d._id}
                  onClick={(e) => handleLogin(e, d._id)}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 14,
                    color: '#f8fafc',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>👨🏽‍✈️</span>
                    <div>
                      <div style={{ fontWeight: 800 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: '#00edff' }}>{d.driverDetails?.vehicleType || 'Go Sedan'} ({d.driverDetails?.vehicleNumber || 'DL 01 AB 1234'})</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 800 }}>Select →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
