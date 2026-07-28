
export default function BarList({ dataObj, color, activeVal, onClickItem }) {
  const data = dataObj || {};
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...Object.values(data).concat([1]), 1);

  return (
    <div>
      {entries.map(([label, val]) => {
        const percentWidth = (val / max) * 100;
        const isActive = activeVal === label;
        
        return (
          <div
            key={label}
            className={`bar-row ${onClickItem ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
            onClick={() => onClickItem && onClickItem(isActive ? null : label)}
            title={`${label}: ${val.toLocaleString('en-IN')}`}
          >
            <div className="bar-label">{label}</div>
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ 
                  width: `${percentWidth}%`, 
                  background: color ? color : (isActive ? 'var(--accent)' : 'var(--ink)')
                }}
              ></div>
            </div>
            <div className="bar-val">{val.toLocaleString('en-IN')}</div>
          </div>
        );
      })}
      {entries.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: '11px', textAlign: 'center', padding: '12px 0' }}>
          No data matches the selected filters
        </div>
      )}
    </div>
  );
}
