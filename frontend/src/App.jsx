import { useState, useEffect, useCallback } from 'react';
import KPICards from './components/KPICards';
import HourlyChart from './components/HourlyChart';
import OutcomeDonut from './components/OutcomeDonut';
import BarList from './components/BarList';
import BookingsTable from './components/BookingsTable';
import BookingSimulator from './components/BookingSimulator';

export default function App() {
  // Aggregate Stats
  const [stats, setStats] = useState({
    status_counts: {},
    vehicle_counts: {},
    hourly_counts: {},
    payment_completed: {},
    cust_cancel_reasons: {},
    driver_cancel_reasons: {},
    top_pickup: {},
    total_bookings: 0,
    completionRate: '0.0',
    driverCancelRate: '0.0',
    avg_booking_value: 0,
    avg_distance: 0,
    avg_driver_rating: 0,
    avg_customer_rating: 0
  });

  // Table Bookings List
  const [bookings, setBookings] = useState([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');

  // Active filters
  const [filters, setFilters] = useState({
    status: null,
    vehicleType: null,
    paymentMethod: null,
    hour: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Advanced features state variables
  const [theme, setTheme] = useState(localStorage.getItem('ola-theme') || 'light');
  const [editingBooking, setEditingBooking] = useState(null);
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Parse active filters to check if any is active
  const hasFilters = Object.values(filters).some(x => x !== null) || datePreset !== 'all' || search;

  // Sync theme setting
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('ola-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const format = (d) => d.toISOString().split('T')[0];
    
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const today = new Date(now);
      setStartDate(format(today));
      setEndDate(format(today));
    } else if (preset === '7days') {
      const past = new Date(now);
      past.setDate(now.getDate() - 7);
      setStartDate(format(past));
      setEndDate(format(now));
    } else if (preset === '30days') {
      const past = new Date(now);
      past.setDate(now.getDate() - 30);
      setStartDate(format(past));
      setEndDate(format(now));
    } else if (preset === '90days') {
      const past = new Date(now);
      past.setDate(now.getDate() - 90);
      setStartDate(format(past));
      setEndDate(format(now));
    } else if (preset === 'custom') {
      if (!startDate) {
        const past = new Date(now);
        past.setDate(now.getDate() - 7);
        setStartDate(format(past));
        setEndDate(format(now));
      }
    }
    setPage(1);
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    
    try {
      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingBooking.status,
          driverRating: editingBooking.status === 'Completed' ? parseFloat(editingBooking.driverRating) : null,
          customerRating: editingBooking.status === 'Completed' ? parseFloat(editingBooking.customerRating) : null,
          driverCancellationReason: editingBooking.status === 'Cancelled by Driver' ? editingBooking.driverCancellationReason : null,
          custCancellationReason: editingBooking.status === 'Cancelled by Customer' ? editingBooking.custCancellationReason : null,
        })
      });

      if (!res.ok) throw new Error('Update failed');
      
      setEditingBooking(null);
      fetchStats();
      fetchBookingsList();
    } catch (err) {
      alert(`Error updating booking: ${err.message}`);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      let query = '';
      const params = [];
      if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
      if (filters.vehicleType) params.push(`vehicleType=${encodeURIComponent(filters.vehicleType)}`);
      if (filters.paymentMethod) params.push(`paymentMethod=${encodeURIComponent(filters.paymentMethod)}`);
      if (filters.hour !== null && filters.hour !== undefined) params.push(`hour=${filters.hour}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      
      if (params.length > 0) {
        query = '?' + params.join('&');
      }

      const res = await fetch(`/api/bookings/stats${query}`);
      if (!res.ok) throw new Error('Stats retrieval failed');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [filters, startDate, endDate]);

  const fetchBookingsList = useCallback(async () => {
    try {
      let query = `?page=${page}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (filters.status) query += `&status=${encodeURIComponent(filters.status)}`;
      if (filters.vehicleType) query += `&vehicleType=${encodeURIComponent(filters.vehicleType)}`;
      if (filters.paymentMethod) query += `&paymentMethod=${encodeURIComponent(filters.paymentMethod)}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await fetch(`/api/bookings${query}`);
      if (!res.ok) throw new Error('Bookings list fetch failed');
      const data = await res.json();
      
      setBookings(data.bookings);
      setBookingsCount(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Error fetching list of bookings:', err);
    }
  }, [page, search, filters, startDate, endDate]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset page to 1 on searching
      fetchBookingsList();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, fetchBookingsList]);

  // Load stats and list on filter changes
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchBookingsList()]);
      setIsLoading(false);
    };
    loadAllData();
  }, [fetchStats, fetchBookingsList]);

  // Handle deleting a single record
  const handleDeleteBooking = async (id) => {
    if (!confirm('Are you sure you want to delete this booking record?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      // Refresh
      fetchStats();
      fetchBookingsList();
    } catch (err) {
      alert(`Error deleting booking: ${err.message}`);
    }
  };

  // Reseed DB (Custom count)
  const handleReseed = async (count = 3000) => {
    if (!confirm(`Warning: This will clear your current database and seed it with ${count} new random bookings. Proceed?`)) return;
    setIsSeeding(true);
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      if (!res.ok) throw new Error('Reseeding script failed');
      
      // Reset page and filters
      setPage(1);
      setSearch('');
      setFilters({ status: null, vehicleType: null, paymentMethod: null, hour: null });
      
      await Promise.all([fetchStats(), fetchBookingsList()]);
      alert(`Successfully seeded database with ${count} records!`);
    } catch (err) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: null,
      vehicleType: null,
      paymentMethod: null,
      hour: null
    });
    setSearch('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatFilterTitle = () => {
    const list = [];
    if (filters.status) list.push(`Status: ${filters.status}`);
    if (filters.vehicleType) list.push(`Vehicle: ${filters.vehicleType}`);
    if (filters.paymentMethod) list.push(`Payment: ${filters.paymentMethod}`);
    if (filters.hour !== null) list.push(`Hour: ${filters.hour}:00`);
    if (search) list.push(`Search: "${search}"`);
    if (datePreset !== 'all') {
      if (datePreset === 'custom') {
        list.push(`Date: ${startDate} to ${endDate}`);
      } else {
        list.push(`Period: ${datePreset}`);
      }
    }

    return list.length > 0 ? `VIEW: ${list.join(' | ')}` : 'VIEW: All bookings';
  };

  // Cancel reasons helper components
  const RenderReasons = ({ reasons }) => {
    const total = Object.values(reasons || {}).reduce((a, b) => a + b, 0) || 1;
    const sorted = Object.entries(reasons || {}).sort((a, b) => b[1] - a[1]);
    
    return (
      <div className="reason-list">
        {sorted.map(([reason, count]) => (
          <div key={reason} className="r">
            <span>{reason}</span>
            <span className="pct">{((count / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
        {sorted.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '11px', textAlign: 'center', padding: '12px 0' }}>
            No cancellations found
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <header>
        <div className="title-block">
          <h1>Ride Booking Operations</h1>
          <div className="sub">
            {stats.total_bookings.toLocaleString('en-IN')} bookings · Dynamic Dashboard · Click stats to filter
          </div>
        </div>
        <div className="meta">
          <div>DATASET: Ola Ride Bookings (MongoDB)</div>
          <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '8px' }}>{formatFilterTitle()}</div>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </header>

      {/* Date Filter Panel */}
      <div className="date-filter-panel">
        <label>Time Window:</label>
        <select 
          className="form-select" 
          style={{ width: '130px', padding: '5px 8px' }} 
          value={datePreset} 
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="custom">Custom Range</option>
        </select>

        {datePreset === 'custom' && (
          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ marginLeft: '8px' }}>From:</label>
            <input 
              type="date" 
              className="date-input" 
              value={startDate} 
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }} 
            />
            <label>To:</label>
            <input 
              type="date" 
              className="date-input" 
              value={endDate} 
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }} 
            />
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <KPICards stats={stats} />

      {/* Quick Filter Control Panels */}
      <div className="filters-wrap">
        <div className="filters">
          <span className="fl">Quick Status Filter:</span>
          {['Completed', 'Cancelled by Driver', 'Cancelled by Customer', 'No Driver Found', 'Incomplete'].map(st => {
            const isActive = filters.status === st;
            const count = stats.status_counts[st] || 0;
            return (
              <div 
                key={st} 
                className={`chip ${isActive ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, status: isActive ? null : st }))}
              >
                {st} ({count.toLocaleString('en-IN')})
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="reset-db-btn"
            disabled={isSeeding}
            onClick={() => handleReseed(2000)}
          >
            {isSeeding ? 'Seeding...' : 'Reseed 2K'}
          </button>
          <button 
            className="reset-db-btn"
            disabled={isSeeding}
            onClick={() => handleReseed(5000)}
          >
            {isSeeding ? 'Seeding...' : 'Reseed 5K'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '4px', marginBottom: '20px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          <div className="sim-spinner" style={{ marginRight: '10px' }}></div> Fetching real-time database aggregates...
        </div>
      )}

      {/* Grid 1: Hour chart and Donut Outcomes */}
      <div className="grid">
        <div className="panel">
          <h3>
            Bookings by hour of day {filters.hour !== null && <span style={{ color: 'var(--accent)' }}>(Filter: {filters.hour}:00)</span>}
          </h3>
          <HourlyChart 
            hourlyCounts={stats.hourly_counts} 
            activeHour={filters.hour} 
            setActiveHour={(hour) => setFilters(prev => ({ ...prev, hour }))}
          />
        </div>
        <div className="panel">
          <h3>
            Booking outcome split {filters.status && <span style={{ color: 'var(--accent)' }}>(Filter: {filters.status})</span>}
          </h3>
          <OutcomeDonut
            statusCounts={stats.status_counts}
            activeStatus={filters.status}
            setActiveStatus={(status) => setFilters(prev => ({ ...prev, status }))}
            totalBookings={stats.total_bookings}
          />
        </div>
      </div>

      {/* Grid 2: Vehicle share, Top customer options and Top driver options */}
      <div className="grid3">
        <div className="panel">
          <h3>
            Vehicle Type share {filters.vehicleType && <span style={{ color: 'var(--accent)' }}>(Filter: {filters.vehicleType})</span>}
          </h3>
          <BarList
            dataObj={stats.vehicle_counts}
            activeVal={filters.vehicleType}
            onClickItem={(vehicleType) => setFilters(prev => ({ ...prev, vehicleType }))}
          />
        </div>
        <div className="panel">
          <h3>Top Customer Cancels</h3>
          <RenderReasons reasons={stats.cust_cancel_reasons} />
        </div>
        <div className="panel">
          <h3>Top Driver Cancels</h3>
          <RenderReasons reasons={stats.driver_cancel_reasons} />
        </div>
      </div>

      {/* Grid 3: Payments and Pickups */}
      <div className="grid">
        <div className="panel">
          <h3>
            Payment Method — completed rides {filters.paymentMethod && <span style={{ color: 'var(--accent)' }}>(Filter: {filters.paymentMethod})</span>}
          </h3>
          <BarList
            dataObj={stats.payment_completed}
            color="var(--good)"
            activeVal={filters.paymentMethod}
            onClickItem={(paymentMethod) => setFilters(prev => ({ ...prev, paymentMethod }))}
          />
        </div>
        <div className="panel">
          <h3>Top 10 Pickups</h3>
          <BarList dataObj={stats.top_pickup} />
        </div>
      </div>

      {/* Grid 4: Live dispatch simulator and Key Finding summary */}
      <div className="grid">
        <BookingSimulator onSimulateComplete={() => {
          fetchStats();
          fetchBookingsList();
        }} />
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--ink)', color: 'var(--paper)' }}>
          <h3 style={{ color: 'var(--paper)', borderBottomColor: '#2e3748' }}>Dashboard Key Findings</h3>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.7' }}>
            Only <strong style={{ color: '#e8a47c' }}>{(stats.completionRate || '0.0')}%</strong> of all booking attempts end in a completed ride. 
            Driver-initiated cancellations (<strong style={{ color: '#e8a47c' }}>{(stats.driverCancelRate || '0.0')}%</strong>) are the single largest source of lost rides. 
            <br /><br />
            Our average fare for rides completed stands at <strong style={{ color: '#e8a47c' }}>₹{stats.avg_booking_value}</strong> with an average travel coverage of <strong style={{ color: '#e8a47c' }}>{stats.avg_distance} KM</strong>.
            The database aggregates averages for customer ratings at <strong style={{ color: '#e8a47c' }}>⭐{stats.avg_customer_rating}</strong> and driver ratings at <strong style={{ color: '#e8a47c' }}>⭐{stats.avg_driver_rating}</strong>.
            <br /><br />
            Evening booking demand is heavily concentrated between <strong style={{ color: '#e8a47c' }}>5:00 PM and 9:00 PM</strong>, experiencing up to 8x normal overnight call load volumes.
          </div>
        </div>
      </div>

      {/* Data Grid table */}
      <BookingsTable
        bookings={bookings}
        total={bookingsCount}
        page={page}
        pages={pages}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        onResetFilters={handleResetFilters}
        hasFilters={hasFilters}
        onDeleteBooking={handleDeleteBooking}
        onEditBooking={setEditingBooking}
        startDate={startDate}
        endDate={endDate}
        filters={filters}
      />

      {/* Edit Booking Modal Overlay */}
      {editingBooking && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Edit Booking {editingBooking.bookingId}</h2>
              <button className="modal-close-btn" onClick={() => setEditingBooking(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateBooking} className="modal-form">
              <div className="form-group">
                <label>Booking Status</label>
                <select 
                  className="form-select" 
                  value={editingBooking.status} 
                  onChange={(e) => setEditingBooking(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Completed">Completed</option>
                  <option value="Cancelled by Driver">Cancelled by Driver</option>
                  <option value="Cancelled by Customer">Cancelled by Customer</option>
                  <option value="No Driver Found">No Driver Found</option>
                  <option value="Incomplete">Incomplete</option>
                </select>
              </div>

              {editingBooking.status === 'Completed' && (
                <>
                  <div className="form-group">
                    <label>Driver Rating (1 - 5 Stars)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      step="0.1" 
                      className="form-input" 
                      value={editingBooking.driverRating === null || editingBooking.driverRating === undefined ? '' : editingBooking.driverRating} 
                      onChange={(e) => setEditingBooking(prev => ({ ...prev, driverRating: e.target.value }))} 
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Rating (1 - 5 Stars)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      step="0.1" 
                      className="form-input" 
                      value={editingBooking.customerRating === null || editingBooking.customerRating === undefined ? '' : editingBooking.customerRating} 
                      onChange={(e) => setEditingBooking(prev => ({ ...prev, customerRating: e.target.value }))} 
                      required
                    />
                  </div>
                </>
              )}

              {editingBooking.status === 'Cancelled by Driver' && (
                <div className="form-group">
                  <label>Driver Cancellation Reason</label>
                  <select 
                    className="form-select" 
                    value={editingBooking.driverCancellationReason || ''} 
                    onChange={(e) => setEditingBooking(prev => ({ ...prev, driverCancellationReason: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Reason --</option>
                    <option value="Customer related issue">Customer related issue</option>
                    <option value="The customer was coughing/sick">The customer was coughing/sick</option>
                    <option value="Personal & Car related issues">Personal & Car related issues</option>
                    <option value="More than permitted people in there">More than permitted people in there</option>
                  </select>
                </div>
              )}

              {editingBooking.status === 'Cancelled by Customer' && (
                <div className="form-group">
                  <label>Customer Cancellation Reason</label>
                  <select 
                    className="form-select" 
                    value={editingBooking.custCancellationReason || ''} 
                    onChange={(e) => setEditingBooking(prev => ({ ...prev, custCancellationReason: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Reason --</option>
                    <option value="Wrong Address">Wrong Address</option>
                    <option value="Change of plans">Change of plans</option>
                    <option value="Driver is not moving towards pickup location">Driver is not moving towards pickup location</option>
                    <option value="Driver asked to cancel">Driver asked to cancel</option>
                    <option value="AC is not working">AC is not working</option>
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="modal-btn" onClick={() => setEditingBooking(null)}>Cancel</button>
                <button type="submit" className="modal-btn primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer>
        Ola Operations Dashboard · Backend: Mongoose + Express · Client: Vite + React SPA · Local database: MongoDB
      </footer>
    </div>
  );
}
