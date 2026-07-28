
export default function HourlyChart({ hourlyCounts, activeHour, setActiveHour }) {
  const counts = hourlyCounts || {};
  const values = Object.values(counts);
  const maxVal = Math.max(...(values.length > 0 ? values : [1]), 1);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleBarClick = (hour) => {
    if (activeHour === hour) {
      setActiveHour(null); // Deselect
    } else {
      setActiveHour(hour); // Filter by this hour
    }
  };

  return (
    <div className="hourchart-wrap">
      <div className="hourchart">
        {hours.map((hour) => {
          const count = counts[hour] || 0;
          const percentHeight = (count / maxVal) * 100;
          const isActive = activeHour === hour;

          return (
            <div key={hour} className="hour-bar-col">
              <div
                className={`hour-bar ${isActive ? 'active' : ''}`}
                style={{ height: `${percentHeight}%` }}
                onClick={() => handleBarClick(hour)}
                title={`Hour ${hour}:00 — ${count.toLocaleString('en-IN')} bookings`}
              >
                <div className="tip">
                  {hour}:00 — {count.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hour-labels">
        {hours.map((hour) => (
          <span key={hour}>
            {hour % 3 === 0 ? hour : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
