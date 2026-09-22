import { useState, useEffect } from 'react';
import API_BASE from '../../config';
import AdminAICopilot from './AdminAICopilot';
import AdminDemandForecast from './AdminDemandForecast';
import AdminIncidentCenter from './AdminIncidentCenter';
import AdminWhatIfSimulator from './AdminWhatIfSimulator';
import './AdminIntelligenceCenter.css';

export default function AdminIntelligenceCenter({ initialSubTab = 'copilot', onNavigateToMap }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [healthData, setHealthData] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  const fetchHealthScore = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/intelligence/health`);
      const data = await res.json();
      if (res.ok && data.success) {
        setHealthData(data);
      }
    } catch (err) {
      console.error('Failed to fetch health score:', err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScore();
    const interval = setInterval(fetchHealthScore, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="admin-page-container intelligence-hub">
      {/* ── TOP SECTION: DYNAMIC RIDEX OPERATION HEALTH SCORE ── */}
      <div className="intelligence-health-banner">
        <div className="health-score-ring-card">
          <div className="health-score-number-wrapper">
            <div className="health-score-number" style={{ color: healthData?.statusColor || '#10b981' }}>
              {isHealthLoading ? '⌛' : healthData?.healthScore ?? '--'}
            </div>
            <span className="health-score-max">/100</span>
          </div>

          <div className="health-status-details">

            <div className="health-status-badge" style={{ borderColor: healthData?.statusColor || '#10b981', color: healthData?.statusColor || '#10b981' }}>
              {healthData?.badge || '🟢 HEALTHY'}
            </div>
            <div className="health-status-label">RIDEX OPERATION HEALTH</div>
          </div>
        </div>

        {/* Breakdown Factors Grid */}
        <div className="health-factors-list">
          {healthData?.factors ? (
            healthData.factors.map((fac, idx) => (
              <div key={idx} className="factor-pill">
                <span className="factor-name">{fac.name}:</span>
                <span className="factor-val">{fac.score}</span>
                <span className="factor-impact">({fac.impact})</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>Calculating operational indicators...</div>
          )}
        </div>
      </div>

      {/* ── INTELLIGENCE NAVIGATION SUB-TABS ── */}
      <div className="intelligence-subtabs-nav">
        <button
          onClick={() => setActiveSubTab('copilot')}
          className={`subtab-btn ${activeSubTab === 'copilot' ? 'active' : ''}`}
        >
          <span>🧠</span> AI Copilot
        </button>

        <button
          onClick={() => setActiveSubTab('forecast')}
          className={`subtab-btn ${activeSubTab === 'forecast' ? 'active' : ''}`}
        >
          <span>🔮</span> Demand Forecast
        </button>

        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`subtab-btn ${activeSubTab === 'incidents' ? 'active' : ''}`}
        >
          <span>🚨</span> Incident Center
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`subtab-btn ${activeSubTab === 'simulator' ? 'active' : ''}`}
        >
          <span>🧩</span> What-If Simulator
        </button>
      </div>

      {/* ── SUB-TAB CONTENT RENDERER ── */}
      <div className="intelligence-tab-content">
        {activeSubTab === 'copilot' && <AdminAICopilot />}
        {activeSubTab === 'forecast' && <AdminDemandForecast />}
        {activeSubTab === 'incidents' && <AdminIncidentCenter onNavigateToMap={onNavigateToMap} />}
        {activeSubTab === 'simulator' && <AdminWhatIfSimulator />}
      </div>
    </div>
  );
}
