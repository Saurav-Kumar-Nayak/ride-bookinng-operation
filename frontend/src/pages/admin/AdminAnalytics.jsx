import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import PeakHourly3DChart from './PeakHourly3DChart';
import './AdminAnalytics.css';

export default function AdminAnalytics() {
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchAnalytics = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics?timeFrame=${timeFrame}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeFrame]);

  // Reset hour/date selection on timeFrame change
  const handleTimeFrameChange = (tf) => {
    setTimeFrame(tf);
    setSelectedHour(null);
    setSelectedDate(null);
  };

  // Initial fetch on mount & filter change
  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Auto-refresh polling every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAnalytics(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchAnalytics]);

  const userGrowth = data?.userGrowth || [];
  const peakHours = data?.peakHours || [];
  const rideStats = data?.rideStats || [];

  const maxPassengers = Math.max(...userGrowth.map(u => u.passengers), 1);

  // Transform backend peakHours array into hourlyCounts object for PeakHourly3DChart
  const hourlyCountsObj = useMemo(() => {
    const map = {};
    for (let h = 0; h < 24; h++) map[h] = 0;
    if (Array.isArray(peakHours)) {
      peakHours.forEach((ph) => {
        const hInt = Number(ph._id);
        if (!isNaN(hInt) && hInt >= 0 && hInt < 24) {
          map[hInt] = Number(ph.count) || 0;
        }
      });
    }
    return map;
  }, [peakHours]);

  const backendSummary = data?.summary;
  // Aggregate fallback period metrics from rideStats if backendSummary is missing
  const baselineTotalRides = useMemo(() => backendSummary?.totalRides ?? rideStats.reduce((acc, curr) => acc + (curr.total || 0), 0), [backendSummary, rideStats]);
  const baselineCompletedRides = useMemo(() => backendSummary?.completedRides ?? rideStats.reduce((acc, curr) => acc + (curr.completed || 0), 0), [backendSummary, rideStats]);
  const baselineRevenue = useMemo(() => backendSummary?.totalRevenue ?? rideStats.reduce((acc, curr) => acc + (curr.revenue || 0), 0), [backendSummary, rideStats]);

  // Calculate dynamic summary metrics based on selected hour or date filter
  const summaryMetrics = useMemo(() => {
    if (selectedDate !== null) {
      const match = rideStats.find(rs => rs._id === selectedDate);
      if (match) {
        const tot = match.total || 0;
        const comp = match.completed || 0;
        const rev = match.revenue || 0;
        const pct = tot > 0 ? ((comp / tot) * 100).toFixed(1) : '100';
        return {
          totalRides: tot,
          completedRides: comp,
          revenue: rev,
          completionRatePct: `${pct}%`,
          filterText: `Filtered Date: ${selectedDate}`,
          statusLabel: 'Date Selected'
        };
      }
    }

    if (selectedHour !== null) {
      const hCount = hourlyCountsObj[selectedHour] || 0;
      const hPct = baselineTotalRides > 0 ? ((hCount / baselineTotalRides) * 100).toFixed(1) : '0';
      const formattedHour = selectedHour < 10 ? `0${selectedHour}:00` : `${selectedHour}:00`;
      const estHourRev = baselineTotalRides > 0 ? Math.round((hCount / baselineTotalRides) * baselineRevenue) : 0;
      return {
        totalRides: hCount,
        completedRides: Math.round(hCount * 0.85),
        revenue: estHourRev,
        completionRatePct: `${hPct}% Share`,
        filterText: `Hourly Bar: ${formattedHour}`,
        statusLabel: `Hour ${formattedHour}`
      };
    }

    const overallPct = backendSummary?.fulfillmentRate !== undefined
      ? `${backendSummary.fulfillmentRate}%`
      : (baselineTotalRides > 0 ? `${((baselineCompletedRides / baselineTotalRides) * 100).toFixed(1)}%` : '100%');

    let windowLabel = `${timeFrame.toUpperCase()} WINDOW SUMMARY`;
    if (timeFrame === 'all') windowLabel = 'ALL-TIME WINDOW SUMMARY';
    if (timeFrame === 'daily') windowLabel = "TODAY'S WINDOW SUMMARY";
    if (timeFrame === 'weekly') windowLabel = 'LAST 7 DAYS WINDOW SUMMARY';
    if (timeFrame === 'monthly') windowLabel = 'LAST 30 DAYS WINDOW SUMMARY';

    return {
      totalRides: baselineTotalRides,
      completedRides: baselineCompletedRides,
      revenue: baselineRevenue,
      completionRatePct: overallPct,
      filterText: windowLabel,
      statusLabel: 'Active Stream'
    };
  }, [selectedDate, selectedHour, rideStats, hourlyCountsObj, baselineTotalRides, baselineCompletedRides, baselineRevenue, timeFrame, backendSummary]);

  return (
    <div className="analytics-page-container">
      {/* SECTION HEADER & TIMEFRAME SELECTOR */}
      <div className="admin-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="admin-header-title">📈 Database Analytics Engine</h2>
            <span className="admin-live-sync-badge">
              ● LIVE MONGO SYNC {lastUpdated && `(${lastUpdated})`}
            </span>
            {(selectedHour !== null || selectedDate !== null) && (
              <button
                onClick={() => { setSelectedHour(null); setSelectedDate(null); }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕ Clear Bar Selection ({summaryMetrics.filterText})
              </button>
            )}
          </div>
          <p className="admin-header-subtitle">
            Multi-dimensional MongoDB ride performance, 3D hourly demand heatmaps, passenger & driver growth
          </p>
        </div>

        <div className="analytics-header-controls">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => handleTimeFrameChange(tf.id)}
              className={`analytics-tab-btn ${timeFrame === tf.id ? 'active' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', backdropFilter: 'blur(12px)' }}>
          ⌛ Querying MongoDB time-series aggregations...
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* DYNAMIC REACTIVE SUMMARY PILLS */}
          <div className="analytics-summary-grid">
            <div className="analytics-summary-card">
              <div className="summary-icon-box blue">🚕</div>
              <div className="summary-content">
                <span className="summary-title">Total Period Rides</span>
                <span className="summary-value">{summaryMetrics.totalRides.toLocaleString('en-IN')}</span>
                <span className="summary-desc">{summaryMetrics.filterText}</span>
              </div>
            </div>

            <div className="analytics-summary-card">
              <div className="summary-icon-box emerald">✅</div>
              <div className="summary-content">
                <span className="summary-title">Fulfillment Rate</span>
                <span className="summary-value">{summaryMetrics.completionRatePct}</span>
                <span className="summary-desc">{summaryMetrics.completedRides.toLocaleString('en-IN')} completed trips</span>
              </div>
            </div>

            <div className="analytics-summary-card">
              <div className="summary-icon-box purple">💰</div>
              <div className="summary-content">
                <span className="summary-title">Aggregated Revenue</span>
                <span className="summary-value">₹{summaryMetrics.revenue.toLocaleString('en-IN')}</span>
                <span className="summary-desc">Fare earnings for selected filter</span>
              </div>
            </div>

            <div className="analytics-summary-card">
              <div className="summary-icon-box orange">⚡</div>
              <div className="summary-content">
                <span className="summary-title">Peak Heatmap Status</span>
                <span className="summary-value">{summaryMetrics.statusLabel}</span>
                <span className="summary-desc">24-Hour hourly demand distribution</span>
              </div>
            </div>
          </div>

          {/* 3D HOURLY HEATMAP & GROWTH PANELS */}
          <div className="analytics-grid-two">
            {/* 3D Peak Hourly Volume Visualizer */}
            <div style={{ gridColumn: 'span 1' }}>
              <PeakHourly3DChart
                hourlyCounts={hourlyCountsObj}
                selectedPreset={timeFrame}
                isLoading={loading}
                onHourSelect={(hour) => {
                  setSelectedHour(hour);
                  if (hour !== null) setSelectedDate(null);
                }}
              />
            </div>

            {/* Passenger & Driver Platform Growth Panel */}
            <div className="analytics-panel-3d" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="panel-header-3d">
                  <div className="panel-title-text">
                    <span>👥 Real Passenger & Driver Growth</span>
                  </div>
                  <span className="panel-subtitle-text">User Registrations</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userGrowth.length > 0 ? (
                    userGrowth.slice(0, 7).map((ug, idx) => {
                      const isSelected = selectedDate === ug.label;
                      const hasDateFilter = selectedDate !== null;
                      return (
                        <div
                          key={idx}
                          className="growth-row"
                          onClick={() => {
                            setSelectedDate(prev => prev === ug.label ? null : ug.label);
                            setSelectedHour(null);
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                            border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                            filter: hasDateFilter && !isSelected ? 'blur(1.5px)' : 'none',
                            opacity: hasDateFilter && !isSelected ? 0.45 : 1
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700 }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>📅 {ug.label}</span>
                            <span style={{ color: '#6366f1', fontFamily: 'var(--font-mono)' }}>
                              👤 {ug.passengers} Passengers · 🚗 {ug.drivers} Drivers
                            </span>
                          </div>
                          <div className="growth-progress-track">
                            <div
                              className="growth-progress-fill"
                              style={{
                                width: `${Math.max(8, (ug.passengers / maxPassengers) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                      No passenger or driver registration records found in MongoDB.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(226,232,240,0.6)', fontSize: '11.5px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>💡 Click row to focus date registration metrics</span>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>MongoDB User Collection</span>
              </div>
            </div>
          </div>

          {/* TIME-SERIES RIDE AGGREGATIONS TABLE */}
          <div className="analytics-panel-3d">
            <div className="panel-header-3d">
              <div className="panel-title-text">
                <span>🚕 Time-Series Ride Aggregations</span>
              </div>
              <span className="panel-subtitle-text">Click row to isolate & focus date telemetry</span>
            </div>

            <div className="analytics-table-wrap">
              <table className="analytics-3d-table">
                <thead>
                  <tr>
                    <th>Date Period</th>
                    <th>Total Rides</th>
                    <th>Completed Rides</th>
                    <th>Cancelled Rides</th>
                    <th>Gross Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {rideStats.map((rs, idx) => {
                    const isSelected = selectedDate === rs._id;
                    const hasDateFilter = selectedDate !== null;

                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          setSelectedDate(prev => prev === rs._id ? null : rs._id);
                          setSelectedHour(null);
                        }}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.18)' : undefined,
                          filter: hasDateFilter && !isSelected ? 'blur(1.5px)' : 'none',
                          opacity: hasDateFilter && !isSelected ? 0.45 : 1
                        }}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#3b82f6' }}>
                          📅 {rs._id} {isSelected && '👈 (Focused)'}
                        </td>
                        <td style={{ fontWeight: 800 }}>{rs.total} rides</td>
                        <td>
                          <span className="status-badge-pill completed">
                            ✓ {rs.completed} completed
                          </span>
                        </td>
                        <td>
                          <span className="status-badge-pill cancelled">
                            ✕ {rs.cancelled} cancelled
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#10b981', fontSize: '14px' }}>
                          ₹{rs.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}

                  {rideStats.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                        No ride records found for selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
