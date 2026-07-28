
const statusColors = {
  "Completed": "#2a694a",
  "Cancelled by Driver": "#bc3e35",
  "Cancelled by Customer": "#d5531d",
  "No Driver Found": "#726a5c",
  "Incomplete": "#e2b83b"
};

export default function OutcomeDonut({ statusCounts, activeStatus, setActiveStatus, totalBookings }) {
  const counts = statusCounts || {};
  const total = totalBookings || Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  // Circle properties
  const r = 40;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r; // ~251.327

  let cumulativeFraction = 0;

  // Parse counts into segments
  const segments = Object.entries(counts).map(([status, count]) => {
    const fraction = total > 0 ? count / total : 0;
    const offset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    
    return {
      status,
      count,
      fraction,
      percentage: (fraction * 100).toFixed(1),
      strokeDasharray: `${fraction * circumference} ${circumference}`,
      strokeDashoffset: offset,
      color: statusColors[status] || '#ccc'
    };
  });

  const handleStatusClick = (status) => {
    if (activeStatus === status) {
      setActiveStatus(null);
    } else {
      setActiveStatus(status);
    }
  };

  return (
    <div className="donut-wrap">
      <div className="donut-svg-container">
        <svg width="150" height="150" viewBox="0 0 100 100">
          <g transform="rotate(-90 50 50)">
            {/* Draw segments */}
            {segments.map((seg, i) => {
              if (seg.count === 0) return null;
              const isFiltered = activeStatus === seg.status;
              
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isFiltered ? "14" : "10"}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  style={{
                    cursor: 'pointer',
                    transition: 'stroke-width 0.2s, opacity 0.2s',
                    opacity: activeStatus && !isFiltered ? 0.4 : 1
                  }}
                  onClick={() => handleStatusClick(seg.status)}
                >
                  <title>{`${seg.status}: ${seg.count.toLocaleString('en-IN')} (${seg.percentage}%)`}</title>
                </circle>
              );
            })}
          </g>
        </svg>
        <div className="donut-center-text">
          <div className="val">{total.toLocaleString('en-IN')}</div>
          <div className="lbl">Bookings</div>
        </div>
      </div>

      <div className="legend">
        {segments.map((seg, i) => {
          const isActive = activeStatus === seg.status;
          return (
            <div
              key={i}
              className={`legend-item ${isActive ? 'active' : ''}`}
              onClick={() => handleStatusClick(seg.status)}
            >
              <div className="swatch" style={{ background: seg.color }}></div>
              <div style={{ flex: 1 }}>{seg.status}</div>
              <div style={{ color: 'var(--muted)', fontWeight: 500 }}>
                {seg.percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
