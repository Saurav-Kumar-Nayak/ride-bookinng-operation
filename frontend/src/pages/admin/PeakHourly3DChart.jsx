import { useState, useMemo, useEffect } from 'react';
import './PeakHourly3DChart.css';

export default function PeakHourly3DChart({ hourlyCounts, selectedPreset = 'today', isLoading = false, onHourSelect }) {
  const [hoveredHour, setHoveredHour] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  // Derive 0-23 hourly data array strictly from real MongoDB props
  const countsData = useMemo(() => {
    const dataMap = {};
    for (let h = 0; h < 24; h++) {
      dataMap[h] = 0;
    }
    if (hourlyCounts && typeof hourlyCounts === 'object') {
      Object.keys(hourlyCounts).forEach((key) => {
        const hInt = Number(key);
        if (!isNaN(hInt) && hInt >= 0 && hInt < 24) {
          dataMap[hInt] = Number(hourlyCounts[key]) || 0;
        }
      });
    }
    return dataMap;
  }, [hourlyCounts]);

  // Compute 24-hour array, Y-scale headroom & dynamic peak calculation
  const { hoursArray, maxVal, yTicks, peakHour, peakCount, totalVolume } = useMemo(() => {
    const arr = [];
    let max = 0;
    let pHour = 0;
    let pCount = -1;
    let sum = 0;

    for (let h = 0; h < 24; h++) {
      const count = countsData[h] !== undefined ? countsData[h] : 0;
      sum += count;
      if (count > pCount) {
        pCount = count;
        pHour = h;
      }
      if (count > max) max = count;
      arr.push({ hour: h, count });
    }

    // Determine clean Y-axis scale based on max count
    const safeMax = Math.max(10, max);
    const ceilMax = Math.ceil((safeMax * 1.15) / 10) * 10; // 15% headroom
    const step = Math.max(2, Math.ceil(ceilMax / 5));
    const ticks = [];
    for (let t = ceilMax; t >= 0; t -= step) {
      ticks.push(t);
    }

    return {
      hoursArray: arr,
      maxVal: ceilMax,
      yTicks: ticks,
      peakHour: pHour,
      peakCount: Math.max(0, pCount),
      totalVolume: sum
    };
  }, [countsData]);

  // Ensure selectedHour stays within valid 0-23 range if set
  useEffect(() => {
    if (selectedHour !== null && (selectedHour < 0 || selectedHour > 23)) {
      setSelectedHour(peakHour);
    }
  }, [peakHour, selectedHour]);

  // Focus state is active strictly when a bar is explicitly selected by user
  const hasFocus = selectedHour !== null;
  const activeHour = selectedHour !== null ? selectedHour : (hoveredHour !== null ? hoveredHour : peakHour);
  const activeCount = countsData[activeHour] || 0;

  // Formatted hour label helper (e.g. 18 -> "18:00")
  const formatHour = (h) => (h < 10 ? `0${h}:00` : `${h}:00`);

  // Toggle bar selection on click (click active bar again to unblur all bars immediately)
  const handleBarClick = (hour) => {
    if (selectedHour === hour) {
      setSelectedHour(null);
      setHoveredHour(null); // Instantly unblur all bars regardless of cursor position
      if (onHourSelect) onHourSelect(null);
    } else {
      setSelectedHour(hour);
      if (onHourSelect) onHourSelect(hour);
    }
  };

  // Demand level metrics for active hour
  const pctOfPeak = peakCount > 0 ? Math.round((activeCount / peakCount) * 100) : 0;
  const pctOfTotal = totalVolume > 0 ? ((activeCount / totalVolume) * 100).toFixed(1) : '0.0';

  let demandBadge = { label: '🌙 Off-Peak Demand', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  if (activeHour === peakHour && activeCount > 0) {
    demandBadge = { label: '👑 PEAK DEMAND SPIKE', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.2)' };
  } else if (pctOfPeak >= 70) {
    demandBadge = { label: '⚡ HIGH DEMAND', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' };
  } else if (pctOfPeak >= 35) {
    demandBadge = { label: '📊 MODERATE DEMAND', color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
  }

  return (
    <div className="peak-hourly-3d-card">
      {/* ── CARD HEADER ── */}
      <div className="peak-card-header">
        <div className="header-left">
          <div className="header-icon-box">
            <span className="header-icon">📈</span>
          </div>
          <div>
            <div className="header-title-row">
              <h3 className="header-title">Peak Hourly Booking Volume</h3>
              <span className="preset-badge">
                <span className="live-dot" /> {selectedPreset.toUpperCase()}
              </span>
            </div>
            <p className="header-sub">
              00:00 - 23:00 • Total Volume: <strong>{totalVolume.toLocaleString('en-IN')} rides</strong>
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="peak-summary-pill" onClick={() => handleBarClick(peakHour)} title="Click to focus Peak Hour">
            <span className="crown-icon">👑</span>
            <span className="peak-label">Peak Hour:</span>
            <strong className="peak-val">
              {formatHour(peakHour)} ({peakCount} bookings)
            </strong>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE SELECTED HOUR TELEMETRY BAR ── */}
      <div className="selected-hour-telemetry-banner">
        <div className="telemetry-info-group">
          <div className="telemetry-item">
            <span className="telemetry-label">{selectedHour !== null ? 'Selected Hour:' : (hoveredHour !== null ? 'Inspecting Hour:' : 'Peak Hour Telemetry:')}</span>
            <span className="telemetry-value time">{formatHour(activeHour)} - {formatHour((activeHour + 1) % 24)}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Booking Volume:</span>
            <span className="telemetry-value count">{activeCount.toLocaleString('en-IN')} rides</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Share of Total:</span>
            <span className="telemetry-value pct">{pctOfTotal}%</span>
          </div>
        </div>

        <div className="telemetry-badge-group">
          <span
            className="demand-status-badge"
            style={{ color: demandBadge.color, background: demandBadge.bg, borderColor: demandBadge.color }}
          >
            {demandBadge.label}
          </span>
        </div>
      </div>

      {/* ── QUICK HOUR JUMP CHIPS ── */}
      <div className="quick-hour-chips">
        <span className="chips-label">Quick Jump:</span>
        <button
          className={`hour-chip ${selectedHour === peakHour ? 'active peak' : ''}`}
          onClick={() => handleBarClick(peakHour)}
        >
          👑 Peak ({formatHour(peakHour)})
        </button>
        <button
          className={`hour-chip ${selectedHour === 8 ? 'active' : ''}`}
          onClick={() => handleBarClick(8)}
        >
          🌅 Morning (08:00)
        </button>
        <button
          className={`hour-chip ${selectedHour === 13 ? 'active' : ''}`}
          onClick={() => handleBarClick(13)}
        >
          ☀️ Afternoon (13:00)
        </button>
        <button
          className={`hour-chip ${selectedHour === 18 ? 'active' : ''}`}
          onClick={() => handleBarClick(18)}
        >
          🌆 Evening (18:00)
        </button>
        <button
          className={`hour-chip ${selectedHour === 22 ? 'active' : ''}`}
          onClick={() => handleBarClick(22)}
        >
          🌙 Night (22:00)
        </button>

        {selectedHour !== null && (
          <button
            className="hour-chip view-all-chip"
            onClick={() => setSelectedHour(null)}
            title="Click to unblur all bars"
          >
            ✨ View All (Unblur)
          </button>
        )}
      </div>

      {/* ── LOADING SKELETON STATE ── */}
      {isLoading ? (
        <div className="chart-loading-skeleton">
          <div className="skeleton-bar-container">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-bar"
                style={{ height: `${20 + (i % 5) * 15}%`, animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
          <div className="skeleton-caption">📡 Querying MongoDB hourly booking aggregations...</div>
        </div>
      ) : (
        /* ── CHART VIEWPORT & 3D STAGE ── */
        <div className="chart-viewport">
          {/* Y-Axis Grid Lines & Labels */}
          <div className="y-axis-container">
            {yTicks.map((tick) => (
              <div key={tick} className="y-tick-row">
                <span className="y-tick-label">{tick}</span>
                <div className="y-grid-line" />
              </div>
            ))}
          </div>

          {/* Empty Data Indicator Banner if all hours are 0 */}
          {totalVolume === 0 && (
            <div className="chart-empty-overlay">
              <span>💤 No booking volume recorded for selected range</span>
            </div>
          )}

          {/* 3D Bars Stage */}
          <div className={`bars-stage ${hasFocus ? 'has-focus' : ''}`}>
            {hoursArray.map(({ hour, count }, idx) => {
              const heightPct = maxVal > 0 ? (count / maxVal) * 100 : 0;
              const isPeak = hour === peakHour && count > 0;
              const isSelected = hour === selectedHour;
              const isHovered = hour === hoveredHour;
              const isFocused = isSelected || (selectedHour === null && isHovered);
              const isBlurred = hasFocus && !isSelected;

              // Handle tooltip edge alignment for 00:00 and 23:00 to prevent clipping
              let tooltipAlignClass = '';
              if (hour <= 2) tooltipAlignClass = 'align-left';
              if (hour >= 21) tooltipAlignClass = 'align-right';

              return (
                <div
                  key={hour}
                  className={`bar-column ${isPeak ? 'is-peak' : ''} ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''} ${isFocused ? 'is-focused' : ''} ${isBlurred ? 'is-blurred' : ''}`}
                  onClick={() => handleBarClick(hour)}
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  title={isSelected ? `Click to unblur all bars` : `Click to focus ${formatHour(hour)} (${count} rides)`}
                >
                  {/* Floating Interactive Tooltip */}
                  {isFocused && (
                    <div className={`bar-floating-tooltip ${isPeak ? 'peak-badge' : ''} ${isSelected ? 'selected-badge' : ''} ${tooltipAlignClass}`}>
                      {isPeak && <div className="tooltip-crown">👑 Peak Demand Spike</div>}
                      {isSelected && !isPeak && <div className="tooltip-crown" style={{ color: '#00edff' }}>🎯 Selected Hour</div>}
                      {!isSelected && isHovered && !isPeak && <div className="tooltip-crown" style={{ color: '#a78bfa' }}>🔍 Inspecting Hour</div>}
                      <div className="tooltip-time">{formatHour(hour)}</div>
                      <div className="tooltip-count">{count.toLocaleString('en-IN')} bookings</div>
                      <div className="tooltip-arrow" />
                    </div>
                  )}

                  {/* 3D Glass Bar Track & Body */}
                  <div className="bar-track-3d">
                    <div
                      className={`bar-body-3d ${count === 0 ? 'zero-height' : ''}`}
                      style={{
                        height: `${Math.max(heightPct, count > 0 ? 5 : 1)}%`,
                        animationDelay: `${idx * 15}ms`
                      }}
                    >
                      {/* Front Face */}
                      <div className="bar-face front" />
                      {/* Top 3D Cap */}
                      <div className="bar-face top" />
                      {/* Side 3D Depth Shadow */}
                      <div className="bar-face side" />
                      {/* Inner Glow Core */}
                      <div className="bar-glow-core" />
                    </div>
                  </div>

                  {/* X-Axis Hour Label (Show every 2 hours: 00, 02, 04... 22) */}
                  <div className={`x-label ${isSelected ? 'selected' : ''}`}>
                    {hour % 2 === 0 ? (hour < 10 ? `0${hour}` : `${hour}`) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FOOTER LEGEND ── */}
      <div className="chart-footer-legend">
        <div className="legend-item">
          <span className="legend-swatch standard-swatch" />
          <span>Hourly Volume</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch selected-swatch" />
          <span>Selected Hour</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch peak-swatch" />
          <span>Peak Demand Spike</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch grid-swatch" />
          <span>Real MongoDB Aggregation</span>
        </div>
      </div>
    </div>
  );
}

