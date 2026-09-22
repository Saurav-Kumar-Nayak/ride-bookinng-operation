import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import PeakHourly3DChart from './PeakHourly3DChart';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [preset, setPreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    activeRides: 0,
    completedRides: 0,
    totalCancelledRides: 0,
    totalRevenue: 0,
    todaysRevenue: 0,
    pendingDriverApprovals: 0,
    completionRate: 0,
    avgBookingValue: 0
  });

  const [charts, setCharts] = useState({
    hourlyCounts: {},
    statusCounts: {},
    revenueTrends: []
  });

  const [selectedVelocityDate, setSelectedVelocityDate] = useState(null);
  const [selectedVolumeDate, setSelectedVolumeDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  const handleVelocityClick = (date) => {
    if (selectedVelocityDate === date) {
      setSelectedVelocityDate(null);
    } else {
      setSelectedVelocityDate(date);
    }
  };

  const handleVolumeClick = (date) => {
    if (selectedVolumeDate === date) {
      setSelectedVolumeDate(null);
    } else {
      setSelectedVolumeDate(date);
    }
  };

  const fetchStats = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      let query = `?preset=${preset}`;
      if (preset === 'custom') {
        if (startDate) query += `&startDate=${startDate}`;
        if (endDate) query += `&endDate=${endDate}`;
      }
      const res = await fetch(`${API_BASE}/api/admin/stats${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load admin stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setCharts(data.charts);
        setLastUpdated(new Date().toLocaleTimeString());
        setIsError(false);
        setErrorMessage('');
      } else {
        throw new Error(data.message || 'API returned failure status');
      }
    } catch (err) {
      console.error('Error loading admin stats:', err.message);
      setIsError(true);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [preset, startDate, endDate]);

  // Reset selected hour on preset change
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    setSelectedHour(null);
  };

  // Initial fetch on mount & filter change
  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  // Real-time auto-refresh polling (every 5 seconds with memory leak prevention)
  useEffect(() => {
    let isMounted = true;
    const pollInterval = setInterval(() => {
      if (isMounted) {
        fetchStats(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [fetchStats]);

  // Calculate dynamic stats for top 8 cards based on selected hour bar
  const displayStats = useMemo(() => {
    if (selectedHour === null) {
      return {
        ...stats,
        isFiltered: false,
        filterLabel: 'ALL-TIME OVERALL'
      };
    }

    const hourlyVolume = charts.hourlyCounts?.[selectedHour] || 0;
    const totalVolume = stats.totalBookings || 1;
    const ratio = totalVolume > 0 ? (hourlyVolume / totalVolume) : 0;

    const completed = Math.round((stats.completedRides || 0) * ratio);
    const cancelled = Math.round((stats.totalCancelledRides || 0) * ratio);
    const driverCancels = Math.round((stats.driverCancellations || 0) * ratio);
    const custCancels = Math.round((stats.customerCancellations || 0) * ratio);
    const totalRevenue = Math.round((stats.totalRevenue || 0) * ratio);
    const todaysRevenue = Math.round((stats.todaysRevenue || 0) * ratio);
    const activeRides = hourlyVolume > 0 ? Math.max(1, Math.round((stats.activeRides || 5) * ratio)) : 0;
    const formattedHour = selectedHour < 10 ? `0${selectedHour}:00` : `${selectedHour}:00`;

    return {
      totalUsers: stats.totalUsers,
      totalDrivers: stats.totalDrivers,
      activeRides,
      completedRides: completed,
      totalCancelledRides: cancelled,
      driverCancellations: driverCancels,
      customerCancellations: custCancels,
      totalRevenue,
      todaysRevenue,
      pendingDriverApprovals: stats.pendingDriverApprovals,
      completionRate: hourlyVolume > 0 ? Math.min(100, parseFloat(((completed / Math.max(1, hourlyVolume)) * 100).toFixed(1))) : stats.completionRate,
      isFiltered: true,
      filterLabel: `Hour Bar ${formattedHour} (${hourlyVolume} rides)`
    };
  }, [selectedHour, stats, charts.hourlyCounts]);

  const recentTrends = (charts.revenueTrends || []).slice(-15); // Show 15 most recent days ending today
  const maxRevenueTrend = Math.max(...recentTrends.map(r => r.revenue), 1);
  const maxBookingsTrend = Math.max(...recentTrends.map(r => r.bookings), 1);

  return (
    <div className="dashboard-page-container">
      {/* ── HEADER CONTROLS ── */}
      <div className="admin-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="admin-header-title">
              🛸 RIDEX Operations Control Center
            </h2>
            <span className="admin-live-sync-badge" style={{
              background: isError ? 'rgba(239, 68, 68, 0.15)' : undefined,
              color: isError ? '#ef4444' : undefined,
              borderColor: isError ? 'rgba(239, 68, 68, 0.4)' : undefined
            }}>
              {isError ? `⚠️ API CONNECTION ERROR — RETRYING EVERY 5S` : `● LIVE MONGO DB SYNC ${lastUpdated ? `(${lastUpdated})` : ''}`}
            </span>
            {selectedHour !== null && (
              <button
                onClick={() => setSelectedHour(null)}
                style={{
                  background: 'rgba(244, 114, 182, 0.2)',
                  border: '1px solid rgba(244, 114, 182, 0.5)',
                  color: '#f472b6',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(244, 114, 182, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕ Reset Hour Filter ({displayStats.filterLabel})
              </button>
            )}
          </div>
          <p className="admin-header-subtitle">
            Live MongoDB database metrics, ride aggregations & revenue analytics (auto-refreshes every 5s)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(19, 24, 36, 0.9)', padding: '6px 14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>Window:</span>
            <select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Time (Recent 30 Days)</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {preset === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="admin-input-date"
              />
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="admin-input-date"
              />
            </div>
          )}

          <button onClick={() => fetchStats(true)} className="admin-btn-secondary" title="Force Refresh">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '14px', textAlign: 'center', background: 'rgba(0, 237, 255, 0.08)', borderRadius: '16px', border: '1px solid rgba(0, 237, 255, 0.2)' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#00edff' }}>⌛ Querying MongoDB aggregation pipelines...</span>
        </div>
      )}

      {/* ── 8 UBER 3D STAT CARDS ── */}
      <div className="uber-kpi-grid-3d">
        {/* 1. Total Users */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d blue">👥</div>
            <div>
              <div className="uber-dash-title">Total Passengers</div>
              <div className="uber-dash-value">{displayStats.totalUsers.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge up">MongoDB</span> Registered riders directory
          </div>
        </div>

        {/* 2. Total Drivers */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d purple">🚗</div>
            <div>
              <div className="uber-dash-title">Total Drivers</div>
              <div className="uber-dash-value">{displayStats.totalDrivers.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge up">MongoDB</span> Registered fleet drivers
          </div>
        </div>

        {/* 3. Active Rides */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d cyan">⚡</div>
            <div>
              <div className="uber-dash-title">Active Rides</div>
              <div className="uber-dash-value">{displayStats.activeRides}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge up">Live</span> {displayStats.isFiltered ? `Active during ${displayStats.filterLabel}` : 'Ongoing trips in progress'}
          </div>
        </div>

        {/* 4. Completed Rides */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d emerald">🏁</div>
            <div>
              <div className="uber-dash-title">Completed Rides</div>
              <div className="uber-dash-value">{displayStats.completedRides.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge up">{displayStats.completionRate}%</span> {displayStats.isFiltered ? 'hour rate' : 'completion rate'}
          </div>
        </div>

        {/* 5. Cancelled Rides */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d red">❌</div>
            <div>
              <div className="uber-dash-title">Cancelled Rides</div>
              <div className="uber-dash-value">{displayStats.totalCancelledRides.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge down">Driver: {displayStats.driverCancellations || 0}</span> Cust: {displayStats.customerCancellations || 0}
          </div>
        </div>

        {/* 6. Total Revenue */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d gold">💰</div>
            <div>
              <div className="uber-dash-title">{displayStats.isFiltered ? 'Hourly Revenue' : 'Total Revenue'}</div>
              <div className="uber-dash-value" style={{ color: '#10b981' }}>₹{displayStats.totalRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge up">Gross</span> {displayStats.isFiltered ? `Fares for ${displayStats.filterLabel}` : 'Completed ride fares'}
          </div>
        </div>

        {/* 7. Today's Revenue */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d emerald">💵</div>
            <div>
              <div className="uber-dash-title">Today's Revenue</div>
              <div className="uber-dash-value" style={{ color: '#34d399' }}>₹{displayStats.todaysRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge up">Today</span> Midnight to now
          </div>
        </div>

        {/* 8. Pending Driver Approvals */}
        <div className="uber-dash-card-3d" style={{
          borderColor: displayStats.isFiltered ? 'rgba(244, 114, 182, 0.4)' : undefined,
          boxShadow: displayStats.isFiltered ? '0 0 15px rgba(244, 114, 182, 0.15)' : undefined
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="uber-dash-icon-3d gold">🪪</div>
            <div>
              <div className="uber-dash-title">Pending Approvals</div>
              <div className="uber-dash-value">{displayStats.pendingDriverApprovals}</div>
            </div>
          </div>
          <div className="uber-dash-footer">
            <span className="uber-trend-badge down">Action</span> Inactive driver accounts
          </div>
        </div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="admin-charts-grid" style={{ marginTop: '24px' }}>
        {/* 3D Peak Hourly Booking Volume Chart */}
        <PeakHourly3DChart
          hourlyCounts={charts.hourlyCounts}
          selectedPreset={preset}
          isLoading={isLoading}
          onHourSelect={(hour) => setSelectedHour(hour)}
        />

        {/* Booking Outcome Split */}
        <div className="uber-chart-panel-3d">
          <div className="uber-panel-header">
            <div className="uber-panel-title">
              <span>🎯 Ride Outcome Distribution</span>
            </div>
            <span className="uber-panel-sub">Status Breakdown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(charts.statusCounts || {}).map(([st, count]) => {
              const total = stats.totalBookings || 1;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
              let color = '#10b981';
              if (st.includes('Driver')) color = '#f97316';
              if (st.includes('Customer')) color = '#ef4444';
              if (st === 'No Driver Found') color = '#fbbf24';
              if (st === 'Incomplete') color = '#c084fc';

              return (
                <div key={st}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                      {st}
                    </span>
                    <span>{count.toLocaleString('en-IN')} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '10px', transition: 'width 0.5s ease', boxShadow: `0 0 12px ${color}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── REVENUE TRENDS & DAILY RIDES ── */}
      <div className="admin-charts-grid" style={{ marginTop: '24px' }}>
        {/* Daily Revenue Velocity */}
        <div className="uber-chart-panel-3d">
          <div className="uber-panel-header">
            <div className="uber-panel-title">
              <span>💰 Daily Revenue Velocity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="uber-panel-sub">Day-over-Day Growth Rate</span>
              {selectedVelocityDate !== null && (
                <button
                  onClick={() => setSelectedVelocityDate(null)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Click to unblur all dates"
                >
                  ✨ View All (Unblur)
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {recentTrends.length > 0 ? (
              recentTrends.map((item) => {
                const widthPct = Math.max((item.revenue / maxRevenueTrend) * 100, 5);
                const velocity = item.velocityPct || 0;
                const isPos = velocity > 0;
                const isNeg = velocity < 0;
                const velColor = isPos ? '#34d399' : isNeg ? '#fca5a5' : '#94a3b8';
                const velSymbol = isPos ? '▲ +' : isNeg ? '▼ ' : '● ';

                const hasVelocityFocus = selectedVelocityDate !== null;
                const isSelected = selectedVelocityDate === item.date;
                const isBlurred = hasVelocityFocus && !isSelected;

                return (
                  <div
                    key={item.date}
                    onClick={() => handleVelocityClick(item.date)}
                    title={isSelected ? 'Click again to unblur all dates' : `Click to focus ${item.date}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: isBlurred ? 'blur(4px) opacity(0.28) grayscale(40%)' : 'none',
                      opacity: isBlurred ? 0.28 : 1,
                      transform: isSelected ? 'scale(1.015) translateX(3px)' : (isBlurred ? 'scale(0.98)' : 'none'),
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                      boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                  >
                    <span style={{ width: '90px', color: isSelected ? '#34d399' : '#94a3b8', fontWeight: isSelected ? 800 : 600, fontFamily: 'var(--font-mono)' }}>{item.date}</span>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '22px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${widthPct}%`,
                        background: isSelected ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #10b981, #34d399)',
                        height: '100%',
                        borderRadius: '8px',
                        transition: 'width 0.5s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.8)' : 'none'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isPos ? 'rgba(16,185,129,0.18)' : isNeg ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.05)',
                      color: velColor,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {velSymbol}{velocity}%
                    </span>
                    <span style={{ width: '85px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No completed ride revenue data available for selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Daily Ride Volumes */}
        <div className="uber-chart-panel-3d">
          <div className="uber-panel-header">
            <div className="uber-panel-title">
              <span>📊 Daily Ride Volumes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="uber-panel-sub">Recent Trip Counts</span>
              {selectedVolumeDate !== null && (
                <button
                  onClick={() => setSelectedVolumeDate(null)}
                  style={{
                    background: 'rgba(0, 237, 255, 0.2)',
                    border: '1px solid rgba(0, 237, 255, 0.4)',
                    color: '#00edff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Click to unblur all dates"
                >
                  ✨ View All (Unblur)
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {recentTrends.length > 0 ? (
              recentTrends.map((item) => {
                const widthPct = Math.max((item.bookings / maxBookingsTrend) * 100, 5);

                const hasVolumeFocus = selectedVolumeDate !== null;
                const isSelected = selectedVolumeDate === item.date;
                const isBlurred = hasVolumeFocus && !isSelected;

                return (
                  <div
                    key={item.date}
                    onClick={() => handleVolumeClick(item.date)}
                    title={isSelected ? 'Click again to unblur all dates' : `Click to focus ${item.date}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: isBlurred ? 'blur(4px) opacity(0.28) grayscale(40%)' : 'none',
                      opacity: isBlurred ? 0.28 : 1,
                      transform: isSelected ? 'scale(1.015) translateX(3px)' : (isBlurred ? 'scale(0.98)' : 'none'),
                      background: isSelected ? 'rgba(0, 237, 255, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(0, 237, 255, 0.4)' : '1px solid transparent',
                      boxShadow: isSelected ? '0 0 15px rgba(0, 237, 255, 0.25)' : 'none'
                    }}
                  >
                    <span style={{ width: '90px', color: isSelected ? '#00edff' : '#94a3b8', fontWeight: isSelected ? 800 : 600, fontFamily: 'var(--font-mono)' }}>{item.date}</span>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '22px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${widthPct}%`,
                        background: isSelected ? 'linear-gradient(90deg, #00edff, #a78bfa)' : 'linear-gradient(90deg, #00edff, #8b5cf6)',
                        height: '100%',
                        borderRadius: '8px',
                        transition: 'width 0.5s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(0, 237, 255, 0.8)' : 'none'
                      }} />
                    </div>
                    <span style={{ width: '90px', textAlign: 'right', fontWeight: 800, color: isSelected ? '#00edff' : '#c084fc' }}>
                      {item.bookings} rides
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                No trip volume data available for selected filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
