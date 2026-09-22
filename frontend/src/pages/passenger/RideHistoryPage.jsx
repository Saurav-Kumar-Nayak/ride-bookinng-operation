import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, CheckCircle2, XCircle, FileText, Car, Star } from 'lucide-react';
import BottomNav from '../../components/passenger/BottomNav.jsx';
import '../../passenger.css';
import '../driver/TripHistory3D.css';

const defaultRides = [
  { id: 1, from: 'Master Canteen Square, Bhubaneswar', to: 'Infocity, Patia, Bhubaneswar', date: 'Today, 2:15 PM', fare: 107, status: 'Completed', type: 'Mini 🚗', dist: '14 km', duration: '28 min', driver: 'Rajesh K.', rating: 5 },
  { id: 2, from: 'Esplanade One Mall, Rasulgarh', to: 'Jayadev Vihar, Bhubaneswar', date: 'Yesterday, 7:30 PM', fare: 68, status: 'Completed', type: 'Auto 🛺', dist: '5.2 km', duration: '16 min', driver: 'Suresh M.', rating: 4 },
  { id: 3, from: 'Biju Patnaik Airport, Bhubaneswar', to: 'KIIT Square, Patia', date: '28 Jul, 11:00 AM', fare: 220, status: 'Completed', type: 'Sedan 🚙', dist: '18 km', duration: '35 min', driver: 'Vinod S.', rating: 5 },
  { id: 4, from: 'AMRI Hospital, Khandagiri', to: 'Saheed Nagar, Bhubaneswar', date: '25 Jul, 9:10 AM', fare: 95, status: 'Cancelled', type: 'Mini 🚗', dist: '6.1 km', duration: '—', driver: '—', rating: null }
];

export default function RideHistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [rideList, setRideList] = useState(defaultRides);

  useEffect(() => {
    async function fetchUserRides() {
      try {
        const API_BASE = (await import('../../config')).default;
        const res = await fetch(`${API_BASE}/api/bookings?limit=20`);
        const data = await res.json();
        
        const mapStatus = (s) => (String(s || '').toLowerCase().includes('cancel') ? 'Cancelled' : 'Completed');

        let fetchedRides = [];
        if (data.bookings && data.bookings.length > 0) {
          fetchedRides = data.bookings.map((b, idx) => ({
            id: `api_${b._id || idx}`,
            from: b.pickupLocation || 'Patia, Bhubaneswar',
            to: b.dropLocation || 'Master Canteen, Bhubaneswar',
            date: b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
            fare: b.fare || 120,
            status: mapStatus(b.status),
            type: `${b.vehicleType || 'Mini'} 🚗`,
            dist: `${b.distance || 6.4} km`,
            duration: '20 min',
            driver: 'Vikram S.',
            rating: b.driverRating || 5
          }));
        }

        if (fetchedRides.length > 0) {
          setRideList(fetchedRides);
        }
      } catch (e) {
        console.warn('RideHistory fetch warning:', e.message);
      }
    }
    fetchUserRides();
  }, []);

  const filtered = rideList.filter(r => {
    const matchFilter = filter === 'All' || r.status === filter;
    const matchSearch = !search ||
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="trip-history-wrapper" style={{ padding: '20px 20px 80px 20px' }}>
      {/* Hero Section */}
      <div className="th-hero-banner">
        <div>
          <div className="th-hero-tagline">
            <Compass size={14} color="#3B82F6" />
            <span>YOUR JOURNEY</span>
          </div>
          <h1 className="th-hero-heading">Trip History</h1>
          <p className="th-hero-subtitle">
            View and manage all your completed trips, passenger details, and receipts.
          </p>
        </div>

        <button onClick={() => navigate('/book')} className="th-hero-cta-btn">
          <Car size={18} />
          <span>Book New Trip</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="th-filter-bar">
        <div className="th-search-box">
          <Search size={17} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search trip history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="th-search-input"
          />
        </div>

        <div className="th-segmented-group">
          {['All', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`th-segment-btn ${filter === st ? (st === 'All' ? 'active-all' : st === 'Completed' ? 'active-completed' : 'active-cancelled') : ''}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ride Record Cards */}
      <div className="th-records-container">
        {filtered.map(ride => {
          const isCompleted = ride.status === 'Completed';
          return (
            <div key={ride.id} className="th-record-card">
              <div className="th-record-header">
                <div>
                  <div className="th-booking-id">Trip #{ride.id}</div>
                  <div className="th-booking-date">{ride.date}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className={`th-status-pill ${isCompleted ? 'completed' : 'cancelled'}`}>
                    {isCompleted ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{ride.status}</span>
                  </span>

                  <div style={{ fontSize: 20, fontWeight: 900, color: isCompleted ? '#22C55E' : '#94A3B8' }}>
                    {isCompleted ? `₹${ride.fare}` : '—'}
                  </div>
                </div>
              </div>

              {/* Route Preview */}
              <div className="th-route-preview">
                <div className="th-route-map-bg" />
                <div className="th-route-line-container">
                  <div className="th-marker-pickup" />
                  <div className="th-route-dashed-line" />
                  <div className="th-marker-drop" />
                </div>

                <div className="th-route-locations">
                  <div className="th-location-item">
                    <span className="th-location-label">Pickup Location</span>
                    <span className="th-location-text">{ride.from}</span>
                  </div>
                  <div className="th-location-item">
                    <span className="th-location-label">Destination</span>
                    <span className="th-location-text">{ride.to}</span>
                  </div>
                </div>

                <div className="th-route-metrics-badge">
                  <div className="th-metrics-dist">{ride.dist}</div>
                  <div className="th-metrics-time">{ride.duration}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav active="history" />
    </div>
  );
}
