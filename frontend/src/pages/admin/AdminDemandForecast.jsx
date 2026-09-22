import { useState, useEffect } from 'react';
import API_BASE from '../../config';
import './AdminDemandForecast.css';

export default function AdminDemandForecast() {
  const [timeframe, setTimeframe] = useState('1h');
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const timeframeOptions = [
    { id: '30m', label: 'Next 30 Mins' },
    { id: '1h', label: 'Next 1 Hour' },
    { id: '2h', label: 'Next 2 Hours' },
    { id: '6h', label: 'Next 6 Hours' },
    { id: 'today', label: 'Rest of Today' }
  ];

  const fetchForecast = async (tf) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/intelligence/forecast?timeframe=${tf}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setForecastData(data);
      } else {
        setErrorMsg(data.message || 'Failed to fetch demand forecast.');
      }
    } catch (err) {
      console.error('Forecast fetch error:', err);
      setErrorMsg('Network error connecting to Demand Forecast backend API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(timeframe);
  }, [timeframe]);

  return (
    <div className="admin-forecast-container">
      {/* ── HEADER ── */}
      <div className="forecast-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="forecast-icon">🔮</span>
            <h2 className="forecast-title">Statistical Demand & Driver Gap Forecasting</h2>
          </div>
          <p className="forecast-subtitle">
            Time-series rolling averages & exponential trend projection derived from historical RideX bookings
          </p>
        </div>

        {/* Timeframe Toggles */}
        <div className="forecast-time-pills">
          {timeframeOptions.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`time-pill-btn ${timeframe === tf.id ? 'active' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="forecast-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="forecast-loading-box">
          <div className="forecast-spinner"></div>
          <div>Aggregating historical booking buckets & projecting fleet requirement...</div>
        </div>
      ) : forecastData ? (
        <div className="forecast-body">
          {/* DATA SOURCE BADGES */}
          <div className="data-source-banner">
            <div className="source-tag real">
              ● REAL DATA (Historical Baseline)
            </div>
            <div className="source-tag predicted">
              🔮 PREDICTED DATA (Time-Series Projection)
            </div>
            <div className="confidence-pill">
              Model Confidence: <strong>{forecastData.confidence}</strong>
            </div>
          </div>

          {forecastData.dataType === 'INSUFFICIENT REAL DATA' ? (
            <div className="forecast-insufficient-card">
              <div className="insufficient-icon">⚠️</div>
              <h3>INSUFFICIENT HISTORICAL DATA</h3>
              <p>{forecastData.explanation}</p>
            </div>
          ) : (
            <>
              {/* ── KPI METRICS CARDS ── */}
              <div className="forecast-kpi-grid">
                <div className="forecast-kpi-card real">
                  <div className="kpi-tag">REAL DATA</div>
                  <div className="kpi-label">Current Hourly Demand</div>
                  <div className="kpi-val">{forecastData.currentDemand}</div>
                  <div className="kpi-sub">Rides / Hour (Baseline)</div>
                </div>

                <div className="forecast-kpi-card predicted">
                  <div className="kpi-tag predicted">PREDICTED DATA</div>
                  <div className="kpi-label">Predicted Demand ({forecastData.timeframeLabel})</div>
                  <div className="kpi-val highlight">{forecastData.predictedDemand}</div>
                  <div className="kpi-sub">Expected Booking Volume</div>
                </div>

                <div className="forecast-kpi-card real">
                  <div className="kpi-tag">REAL DATA</div>
                  <div className="kpi-label">Available Active Drivers</div>
                  <div className="kpi-val">{forecastData.availableDrivers}</div>
                  <div className="kpi-sub">Online Available Fleet</div>
                </div>

                <div className="forecast-kpi-card predicted">
                  <div className="kpi-tag predicted">PREDICTED DATA</div>
                  <div className="kpi-label">Expected Driver Requirement</div>
                  <div className="kpi-val">{forecastData.expectedDriverRequirement}</div>
                  <div className="kpi-sub">Optimal Fleet Capacity</div>
                </div>

                <div className={`forecast-kpi-card ${forecastData.driverGap > 0 ? 'alert' : 'success'}`}>
                  <div className="kpi-tag">PREDICTED GAP</div>
                  <div className="kpi-label">Predicted Driver Gap</div>
                  <div className="kpi-val">
                    {forecastData.driverGap > 0 ? `-${forecastData.driverGap}` : '0 (Optimal)'}
                  </div>
                  <div className="kpi-sub">
                    Risk Level: <strong style={{ color: forecastData.riskLevel === 'HIGH' ? '#ef4444' : '#10b981' }}>{forecastData.riskLevel}</strong>
                  </div>
                </div>
              </div>

              {/* ── TIMELINE PROJECTION CHART ── */}
              {forecastData.forecastTimeline && forecastData.forecastTimeline.length > 0 && (
                <div className="forecast-chart-card">
                  <div className="chart-header">
                    <span className="chart-title">📈 6-Hour Demand & Driver Requirement Projection</span>
                    <span className="chart-legend">
                      <span className="legend-item real"><span className="dot"></span> Real Demand</span>
                      <span className="legend-item pred"><span className="dot"></span> Predicted Demand</span>
                      <span className="legend-item req"><span className="dot"></span> Required Drivers</span>
                    </span>
                  </div>

                  <div className="timeline-bars-container">
                    {forecastData.forecastTimeline.map((pt, idx) => {
                      const maxVal = Math.max(10, ...forecastData.forecastTimeline.map(p => Math.max(p.realDemand, p.predictedDemand, p.requiredDrivers)));
                      const realPct = Math.round((pt.realDemand / maxVal) * 100);
                      const predPct = Math.round((pt.predictedDemand / maxVal) * 100);
                      const reqPct = Math.round((pt.requiredDrivers / maxVal) * 100);

                      return (
                        <div key={idx} className="timeline-col">
                          <div className="bar-group">
                            <div className="bar-wrapper" title={`Real Demand: ${pt.realDemand}`}>
                              <div className="bar real" style={{ height: `${realPct}%` }}>
                                <span className="bar-val">{pt.realDemand}</span>
                              </div>
                            </div>

                            <div className="bar-wrapper" title={`Predicted Demand: ${pt.predictedDemand}`}>
                              <div className="bar pred" style={{ height: `${predPct}%` }}>
                                <span className="bar-val">{pt.predictedDemand}</span>
                              </div>
                            </div>

                            <div className="bar-wrapper" title={`Required Drivers: ${pt.requiredDrivers}`}>
                              <div className="bar req" style={{ height: `${reqPct}%` }}>
                                <span className="bar-val">{pt.requiredDrivers}</span>
                              </div>
                            </div>
                          </div>

                          <div className="time-label">{pt.timeLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
