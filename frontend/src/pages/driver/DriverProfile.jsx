import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import API_BASE from '../../config';
import {
  User,
  Phone,
  Mail,
  Car,
  ShieldCheck,
  Star,
  Award,
  CheckCircle2,
  RefreshCw,
  Save,
  Sparkles,
  Check
} from 'lucide-react';

export default function DriverProfile() {
  const { driver, fetchDriverStatus } = useOutletContext() || {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('Go Sedan');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driversList, setDriversList] = useState([]);
  const [switchingId, setSwitchingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (driver) {
      setName(driver.name || '');
      setPhone(driver.phone || '');
      setEmail(driver.email || '');
      setVehicleType(driver.driverDetails?.vehicleType || 'Go Sedan');
      setVehicleNumber(driver.driverDetails?.vehicleNumber || 'DL 01 AB 1234');
    }
    fetchDriversList();
  }, [driver]);

  const fetchDriversList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/driver/list`);
      const data = await res.json();
      if (data.success) {
        setDriversList(data.drivers || []);
      }
    } catch (err) {}
  };

  const handleSwitchDriver = async (d) => {
    setSwitchingId(d._id);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/driver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: d.phone, driverId: d._id })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('ridex_driver_token', data.token);
        setMsg(`🎉 Switched active driver profile to ${d.name}!`);
        if (fetchDriverStatus) fetchDriverStatus(data.token);
        fetchDriversList();
      }
    } catch (err) {
      setMsg('⚠️ Failed to switch driver account.');
    } finally {
      setSwitchingId(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ridex_driver_token') || driver?._id;
    if (!token) {
      setMsg('⚠️ Driver session token not found. Please select an active driver account above.');
      return;
    }

    setSaving(true);
    setMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/driver/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, email, vehicleType, vehicleNumber })
      });

      const data = await res.json();
      if (data.success) {
        setMsg('🎉 Profile & vehicle details updated successfully!');
        if (fetchDriverStatus) fetchDriverStatus(token);
        fetchDriversList();
      } else {
        setMsg(`⚠️ ${data.message || 'Failed to update profile.'}`);
      }
    } catch (err) {
      setMsg('⚠️ Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 1040, paddingBottom: 40 }}>
      {/* 3D Partner Profile Hero Banner */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(16, 34, 61, 0.95) 0%, rgba(10, 20, 38, 0.98) 100%)',
        border: '1.5px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 16px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Elevated 3D Profile Avatar */}
          <div style={{
            position: 'relative',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            border: '3px solid #60a5fa',
            boxShadow: '0 0 24px rgba(59, 130, 246, 0.5), 0 8px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34
          }}>
            👨🏽‍✈️
            <div style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#10b981',
              border: '2.5px solid #0a1426',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Check size={12} strokeWidth={4} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.3px' }}>
                {driver?.name || 'Suresh Yadav'}
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: 11,
                fontWeight: 900,
                padding: '3px 10px',
                borderRadius: 999,
                letterSpacing: '0.05em'
              }}>
                OPERATIONAL PARTNER
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 800 }}>
                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                {driver?.driverDetails?.rating || '4.7'} Rating
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                License: {driver?.driverDetails?.vehicleNumber || 'DL 1R 8821'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={14} /> VERIFIED ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* 3D Metric Badges */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: 'rgba(14, 26, 46, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '10px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>TOTAL TRIPS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>4,120</div>
          </div>
          <div style={{
            background: 'rgba(14, 26, 46, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '10px 16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>ACCEPTANCE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', marginTop: 2 }}>98.4%</div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 16,
          background: msg.includes('🎉') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1.5px solid ${msg.includes('🎉') ? '#10b981' : '#ef4444'}`,
          color: msg.includes('🎉') ? '#34d399' : '#ef4444',
          fontWeight: 800,
          fontSize: 13,
          marginBottom: 20,
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {msg}
        </div>
      )}

      {/* Registered Driver Partner Accounts Switcher */}
      {driversList.length > 0 && (
        <div style={{
          background: 'linear-gradient(180deg, #10223d 0%, #0c1a2e 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.10)',
          borderRadius: 24,
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 16px 36px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#38bdf8" />
                <span>Registered Driver Partner Accounts</span>
              </h3>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Click any partner card to switch active operating profile</div>
            </div>
            <span style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 999 }}>
              {driversList.length} Accounts Registered
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {driversList.map((d) => {
              const isActive = driver && (driver._id === d._id || driver.phone === d.phone);
              return (
                <div
                  key={d._id}
                  style={{
                    background: isActive ? 'linear-gradient(145deg, rgba(37, 99, 235, 0.25), rgba(16, 34, 61, 0.95))' : 'rgba(14, 26, 46, 0.7)',
                    border: `1.5px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 20,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    boxShadow: isActive ? '0 8px 24px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: isActive ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      border: isActive ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                      boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none'
                    }}>
                      👨🏽‍✈️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, marginTop: 1 }}>📞 {d.phone}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(7, 16, 30, 0.6)', padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>🚙 {d.driverDetails?.vehicleType || 'Go Sedan'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f8fafc' }}>
                      {d.driverDetails?.vehicleNumber || 'DL 01 AB 1234'}
                    </span>
                  </div>

                  {isActive ? (
                    <div style={{ background: '#10b981', color: '#ffffff', fontWeight: 900, fontSize: 12, padding: '9px', borderRadius: 12, textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                      ✓ Active Profile
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchDriver(d)}
                      disabled={switchingId === d._id}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      {switchingId === d._id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Switching...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>Switch Profile</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Profile Edit Form */}
      <form onSubmit={handleSave} style={{
        background: 'linear-gradient(180deg, #10223d 0%, #0c1a2e 100%)',
        border: '1.5px solid rgba(255, 255, 255, 0.10)',
        borderRadius: 24,
        padding: 32,
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 20 }}>
          UPDATE DRIVER & VEHICLE DETAILS
        </div>

        {/* Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <User size={14} color="#38bdf8" /> DRIVER FULL NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(7, 16, 30, 0.8)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Phone size={14} color="#38bdf8" /> PHONE NUMBER
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(7, 16, 30, 0.8)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Car size={14} color="#38bdf8" /> VEHICLE CATEGORY
            </label>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(7, 16, 30, 0.9)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="Go Sedan">Go Sedan</option>
              <option value="Go Mini">Go Mini</option>
              <option value="Premier Sedan">Premier Sedan</option>
              <option value="Uber XL">Uber XL</option>
              <option value="Auto">Auto</option>
              <option value="Bike">Bike</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Award size={14} color="#38bdf8" /> VEHICLE LICENSE PLATE
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(7, 16, 30, 0.8)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* 3D Primary Action Button */}
        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            height: 54,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: 16,
            color: '#ffffff',
            fontWeight: 900,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.25s ease'
          }}
        >
          {saving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save Profile & Vehicle Updates</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

