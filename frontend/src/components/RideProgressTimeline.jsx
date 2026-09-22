import React from 'react';
import {
  Check,
  Navigation,
  MapPin,
  Car,
  CheckCircle2,
  Clock
} from 'lucide-react';
import './RideProgressTimeline.css';

const RIDE_STAGES = [
  {
    id: 'ACCEPTED',
    statusKeys: ['Accepted'],
    label: 'RIDE ACCEPTED',
    desc: 'Booking confirmed',
    defaultTime: '11:42 AM'
  },
  {
    id: 'ARRIVING',
    statusKeys: ['Driver Arriving'],
    label: 'DRIVER ARRIVING',
    desc: 'Your driver is on the way to pickup',
    defaultTime: '2 min'
  },
  {
    id: 'ARRIVED',
    statusKeys: ['Driver Arrived', 'Arrived'],
    label: 'DRIVER ARRIVED',
    desc: 'Driver has reached your location',
    defaultTime: 'At Pickup'
  },
  {
    id: 'STARTED',
    statusKeys: ['Ride Started', 'In Progress'],
    label: 'RIDE STARTED',
    desc: 'Enjoy your ride',
    defaultTime: 'En Route'
  },
  {
    id: 'COMPLETED',
    statusKeys: ['Completed'],
    label: 'COMPLETED',
    desc: 'Trip finished',
    defaultTime: 'Finished'
  }
];

export default function RideProgressTimeline({
  status = 'Accepted',
  eta = '8 min',
  fare = 147,
  onStatusChange,
  updating = false,
  role = 'driver'
}) {
  // Determine current active step index (0 to 4)
  const getActiveIndex = (currentStatus) => {
    if (!currentStatus) return 0;
    const norm = currentStatus.trim().toLowerCase();
    if (norm === 'accepted') return 0;
    if (norm === 'driver arriving') return 1;
    if (norm === 'driver arrived' || norm === 'arrived') return 2;
    if (norm === 'ride started' || norm === 'in progress') return 3;
    if (norm === 'completed') return 4;
    return 0;
  };

  const activeIdx = getActiveIndex(status);

  // Dynamic next status and CTA button config
  const getCtaConfig = () => {
    switch (activeIdx) {
      case 0:
        return {
          nextStatus: 'Driver Arriving',
          text: role === 'passenger' ? 'Driver En Route to Pickup' : 'Start Driving to Pickup →',
          icon: <Navigation size={18} />,
          className: 'accepted'
        };
      case 1:
        return {
          nextStatus: 'Driver Arrived',
          text: role === 'passenger' ? 'Driver Arriving Soon' : 'Mark "Arrived at Pickup" →',
          icon: <MapPin size={18} />,
          className: 'arriving'
        };
      case 2:
        return {
          nextStatus: 'Ride Started',
          text: role === 'passenger' ? 'Driver at Pickup Location' : 'Start Trip with Passenger →',
          icon: <Car size={18} />,
          className: 'arrived'
        };
      case 3:
        return {
          nextStatus: 'Completed',
          text: role === 'passenger' ? 'Trip in Progress' : `Complete Trip & Collect ₹${fare} →`,
          icon: <CheckCircle2 size={18} />,
          className: 'started'
        };
      default:
        return {
          nextStatus: null,
          text: 'Trip Completed 🎉',
          icon: <Check size={18} />,
          className: 'completed'
        };
    }
  };

  const ctaConfig = getCtaConfig();

  return (
    <div className="ridex-progress-card">
      {/* Header with Live Status Badge */}
      <div className="ridex-progress-header">
        <div className="ridex-progress-title-group">
          <h3 className="ridex-progress-heading">RIDE PROGRESS</h3>
        </div>
        <div className="ridex-live-badge">
          <span className="ridex-live-dot" />
          <span>LIVE RIDE</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="ridex-timeline-list">
        {RIDE_STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;
          const isUpcoming = idx > activeIdx;

          // Metadata time rendering
          let timeText = '—';
          if (isCompleted) {
            timeText = stage.id === 'ACCEPTED' ? '11:42 AM' : '11:48 AM';
          } else if (isActive) {
            timeText = stage.id === 'ARRIVING' ? (typeof eta === 'number' ? `${eta} min` : eta) : 'ACTIVE';
          }

          return (
            <div key={stage.id} className="ridex-timeline-item">
              {/* Left Column: Circle & Vertical Connector */}
              <div className="ridex-timeline-left">
                <div
                  className={`ridex-timeline-circle ${
                    isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isActive ? (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 0 8px #ffffff'
                      }}
                    />
                  ) : (
                    <span>○</span>
                  )}
                </div>

                {/* Connector Line to Next Step */}
                {idx < RIDE_STAGES.length - 1 && (
                  <div
                    className={`ridex-connector-line ${
                      isCompleted
                        ? 'completed'
                        : isActive
                        ? 'active'
                        : 'upcoming'
                    }`}
                  />
                )}
              </div>

              {/* Center Column: Title & Description */}
              <div className="ridex-timeline-content">
                <div
                  className={`ridex-timeline-title ${
                    isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'
                  }`}
                >
                  {stage.label}
                </div>
                <div
                  className={`ridex-timeline-desc ${
                    isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'
                  }`}
                >
                  {stage.desc}
                </div>
              </div>

              {/* Right Column: Time / ETA Metadata */}
              <div
                className={`ridex-timeline-meta ${
                  isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'
                }`}
              >
                {isCompleted ? (
                  <span>{timeText} ✓</span>
                ) : isActive ? (
                  <span>{timeText}</span>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Action Button (CTA) */}
      {onStatusChange && (
        <div style={{ marginTop: 22 }}>
          <button
            type="button"
            className={`ridex-cta-button ${ctaConfig.className}`}
            onClick={() => {
              if (ctaConfig.nextStatus && onStatusChange && !updating) {
                onStatusChange(ctaConfig.nextStatus);
              }
            }}
            disabled={updating || !ctaConfig.nextStatus}
          >
            {updating ? (
              <>
                <Clock className="animate-spin" size={18} />
                <span>Updating Status...</span>
              </>
            ) : (
              <>
                {ctaConfig.icon}
                <span>{ctaConfig.text}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
