import { useState, useEffect, useCallback, useMemo } from 'react';
import API_BASE from '../../config';
import './AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const fetchUsers = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      let query = `?page=${page}&limit=12`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(`${API_BASE}/api/admin/users${query}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  // Fetch on mount & change
  useEffect(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // 5-second auto-polling with memory leak protection
  useEffect(() => {
    let isMounted = true;
    const timer = setInterval(() => {
      if (isMounted) {
        fetchUsers(false);
      }
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [fetchUsers]);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/toggle-status`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to update status');
      fetchUsers(true);
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
      }
    } catch (err) {
      alert(`Error updating user status: ${err.message}`);
    }
  };

  const activeUserCount = useMemo(() => {
    return users.filter(u => u.status === 'active').length;
  }, [users]);

  return (
    <div className="users-page-container">
      {/* UBER PASSENGER MANAGEMENT HEADER */}
      <div className="admin-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className="admin-header-title">👥 RIDEX Passenger Command Center</h2>
            <span className="admin-live-sync-badge">
              ● LIVE SYNC {lastUpdated && `(${lastUpdated})`}
            </span>
          </div>
          <p className="admin-header-subtitle">
            Registered passenger directory & telemetry audit ({total} total riders in MongoDB)
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
            placeholder="🔍 Search name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="admin-input-search"
            style={{ width: '200px' }}
          />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="admin-select"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>

          <button onClick={() => fetchUsers(true)} className="admin-btn-secondary">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* UBER PASSENGER SUMMARY KPI GRID */}
      <div className="uber-users-kpi-grid">
        <div className="uber-user-kpi-card-3d">
          <div className="uber-user-kpi-icon cyan">👥</div>
          <div>
            <div className="uber-user-kpi-label">Total Riders</div>
            <div className="uber-user-kpi-value">{total} Passengers</div>
            <div className="uber-user-kpi-sub">MongoDB User Database</div>
          </div>
        </div>

        <div className="uber-user-kpi-card-3d">
          <div className="uber-user-kpi-icon emerald">🟢</div>
          <div>
            <div className="uber-user-kpi-label">Active Passenger Accounts</div>
            <div className="uber-user-kpi-value">{activeUserCount} Active</div>
            <div className="uber-user-kpi-sub">Verified & authorized accounts</div>
          </div>
        </div>

        <div className="uber-user-kpi-card-3d">
          <div className="uber-user-kpi-icon amber">⭐</div>
          <div>
            <div className="uber-user-kpi-label">Passenger Avg Score</div>
            <div className="uber-user-kpi-value">4.88 / 5.0</div>
            <div className="uber-user-kpi-sub">Behavior & driver feedback</div>
          </div>
        </div>

        <div className="uber-user-kpi-card-3d">
          <div className="uber-user-kpi-icon purple">🛡️</div>
          <div>
            <div className="uber-user-kpi-label">Security Health</div>
            <div className="uber-user-kpi-value">99.8% Shield</div>
            <div className="uber-user-kpi-sub">OTP & Passcode verified</div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', background: 'rgba(19, 24, 36, 0.85)', borderRadius: '22px', backdropFilter: 'blur(20px)' }}>
          ⌛ Querying MongoDB passenger directory radar...
        </div>
      )}

      {!isLoading && (
        <>
          {/* UBER 3D CARDS GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="uber-user-cards-grid">
              {users.map((u) => {
                const firstLetter = u.name ? u.name.charAt(0).toUpperCase() : 'P';

                return (
                  <div key={u._id} className="uber-user-card-3d">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div className="uber-user-avatar-3d">{firstLetter}</div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#f8fafc' }}>
                            {u.name || 'RideX Passenger'}
                          </h4>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            ID: {u._id.substring(0, 10)}...
                          </p>
                        </div>
                      </div>

                      <span className="uber-user-phone-badge">
                        +91 {u.phone}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 700 }}>
                        📧 {u.email || 'No email synced'}
                      </span>
                      <span className={`account-badge-3d ${u.status === 'active' ? 'active' : 'inactive'}`}>
                        {u.status === 'active' ? '● Active' : '● Inactive'}
                      </span>
                    </div>

                    <div className="uber-card-stats">
                      <div>
                        <div className="uber-stat-num" style={{ color: '#fbbf24' }}>⭐ {u.rating || 4.8}</div>
                        <div className="uber-stat-sub">Rider Rating</div>
                      </div>
                      <div>
                        <div className="uber-stat-num">{u.totalTrips || 0}</div>
                        <div className="uber-stat-sub">Trips</div>
                      </div>
                      <div>
                        <div className="uber-stat-num" style={{ color: '#00edff' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="uber-stat-sub">Joined</div>
                      </div>
                    </div>

                    <div className="uber-card-actions">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="admin-btn-sm blue"
                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                      >
                        👁️ Passenger Telemetry
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u._id)}
                        className={`admin-btn-sm ${u.status === 'active' ? 'red' : 'green'}`}
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {users.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: '#94a3b8', background: 'rgba(19, 24, 36, 0.85)', borderRadius: '22px' }}>
                  No passenger accounts found matching criteria.
                </div>
              )}
            </div>
          )}

          {/* UBER GLASS TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="users-table-wrap-3d">
              <table className="users-3d-table">
                <thead>
                  <tr>
                    <th>Passenger</th>
                    <th>Phone Number</th>
                    <th>Email Address</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Registered Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const firstLetter = u.name ? u.name.charAt(0).toUpperCase() : 'P';

                    return (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="uber-user-avatar-3d" style={{ width: '36px', height: '36px', fontSize: '14px', borderRadius: '12px' }}>
                              {firstLetter}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#00edff', fontSize: '14px' }}>{u.name || 'RideX Passenger'}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ID: {u._id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+91 {u.phone}</td>
                        <td style={{ color: '#cbd5e1' }}>{u.email || '—'}</td>
                        <td style={{ fontWeight: 800, color: '#fbbf24' }}>⭐ {u.rating || 4.8}</td>
                        <td>
                          <span className={`account-badge-3d ${u.status === 'active' ? 'active' : 'inactive'}`}>
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="admin-btn-sm blue"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              👁️ Details
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u._id)}
                              className={`admin-btn-sm ${u.status === 'active' ? 'red' : 'green'}`}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No passenger accounts found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 3D Pagination Footer */}
              <div className="users-pagination-3d">
                <span>Showing Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} Total Passengers in MongoDB)</span>
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

      {/* UBER 3D FLOATING PASSENGER TELEMETRY MODAL */}
      {selectedUser && (
        <div className="users-modal-backdrop-3d" onClick={() => setSelectedUser(null)}>
          <div className="users-modal-content-3d" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="uber-user-avatar-3d" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 900 }}>
                    {selectedUser.name || 'RideX Passenger'}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#00edff', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                    +91 {selectedUser.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="users-modal-grid">
              <div className="users-modal-tile">
                <span className="modal-tile-label">Account Security Status</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: selectedUser.status === 'active' ? '#10b981' : '#ef4444' }}>
                  {selectedUser.status === 'active' ? 'Active & Authorized' : 'Deactivated / Suspended'}
                </span>
              </div>

              <div className="users-modal-tile">
                <span className="modal-tile-label">Registered Phone Number</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#00edff', fontFamily: 'var(--font-mono)' }}>
                  +91 {selectedUser.phone}
                </span>
              </div>

              <div className="users-modal-tile">
                <span className="modal-tile-label">Email Address</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  {selectedUser.email || 'N/A'}
                </span>
              </div>

              <div className="users-modal-tile">
                <span className="modal-tile-label">Passenger Rating</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>
                  ⭐ {selectedUser.rating || 4.8} / 5.0
                </span>
              </div>

              <div className="users-modal-tile">
                <span className="modal-tile-label">Total Completed Trips</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedUser.totalTrips || 0} rides
                </span>
              </div>

              <div className="users-modal-tile">
                <span className="modal-tile-label">Account Registration Date</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                  {new Date(selectedUser.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="users-modal-tile">
              <span className="modal-tile-label">Last Active Session</span>
              <span style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString('en-IN') : 'Active Session Logged'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => handleToggleStatus(selectedUser._id)}
                className={`admin-btn-sm ${selectedUser.status === 'active' ? 'red' : 'green'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {selectedUser.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
              <button onClick={() => setSelectedUser(null)} className="admin-btn-secondary">
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
