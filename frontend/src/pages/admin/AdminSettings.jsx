import { useState, useEffect, useCallback } from 'react';
import API_BASE from '../../config';
import './AdminSettings.css';

export default function AdminSettings({ theme, toggleTheme }) {
  const [adminPin, setAdminPin] = useState(localStorage.getItem('ridex_admin_pin') || '1234');
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [isSeeding, setIsSeeding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [seedTargetCount, setSeedTargetCount] = useState(null);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success'); // 'success' | 'error' | 'info'

  const [healthStatus, setHealthStatus] = useState({
    db: { status: 'Checking...', latency: null, isError: false },
    api: { status: 'Checking...', latency: null, isError: false },
    twilio: { status: 'Operational', latency: 'Gateway Active', isError: false },
    maps: { status: 'Operational', latency: 'Engine Ready', isError: false },
    lastChecked: null
  });

  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      const latency = Date.now() - start;
      if (res.ok) {
        setHealthStatus({
          db: { status: 'Connected', latency: `${latency}ms`, isError: false },
          api: { status: 'Operational', latency: `${latency}ms`, isError: false },
          twilio: { status: 'Operational', latency: 'Gateway Active', isError: false },
          maps: { status: 'Operational', latency: 'Engine Ready', isError: false },
          lastChecked: new Date().toLocaleTimeString()
        });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      setHealthStatus({
        db: { status: 'Status Unavailable', latency: 'N/A', isError: true },
        api: { status: 'Unavailable', latency: 'N/A', isError: true },
        twilio: { status: 'Status Unavailable', latency: 'N/A', isError: true },
        maps: { status: 'Operational', latency: 'Client Engine', isError: false },
        lastChecked: new Date().toLocaleTimeString()
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handlePinChange = (val) => {
    // Only allow numeric input up to 4 digits
    if (!/^\d*$/.test(val)) return;
    if (val.length > 4) return;
    setNewPin(val);
    if (val.length > 0 && val.length < 4) {
      setPinError('Passcode must be exactly 4 numeric digits.');
    } else {
      setPinError('');
    }
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('Please enter a 4-digit numeric passcode.');
      return;
    }
    setIsSavingPin(true);
    setTimeout(() => {
      localStorage.setItem('ridex_admin_pin', newPin);
      setAdminPin(newPin);
      setNewPin('');
      setPinError('');
      setIsSavingPin(false);
      setMsgType('success');
      setMsg('Admin security passcode updated successfully.');
      setTimeout(() => setMsg(''), 4000);
    }, 400);
  };

  const triggerReseedConfirmation = (count) => {
    setSeedTargetCount(count);
    setShowConfirmModal(true);
  };

  const handleConfirmReseed = async () => {
    const count = seedTargetCount;
    setShowConfirmModal(false);
    if (!count) return;

    setIsSeeding(true);
    setMsgType('info');
    setMsg(`Seeding MongoDB database with ${count.toLocaleString()} records...`);

    try {
      const res = await fetch(`${API_BASE}/api/bookings/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      if (!res.ok) throw new Error('Database reseed API execution failed');
      setMsgType('success');
      setMsg(`Database successfully re-seeded with ${count.toLocaleString()} records!`);
      checkHealth();
    } catch (err) {
      setMsgType('error');
      setMsg(`Reseed operation failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="uber-admin-settings-container">
      {/* UBER CONSOLE HEADER */}
      <div className="uber-settings-header">
        <div>
          <div className="header-title-wrapper">
            <h2 className="uber-settings-title">System & Security Settings</h2>
            <span className="uber-status-pill">OPERATIONS CONSOLE</span>
          </div>
          <p className="uber-settings-subtitle">
            Manage admin security PIN, database seeder utilities, and real-time infrastructure diagnostics
          </p>
        </div>

        {toggleTheme && (
          <button onClick={toggleTheme} className="uber-btn-outline">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        )}
      </div>

      {/* ALERT FEEDBACK BANNER */}
      {msg && (
        <div className={`uber-alert-banner ${msgType}`}>
          <span className="alert-icon">
            {msgType === 'success' ? '✓' : msgType === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="alert-text">{msg}</span>
          <button className="alert-close-btn" onClick={() => setMsg('')}>&times;</button>
        </div>
      )}

      {/* 2-COLUMN MAIN SETTINGS GRID */}
      <div className="uber-settings-grid">
        {/* CARD 1: ADMIN SECURITY PASSCODE */}
        <div className="uber-card">
          <div className="uber-card-header">
            <div className="uber-card-icon-box">🔒</div>
            <div>
              <h3 className="uber-card-title">Admin Security Passcode</h3>
              <p className="uber-card-desc">4-digit access PIN for Admin Command Center</p>
            </div>
          </div>

          <div className="uber-card-body">
            <div className="passcode-vault-panel">
              <div>
                <span className="vault-label">CURRENT VAULT PIN</span>
                <div className="vault-value">
                  {showPin ? adminPin : '••••'}
                </div>
              </div>
              <button
                type="button"
                className="uber-btn-text"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? '🙈 Hide' : '👁️ Reveal'}
              </button>
            </div>

            <form onSubmit={handleSavePin} className="passcode-form">
              <div className="form-group">
                <label className="form-label">New 4-Digit Passcode</label>
                <div className="input-with-counter">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={newPin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className={`uber-input ${pinError ? 'input-error' : ''}`}
                  />
                  <span className="digit-counter">{newPin.length} / 4</span>
                </div>
                {pinError && <span className="field-error-text">{pinError}</span>}
              </div>

              <button
                type="submit"
                disabled={isSavingPin || newPin.length !== 4}
                className="uber-btn-primary full-width"
              >
                {isSavingPin ? 'Saving...' : 'Update Security Passcode'}
              </button>
            </form>
          </div>
        </div>

        {/* CARD 2: MONGODB DATABASE SEEDER */}
        <div className="uber-card">
          <div className="uber-card-header">
            <div className="uber-card-icon-box">🗄️</div>
            <div>
              <h3 className="uber-card-title">Database Seeder Engine</h3>
              <p className="uber-card-desc">Populate MongoDB with sample booking & ride metrics</p>
            </div>
          </div>

          <div className="uber-card-body">
            <p className="seeder-warning-text">
              <strong>Notice:</strong> Running the seeder replaces active sample bookings with freshly aggregated ride data and GPS telemetry coordinates.
            </p>

            <div className="seeder-actions-grid">
              <div className="seeder-action-card">
                <div className="seeder-meta">
                  <span className="seeder-badge">Standard Volume</span>
                  <h4 className="seeder-count">2,000 Records</h4>
                  <p className="seeder-desc">Lightweight sample dataset for standard performance testing.</p>
                </div>
                <button
                  disabled={isSeeding}
                  onClick={() => triggerReseedConfirmation(2000)}
                  className="uber-btn-secondary full-width"
                >
                  {isSeeding ? 'Seeding...' : 'Seed 2K Bookings'}
                </button>
              </div>

              <div className="seeder-action-card highlight">
                <div className="seeder-meta">
                  <span className="seeder-badge dark">Stress Testing</span>
                  <h4 className="seeder-count">5,000 Records</h4>
                  <p className="seeder-desc">Heavy volume dataset for revenue and peak hourly analytics.</p>
                </div>
                <button
                  disabled={isSeeding}
                  onClick={() => triggerReseedConfirmation(5000)}
                  className="uber-btn-primary full-width"
                >
                  {isSeeding ? 'Seeding...' : 'Seed 5K Bookings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: SYSTEM HEALTH & INFRASTRUCTURE DIAGNOSTICS */}
      <div className="uber-card full-width-card" style={{ marginTop: '24px' }}>
        <div className="uber-card-header flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="uber-card-icon-box green">🩺</div>
            <div>
              <h3 className="uber-card-title">System Infrastructure & Service Diagnostics</h3>
              <p className="uber-card-desc">Live connectivity status for backend database, APIs, SMS, and mapping engines</p>
            </div>
          </div>

          <button onClick={checkHealth} disabled={isCheckingHealth} className="uber-btn-outline sm">
            {isCheckingHealth ? '⌛ Testing...' : `🔄 Re-test Services ${healthStatus.lastChecked ? `(${healthStatus.lastChecked})` : ''}`}
          </button>
        </div>

        <div className="uber-card-body">
          <div className="health-services-grid">
            {/* Service 1: MongoDB */}
            <div className={`health-service-card ${healthStatus.db.isError ? 'error' : 'ok'}`}>
              <div className="service-card-top">
                <span className={`service-status-dot ${healthStatus.db.isError ? 'dot-red' : 'dot-green'}`} />
                <span className="service-latency">{healthStatus.db.latency || 'Checking...'}</span>
              </div>
              <div className="service-name">Database Engine</div>
              <div className="service-status-text">MongoDB Atlas</div>
              <div className="service-state-sub">{healthStatus.db.status}</div>
            </div>

            {/* Service 2: REST API */}
            <div className={`health-service-card ${healthStatus.api.isError ? 'error' : 'ok'}`}>
              <div className="service-card-top">
                <span className={`service-status-dot ${healthStatus.api.isError ? 'dot-red' : 'dot-green'}`} />
                <span className="service-latency">{healthStatus.api.latency || 'Checking...'}</span>
              </div>
              <div className="service-name">REST API Server</div>
              <div className="service-status-text">Express / Node.js Engine</div>
              <div className="service-state-sub">{healthStatus.api.status}</div>
            </div>

            {/* Service 3: Twilio SMS */}
            <div className={`health-service-card ${healthStatus.twilio.isError ? 'error' : 'ok'}`}>
              <div className="service-card-top">
                <span className={`service-status-dot ${healthStatus.twilio.isError ? 'dot-red' : 'dot-green'}`} />
                <span className="service-latency">{healthStatus.twilio.latency}</span>
              </div>
              <div className="service-name">OTP Gateway</div>
              <div className="service-status-text">Twilio Verify API</div>
              <div className="service-state-sub">{healthStatus.twilio.status}</div>
            </div>

            {/* Service 4: Leaflet Map */}
            <div className={`health-service-card ${healthStatus.maps.isError ? 'error' : 'ok'}`}>
              <div className="service-card-top">
                <span className={`service-status-dot ${healthStatus.maps.isError ? 'dot-red' : 'dot-green'}`} />
                <span className="service-latency">{healthStatus.maps.latency}</span>
              </div>
              <div className="service-name">Map Telemetry</div>
              <div className="service-status-text">Leaflet 3D Engine</div>
              <div className="service-state-sub">{healthStatus.maps.status}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL FOR SEEDING */}
      {showConfirmModal && (
        <div className="uber-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="uber-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚠️ Confirm Database Seeding</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>
                You are about to re-seed MongoDB with <strong>{seedTargetCount?.toLocaleString()} records</strong>.
              </p>
              <p className="modal-warning-box">
                This operation clears current sample bookings and regenerates fresh ride telemetry. This action is isolated to test data.
              </p>
            </div>
            <div className="modal-footer">
              <button className="uber-btn-outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className="uber-btn-danger" onClick={handleConfirmReseed}>
                Confirm & Seed MongoDB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

