
export default function KPICards({ stats }) {
  const kpis = [
    {
      num: stats.total_bookings !== undefined ? stats.total_bookings.toLocaleString('en-IN') : '0',
      label: "Total bookings"
    },
    {
      num: `${stats.completionRate || '0.0'}%`,
      label: "Completion rate"
    },
    {
      num: `${stats.driverCancelRate || '0.0'}%`,
      label: "Driver cancellations",
      flag: true
    },
    {
      num: `₹${stats.avg_booking_value !== undefined ? stats.avg_booking_value.toLocaleString('en-IN') : '0'}`,
      label: "Avg booking value"
    },
    {
      num: stats.avg_driver_rating !== undefined ? stats.avg_driver_rating : '0.0',
      label: "Avg driver rating"
    }
  ];

  return (
    <div className="kpi-row">
      {kpis.map((k, i) => (
        <div key={i} className={`kpi ${k.flag ? 'flag' : ''}`}>
          <div className="num">{k.num}</div>
          <div className="label">{k.label}</div>
        </div>
      ))}
    </div>
  );
}
