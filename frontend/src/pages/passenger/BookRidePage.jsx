import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLiveLocationMap from '../../components/passenger/GoogleLiveLocationMap.jsx';
import { VehicleIcon } from '../../components/passenger/VehicleIcons.jsx';
import { getCurrentFestiveData } from '../../utils/festiveOffers.js';
import { getCoordinatesFromLocationText, getHaversineDistanceKm, getVehicleMetrics, isValidCoordinate } from '../../utils/locationGeocoder.js';
import API_BASE from '../../config.js';
import '../../passenger.css';

const rideOptions = [
  { id: 'bike', emoji: '🏍️', name: 'Bike', fareMultiplier: 0.6, seats: 1, base: 30, arrivalMins: 2, minsPerKm: 1.8 },
  { id: 'auto', emoji: '🛺', name: 'Auto', fareMultiplier: 0.85, seats: 3, base: 45, arrivalMins: 3, minsPerKm: 2.5 },
  { id: 'mini', emoji: '🚗', name: 'Mini', fareMultiplier: 1.0, seats: 4, base: 60, arrivalMins: 3, minsPerKm: 2.2 },
  { id: 'sedan', emoji: '🚙', name: 'Sedan', fareMultiplier: 1.4, seats: 4, base: 90, arrivalMins: 4, minsPerKm: 2.0 },
  { id: 'suv', emoji: '🚐', name: 'SUV', fareMultiplier: 2.0, seats: 6, base: 140, arrivalMins: 5, minsPerKm: 2.4 },
  { id: 'prime', emoji: '✨', name: 'Prime', fareMultiplier: 2.5, seats: 4, base: 180, arrivalMins: 3, minsPerKm: 1.9 },
];

const paymentMethods = [
  { id: 'upi', icon: '💳', label: 'UPI', sub: 'Instant payment' },
  { id: 'wallet', icon: '👛', label: 'Wallet', sub: '₹850 available' },
  { id: 'card', icon: '💰', label: 'Card', sub: 'HDFC •••• 4521' },
  { id: 'cash', icon: '💵', label: 'Cash', sub: 'Pay driver' },
];

const getCleanLocationText = (locState, sessionKey, fallbackText) => {
  if (locState) {
    if (typeof locState === 'string' && locState.trim() && !locState.trim().startsWith('{')) {
      return locState.trim();
    }
    if (typeof locState === 'object' && locState.address) {
      return locState.address;
    }
  }
  const sessionVal = sessionStorage.getItem(sessionKey);
  if (sessionVal) {
    if (typeof sessionVal === 'string' && !sessionVal.trim().startsWith('{')) {
      return sessionVal.trim();
    }
    try {
      const parsed = JSON.parse(sessionVal);
      if (parsed?.address) return parsed.address;
    } catch (e) {}
  }
  return fallbackText;
};

const getCleanCoords = (locState, fallbackLat, fallbackLng, fallbackAddr) => {
  return getCoordinatesFromLocationText(locState, fallbackLat, fallbackLng, fallbackAddr);
};

export default function BookRidePage() {
  const navigate = useNavigate();
  const [selectedRide, setRide] = useState(() => {
    const savedCat = sessionStorage.getItem('selectedVehicleCategory');
    if (savedCat) {
      const match = rideOptions.find(r => r.id === savedCat);
      if (match) return match.id;
    }
    return 'mini';
  });
  const [selectedPay, setPay] = useState('upi');
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('idle'); // 'idle' | 'confirming' | 'confirmed' | 'failed'
  const [bookingError, setBookingError] = useState(null);
  const confirmLockRef = useRef(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchEnd - touchStart;
    if (diff > 40) {
      setIsCollapsed(true);
    } else if (diff < -40) {
      setIsCollapsed(false);
    }
    setTouchStart(null);
  };

  useEffect(() => {
    const appliedPromo = sessionStorage.getItem('ridex_applied_promo');
    if (appliedPromo) {
      setPromo(appliedPromo.toUpperCase());
      setPromoApplied(true);
    }
  }, []);

  const savedPickup = sessionStorage.getItem('pickupLocation');
  const savedDest = sessionStorage.getItem('destLocation');

  const [pickup, setPickup] = useState(
    savedPickup ? (savedPickup.startsWith('{') ? JSON.parse(savedPickup) : { address: savedPickup }) : { lat: 20.3533, lng: 85.8266, address: '📍 Patia, Bhubaneswar' }
  );
  const [destination, setDestination] = useState(
    savedDest ? (savedDest.startsWith('{') ? JSON.parse(savedDest) : { address: savedDest }) : { lat: 20.2961, lng: 85.8245, address: '🏁 Master Canteen, Bhubaneswar' }
  );

  const getPromoDiscountAmount = (code, fareBase) => {
    if (!code) return 0;
    const clean = code.trim().toUpperCase();
    if (clean === 'PUJA2026') return Math.min(30, Math.max(5, Math.round(fareBase * 0.05)));
    if (clean === 'DURGAPASS') return Math.min(50, Math.max(10, Math.round(fareBase * 0.10)));
    if (clean === 'NAVYATRA') return Math.min(35, Math.max(8, Math.round(fareBase * 0.08)));
    if (clean === 'DIWALI10') return Math.min(40, Math.max(10, Math.round(fareBase * 0.10)));
    if (clean === 'NEWYEAR2026') return Math.min(45, Math.max(10, Math.round(fareBase * 0.10)));
    if (clean === 'XMASGIFT') return Math.min(25, Math.max(5, Math.round(fareBase * 0.05)));
    return Math.min(30, Math.max(5, Math.round(fareBase * 0.07)));
  };

  const pCoords = getCleanCoords(pickup, 20.3562, 85.8188, 'Patia');
  const dCoords = getCleanCoords(destination, 20.2980, 85.8350, 'Master Canteen');

  const calculatedHaversine = getHaversineDistanceKm(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
  const distKm = routeInfo?.distanceKm || (calculatedHaversine > 0 ? calculatedHaversine : 4.4);

  const currentOption = rideOptions.find(r => r.id === selectedRide) || rideOptions[2];
  const { driverArrivalMins: selectedArrivalEta, tripDurationMins: selectedTripDuration } = getVehicleMetrics(currentOption, distKm);
  const calculatedFare = Math.round(currentOption.base + distKm * 14 * currentOption.fareMultiplier);
  const taxesAndFees = 12;
  const subtotalFare = calculatedFare + taxesAndFees;
  const discount = promoApplied ? getPromoDiscountAmount(promo, calculatedFare) : 0;
  const finalTotalFare = Math.max(20, subtotalFare - discount);

  const handleConfirm = () => {
    try {
      const pAddr = getCleanLocationText(pickup, 'pickupLocation', '📍 Patia, Bhubaneswar');
      const dAddr = getCleanLocationText(destination, 'destLocation', '🏁 Master Canteen, Bhubaneswar');

      const pCoordsClean = getCleanCoords(pickup, 20.3562, 85.8188, pAddr);
      const dCoordsClean = getCleanCoords(destination, 20.2980, 85.8350, dAddr);

      const bookingId = `RIDEX-${Math.floor(100000 + Math.random() * 900000)}`;

      const driverForVehicle = {
        Bike:  { id: 1, name: 'Vikram Singh', avatar: '👨🏽‍✈️', rating: '4.95', rides: '4,120', since: '2020', vehicleIcon: '🏍️', vehicleName: 'TVS Apache RTR 160 (Bike)', vehicleNum: 'DL 3S AK 8921', vehicleNumber: 'DL 3S AK 8921', phone: '+91 98112 34567' },
        Auto:  { id: 2, name: 'Pankaj Yadav', avatar: '👨🏻‍✈️', rating: '4.94', rides: '3,210', since: '2021', vehicleIcon: '🛺', vehicleName: 'Bajaj RE LPG (Auto)', vehicleNum: 'DL 1R TT 4321', vehicleNumber: 'DL 1R TT 4321', phone: '+91 98990 11223' },
        Mini:  { id: 3, name: 'Sandeep Verma', avatar: '👨🏼‍✈️', rating: '4.92', rides: '2,890', since: '2021', vehicleIcon: '🚗', vehicleName: 'Maruti WagonR (Mini)', vehicleNum: 'DL 8S MM 4512', vehicleNumber: 'DL 8S MM 4512', phone: '+91 98765 43210' },
        Sedan: { id: 4, name: 'Amit Sharma', avatar: '👨🏻‍✈️', rating: '4.97', rides: '5,670', since: '2018', vehicleIcon: '🚙', vehicleName: 'Swift Dzire (Sedan)', vehicleNum: 'DL 4C AB 7890', vehicleNumber: 'DL 4C AB 7890', phone: '+91 98101 22334' },
        SUV:   { id: 5, name: 'Manoj Kumar', avatar: '👨🏿‍✈️', rating: '4.89', rides: '4,850', since: '2019', vehicleIcon: '🚐', vehicleName: 'Toyota Innova Crysta (SUV)', vehicleNum: 'UP 16 B 9012', vehicleNumber: 'UP 16 B 9012', phone: '+91 99100 88776' },
        Prime: { id: 6, name: 'Rakesh Sharma', avatar: '👨🏽‍✈️', rating: '4.98', rides: '6,400', since: '2020', vehicleIcon: '✨', vehicleName: 'Tata Nexon EV Prime', vehicleNum: 'DL 12 C 8877', vehicleNumber: 'DL 12 C 8877', phone: '+91 98223 99887' },
      }[currentOption?.name || 'Mini'] || { id: 4, name: 'Amit Sharma', avatar: '👨🏻‍✈️', rating: '4.97', rides: '5,670', since: '2018', vehicleIcon: '🚗', vehicleName: 'Mini Ride', vehicleNum: 'DL 4C AB 7890', vehicleNumber: 'DL 4C AB 7890', phone: '+91 98101 22334' };

      const cleanDistance = parseFloat(Number(distKm).toFixed(1));

      sessionStorage.setItem('ridex_booking_id', bookingId);
      sessionStorage.setItem('ridex_current_driver', JSON.stringify(driverForVehicle));
      sessionStorage.setItem('ridex_current_booking', JSON.stringify({
        bookingId,
        pickup: pAddr,
        drop: dAddr,
        fare: `₹${finalTotalFare}`,
        rawFare: finalTotalFare,
        vehicle: currentOption?.name || 'Mini',
        vehicleIcon: currentOption?.emoji || '🚗',
        distKm: cleanDistance,
        tripDuration: selectedTripDuration || 15,
        vehicleEta: selectedArrivalEta || 3,
        status: 'Confirmed'
      }));

      sessionStorage.setItem('pickupCoords', JSON.stringify(pCoordsClean));
      sessionStorage.setItem('destCoords', JSON.stringify(dCoordsClean));
      sessionStorage.setItem('pickupLocation', pAddr);
      sessionStorage.setItem('destLocation', dAddr);

      // Async background save to backend (if available)
      fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          pickupLocation: pAddr,
          dropLocation: dAddr,
          vehicleType: currentOption?.name || 'Mini',
          paymentMethod: selectedPay === 'upi' ? 'UPI' : selectedPay === 'card' ? 'Credit Card' : selectedPay === 'cash' ? 'Cash' : 'Wallet',
          fare: finalTotalFare,
          rawFare: finalTotalFare,
          distance: cleanDistance,
          status: 'Confirmed'
        })
      }).catch(e => console.warn('Background booking save:', e));

      // Instant UI transition to Driver Assigned screen
      window.location.href = '/driver-assigned';
    } catch (err) {
      console.error('Confirm error:', err);
      window.location.href = '/driver-assigned';
    }
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', height: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto', overflow: 'hidden', background: '#090a10' }}>

      {/* ── Live Location Map ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GoogleLiveLocationMap
          height="100%"
          mode="book"
          pickupLocation={pickup}
          setPickupLocation={setPickup}
          destinationLocation={destination}
          setDestinationLocation={setDestination}
          onRouteCalculated={(info) => setRouteInfo(info)}
          showSearchInputs={false}
          showSummaryBar={false}
        />
      </div>

      {/* ── Top Bar with Route Summary ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(9,10,16,0.95), transparent)',
        padding: '50px 16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate('/home')}
          style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0, 237, 255, 0.3)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          ←
        </button>

        {/* Route Summary Pill */}
        <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(0, 237, 255, 0.4)', borderRadius: 16, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
          <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 800, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getCleanLocationText(pickup, 'pickupLocation', '📍 Patia').split(',')[0]} → {getCleanLocationText(destination, 'destLocation', '🏁 Master Canteen').split(',')[0]}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#00edff', fontWeight: 800, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              📏 {routeInfo?.distance || `${distKm} km`}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>•</span>
            <span style={{ color: '#34d399', fontWeight: 800, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              ⏱️ {routeInfo?.duration || `${selectedTripDuration} mins`}
            </span>
            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 11, background: 'rgba(251, 191, 36, 0.15)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(251, 191, 36, 0.3)', fontFamily: 'var(--font-mono)' }}>
              🚗 {selectedArrivalEta} min away
            </span>
          </div>
        </div>

        {/* Map / Rides Toggle Button */}
        <button onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ padding: '10px 14px', background: 'rgba(0, 237, 255, 0.2)', border: '1.5px solid #00edff', borderRadius: 14, color: '#00edff', fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 15px rgba(0,237,255,0.3)' }}>
          {isCollapsed ? '📋 Ride Options' : '🗺️ View Map'}
        </button>
      </div>

      {/* Floating Instant Confirm Pill (Visible when Map collapsed mode is active) */}
      {isCollapsed && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 25, animation: 'fadeInUp 0.3s ease' }}>
          <button onClick={handleConfirm} disabled={confirming}
            style={{
              width: '100%', padding: '16px 20px',
              background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)',
              border: 'none', borderRadius: 20, color: '#0f172a', fontWeight: 900, fontSize: 16,
              cursor: confirming ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              boxShadow: '0 8px 32px rgba(0, 237, 255, 0.6)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            {confirming ? (
              <><div style={{ width: 22, height: 22, border: '2.5px solid rgba(15,23,42,0.3)', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Confirming Booking...</>
            ) : (
              `⚡ Instant Confirm ${currentOption.emoji} ${currentOption.name} — ₹${finalTotalFare}`
            )}
          </button>
        </div>
      )}

      {/* ── Dynamic Uber Bottom Sheet ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(180deg, rgba(19, 24, 36, 0.98) 0%, rgba(9, 10, 16, 0.99) 100%)',
        borderTop: '1.5px solid rgba(0, 237, 255, 0.4)',
        borderRadius: '32px 32px 0 0',
        boxShadow: '0 -15px 50px rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '78vh',
        transform: isCollapsed ? 'translateY(calc(100% - 74px))' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Dynamic Handle Bar Header (Clickable & Draggable Arrow Handle) */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: 'pointer',
            paddingTop: 12,
            paddingBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            userSelect: 'none',
            background: isCollapsed ? 'rgba(0, 237, 255, 0.08)' : 'transparent',
            borderRadius: '32px 32px 0 0',
            transition: 'background 0.2s ease',
          }}
        >
          {/* Animated Handle Bar Pill */}
          <div style={{
            width: 54,
            height: 5,
            borderRadius: 999,
            background: isCollapsed ? '#00edff' : 'rgba(0, 237, 255, 0.5)',
            boxShadow: isCollapsed ? '0 0 14px rgba(0, 237, 255, 0.9)' : 'none',
            transition: 'all 0.3s ease',
          }} />

          {/* Dynamic Interactive Arrow Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
            fontSize: 11,
            fontWeight: 800,
            color: '#00edff',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ fontSize: 13, transition: 'transform 0.3s', transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>▼</span>
            <span>{isCollapsed ? 'TAP / SWIPE UP TO SEE RIDE OPTIONS' : 'TAP / SWIPE DOWN TO VIEW ROUTE MAP'}</span>
            <span style={{ fontSize: 13, transition: 'transform 0.3s', transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>▼</span>
          </div>
        </div>

        {/* Scrollable Vehicle & Fare Content Section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px' }}>
          {/* Ride Options Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', margin: 0 }}>
              Select Vehicle Category
            </h3>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#00edff', background: 'rgba(0, 237, 255, 0.12)', border: '1px solid rgba(0, 237, 255, 0.3)', padding: '3px 10px', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>
              ⚡ FAST DISPATCH
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {rideOptions.map(r => {
              const { driverArrivalMins, tripDurationMins } = getVehicleMetrics(r, distKm);
              const rFare = Math.round(r.base + distKm * 14 * r.fareMultiplier);
              const rDisc = promoApplied ? getPromoDiscountAmount(promo, rFare) : 0;
              const rFinalFare = Math.max(20, rFare - rDisc);
              const isSelected = selectedRide === r.id;

              return (
                <div key={r.id} onClick={() => setRide(r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: isSelected ? 'rgba(0, 237, 255, 0.12)' : 'rgba(15, 23, 42, 0.85)',
                    border: `2px solid ${isSelected ? '#00edff' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 18, padding: '14px 16px', cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: isSelected ? 'scale(1.02)' : 'none',
                    boxShadow: isSelected ? '0 0 20px rgba(0, 237, 255, 0.25)' : 'none'
                  }}>
                  <div style={{ width: 48, display: 'flex', justifyContent: 'center' }}>
                    <VehicleIcon type={r.id} size={40} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, color: isSelected ? '#ffffff' : '#f8fafc', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.name}
                      {rDisc > 0 && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #34d399', color: '#34d399', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999 }}>
                          Save ₹{rDisc}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>👤 {r.seats} seats</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span style={{ color: isSelected ? '#fbbf24' : '#00edff', fontWeight: isSelected ? 800 : 600 }}>
                        ⏱ {driverArrivalMins} min away
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span>{tripDurationMins} min trip</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {rDisc > 0 ? (
                      <div>
                        <div style={{ textDecoration: 'line-through', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>₹{rFare}</div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: '#34d399' }}>₹{rFinalFare}</div>
                      </div>
                    ) : (
                      <div style={{ fontWeight: 900, fontSize: 18, color: isSelected ? '#00edff' : '#f8fafc' }}>₹{rFare}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Festive Promos Bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🏷️</span> TAP PROMO CODE TO FILL:
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {getCurrentFestiveData().festiveOffers.map(o => (
                <button
                  key={o.code}
                  onClick={() => {
                    setPromo(o.code);
                    setPromoApplied(false);
                  }}
                  style={{
                    flexShrink: 0,
                    background: promo === o.code ? 'rgba(0, 237, 255, 0.18)' : 'rgba(15, 23, 42, 0.95)',
                    border: `1.5px dashed ${promo === o.code ? '#00edff' : o.color}`,
                    borderRadius: 14,
                    padding: '8px 14px',
                    color: promo === o.code ? '#00edff' : o.color,
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {o.code} ({o.disc})
                </button>
              ))}
            </div>
          </div>

          {/* Promo Code Box */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              placeholder="Enter Promo Code (e.g. PUJA2026)"
              value={promo}
              onChange={e => {
                setPromo(e.target.value.toUpperCase());
                setPromoApplied(false);
              }}
              style={{ flex: 1, padding: '13px 16px', background: 'rgba(15, 23, 42, 0.9)', border: `1.5px solid ${promoApplied ? '#34d399' : 'rgba(0, 237, 255, 0.3)'}`, borderRadius: 14, fontSize: 14, color: '#f8fafc', fontFamily: 'inherit', outline: 'none', fontWeight: 700 }}
            />
            <button
              onClick={() => {
                if (promo.trim().length > 0) {
                  setPromoApplied(true);
                }
              }}
              style={{ padding: '13px 20px', background: promoApplied ? '#10b981' : 'linear-gradient(135deg, #00edff, #3b82f6)', border: 'none', borderRadius: 14, color: promoApplied ? '#fff' : '#0f172a', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {promoApplied ? '✓ Applied' : 'Apply'}
            </button>
          </div>

          {promoApplied && discount > 0 && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #34d399', borderRadius: 14, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: '#34d399', fontWeight: 800 }}>
                🎉 Promo <strong>{promo}</strong> Applied! Savings: <strong>₹{discount}</strong>
              </div>
              <button onClick={() => { setPromoApplied(false); setPromo(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          )}

          {/* Payment Method Selector */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: 18, padding: '14px 16px', marginBottom: 16, border: '1px solid rgba(0, 237, 255, 0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.05em' }}>PAYMENT METHOD</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {paymentMethods.map(pm => (
                <button key={pm.id} onClick={() => setPay(pm.id)}
                  style={{
                    flex: 1, padding: '12px 6px',
                    background: selectedPay === pm.id ? 'linear-gradient(135deg, #00edff, #3b82f6)' : 'rgba(15, 23, 42, 0.95)',
                    border: `1.5px solid ${selectedPay === pm.id ? '#00edff' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.25s ease', fontSize: 11, fontWeight: 800,
                    color: selectedPay === pm.id ? '#0f172a' : '#f8fafc',
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{pm.icon}</div>
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fare Summary Breakdown */}
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(0, 237, 255, 0.25)', borderRadius: 18, padding: '16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Base Fare ({distKm} km)</span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>₹{calculatedFare}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>Taxes & Tech Fee (5% GST)</span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>₹{taxesAndFees}</span>
            </div>

            {promoApplied && discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, background: 'rgba(16, 185, 129, 0.15)', padding: '8px 12px', borderRadius: 10, border: '1px solid #34d399' }}>
                <span style={{ color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏷️ Festive Savings ({promo.toUpperCase()})
                </span>
                <span style={{ fontWeight: 900, color: '#34d399' }}>- ₹{discount}</span>
              </div>
            )}

            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 900, fontSize: 16, color: '#f8fafc' }}>Total Fare</span>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Includes all fees & taxes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {promoApplied && discount > 0 && (
                  <div style={{ textDecoration: 'line-through', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    ₹{subtotalFare}
                  </div>
                )}
                <div style={{ fontWeight: 900, fontSize: 22, color: promoApplied && discount > 0 ? '#34d399' : '#00edff' }}>
                  ₹{finalTotalFare}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ALWAYS-PINNED Sticky Confirmation Button at Bottom of Sheet */}
        <div style={{ padding: '16px 20px 28px', background: 'rgba(9, 10, 16, 0.98)', borderTop: '1px solid rgba(0, 237, 255, 0.2)' }}>
          {bookingStatus === 'failed' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid #ef4444',
              borderRadius: 16,
              padding: '12px 16px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 700 }}>
                ⚠️ {bookingError || 'Booking confirmation failed.'}
              </div>
              <button
                onClick={handleConfirm}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 14px',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🔁 Retry
              </button>
            </div>
          )}

          <button onClick={handleConfirm} disabled={confirming || bookingStatus === 'confirming'}
            style={{
              width: '100%', padding: '17px',
              background: confirming || bookingStatus === 'confirming' ? 'rgba(0, 237, 255, 0.3)' : 'linear-gradient(135deg, #00edff 0%, #3b82f6 50%, #8b5cf6 100%)',
              border: 'none', borderRadius: 20, color: '#0f172a', fontWeight: 900, fontSize: 17, cursor: confirming || bookingStatus === 'confirming' ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 32px rgba(0,237,255,0.45)', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
            }}>
            {confirming || bookingStatus === 'confirming' ? (
              <><div style={{ width: 22, height: 22, border: '2.5px solid rgba(15,23,42,0.3)', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Confirming Booking...</>
            ) : (
              `🚀 Confirm ${currentOption.emoji} ${currentOption.name} — ₹${finalTotalFare}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
