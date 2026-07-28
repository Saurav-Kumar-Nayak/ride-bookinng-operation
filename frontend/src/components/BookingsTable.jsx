
export default function BookingsTable({
  bookings,
  total,
  page,
  pages,
  onPageChange,
  search,
  onSearchChange,
  onResetFilters,
  hasFilters,
  onDeleteBooking,
  onEditBooking,
  startDate,
  endDate,
  filters
}) {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge completed';
      case 'Cancelled by Driver': return 'badge driver-cancel';
      case 'Cancelled by Customer': return 'badge customer-cancel';
      case 'No Driver Found': return 'badge no-driver';
      case 'Incomplete': return 'badge incomplete';
      default: return 'badge';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="panel" style={{ gridColumn: 'span 2' }}>
      <div className="table-header">
        <div className="table-title">
          <h3 style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
            Live Booking Records ({total.toLocaleString('en-IN')} matches)
          </h3>
        </div>
        <div className="table-actions">
          <button 
            className="reset-db-btn" 
            style={{ padding: '6px 12px', borderStyle: 'solid', borderColor: 'var(--good)', color: 'var(--good)' }}
            onClick={() => {
              let query = '';
              const params = [];
              if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
              if (filters.vehicleType) params.push(`vehicleType=${encodeURIComponent(filters.vehicleType)}`);
              if (filters.paymentMethod) params.push(`paymentMethod=${encodeURIComponent(filters.paymentMethod)}`);
              if (search) params.push(`search=${encodeURIComponent(search)}`);
              if (startDate) params.push(`startDate=${startDate}`);
              if (endDate) params.push(`endDate=${endDate}`);
              if (params.length > 0) query = '?' + params.join('&');
              window.location.href = `/api/bookings/export${query}`;
            }}
          >
            📥 Export CSV
          </button>
          {hasFilters && (
            <button 
              className="reset-db-btn" 
              style={{ padding: '6px 12px', borderStyle: 'solid' }}
              onClick={onResetFilters}
            >
              Clear Active Filters
            </button>
          )}
          <input
            type="text"
            className="search-input"
            placeholder="Search Route / BK_ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Vehicle</th>
              <th>Route (Pickup ➔ Drop)</th>
              <th>Distance & Fare</th>
              <th>Payment</th>
              <th>Ratings (Dr / Cust)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings && bookings.map((b) => (
              <tr key={b._id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{b.bookingId}</td>
                <td>
                  <div>{formatDate(b.bookingDate)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{b.bookingTime}</div>
                </td>
                <td>
                  <span className={getStatusClass(b.status)}>{b.status}</span>
                  {(b.custCancellationReason || b.driverCancellationReason) && (
                    <div style={{ fontSize: '10px', color: 'var(--bad)', marginTop: '4px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.custCancellationReason || b.driverCancellationReason}>
                      Reason: {b.custCancellationReason || b.driverCancellationReason}
                    </div>
                  )}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{b.vehicleType}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{b.pickupLocation}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>➔ {b.dropLocation}</div>
                </td>
                <td>
                  <div>{b.distance ? `${b.distance} KM` : '-'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>₹{b.fare}</div>
                </td>
                <td style={{ fontSize: '12px' }}>{b.paymentMethod}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {b.status === 'Completed' ? (
                    <span>⭐{b.driverRating || '-'} / ⭐{b.customerRating || '-'}</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>-</span>
                  )}
                </td>
                <td>
                  <button
                    className="reset-db-btn"
                    style={{ padding: '3px 6px', fontSize: '10px', marginRight: '6px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                    onClick={() => onEditBooking(b)}
                  >
                    Edit
                  </button>
                  <button
                    className="reset-db-btn"
                    style={{ padding: '3px 6px', fontSize: '10px' }}
                    onClick={() => onDeleteBooking(b._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {(!bookings || bookings.length === 0) && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                  No booking records found matching the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <div>
          Showing Page {page} of {pages || 1}
        </div>
        <div className="pagination-btns">
          <button
            className="pg-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <button
            className="pg-btn"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
