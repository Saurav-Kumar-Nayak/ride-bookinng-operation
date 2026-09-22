import { useState, useEffect } from 'react';
import API_BASE from '../../config';
import './AdminIncidentCenter.css';

export default function AdminIncidentCenter({ onNavigateToMap }) {
  const [incidents, setIncidents] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [investigatingId, setInvestigatingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState('REAL DATA');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchIncidents = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/intelligence/incidents`);
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.incidents || []);
        setDataType(data.dataType || 'REAL DATA');
      } else {
        setErrorMsg(data.message || 'Failed to fetch operational incidents.');
      }
    } catch (err) {
      console.error('Incidents fetch error:', err);
      setErrorMsg('Network error connecting to Incident Detection backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleInvestigate = (id) => {
    setInvestigatingId(investigatingId === id ? null : id);
  };

  const visibleIncidents = incidents.filter(i => !dismissedIds.has(i.id));

  return (
    <div className="admin-incident-container">
      {/* ── HEADER ── */}
      <div className="incident-header">
        <div className="header-info">
          <span className="incident-badge-icon">🚨</span>
          <div>
            <h2 className="incident-title">Real-Time Operational Incident Center</h2>
            <p className="incident-subtitle">
              Automated anomaly detection monitoring cancellation spikes, driver shortages & fleet risk thresholds
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="incident-count-pill">
            Active Alerts: <strong>{visibleIncidents.length}</strong>
          </span>
          <button onClick={fetchIncidents} className="refresh-incidents-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="incident-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="incident-loading-box">
          <div className="incident-spinner"></div>
          <div>Scanning real-time MongoDB telemetry for operational threshold breaches...</div>
        </div>
      ) : visibleIncidents.length === 0 ? (
        <div className="incident-empty-card">
          <div className="empty-icon">🟢</div>
          <h3>ALL OPERATIONAL PARAMETERS NORMAL</h3>
          <p>No operational incidents or threshold breaches detected in current telemetry window.</p>
        </div>
      ) : (
        <div className="incidents-list">
          {visibleIncidents.map((incident) => {
            const isHigh = incident.severity === 'HIGH';
            const isMedium = incident.severity === 'MEDIUM';

            return (
              <div
                key={incident.id}
                className={`incident-card ${isHigh ? 'high' : isMedium ? 'medium' : 'low'}`}
              >
                <div className="incident-card-header">
                  <div className="severity-title">{incident.title}</div>
                  <div className="incident-timestamp">Detected: {incident.timestamp}</div>
                </div>

                <div className="incident-grid">
                  <div className="incident-meta-item">
                    <span className="meta-label">Zone Location:</span>
                    <span className="meta-val zone">{incident.zone}</span>
                  </div>

                  <div className="incident-meta-item">
                    <span className="meta-label">Detected Evidence Metric:</span>
                    <span className="meta-val metric">{incident.detectedMetric}</span>
                  </div>

                  <div className="incident-meta-item">
                    <span className="meta-label">Historical Baseline:</span>
                    <span className="meta-val">{incident.baseline}</span>
                  </div>

                  <div className="incident-meta-item">
                    <span className="meta-label">Operational Impact:</span>
                    <span className="meta-val impact">{incident.impact}</span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="incident-action-box">
                  <span className="action-tag">💡 RECOMMENDED ACTION:</span>
                  <span className="action-text">{incident.recommendedAction}</span>
                </div>

                {/* Action Buttons */}
                <div className="incident-buttons">
                  <button
                    onClick={() => handleInvestigate(incident.id)}
                    className="action-btn investigate"
                  >
                    🔍 {investigatingId === incident.id ? 'Close Details' : 'Investigate'}
                  </button>

                  <button
                    onClick={() => onNavigateToMap && onNavigateToMap(incident.zone)}
                    className="action-btn view-zone"
                  >
                    🗺️ View Zone on Fleet Map
                  </button>

                  <button
                    onClick={() => handleDismiss(incident.id)}
                    className="action-btn dismiss"
                  >
                    ✕ Dismiss Alert
                  </button>
                </div>

                {/* Expanded Investigation Panel */}
                {investigatingId === incident.id && (
                  <div className="investigation-details-panel">
                    <h4>🔍 Detailed Diagnostic Report ({incident.id})</h4>
                    <p>
                      Threshold analysis confirmed breach against baseline <code>{incident.baseline}</code>.
                      Recommended immediate operational dispatch adjustment to restore optimal response SLA.
                    </p>
                    <div className="data-source-tag">
                      DATA SOURCE: {incident.dataType || dataType} · VERIFIED BY RIDEX ANOMALY ENGINE
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
