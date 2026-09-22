import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import './AdminRides.css';

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRides = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      let query = `?page=${page}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;
      if (vehicleFilter) query += `&vehicleType=${encodeURIComponent(vehicleFilter)}`;
      if (paymentFilter) query += `&paymentMethod=${encodeURIComponent(paymentFilter)}`;

      const res = await fetch(`${API_BASE}/api/admin/rides${query}`);
      if (!res.ok) throw new Error('Failed to fetch rides');
      const data = await res.json();
      if (data.success) {
        setRides(data.rides);
        setTotal(data.total);
        setPages(data.pages);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching rides:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, vehicleFilter, paymentFilter]);

  // Initial fetch
  useEffect(() => {
    fetchRides(true);
  }, [fetchRides]);

  // 5-second auto-polling for real-time ride stream
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRides(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchRides]);

  const handleExportCSV = () => {
    let query = '?';
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;
    if (vehicleFilter) query += `&vehicleType=${encodeURIComponent(vehicleFilter)}`;
    if (paymentFilter) query += `&paymentMethod=${encodeURIComponent(paymentFilter)}`;
    window.open(`${API_BASE}/api/bookings/export${query}`, '_blank');
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setVehicleFilter('');
    setPaymentFilter('');
    setPage(1);
  };

  // Compute dynamic KPI metrics from loaded ride dataset
  const kpiMetrics = useMemo(() => {
    const totalLoaded = rides.length;
    let completed = 0;
    let inProgress = 0;
    let cancelled = 0;
    let totalFareSum = 0;

    rides.forEach((r) => {
      if (r.status === 'Completed') completed++;
      else if (r.status === 'In Progress' || r.status === 'Driver Assigned' || r.status === 'Arrived') inProgress++;
      else cancelled++;

      totalFareSum += (r.fare || 0);
    });

    const completedPct = totalLoaded > 0 ? Math.round((completed / totalLoaded) * 100) : 0;
    const cancelledPct = totalLoaded > 0 ? Math.round((cancelled / totalLoaded) * 100) : 0;

    return {
      totalVolume: total,
      completed,
      completedPct,
      inProgress,
      cancelled,
      cancelledPct,
      totalFareSum
    };
  }, [rides, total]);

  // Compute vehicle breakdown dynamically from current page rides
  const vehicleStats = useMemo(() => {
    const counts = {};
    rides.forEach((r) => {
      const type = r.vehicleType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    const totalRidesOnPage = rides.length || 1;
    const vehicleColors = {
      'Auto': '#f59e0b',
      'Go Sedan': '#3b82f6',
      'Premier Sedan': '#ec4899',
      'Uber XL': '#8b5cf6',
      'Bike': '#10b981',
      'eBike': '#14b8a6',
      'Go Mini': '#06b6d4'
    };

    return Object.keys(counts).map((type) => {
      const count = counts[type];
      const pct = Math.round((count / totalRidesOnPage) * 100);
      const color = vehicleColors[type] || '#6366f1';
      return { type, count, pct, color };
    }).sort((a, b) => b.count - a.count);
  }, [rides]);

  // Compute Donut SVG segments dynamically
  const donutSegments = useMemo(() => {
    if (!vehicleStats.length) return [];
    let currentOffset = 0;
    const circumference = 2 * Math.PI * 40; // R=40 -> 251.327

    return vehicleStats.map((v) => {
      const fraction = v.pct / 100;
      const strokeDash = fraction * circumference;
      const strokeGap = circumference - strokeDash;
      const offset = currentOffset;
      currentOffset -= strokeDash;

      return {
        ...v,
        strokeDasharray: `${strokeDash} ${strokeGap}`,
        strokeDashoffset: offset
      };
    });
  }, [vehicleStats]);

  // Compute status breakdown dynamically
  const statusStats = useMemo(() => {
    const counts = {
      'Completed': 0,
      'Cancelled by Driver': 0,
      'Cancelled by Customer': 0,
      'No Driver Found': 0,
      'Incomplete': 0
    };

    rides.forEach((r) => {
      const st = r.status || 'Incomplete';
      counts[st] = (counts[st] || 0) + 1;
    });

    const totalRidesOnPage = rides.length || 1;

    return [
      { status: 'Completed', label: 'Completed Trips', count: counts['Completed'], color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
      { status: 'Cancelled by Driver', label: 'Cancelled (Driver)', count: counts['Cancelled by Driver'], color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
      { status: 'Cancelled by Customer', label: 'Cancelled (Customer)', count: counts['Cancelled by Customer'], color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
      { status: 'No Driver Found', label: 'No Driver Found', count: counts['No Driver Found'], color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
      { status: 'Incomplete', label: 'Incomplete / Pending', count: counts['Incomplete'], color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
    ].map(s => ({
      ...s,
      pct: Math.round((s.count / totalRidesOnPage) * 100)
    }));
  }, [rides]);

  const hasActiveFilters = Boolean(search || statusFilter || vehicleFilter || paymentFilter);

  return (
    <div className="rides-command-hub">
      {/* ── HERO / PAGE HEADER ── */}
      <header className="rides-hub-header">
        <div className="rides-header-titles">
          <div className="rides-title-badge-group">
            <h1 className="rides-hub-title">🚗 Rides Log & Audit Stream</h1>
            <div className="rides-live-badge">
              <span className="rides-pulse-dot" />
              <span className="rides-pulse-text">LIVE MONGO STREAM {lastUpdated && `(${lastUpdated})`}</span>
            </div>
            {hasActiveFilters && (
              <button onClick={handleResetFilters} className="rides-clear-filter-btn">
                ✕ Reset Active Filters
              </button>
            )}
          </div>
          <p className="rides-hub-subtitle">
            Complete audit trail of all ride operations, pickup/drop coordinates, fare calculation & trip status ({total.toLocaleString('en-IN')} total rides in MongoDB)
          </p>
        </div>

        <div className="rides-header-actions">
          <div className="rides-date-badge">
            <span className="rides-date-ico">📅</span>
            <span>Real-time Audit Stream</span>
          </div>
          <button onClick={() => fetchRides(true)} className="rides-btn-refresh">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            <span>Refresh Stream</span>
          </button>
        </div>
      </header>

      {/* ── COMMAND SEARCH + FILTER BAR ── */}
      <div className="rides-command-bar">
        <div className="rides-search-box">
          <svg className="rides-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search Booking ID, pickup, drop location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rides-input-search"
          />
          {search && (
            <button onClick={() => setSearch('')} className="rides-clear-search-btn">✕</button>
          )}
        </div>

        <div className="rides-filter-group">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rides-filter-select"
          >
            <option value="">All Trip Statuses</option>
            <option value="Completed">🟢 Completed</option>
            <option value="Cancelled by Driver">🟠 Cancelled by Driver</option>
            <option value="Cancelled by Customer">🔴 Cancelled by Customer</option>
            <option value="No Driver Found">🟡 No Driver Found</option>
            <option value="Incomplete">🟣 Incomplete</option>
          </select>

          <select
            value={vehicleFilter}
            onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
            className="rides-filter-select"
          >
            <option value="">All Vehicle Types</option>
            <option value="Auto">🛺 Auto</option>
            <option value="Go Mini">🚘 Go Mini</option>
            <option value="Go Sedan">🚗 Go Sedan</option>
            <option value="Premier Sedan">👑 Premier Sedan</option>
            <option value="Uber XL">🚙 Uber XL</option>
            <option value="Bike">🛵 Bike</option>
            <option value="eBike">⚡ eBike</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="rides-filter-select"
          >
            <option value="">All Payment Methods</option>
            <option value="UPI">⚡ UPI</option>
            <option value="Cash">💵 Cash</option>
            <option value="Card">💳 Credit / Debit Card</option>
            <option value="Uber Wallet">👛 Uber Wallet</option>
          </select>

          <button onClick={handleExportCSV} className="rides-btn-csv" title="Export rides matching query to CSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rides-loading-card">
          <div className="rides-spinner" />
          <p className="rides-loading-text">Querying MongoDB master ride audit stream...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── EXECUTIVE KPI CARDS (5 MODULES) ── */}
          <section className="rides-kpi-deck">
            {/* KPI 1 */}
            <div className="rides-kpi-card theme-blue">
              <div className="rides-kpi-top">
                <span className="rides-kpi-tag">Total Database Volume</span>
                <div className="rides-kpi-ico blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                </div>
              </div>
              <div className="rides-kpi-main">
                <div className="rides-kpi-val">{kpiMetrics.totalVolume.toLocaleString('en-IN')}</div>
                <span className="rides-kpi-badge pos">↑ Live DB</span>
              </div>
              <p className="rides-kpi-sub">Total MongoDB trip records</p>
              <div className="rides-sparkline-box">
                <svg viewBox="0 0 100 24" className="rides-sparkline blue">
                  <path d="M0,20 Q20,5 40,15 T80,4 T100,12" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                  <path d="M0,20 Q20,5 40,15 T80,4 T100,12 L100,24 L0,24 Z" fill="url(#rGradBlue)" opacity="0.25" />
                  <defs>
                    <linearGradient id="rGradBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rides-kpi-card theme-emerald">
              <div className="rides-kpi-top">
                <span className="rides-kpi-tag">Completed Trips (Page)</span>
                <div className="rides-kpi-ico emerald">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
              <div className="rides-kpi-main">
                <div className="rides-kpi-val">{kpiMetrics.completed} <span className="rides-kpi-pct-span">({kpiMetrics.completedPct}%)</span></div>
                <span className="rides-kpi-badge pos">↑ Fulfilling</span>
              </div>
              <p className="rides-kpi-sub">Successfully fulfilled trips</p>
              <div className="rides-sparkline-box">
                <svg viewBox="0 0 100 24" className="rides-sparkline emerald">
                  <path d="M0,18 Q25,8 50,14 T85,3 T100,8" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  <path d="M0,18 Q25,8 50,14 T85,3 T100,8 L100,24 L0,24 Z" fill="url(#rGradEmerald)" opacity="0.25" />
                  <defs>
                    <linearGradient id="rGradEmerald" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rides-kpi-card theme-cyan">
              <div className="rides-kpi-top">
                <span className="rides-kpi-tag">Active / In Progress</span>
                <div className="rides-kpi-ico cyan">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
              </div>
              <div className="rides-kpi-main">
                <div className="rides-kpi-val">{kpiMetrics.inProgress}</div>
                <span className="rides-kpi-badge cyan">● Active</span>
              </div>
              <p className="rides-kpi-sub">Trips currently on road</p>
              <div className="rides-sparkline-box">
                <svg viewBox="0 0 100 24" className="rides-sparkline cyan">
                  <path d="M0,22 Q30,12 55,16 T80,5 T100,2" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                  <path d="M0,22 Q30,12 55,16 T80,5 T100,2 L100,24 L0,24 Z" fill="url(#rGradCyan)" opacity="0.25" />
                  <defs>
                    <linearGradient id="rGradCyan" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rides-kpi-card theme-red">
              <div className="rides-kpi-top">
                <span className="rides-kpi-tag">Cancelled / Exception</span>
                <div className="rides-kpi-ico red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
              </div>
              <div className="rides-kpi-main">
                <div className="rides-kpi-val">{kpiMetrics.cancelled} <span className="rides-kpi-pct-span">({kpiMetrics.cancelledPct}%)</span></div>
                <span className="rides-kpi-badge red">↓ Monitored</span>
              </div>
              <p className="rides-kpi-sub">Driver/Customer cancellations</p>
              <div className="rides-sparkline-box">
                <svg viewBox="0 0 100 24" className="rides-sparkline red">
                  <path d="M0,15 Q20,18 40,10 T80,12 T100,8" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                  <path d="M0,15 Q20,18 40,10 T80,12 T100,8 L100,24 L0,24 Z" fill="url(#rGradRed)" opacity="0.25" />
                  <defs>
                    <linearGradient id="rGradRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="rides-kpi-card theme-purple">
              <div className="rides-kpi-top">
                <span className="rides-kpi-tag">Fare Earnings (Page)</span>
                <div className="rides-kpi-ico purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div className="rides-kpi-main">
                <div className="rides-kpi-val">₹{kpiMetrics.totalFareSum.toLocaleString('en-IN')}</div>
                <span className="rides-kpi-badge pos">↑ Gross ticket</span>
              </div>
              <p className="rides-kpi-sub">Sum of fares on current page</p>
              <div className="rides-sparkline-box">
                <svg viewBox="0 0 100 24" className="rides-sparkline purple">
                  <path d="M0,12 Q25,20 50,8 T80,14 T100,6" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                  <path d="M0,12 Q25,20 50,8 T80,14 T100,6 L100,24 L0,24 Z" fill="url(#rGradPurple)" opacity="0.25" />
                  <defs>
                    <linearGradient id="rGradPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="transparent"/></linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </section>

          {/* ── MAIN RIDE ANALYTICS (SPLIT PANELS) ── */}
          <section className="rides-analytics-split">
            {/* LEFT PANEL: VEHICLE CATEGORY BREAKDOWN */}
            <div className="rides-panel-card">
              <div className="rides-panel-header">
                <div className="rides-panel-heading">
                  <span className="rides-panel-icon vehicle">🚗</span>
                  <div>
                    <h2 className="rides-panel-title">Rides by Vehicle Category</h2>
                    <p className="rides-panel-sub">Vehicle segment distribution on loaded stream</p>
                  </div>
                </div>
                <span className="rides-count-tag">{vehicleStats.length} Categories</span>
              </div>

              <div className="rides-donut-body">
                {donutSegments.length > 0 ? (
                  <div className="rides-donut-layout">
                    {/* Dynamic Donut Chart */}
                    <div className="rides-donut-container">
                      <svg viewBox="0 0 100 100" className="rides-donut-svg">
                        <circle cx="50" cy="50" r="40" className="rides-donut-bg" />
                        {donutSegments.map((seg) => (
                          <circle
                            key={seg.type}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray={seg.strokeDasharray}
                            strokeDashoffset={seg.strokeDashoffset}
                            className="rides-donut-segment"
                          >
                            <title>{`${seg.type}: ${seg.count} rides (${seg.pct}%)`}</title>
                          </circle>
                        ))}
                      </svg>
                      <div className="rides-donut-center">
                        <span className="rides-donut-center-lbl">STREAM</span>
                        <span className="rides-donut-center-val">{rides.length} RIDES</span>
                      </div>
                    </div>

                    {/* Vehicle Legend List */}
                    <div className="rides-legend-list">
                      {vehicleStats.map((v) => (
                        <div key={v.type} className="rides-legend-row-item">
                          <div className="rides-legend-row-top">
                            <div className="rides-legend-left">
                              <span className="rides-dot-pill" style={{ background: v.color, boxShadow: `0 0 8px ${v.color}` }} />
                              <span className="rides-legend-name">{v.type}</span>
                            </div>
                            <div className="rides-legend-right">
                              <span className="rides-legend-count">{v.count} rides</span>
                              <span className="rides-legend-pct" style={{ color: v.color }}>{v.pct}%</span>
                            </div>
                          </div>
                          <div className="rides-legend-track">
                            <div className="rides-legend-fill" style={{ width: `${v.pct}%`, background: v.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rides-empty-analytics">No vehicle breakdown data available.</div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: RIDE STATUS OVERVIEW */}
            <div className="rides-panel-card">
              <div className="rides-panel-header">
                <div className="rides-panel-heading">
                  <span className="rides-panel-icon status">📊</span>
                  <div>
                    <h2 className="rides-panel-title">Ride Status Overview</h2>
                    <p className="rides-panel-sub">Operational status telemetry breakdown</p>
                  </div>
                </div>
                <span className="rides-count-tag">{statusStats.filter(s => s.count > 0).length} Active Statuses</span>
              </div>

              <div className="rides-status-body">
                <div className="rides-status-bars-list">
                  {statusStats.map((st) => (
                    <div key={st.status} className="rides-status-bar-item">
                      <div className="rides-status-bar-top">
                        <div className="rides-status-left">
                          <span className="rides-status-dot-indicator" style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
                          <span className="rides-status-name">{st.label}</span>
                        </div>
                        <div className="rides-status-right">
                          <span className="rides-status-count">{st.count} trips</span>
                          <span className="rides-status-pct" style={{ color: st.color }}>{st.pct}%</span>
                        </div>
                      </div>
                      <div className="rides-status-track">
                        <div
                          className="rides-status-fill"
                          style={{ width: `${Math.max(st.pct, 2)}%`, background: `linear-gradient(90deg, ${st.color}, ${st.color}cc)` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── RECENT RIDES ENTERPRISE DATA GRID TABLE ── */}
          <section className="rides-panel-card full-width">
            <div className="rides-panel-header">
              <div className="rides-panel-heading">
                <span className="rides-panel-icon table">📑</span>
                <div>
                  <h2 className="rides-panel-title">Recent Rides Master Stream</h2>
                  <p className="rides-panel-sub">Latest trip records in real-time MongoDB stream</p>
                </div>
              </div>
              <div className="rides-table-header-right">
                <span className="rides-records-badge">Showing {rides.length} of {total} Records</span>
              </div>
            </div>

            <div className="rides-table-container">
              <table className="rides-enterprise-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Booking ID</th>
                    <th>Date & Time</th>
                    <th>Vehicle</th>
                    <th>Pickup Location</th>
                    <th>Destination</th>
                    <th>Distance</th>
                    <th>Fare Earned</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((r, idx) => {
                    const rowNum = (page - 1) * 10 + idx + 1;

                    let statusClass = 'completed';
                    let statusLabel = 'Completed';

                    if (r.status === 'Cancelled by Driver') {
                      statusClass = 'cancelled-driver';
                      statusLabel = 'Cancelled (Driver)';
                    } else if (r.status === 'Cancelled by Customer') {
                      statusClass = 'cancelled-cust';
                      statusLabel = 'Cancelled (Customer)';
                    } else if (r.status === 'No Driver Found') {
                      statusClass = 'no-driver';
                      statusLabel = 'No Driver Found';
                    } else if (r.status === 'Incomplete') {
                      statusClass = 'incomplete';
                      statusLabel = 'Incomplete';
                    } else if (r.status === 'In Progress' || r.status === 'Driver Assigned' || r.status === 'Arrived') {
                      statusClass = 'in-progress';
                      statusLabel = 'In Progress';
                    }

                    const vInfo = ((vType) => {
                      if (vType === 'Uber XL') return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.35)', color: '#c084fc', icon: '🚙' };
                      if (vType === 'Premier Sedan') return { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.35)', color: '#f472b6', icon: '👑' };
                      if (vType === 'Go Sedan') return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', color: '#60a5fa', icon: '🚘' };
                      if (vType === 'Auto') return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', color: '#fbbf24', icon: '🛺' };
                      if (vType === 'Bike' || vType === 'eBike') return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', color: '#34d399', icon: '🛵' };
                      return { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)', color: '#818cf8', icon: '🚗' };
                    })(r.vehicleType);

                    const formattedDate = r.bookingDate ? new Date(r.bookingDate).toISOString().split('T')[0] : '—';

                    return (
                      <tr key={r._id} className="rides-table-row">
                        <td className="rides-idx-col">#{rowNum}</td>
                        <td>
                          <span className="rides-badge-booking">🎫 {r.bookingId}</span>
                        </td>
                        <td className="rides-date-col">
                          <div className="rides-date-main">{formattedDate}</div>
                          <div className="rides-time-sub">⏰ {r.bookingTime}</div>
                        </td>
                        <td>
                          <span
                            className="rides-badge-vehicle"
                            style={{ background: vInfo.bg, borderColor: vInfo.border, color: vInfo.color }}
                          >
                            <span>{vInfo.icon}</span>
                            <span>{r.vehicleType}</span>
                          </span>
                        </td>
                        <td className="rides-loc-col" title={r.pickupLocation}>
                          <span className="rides-indicator pickup" />
                          <span className="rides-loc-name">{r.pickupLocation}</span>
                        </td>
                        <td className="rides-loc-col" title={r.dropLocation}>
                          <span className="rides-indicator drop" />
                          <span className="rides-loc-name">{r.dropLocation}</span>
                        </td>
                        <td className="rides-dist-col">
                          {r.distance ? `${r.distance} KM` : '—'}
                        </td>
                        <td>
                          <span className="rides-fare-pill">
                            ₹{r.fare ? r.fare.toLocaleString('en-IN') : 0}
                          </span>
                        </td>
                        <td>
                          <span className="rides-badge-payment">
                            {r.paymentMethod || 'UPI'}
                          </span>
                        </td>
                        <td>
                          <span className={`rides-status-pill ${statusClass}`}>
                            <span className="rides-status-dot" />
                            <span>{statusLabel}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedRide(r)}
                            className="rides-audit-btn"
                          >
                            👁️ Audit Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {rides.length === 0 && (
                    <tr>
                      <td colSpan="11" className="rides-table-empty">
                        No ride audit records found matching selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Bar */}
              <div className="rides-pagination-bar">
                <span className="rides-page-info">
                  Showing Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} Total Rides in MongoDB)
                </span>
                <div className="rides-page-actions">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="rides-page-btn"
                  >
                    ← Prev Page
                  </button>
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage(p => p + 1)}
                    className="rides-page-btn"
                  >
                    Next Page →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── FLOATING RIDE AUDIT MODAL ── */}
      {selectedRide && (
        <div className="rides-modal-backdrop" onClick={() => setSelectedRide(null)}>
          <div className="rides-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="rides-modal-header">
              <div className="rides-modal-title-wrap">
                <span className="rides-modal-icon">🚕</span>
                <div>
                  <h3 className="rides-modal-h3">Ride Operational Audit Details</h3>
                  <span className="rides-modal-code">{selectedRide.bookingId}</span>
                </div>
              </div>
              <button onClick={() => setSelectedRide(null)} className="rides-modal-close-btn">
                &times;
              </button>
            </div>

            <div className="rides-modal-grid">
              <div className="rides-modal-tile">
                <span className="modal-tile-label">Booking Date & Time</span>
                <span className="modal-tile-value">
                  {new Date(selectedRide.bookingDate).toLocaleDateString('en-IN')} ({selectedRide.bookingTime})
                </span>
              </div>

              <div className="rides-modal-tile">
                <span className="modal-tile-label">Trip Status</span>
                <span className="modal-tile-value" style={{ color: '#10b981' }}>{selectedRide.status}</span>
              </div>

              <div className="rides-modal-tile">
                <span className="modal-tile-label">Vehicle Category</span>
                <span className="modal-tile-value">{selectedRide.vehicleType}</span>
              </div>

              <div className="rides-modal-tile">
                <span className="modal-tile-label">Trip Distance</span>
                <span className="modal-tile-value">{selectedRide.distance} KM</span>
              </div>

              <div className="rides-modal-tile">
                <span className="modal-tile-label">Gross Fare</span>
                <span className="modal-tile-value" style={{ color: '#10b981', fontSize: '18px' }}>₹{selectedRide.fare}</span>
              </div>

              <div className="rides-modal-tile">
                <span className="modal-tile-label">Payment Gateway</span>
                <span className="modal-tile-value">{selectedRide.paymentMethod}</span>
              </div>
            </div>

            <div className="rides-modal-tile">
              <span className="modal-tile-label">Pickup Address</span>
              <span className="modal-tile-value" style={{ fontSize: '13px' }}>📍 {selectedRide.pickupLocation}</span>
            </div>

            <div className="rides-modal-tile">
              <span className="modal-tile-label">Drop-off Destination</span>
              <span className="modal-tile-value" style={{ fontSize: '13px' }}>🏁 {selectedRide.dropLocation}</span>
            </div>

            {selectedRide.custCancellationReason && (
              <div className="rides-modal-tile error-tile">
                <span className="modal-tile-label" style={{ color: '#ef4444' }}>Customer Cancellation Reason</span>
                <span className="modal-tile-value" style={{ color: '#fca5a5' }}>{selectedRide.custCancellationReason}</span>
              </div>
            )}

            {selectedRide.driverCancellationReason && (
              <div className="rides-modal-tile warn-tile">
                <span className="modal-tile-label" style={{ color: '#f97316' }}>Driver Cancellation Reason</span>
                <span className="modal-tile-value" style={{ color: '#fdba74' }}>{selectedRide.driverCancellationReason}</span>
              </div>
            )}

            <div className="rides-modal-footer">
              <button onClick={() => setSelectedRide(null)} className="rides-modal-btn">
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
