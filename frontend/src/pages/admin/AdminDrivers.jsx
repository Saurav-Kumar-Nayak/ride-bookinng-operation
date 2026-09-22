import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import './AdminDrivers.css';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const fetchDrivers = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      let query = `?page=${page}&limit=12`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (availability) query += `&availability=${encodeURIComponent(availability)}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(`${API_BASE}/api/admin/drivers${query}`);
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const data = await res.json();
      if (data.success) {
        setDrivers(data.drivers);
        setTotal(data.total);
        setPages(data.pages);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, availability, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchDrivers(true);
  }, [fetchDrivers]);

  // 5-second auto-polling with memory leak protection
  useEffect(() => {
    let isMounted = true;
    const timer = setInterval(() => {
      if (isMounted) {
        fetchDrivers(false);
      }
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [fetchDrivers]);

  const handleToggleStatus = async (driverId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/drivers/${driverId}/toggle-status`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to update driver status');
      fetchDrivers(true);
      if (selectedDriver && selectedDriver._id === driverId) {
        setSelectedDriver(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
      }
    } catch (err) {
      alert(`Error updating driver status: ${err.message}`);
    }
  };

  // Fleet Stats Aggregation for Top KPI Bar
  const availableCount = useMemo(() => {
    return drivers.filter(d => (d.driverDetails?.availability || 'Available') === 'Available').length;
  }, [drivers]);

  const onTripCount = useMemo(() => {
    return drivers.filter(d => (d.driverDetails?.availability) === 'On Trip').length;
  }, [drivers]);

  return (
    <div className="drivers-page-container">
      {/* UBER FLEET COMMAND HEADER */}
      <div className="admin-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="admin-header-title">🚗 RIDEX Fleet Operations Center</h2>
            <span className="admin-live-sync-badge">
              ● LIVE RADAR TELEMETRY {lastUpdated && `(${lastUpdated})`}
            </span>
          </div>
          <p className="admin-header-subtitle">
            Driver profiles, vehicle registration, availability & status ({total} registered drivers in MongoDB)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Toggle Switch */}
          <div className="uber-view-toggle">
            <button
              className={`uber-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              🪟 3D Cards
            </button>
            <button
              className={`uber-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📋 Glass Table
            </button>
          </div>

          <input
            type="text"
            placeholder="🔍 Search name, vehicle, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="admin-input-search"
            style={{ width: '200px' }}
          />

          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="">All Availabilities</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Offline">Offline</option>
          </select>

          <button onClick={() => fetchDrivers(true)} className="admin-btn-secondary">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* UBER FLEET SUMMARY KPI GRID */}
      <div className="uber-fleet-kpi-grid">
        <div className="uber-kpi-card-3d">
          <div className="uber-kpi-icon cyan">🚕</div>
          <div>
            <div className="uber-kpi-label">Registered Fleet</div>
            <div className="uber-kpi-value">{total} Drivers</div>
            <div className="uber-kpi-sub">MongoDB Driver Collection</div>
          </div>
        </div>

        <div className="uber-kpi-card-3d">
          <div className="uber-kpi-icon emerald">🟢</div>
          <div>
            <div className="uber-kpi-label">Available for Dispatch</div>
            <div className="uber-kpi-value">{availableCount} Drivers</div>
            <div className="uber-kpi-sub">Ready for incoming rides</div>
          </div>
        </div>

        <div className="uber-kpi-card-3d">
          <div className="uber-kpi-icon orange">⚡</div>
          <div>
            <div className="uber-kpi-label">Active Trips in Progress</div>
            <div className="uber-kpi-value">{onTripCount} Drivers</div>
            <div className="uber-kpi-sub">Live route navigation</div>
          </div>
        </div>

        <div className="uber-kpi-card-3d">
          <div className="uber-kpi-icon purple">⭐</div>
          <div>
            <div className="uber-kpi-label">Fleet Avg Rating</div>
            <div className="uber-kpi-value">4.85 / 5.0</div>
            <div className="uber-kpi-sub">Customer satisfaction score</div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', background: 'rgba(19, 24, 36, 0.85)', borderRadius: '22px', backdropFilter: 'blur(20px)' }}>
          ⌛ Querying MongoDB driver fleet radar...
        </div>
      )}

      {!isLoading && (
        <>
          {/* UBER 3D CARDS GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="uber-driver-cards-grid">
              {drivers.map((d) => {
                const det = d.driverDetails || {};
                const avail = det.availability || 'Available';
                let availClass = 'available';
                if (avail === 'On Trip') availClass = 'ontrip';
                if (avail === 'Offline') availClass = 'offline';

                const firstLetter = d.name ? d.name.charAt(0).toUpperCase() : 'D';

                return (
                  <div key={d._id} className="uber-driver-card-3d">
                    <div className="uber-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div className="uber-avatar-wrap">
                          <div className="uber-avatar-3d">{firstLetter}</div>
                          {avail === 'Available' && <div className="uber-avatar-online-dot" />}
                        </div>
                        <div className="uber-driver-info">
                          <h4>{d.name}</h4>
                          <p>+91 {d.phone}</p>
                        </div>
                      </div>

                      <span className="uber-plate-badge">
                        {det.vehicleNumber || 'DL 01 AB 1234'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="driver-vehicle-pill-3d">🚕 {det.vehicleType || 'Go Sedan'}</span>
                      <span className={`driver-status-pill-3d ${availClass}`}>
                        {avail === 'Available' ? '🟢 Available' : (avail === 'On Trip' ? '🟠 On Trip' : '⚪ Offline')}
                      </span>
                    </div>

                    <div className="uber-card-stats">
                      <div>
                        <div className="uber-stat-num">⭐ {det.rating || d.rating || 4.7}</div>
                        <div className="uber-stat-sub">Rating</div>
                      </div>
                      <div>
                        <div className="uber-stat-num">{det.totalTrips || 0}</div>
                        <div className="uber-stat-sub">Trips</div>
                      </div>
                      <div>
                        <div className="uber-stat-num" style={{ color: d.status === 'active' ? '#10b981' : '#ef4444' }}>
                          {d.status === 'active' ? 'Active' : 'Suspended'}
                        </div>
                        <div className="uber-stat-sub">Status</div>
                      </div>
                    </div>

                    <div className="uber-card-actions">
                      <button
                        onClick={() => setSelectedDriver(d)}
                        className="admin-btn-sm blue"
                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                      >
                        👁️ Driver Telemetry
                      </button>
                      <button
                        onClick={() => handleToggleStatus(d._id)}
                        className={`admin-btn-sm ${d.status === 'active' ? 'red' : 'green'}`}
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                      >
                        {d.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {drivers.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: '#94a3b8', background: 'rgba(19, 24, 36, 0.85)', borderRadius: '22px' }}>
                  No drivers found matching selected criteria.
                </div>
              )}
            </div>
          )}

          {/* UBER GLASS TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="drivers-table-wrap-3d">
              <table className="drivers-3d-table">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Phone Number</th>
                    <th>Vehicle Type</th>
                    <th>Plate Number</th>
                    <th>Availability</th>
                    <th>Rating</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => {
                    const det = d.driverDetails || {};
                    const avail = det.availability || 'Available';
                    let availClass = 'available';
                    if (avail === 'On Trip') availClass = 'ontrip';
                    if (avail === 'Offline') availClass = 'offline';

                    const firstLetter = d.name ? d.name.charAt(0).toUpperCase() : 'D';

                    return (
                      <tr key={d._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="driver-avatar-3d">{firstLetter}</div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '14px' }}>{d.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                                Trips: {det.totalTrips || 0}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+91 {d.phone}</td>
                        <td>
                          <span className="driver-vehicle-pill-3d">🚕 {det.vehicleType || 'Go Sedan'}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#cbd5e1' }}>
                          {det.vehicleNumber || 'DL 01 AB 1234'}
                        </td>
                        <td>
                          <span className={`driver-status-pill-3d ${availClass}`}>
                            {avail === 'Available' ? '🟢 Available' : (avail === 'On Trip' ? '🟠 On Trip' : '⚪ Offline')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#fbbf24' }}>
                          ⭐ {det.rating || d.rating || 4.7}
                        </td>
                        <td>
                          <span className={`account-badge-3d ${d.status === 'active' ? 'active' : 'inactive'}`}>
                            {d.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedDriver(d)}
                              className="admin-btn-sm blue"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              👁️ Details
                            </button>
                            <button
                              onClick={() => handleToggleStatus(d._id)}
                              className={`admin-btn-sm ${d.status === 'active' ? 'red' : 'green'}`}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              {d.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No drivers found matching selected search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 3D Pagination Footer */}
              <div className="drivers-pagination-3d">
                <span>Showing Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} Total Drivers in MongoDB)</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="admin-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                    ← Prev Page
                  </button>
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="admin-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                    Next Page →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* UBER 3D FLOATING DRIVER PROFILE MODAL */}
      {selectedDriver && (
        <div className="drivers-modal-backdrop-3d" onClick={() => setSelectedDriver(null)}>
          <div className="drivers-modal-content-3d" onClick={(e) => e.stopPropagation()}>
            <div className="drivers-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="uber-avatar-3d" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {selectedDriver.name ? selectedDriver.name.charAt(0).toUpperCase() : 'D'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 900 }}>
                    {selectedDriver.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#00edff', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                    +91 {selectedDriver.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="drivers-modal-grid">
              <div className="drivers-modal-tile">
                <span className="modal-tile-label">Vehicle Category</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#c4b5fd' }}>
                  🚕 {selectedDriver.driverDetails?.vehicleType || 'Go Sedan'}
                </span>
              </div>

              <div className="drivers-modal-tile">
                <span className="modal-tile-label">License Plate Badge</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)' }}>
                  {selectedDriver.driverDetails?.vehicleNumber || 'DL 01 AB 1234'}
                </span>
              </div>

              <div className="drivers-modal-tile">
                <span className="modal-tile-label">Availability Status</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                  {selectedDriver.driverDetails?.availability || 'Available'}
                </span>
              </div>

              <div className="drivers-modal-tile">
                <span className="modal-tile-label">Account Security</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: selectedDriver.status === 'active' ? '#10b981' : '#ef4444' }}>
                  {selectedDriver.status === 'active' ? 'Active' : 'Inactive / Suspended'}
                </span>
              </div>

              <div className="drivers-modal-tile">
                <span className="modal-tile-label">Overall Customer Rating</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>
                  ⭐ {selectedDriver.driverDetails?.rating || selectedDriver.rating || 4.7} / 5.0
                </span>
              </div>

              <div className="drivers-modal-tile">
                <span className="modal-tile-label">Total Completed Trips</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedDriver.driverDetails?.totalTrips || 0} rides
                </span>
              </div>
            </div>

            <div className="drivers-modal-tile">
              <span className="modal-tile-label">Total Gross Earnings</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>
                ₹{(selectedDriver.driverDetails?.totalEarnings || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="drivers-modal-tile">
              <span className="modal-tile-label">Live GPS Telemetry Address</span>
              <span style={{ fontSize: '13px', color: '#f8fafc' }}>
                📍 {selectedDriver.driverDetails?.currentLocation?.address || 'Connaught Place, New Delhi'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => handleToggleStatus(selectedDriver._id)}
                className={`admin-btn-sm ${selectedDriver.status === 'active' ? 'red' : 'green'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {selectedDriver.status === 'active' ? 'Deactivate Driver' : 'Activate Driver'}
              </button>
              <button onClick={() => setSelectedDriver(null)} className="admin-btn-secondary">
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
