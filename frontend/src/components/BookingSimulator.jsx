import { useState, useEffect, useRef } from 'react';

const pickupLocationsList = [
  'Connaught Place', 'Karol Bagh', 'Saket', 'Badarpur', 'Pragati Maidan', 
  'Madipur', 'AIIMS', 'Mehrauli', 'Dwarka Sector 21', 'Pataudi Chowk',
  'Khandsa', 'Barakhamba Road', 'Noida Sector 62', 'Gurgaon Phase 3', 'Vasant Kunj'
];

const dropLocationsList = [
  'Connaught Place', 'Karol Bagh', 'Saket', 'Badarpur', 'Pragati Maidan', 
  'Madipur', 'AIIMS', 'Mehrauli', 'Dwarka Sector 21', 'Pataudi Chowk',
  'Khandsa', 'Barakhamba Road', 'Noida Sector 62', 'Gurgaon Phase 3', 'Vasant Kunj',
  'Rajendra Place', 'Lajpat Nagar', 'Green Park', 'Hauz Khas', 'R.K. Puram'
];

const vehicleTypes = ['Auto', 'Go Mini', 'Go Sedan', 'Bike', 'Premier Sedan', 'eBike', 'Uber XL'];
const paymentMethods = ['UPI', 'Cash', 'Uber Wallet', 'Credit Card', 'Debit Card'];

// Driver names array for simulation immersion
const drivers = ['Rohan Sharma', 'Amit Kumar', 'Suresh Kumar', 'Rajendra Singh', 'Vikram Negi', 'Manpreet Singh', 'Abdul Rahman'];

export default function BookingSimulator({ onSimulateComplete }) {
  const [pickup, setPickup] = useState('Saket');
  const [drop, setDrop] = useState('Connaught Place');
  const [vehicle, setVehicle] = useState('Auto');
  const [payment, setPayment] = useState('UPI');

  const [simState, setSimState] = useState('idle'); // idle, simulating, finished
  const [logs, setLogs] = useState([]);
  const [finalBooking, setFinalBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef([]);

  useEffect(() => {
    const currentTimers = timerRef.current;
    // Clean up timers on unmount
    return () => {
      currentTimers.forEach(t => clearTimeout(t));
    };
  }, []);

  const runSimulationLogs = (booking) => {
    setLogs([]);
    const generatedDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const logTimeline = [];

    // Step 1: Base connect
    logTimeline.push({ delay: 0, text: `Connecting to Ola dispatch API server...` });
    logTimeline.push({ delay: 500, text: `Analyzing vehicle demand in ${pickup} area...` });
    logTimeline.push({ delay: 1100, text: `Broadcasting ride requests to nearby ${vehicle} drivers...` });

    if (booking.status === 'Completed') {
      logTimeline.push({ delay: 1800, text: `Driver accepted! Assigned driver: ${generatedDriver} (⭐${booking.driverRating || '4.5'})` });
      logTimeline.push({ delay: 2500, text: `Vehicle details: ${vehicle} (MH02-Y-${Math.floor(Math.random() * 9000 + 1000)})` });
      logTimeline.push({ delay: 3200, text: `Ride is in progress. Route: ${pickup} ➔ ${drop} (${booking.distance} KM)` });
      logTimeline.push({ delay: 4200, text: `Destination reached! Fare: ₹${booking.fare}. Payment confirmed via ${booking.paymentMethod}.` });
    } else if (booking.status === 'Cancelled by Driver') {
      logTimeline.push({ delay: 1800, text: `Driver accepted: ${generatedDriver} (⭐${parseFloat((4 + Math.random()).toFixed(1))})` });
      logTimeline.push({ delay: 2600, text: `CANCELLED: Driver cancelled the booking. Reason: "${booking.driverCancellationReason}"` });
    } else if (booking.status === 'Cancelled by Customer') {
      logTimeline.push({ delay: 1800, text: `Driver accepted: ${generatedDriver} (⭐${parseFloat((4 + Math.random()).toFixed(1))})` });
      logTimeline.push({ delay: 2600, text: `CANCELLED: Booking cancelled by passenger. Reason: "${booking.custCancellationReason}"` });
    } else if (booking.status === 'No Driver Found') {
      logTimeline.push({ delay: 1800, text: `High demand alert! Searching backup grid...` });
      logTimeline.push({ delay: 2800, text: `DISPATCH TIMEOUT: No drivers available within 5km radius.` });
    } else {
      // Incomplete
      logTimeline.push({ delay: 1800, text: `Driver accepted: ${generatedDriver} (⭐4.6)` });
      logTimeline.push({ delay: 2500, text: `Ride started...` });
      logTimeline.push({ delay: 3300, text: `DISCONNECTED: GPS tracking lost. Fare transaction incomplete.` });
    }

    // Sequentially show logs
    logTimeline.forEach((item) => {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, item.text]);
        // Scroll logs window to bottom
        const el = document.getElementById('log-box');
        if (el) el.scrollTop = el.scrollHeight;
      }, item.delay);
      timerRef.current.push(timer);
    });

    // Complete simulation
    const finalTimer = setTimeout(() => {
      setSimState('finished');
      setFinalBooking(booking);
      if (onSimulateComplete) {
        onSimulateComplete(); // Updates statistical dashboard
      }
    }, logTimeline[logTimeline.length - 1].delay + 500);
    timerRef.current.push(finalTimer);
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (pickup === drop) {
      alert("Pickup and Drop locations cannot be the same!");
      return;
    }

    setIsSubmitting(true);
    setSimState('simulating');
    setLogs(['Initializing...']);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLocation: pickup,
          dropLocation: drop,
          vehicleType: vehicle,
          paymentMethod: payment,
          simulate: true // Requests backend outcome randomizer
        })
      });

      if (!response.ok) {
        throw new Error('Server booking request failed.');
      }
      
      const data = await response.json();
      runSimulationLogs(data.booking);
    } catch (err) {
      setLogs(prev => [...prev, `ERROR: ${err.message}`]);
      setSimState('finished');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSimState('idle');
    setLogs([]);
    setFinalBooking(null);
  };

  return (
    <div className="panel simulator-panel">
      <h3>Live Dispatch Simulation</h3>
      
      {simState === 'idle' && (
        <form onSubmit={handleSimulate} className="simulator-form">
          <div className="form-group">
            <label>Pickup Location</label>
            <select className="form-select" value={pickup} onChange={(e) => setPickup(e.target.value)}>
              {pickupLocationsList.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Drop Location</label>
            <select className="form-select" value={drop} onChange={(e) => setDrop(e.target.value)}>
              {dropLocationsList.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Class</label>
            <select className="form-select" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select className="form-select" value={payment} onChange={(e) => setPayment(e.target.value)}>
              {paymentMethods.map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Routing...' : 'Simulate Ride Dispatch'}
          </button>
        </form>
      )}

      {(simState === 'simulating' || simState === 'finished') && (
        <div className="sim-screen">
          <div className="sim-header">
            <div className="sim-headline">Ola Fleet Dispatcher Console</div>
            {simState === 'simulating' && <div className="sim-spinner"></div>}
          </div>
          
          <div className="sim-logs" id="log-box">
            {logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              return (
                <div 
                  key={index} 
                  className={`log-entry ${isLast ? 'pulse' : ''}`}
                >
                  &gt; {log}
                </div>
              );
            })}
          </div>

          {simState === 'finished' && finalBooking && (
            <div className="sim-details" style={{ animation: 'logFadeIn 0.3s ease-out' }}>
              <span className={`sim-result-badge ${finalBooking.status === 'Completed' ? 'completed' : 'cancelled'}`}>
                Booking Status: {finalBooking.status}
              </span>
              <div style={{ marginTop: '8px', fontSize: '11px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>ID: <strong>{finalBooking.bookingId}</strong></span>
                <span>Distance: <strong>{finalBooking.distance} KM</strong></span>
                {finalBooking.fare > 0 && <span>Fare: <strong>₹{finalBooking.fare}</strong></span>}
                {finalBooking.status === 'Completed' && (
                  <span>Cust Rating: <strong>⭐{finalBooking.customerRating}</strong></span>
                )}
              </div>
              <button 
                className="reset-sim-btn" 
                onClick={handleReset}
                style={{ marginTop: '12px' }}
              >
                Close Simulator
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
