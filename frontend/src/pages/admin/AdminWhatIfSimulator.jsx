import { useState, useEffect } from 'react';
import API_BASE from '../../config';
import './AdminWhatIfSimulator.css';

export default function AdminWhatIfSimulator() {
  const DEFAULT_PARAMS = {
    demandDeltaPct: 15,
    supplyDeltaPct: 20,
    cancellationDeltaPct: -10,
    fareDeltaPct: 5
  };

  const PRESETS = [
    { label: '⚡ Peak Rush (+50% Demand)', params: { demandDeltaPct: 50, supplyDeltaPct: 10, cancellationDeltaPct: 15, fareDeltaPct: 10 } },
    { label: '🌧️ Storm Alert (+80% Demand, +30% Cancel)', params: { demandDeltaPct: 80, supplyDeltaPct: -10, cancellationDeltaPct: 30, fareDeltaPct: 20 } },
    { label: '🚗 Fleet Onboarding (+40% Drivers)', params: { demandDeltaPct: 20, supplyDeltaPct: 40, cancellationDeltaPct: -15, fareDeltaPct: 0 } },
    { label: '🏷️ Price Cut (-15% Fare, +35% Demand)', params: { demandDeltaPct: 35, supplyDeltaPct: 10, cancellationDeltaPct: -5, fareDeltaPct: -15 } }
  ];

  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [simResult, setSimResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const runSimulation = async (currentParams) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/intelligence/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentParams)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSimResult(data);
      } else {
        setErrorMsg(data.message || 'Failed to calculate simulation output.');
      }
    } catch (err) {
      console.error('Simulation fetch error:', err);
      setErrorMsg('Network error connecting to What-If Simulator engine.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(params);
  }, []);

  const handleSliderChange = (paramKey, value) => {
    const newParams = { ...params, [paramKey]: Number(value) };
    setParams(newParams);
    runSimulation(newParams);
  };

  const handleApplyPreset = (presetParams) => {
    setParams(presetParams);
    runSimulation(presetParams);
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    runSimulation(DEFAULT_PARAMS);
  };

  return (
    <div className="admin-simulator-container">

      {/* ── HEADER ── */}
      <div className="simulator-header">
        <div className="header-info">
          <span className="sim-icon">🧩</span>
          <div>
            <h2 className="sim-title">What-If Operations Scenario Simulator</h2>
            <p className="sim-subtitle">
              Simulate operational supply/demand stress, fare elasticity, and driver capacity variations
            </p>
          </div>
        </div>

        <button onClick={handleReset} className="reset-sim-btn">
          🔄 Reset Simulation
        </button>
      </div>

      {/* ── QUICK PRESETS ── */}
      <div className="copilot-quick-actions">
        <span className="quick-actions-label">⚡ Rapid Scenario Presets:</span>
        <div className="quick-buttons-grid">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p.params)}
              className="copilot-action-btn"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="sim-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="simulator-body-grid">
        {/* ── SLIDER CONTROLS PANEL ── */}
        <div className="simulator-controls-card">
          <div className="controls-card-header">
            <h3>🎛️ Scenario Parameter Controls</h3>
            <span className="controls-sub">Adjust variables to model expected outcomes</span>
          </div>

          <div className="sliders-list">
            {/* 1. Demand Slider */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-title">📈 Booking Demand:</span>
                <span className="slider-value">{params.demandDeltaPct > 0 ? `+${params.demandDeltaPct}%` : `${params.demandDeltaPct}%`}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="100"
                step="5"
                value={params.demandDeltaPct}
                onChange={(e) => handleSliderChange('demandDeltaPct', e.target.value)}
                className="sim-range-input demand"
              />
              <div className="range-bounds"><span>-30%</span><span>0%</span><span>+100%</span></div>
            </div>

            {/* 2. Driver Supply Slider */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-title">🚗 Driver Fleet Supply:</span>
                <span className="slider-value">{params.supplyDeltaPct > 0 ? `+${params.supplyDeltaPct}%` : `${params.supplyDeltaPct}%`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={params.supplyDeltaPct}
                onChange={(e) => handleSliderChange('supplyDeltaPct', e.target.value)}
                className="sim-range-input supply"
              />
              <div className="range-bounds"><span>-20%</span><span>0%</span><span>+50%</span></div>
            </div>

            {/* 3. Cancellation Rate Slider */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-title">❌ Cancellation Rate:</span>
                <span className="slider-value">{params.cancellationDeltaPct > 0 ? `+${params.cancellationDeltaPct}%` : `${params.cancellationDeltaPct}%`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={params.cancellationDeltaPct}
                onChange={(e) => handleSliderChange('cancellationDeltaPct', e.target.value)}
                className="sim-range-input cancellation"
              />
              <div className="range-bounds"><span>-20%</span><span>0%</span><span>+50%</span></div>
            </div>

            {/* 4. Average Fare Slider */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-title">💰 Average Ride Fare:</span>
                <span className="slider-value">{params.fareDeltaPct > 0 ? `+${params.fareDeltaPct}%` : `${params.fareDeltaPct}%`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="30"
                step="5"
                value={params.fareDeltaPct}
                onChange={(e) => handleSliderChange('fareDeltaPct', e.target.value)}
                className="sim-range-input fare"
              />
              <div className="range-bounds"><span>-20%</span><span>0%</span><span>+30%</span></div>
            </div>
          </div>
        </div>

        {/* ── SIMULATION RESULTS PANEL ── */}
        <div className="simulator-results-card">
          <div className="results-card-header">
            <h3>📊 Model Forecast Estimate</h3>
          </div>

          {isLoading ? (
            <div className="sim-loading-box">
              <div className="sim-spinner"></div>
              <div>Computing capacity matrices & elastic revenue impact...</div>
            </div>
          ) : simResult?.estimate ? (
            <div className="results-grid">
              {/* Estimated Completed Rides */}
              <div className="result-metric-item">
                <span className="metric-label">Estimated Completed Rides</span>
                <span className="metric-value">{simResult.estimate.simulatedCompleted}</span>
                <span className="metric-baseline">Baseline: {simResult.baseline.completedCount}</span>
              </div>

              {/* Estimated Cancelled Rides */}
              <div className="result-metric-item">
                <span className="metric-label">Estimated Cancellations</span>
                <span className="metric-value text-red">{simResult.estimate.simulatedCancelCount}</span>
                <span className="metric-baseline">Baseline: {simResult.baseline.cancelledCount}</span>
              </div>

              {/* Driver Requirement & Gap */}
              <div className="result-metric-item">
                <span className="metric-label">Required Driver Fleet</span>
                <span className="metric-value">{simResult.estimate.requiredDrivers}</span>
                <span className="metric-baseline">Driver Gap: <strong>{simResult.estimate.driverGap}</strong></span>
              </div>

              {/* Operational Risk */}
              <div className="result-metric-item">
                <span className="metric-label">Operational Risk Score</span>
                <span className={`metric-value risk-${simResult.estimate.operationalRisk.toLowerCase()}`}>
                  {simResult.estimate.operationalRisk}
                </span>
                <span className="metric-baseline">Simulated Capacity SLA</span>
              </div>

              {/* Estimated Total Revenue */}
              <div className="result-metric-item wide highlight">
                <span className="metric-label">Estimated Projected Revenue</span>
                <span className="metric-value large">
                  ₹{simResult.estimate.simulatedRevenue.toLocaleString('en-IN')}
                </span>
                <div className="revenue-diff-badge">
                  Net Change: <strong>{simResult.estimate.revenueDifference >= 0 ? `+₹${simResult.estimate.revenueDifference.toLocaleString('en-IN')}` : `-₹${Math.abs(simResult.estimate.revenueDifference).toLocaleString('en-IN')}`} ({simResult.estimate.revenueChangePct}%)</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
