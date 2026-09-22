import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import './AdminRevenue.css';

export default function AdminRevenue() {
  const [preset, setPreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState({
    revenue: { totalRevenue: 0, todaysRevenue: 0, totalCompleted: 0, avgFare: 0, avgDistance: 0 },
    vehicleRevenue: [],
    paymentRevenue: [],
    topRides: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleVehicleClick = (id) => {
    setSelectedVehicle(prev => (prev === id ? null : id));
  };

  const handlePaymentClick = (id) => {
    setSelectedPayment(prev => (prev === id ? null : id));
  };

  const fetchRevenue = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      let queryParams = `preset=${preset}`;
      if (preset === 'custom') {
        if (startDate) queryParams += `&startDate=${startDate}`;
        if (endDate) queryParams += `&endDate=${endDate}`;
      }
      const res = await fetch(`${API_BASE}/api/admin/revenue?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch revenue analytics');
      const data = await res.json();
      if (data.success) {
        setRevenueData(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error loading revenue stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [preset, startDate, endDate]);

  // Initial fetch on mount & preset/date change
  useEffect(() => {
    fetchRevenue(true);
  }, [fetchRevenue]);

  // Real-time 5-second auto-polling
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRevenue(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchRevenue]);

  const maxVehicleRev = useMemo(() => Math.max(...(revenueData.vehicleRevenue || []).map(v => v.total), 1), [revenueData.vehicleRevenue]);
  const maxPaymentRev = useMemo(() => Math.max(...(revenueData.paymentRevenue || []).map(p => p.total), 1), [revenueData.paymentRevenue]);

  const totalVehicleSum = useMemo(() => (revenueData.vehicleRevenue || []).reduce((acc, v) => acc + (v.total || 0), 0), [revenueData.vehicleRevenue]);
  const totalPaymentSum = useMemo(() => (revenueData.paymentRevenue || []).reduce((acc, p) => acc + (p.total || 0), 0), [revenueData.paymentRevenue]);

  // Calculate dynamic KPIs based on selected vehicle/payment filter
  const displayKPIs = useMemo(() => {
    const baseRev = revenueData.revenue?.totalRevenue || 0;
    const baseToday = revenueData.revenue?.todaysRevenue || 0;
    const baseCompleted = revenueData.revenue?.totalCompleted || 0;
    const baseAvgFare = revenueData.revenue?.avgFare || 0;
    const baseAvgDist = revenueData.revenue?.avgDistance || 0;

    let vMatch = selectedVehicle ? (revenueData.vehicleRevenue || []).find(v => v._id === selectedVehicle) : null;
    let pMatch = selectedPayment ? (revenueData.paymentRevenue || []).find(p => p._id === selectedPayment) : null;

    if (vMatch) {
      const vTotal = vMatch.total || 0;
      const vCount = vMatch.count || 0;
      const vAvgFare = vCount > 0 ? Math.round(vTotal / vCount) : 0;
      return {
        totalRevenue: vTotal,
        todaysRevenue: baseToday,
        totalCompleted: vCount,
        avgFare: vAvgFare,
        avgDistance: baseAvgDist,
        filterText: `Vehicle Filter: ${selectedVehicle}`
      };
    }

    if (pMatch) {
      const pTotal = pMatch.total || 0;
      const pCount = pMatch.count || 0;
      const pAvgFare = pCount > 0 ? Math.round(pTotal / pCount) : 0;
      return {
        totalRevenue: pTotal,
        todaysRevenue: baseToday,
        totalCompleted: pCount,
        avgFare: pAvgFare,
        avgDistance: baseAvgDist,
        filterText: `Payment Gateway: ${selectedPayment}`
      };
    }

    return {
      totalRevenue: baseRev,
      todaysRevenue: baseToday,
      totalCompleted: baseCompleted,
      avgFare: baseAvgFare,
      avgDistance: baseAvgDist,
      filterText: null
    };
  }, [revenueData, selectedVehicle, selectedPayment]);

  const filteredTopRides = useMemo(() => {
    let list = revenueData.topRides || [];
    if (selectedVehicle) {
      list = list.filter(r => r.vehicleType === selectedVehicle);
    }
    if (selectedPayment) {
      list = list.filter(r => r.paymentMethod === selectedPayment);
    }
    return list;
  }, [revenueData.topRides, selectedVehicle, selectedPayment]);

  // Vehicle category color palette
  const vehicleColors = useMemo(() => ({
    'Auto': '#f59e0b',
    'Go Sedan': '#3b82f6',
    'Premier Sedan': '#ec4899',
    'Uber XL': '#8b5cf6',
    'Bike': '#10b981',
    'eBike': '#14b8a6'
  }), []);

  // Payment method color palette
  const paymentColors = useMemo(() => ({
    'UPI': '#3b82f6',
    'Cash': '#10b981',
    'Card': '#8b5cf6',
    'Uber Wallet': '#f59e0b'
  }), []);

  // Compute Donut SVG paths dynamically
  const donutSegments = useMemo(() => {
    const list = revenueData.vehicleRevenue || [];
    if (!list.length || totalVehicleSum === 0) return [];
    
    let currentOffset = 0;
    const circumference = 2 * Math.PI * 40; // R=40 -> C=251.327

    return list.map((v) => {
      const pct = v.total / totalVehicleSum;
      const strokeDash = pct * circumference;
      const strokeGap = circumference - strokeDash;
      const offset = currentOffset;
      currentOffset -= strokeDash;

      const color = vehicleColors[v._id] || '#00edff';

      return {
        id: v._id,
        count: v.count,
        total: v.total,
        pct: (pct * 100).toFixed(1),
        strokeDasharray: `${strokeDash} ${strokeGap}`,
        strokeDashoffset: offset,
        color
      };
    });
  }, [revenueData.vehicleRevenue, totalVehicleSum, vehicleColors]);

  return (
    <div className="rev-command-hub">
      {/* ── TOP HEADER SECTION ── */}
      <header className="rev-hub-header">
        <div className="rev-header-titles">
          <div className="rev-badge-title-group">
            <h1 className="rev-hub-title">Revenue Intelligence</h1>
            <div className="rev-live-indicator">
              <span className="rev-pulse-dot" />
              <span className="rev-pulse-text">LIVE MONGO SYNC {lastUpdated && `(${lastUpdated})`}</span>
            </div>
            {(selectedVehicle !== null || selectedPayment !== null) && (
              <button
                onClick={() => { setSelectedVehicle(null); setSelectedPayment(null); }}
                className="rev-reset-filter-chip"
              >
                ✕ Clear Active Filter ({displayKPIs.filterText})
              </button>
            )}
          </div>
          <p className="rev-hub-subtitle">
            Dynamic date-wise revenue totals, ticket size & breakdown by vehicle and payment method
          </p>
        </div>

        <div className="rev-header-actions">
          {preset === 'custom' && (
            <div className="rev-custom-dates">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rev-date-ctrl"
                title="Start Date"
              />
              <span className="rev-date-to">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rev-date-ctrl"
                title="End Date"
              />
            </div>
          )}

          <div className="rev-select-box">
            <select
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value);
                if (e.target.value !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="rev-filter-dropdown"
            >
              <option value="all">🌐 All Time Historical</option>
              <option value="today">📅 Today</option>
              <option value="7days">📆 Last 7 Days</option>
              <option value="30days">🗓️ Last 30 Days</option>
              <option value="thisMonth">📊 This Month</option>
              <option value="thisYear">📈 This Year</option>
              <option value="custom">🔍 Custom Date Range</option>
            </select>
          </div>

          <button onClick={() => fetchRevenue(true)} className="rev-btn-refresh">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </header>

      {/* ── SECOND: ACTIVE FILTER BAR ── */}
      <div className="rev-active-status-bar">
        <div className="rev-status-left">
          <span className="rev-status-tag">ACTIVE FILTER WINDOW</span>
          <span className="rev-status-value">
            {preset === 'all' && 'All Time Historical Data'}
            {preset === 'today' && 'Today Only'}
            {preset === '7days' && 'Last 7 Days (Rolling Window)'}
            {preset === '30days' && 'Last 30 Days'}
            {preset === 'thisMonth' && 'Current Calendar Month'}
            {preset === 'thisYear' && 'Current Year (Year-to-Date)'}
            {preset === 'custom' && (startDate || endDate ? `${startDate || 'Beginning'} ➔ ${endDate || 'Today'}` : 'Custom Date Range')}
            {displayKPIs.filterText && ` • ${displayKPIs.filterText}`}
          </span>
        </div>
        <div className="rev-status-right">
          <span className="rev-telemetry-badge">⚡ Real-Time Operational Stream</span>
        </div>
      </div>

      {isLoading && (
        <div className="rev-loading-wrapper">
          <div className="rev-glow-spinner" />
          <p>Fetching MongoDB financial aggregations...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── THIRD: 5 EXECUTIVE KPI CARDS ── */}
          <section className="rev-kpi-deck">
            {/* KPI 1 */}
            <div className="rev-kpi-module theme-blue">
              <div className="rev-kpi-top">
                <span className="rev-kpi-tag">Selected Window Revenue</span>
                <div className="rev-kpi-ico blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div className="rev-kpi-main">
                <div className="rev-kpi-num">₹{displayKPIs.totalRevenue.toLocaleString('en-IN')}</div>
                <div className="rev-kpi-trend pos">↑ 12.4% <span className="rev-trend-sub">vs prev</span></div>
              </div>
              <p className="rev-kpi-desc">{displayKPIs.filterText || 'Total completed fare earnings'}</p>
              {/* Sparkline Visual */}
              <div className="rev-sparkline-wrap">
                <svg viewBox="0 0 100 24" className="rev-sparkline blue">
                  <path d="M0,20 Q20,5 40,15 T80,4 T100,12" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                  <path d="M0,20 Q20,5 40,15 T80,4 T100,12 L100,24 L0,24 Z" fill="url(#gradBlue)" opacity="0.25" />
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rev-kpi-module theme-emerald">
              <div className="rev-kpi-top">
                <span className="rev-kpi-tag">Today's Revenue</span>
                <div className="rev-kpi-ico emerald">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
              </div>
              <div className="rev-kpi-main">
                <div className="rev-kpi-num">₹{displayKPIs.todaysRevenue.toLocaleString('en-IN')}</div>
                <div className="rev-kpi-trend pos">↑ 8.6% <span className="rev-trend-sub">today</span></div>
              </div>
              <p className="rev-kpi-desc">Collected today</p>
              <div className="rev-sparkline-wrap">
                <svg viewBox="0 0 100 24" className="rev-sparkline emerald">
                  <path d="M0,18 Q25,8 50,14 T85,3 T100,8" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  <path d="M0,18 Q25,8 50,14 T85,3 T100,8 L100,24 L0,24 Z" fill="url(#gradEmerald)" opacity="0.25" />
                  <defs>
                    <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rev-kpi-module theme-cyan">
              <div className="rev-kpi-top">
                <span className="rev-kpi-tag">Completed Paid Rides</span>
                <div className="rev-kpi-ico cyan">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
              <div className="rev-kpi-main">
                <div className="rev-kpi-num">{displayKPIs.totalCompleted.toLocaleString('en-IN')}</div>
                <div className="rev-kpi-trend pos">↑ 15.1% <span className="rev-trend-sub">volume</span></div>
              </div>
              <p className="rev-kpi-desc">Fulfilled bookings in range</p>
              <div className="rev-sparkline-wrap">
                <svg viewBox="0 0 100 24" className="rev-sparkline cyan">
                  <path d="M0,22 Q30,12 55,16 T80,5 T100,2" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                  <path d="M0,22 Q30,12 55,16 T80,5 T100,2 L100,24 L0,24 Z" fill="url(#gradCyan)" opacity="0.25" />
                  <defs>
                    <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rev-kpi-module theme-purple">
              <div className="rev-kpi-top">
                <span className="rev-kpi-tag">Avg Fare / Ride</span>
                <div className="rev-kpi-ico purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
              </div>
              <div className="rev-kpi-main">
                <div className="rev-kpi-num">₹{displayKPIs.avgFare.toLocaleString('en-IN')}</div>
                <div className="rev-kpi-trend neutral">→ 0.4% <span className="rev-trend-sub">ticket</span></div>
              </div>
              <p className="rev-kpi-desc">Average ticket size</p>
              <div className="rev-sparkline-wrap">
                <svg viewBox="0 0 100 24" className="rev-sparkline purple">
                  <path d="M0,15 Q20,18 40,10 T80,12 T100,8" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                  <path d="M0,15 Q20,18 40,10 T80,12 T100,8 L100,24 L0,24 Z" fill="url(#gradPurple)" opacity="0.25" />
                  <defs>
                    <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="rev-kpi-module theme-orange">
              <div className="rev-kpi-top">
                <span className="rev-kpi-tag">Avg Distance</span>
                <div className="rev-kpi-ico orange">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
              </div>
              <div className="rev-kpi-main">
                <div className="rev-kpi-num">{displayKPIs.avgDistance} <span className="rev-unit-span">KM</span></div>
                <div className="rev-kpi-trend pos">↑ 3.2% <span className="rev-trend-sub">coverage</span></div>
              </div>
              <p className="rev-kpi-desc">Coverage per trip</p>
              <div className="rev-sparkline-wrap">
                <svg viewBox="0 0 100 24" className="rev-sparkline orange">
                  <path d="M0,12 Q25,20 50,8 T80,14 T100,6" fill="none" stroke="#f97316" strokeWidth="2.5" />
                  <path d="M0,12 Q25,20 50,8 T80,14 T100,6 L100,24 L0,24 Z" fill="url(#gradOrange)" opacity="0.25" />
                  <defs>
                    <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </section>

          {/* ── FOURTH: TWO LARGE ANALYTICS PANELS ── */}
          <section className="rev-analytics-split">
            {/* LEFT PANEL: DONUT / RING CHART FOR VEHICLES */}
            <div className="rev-card-panel">
              <div className="rev-panel-top">
                <div className="rev-panel-heading">
                  <div className="rev-panel-icon vehicle">🚗</div>
                  <div>
                    <h2 className="rev-panel-title">Revenue Share by Vehicle Category</h2>
                    <p className="rev-panel-sub">Fleet segment revenue distribution</p>
                  </div>
                </div>
                {selectedVehicle !== null && (
                  <button onClick={() => setSelectedVehicle(null)} className="rev-unfilter-btn">
                    ✕ Reset Vehicle Filter
                  </button>
                )}
              </div>

              <div className="rev-donut-panel-body">
                {donutSegments.length > 0 ? (
                  <div className="rev-donut-layout">
                    {/* Dynamic SVG Donut Chart */}
                    <div className="rev-donut-chart-container">
                      <svg viewBox="0 0 100 100" className="rev-donut-svg">
                        <circle cx="50" cy="50" r="40" className="rev-donut-bg" />
                        {donutSegments.map((seg) => (
                          <circle
                            key={seg.id}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={seg.strokeDasharray}
                            strokeDashoffset={seg.strokeDashoffset}
                            className={`rev-donut-segment ${selectedVehicle === seg.id ? 'active' : ''} ${selectedVehicle && selectedVehicle !== seg.id ? 'dimmed' : ''}`}
                            onClick={() => handleVehicleClick(seg.id)}
                          >
                            <title>{`${seg.id}: ₹${seg.total.toLocaleString('en-IN')} (${seg.pct}%)`}</title>
                          </circle>
                        ))}
                      </svg>
                      <div className="rev-donut-center">
                        <span className="rev-donut-center-label">TOTAL REVENUE</span>
                        <span className="rev-donut-center-val">₹{totalVehicleSum.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Category Legend & Stats List */}
                    <div className="rev-legend-list">
                      {donutSegments.map((seg) => {
                        const isSelected = selectedVehicle === seg.id;
                        const isBlurred = selectedVehicle !== null && !isSelected;

                        return (
                          <div
                            key={seg.id}
                            onClick={() => handleVehicleClick(seg.id)}
                            className={`rev-legend-item ${isSelected ? 'selected' : ''} ${isBlurred ? 'blurred' : ''}`}
                          >
                            <div className="rev-legend-row">
                              <div className="rev-legend-left">
                                <span className="rev-dot-pill" style={{ background: seg.color, boxShadow: `0 0 8px ${seg.color}` }} />
                                <span className="rev-legend-name">{seg.id}</span>
                                <span className="rev-legend-count">({seg.count} rides)</span>
                              </div>
                              <div className="rev-legend-right">
                                <span className="rev-legend-pct" style={{ color: seg.color }}>{seg.pct}%</span>
                                <span className="rev-legend-amount">₹{seg.total.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <div className="rev-mini-progress-track">
                              <div
                                className="rev-mini-progress-fill"
                                style={{ width: `${seg.pct}%`, background: seg.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rev-empty-msg">No vehicle category data found.</div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: PAYMENT METHOD HORIZONTAL PROGRESS BARS */}
            <div className="rev-card-panel">
              <div className="rev-panel-top">
                <div className="rev-panel-heading">
                  <div className="rev-panel-icon payment">💳</div>
                  <div>
                    <h2 className="rev-panel-title">Revenue Share by Payment Method</h2>
                    <p className="rev-panel-sub">Gateway & payment channel split</p>
                  </div>
                </div>
                {selectedPayment !== null && (
                  <button onClick={() => setSelectedPayment(null)} className="rev-unfilter-btn">
                    ✕ Reset Payment Filter
                  </button>
                )}
              </div>

              <div className="rev-payment-panel-body">
                {(revenueData.paymentRevenue || []).length > 0 ? (
                  <div className="rev-payment-bars-list">
                    {revenueData.paymentRevenue.map((p) => {
                      const pct = totalPaymentSum > 0 ? ((p.total / totalPaymentSum) * 100).toFixed(1) : 0;
                      const widthPct = Math.max((p.total / maxPaymentRev) * 100, 4);
                      const isSelected = selectedPayment === p._id;
                      const isBlurred = selectedPayment !== null && !isSelected;
                      const color = paymentColors[p._id] || '#8b5cf6';

                      const icon = p._id === 'UPI' ? '⚡' : p._id === 'Cash' ? '💵' : p._id === 'Card' ? '💳' : '👛';

                      return (
                        <div
                          key={p._id}
                          onClick={() => handlePaymentClick(p._id)}
                          className={`rev-payment-row-card ${isSelected ? 'selected' : ''} ${isBlurred ? 'blurred' : ''}`}
                        >
                          <div className="rev-pay-row-header">
                            <div className="rev-pay-left">
                              <span className="rev-pay-icon" style={{ background: `${color}20`, color }}>{icon}</span>
                              <span className="rev-pay-name">{p._id}</span>
                              <span className="rev-pay-badge">{p.count} txns</span>
                            </div>
                            <div className="rev-pay-right">
                              <span className="rev-pay-pct" style={{ color }}>{pct}%</span>
                              <span className="rev-pay-amount">₹{p.total.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="rev-pay-bar-track">
                            <div
                              className="rev-pay-bar-fill"
                              style={{
                                width: `${widthPct}%`,
                                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                boxShadow: isSelected ? `0 0 12px ${color}` : 'none'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rev-empty-msg">No payment channel data found.</div>
                )}
              </div>
            </div>
          </section>

          {/* ── FIFTH: TOP HIGHEST VALUE FARE TRANSACTIONS TABLE ── */}
          <section className="rev-card-panel full-width">
            <div className="rev-panel-top">
              <div className="rev-panel-heading">
                <div className="rev-panel-icon table">💎</div>
                <div>
                  <h2 className="rev-panel-title">Top Highest Value Fare Transactions</h2>
                  <p className="rev-panel-sub">Highest revenue trip records in selected filter range</p>
                </div>
              </div>
              <span className="rev-records-count-badge">{filteredTopRides.length} Records Returned</span>
            </div>

            <div className="rev-table-wrapper">
              <table className="rev-data-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Pickup Location</th>
                    <th>Destination</th>
                    <th>Distance</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Fare Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopRides.map((r) => {
                    const vInfo = ((vType) => {
                      if (vType === 'Uber XL') return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.35)', color: '#c084fc', icon: '🚙' };
                      if (vType === 'Premier Sedan') return { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.35)', color: '#f472b6', icon: '👑' };
                      if (vType === 'Go Sedan') return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', color: '#60a5fa', icon: '🚘' };
                      if (vType === 'Auto') return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', color: '#fbbf24', icon: '🛺' };
                      if (vType === 'Bike' || vType === 'eBike') return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', color: '#34d399', icon: '🛵' };
                      return { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)', color: '#818cf8', icon: '🚗' };
                    })(r.vehicleType);

                    return (
                      <tr key={r._id} className="rev-table-row">
                        <td>
                          <span className="rev-badge-booking">🎫 {r.bookingId}</span>
                        </td>
                        <td className="rev-date-col">
                          {new Date(r.bookingDate).toISOString().split('T')[0]}
                        </td>
                        <td>
                          <span
                            className="rev-badge-vehicle"
                            style={{
                              background: vInfo.bg,
                              borderColor: vInfo.border,
                              color: vInfo.color
                            }}
                          >
                            <span>{vInfo.icon}</span>
                            <span>{r.vehicleType}</span>
                          </span>
                        </td>
                        <td className="rev-loc-col" title={r.pickupLocation}>
                          <span className="rev-indicator pickup" />
                          <span className="rev-loc-name">{r.pickupLocation}</span>
                        </td>
                        <td className="rev-loc-col" title={r.dropLocation}>
                          <span className="rev-indicator drop" />
                          <span className="rev-loc-name">{r.dropLocation}</span>
                        </td>
                        <td className="rev-dist-col">
                          {r.distance} KM
                        </td>
                        <td>
                          <span className="rev-badge-payment">
                            {r.paymentMethod || 'UPI'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="rev-fare-pill">
                            ₹{r.fare.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTopRides.length === 0 && (
                    <tr>
                      <td colSpan="8" className="rev-table-empty">
                        No transactions match the selected date range or active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
