import { useState, useEffect, useRef, useCallback } from 'react';
import { getVehicleSvgString } from './VehicleIcons.jsx';
import { isValidCoordinate, getHaversineDistanceKm, calculateBearing, getDistanceToPolylineKm, isValidGpsUpdate, getMatchedPolylineTrim } from '../../utils/locationGeocoder.js';

const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

/**
 * Fetch real-road driving route via OSRM GeoJSON API.
 */
async function fetchOsrmRoadRoute(pLat, pLng, dLat, dLng, signal) {
  if (!isValidCoordinate(pLat, pLng) || !isValidCoordinate(dLat, dLng)) return null;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates; // array of [lng, lat]
      if (!coords || !Array.isArray(coords) || coords.length === 0) return null;

      const distMeters = route.distance || 0;
      const durSeconds = route.duration || 0;

      const distKm = Math.max(0.8, parseFloat((distMeters / 1000).toFixed(1)));
      const durMin = Math.max(2, Math.round(durSeconds / 60));

      const leafletPoints = coords.map(([lng, lat]) => [lat, lng]);
      const googlePoints = coords.map(([lng, lat]) => ({ lat, lng }));

      return {
        distKm,
        durMin,
        distanceText: `${distKm} km`,
        durationText: `${durMin} mins`,
        leafletPoints,
        googlePoints,
      };
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('OSRM Route fetch notice:', err.message);
    }
  }
  return null;
}

const TargetIcon = ({ color = "currentColor", size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="2.2" fill={color} />
  </svg>
);

export default function LiveLocationMap({
  height = '440px',
  selectionMode = 'pickup', // 'pickup' | 'destination' | 'view'
  pickupLocation,
  setPickupLocation,
  destinationLocation,
  setDestinationLocation,
  onRouteCalculated,
  onLocationSelect,
  showSearchInputs = true,
  showSummaryBar = true,
  showAddressCard = true,
  mode = 'default', // 'driver_assigned' | 'live_ride' | 'book' | 'default'
  driver = null,
  onDriverProgress,
}) {
  const mapContainerRef = useRef(null);
  const pickupInputRef = useRef(null);
  const destInputRef = useRef(null);

  const googleMapInstance = useRef(null);
  const leafletMapInstance = useRef(null);
  const tileLayerRef = useRef(null);

  // Google Maps Services & Overlays
  const gDirectionsRenderer = useRef(null);
  const gDirectionsService = useRef(null);
  const gUserMarker = useRef(null);
  const gUserCircle = useRef(null);
  const gPickupMarker = useRef(null);
  const gDropMarker = useRef(null);
  const gCabMarkers = useRef([]);

  // Leaflet Overlays & Markers
  const lUserMarker = useRef(null);
  const lUserCircle = useRef(null);
  const lPickupMarker = useRef(null);
  const lDropMarker = useRef(null);
  const lCabMarkers = useRef([]);

  // Sequence tracking for async routing race-condition protection
  const routeRequestIdRef = useRef(0);

  const watchIdRef = useRef(null);
  const selectionModeRef = useRef(selectionMode);
  const setPickupLocationRef = useRef(setPickupLocation);
  const setDestinationLocationRef = useRef(setDestinationLocation);

  useEffect(() => { selectionModeRef.current = selectionMode; }, [selectionMode]);
  useEffect(() => { setPickupLocationRef.current = setPickupLocation; }, [setPickupLocation]);
  useEffect(() => { setDestinationLocationRef.current = setDestinationLocation; }, [setDestinationLocation]);

  const [mapEngine, setMapEngine] = useState('none'); // 'google' | 'leaflet' | 'none'
  const [mapTheme, setMapTheme] = useState('google'); // 'google' (colorful) | 'dark'
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [address, setAddress] = useState('Bhubaneswar, Odisha');
  const [addressLoading, setAddressLoading] = useState(false);
  const [isAutoCentered, setIsAutoCentered] = useState(true);
  const [locateState, setLocateState] = useState('idle');
  const [is3DMode, setIs3DMode] = useState(false);

  const [pickupText, setPickupText] = useState(pickupLocation?.address || '');
  const [destText, setDestText] = useState(destinationLocation?.address || '');
  const [routeInfo, setRouteInfo] = useState(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY';

  // 1. Initialize Google Maps JS Platform SDK or Fallback
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapEngine('google');
      return;
    }

    if (isKeyConfigured && !document.getElementById('google-maps-sdk')) {
      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`;
      script.async = true;
      script.onload = () => {
        setMapEngine('google');
        window.googleMapsReady = true;
        window.dispatchEvent(new Event('google-maps-ready'));
      };
      script.onerror = () => loadLeafletFallback();
      document.head.appendChild(script);
    } else {
      loadLeafletFallback();
    }

    function loadLeafletFallback() {
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-js-cdn')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js-cdn';
        script.src = LEAFLET_JS;
        script.async = true;
        script.onload = () => setMapEngine('leaflet');
        script.onerror = () => setMapEngine('none');
        document.head.appendChild(script);
      } else if (window.L) {
        setMapEngine('leaflet');
      } else {
        const script = document.getElementById('leaflet-js-cdn');
        script?.addEventListener('load', () => setMapEngine('leaflet'));
      }
    }
  }, [isKeyConfigured, apiKey]);

  // Guarantee Leaflet scripts are injected if mapEngine switches to 'leaflet'
  useEffect(() => {
    if (mapEngine === 'leaflet' && !window.L) {
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-js-cdn')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js-cdn';
        script.src = LEAFLET_JS;
        script.async = true;
        script.onload = () => setMapEngine('leaflet');
        script.onerror = () => setMapEngine('none');
        document.head.appendChild(script);
      } else {
        const script = document.getElementById('leaflet-js-cdn');
        script?.addEventListener('load', () => setMapEngine('leaflet'));
      }
    }
  }, [mapEngine]);

  // Reverse Geocoding Helper
  const fetchAddress = useCallback(async (lat, lng, callback) => {
    setAddressLoading(true);
    let resolvedName = '';

    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          resolvedName = response.results[0].formatted_address;
        }
      } catch (err) {}
    }

    if (!resolvedName) {
      try {
        const bdcRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (bdcRes.ok) {
          const bdcData = await bdcRes.json();
          const locality = bdcData.locality || bdcData.localityInfo?.informational?.[0]?.name;
          const city = bdcData.city || bdcData.principalSubdivision || 'Bhubaneswar';
          const state = bdcData.principalSubdivision || 'Odisha';
          resolvedName = [locality, city, state].filter(Boolean).join(', ');
        }
      } catch (e) {}
    }

    if (!resolvedName) resolvedName = 'Bhubaneswar, Odisha';

    setAddress(resolvedName);
    if (callback) callback(resolvedName);
    if (onLocationSelect) onLocationSelect({ lat, lng, address: resolvedName });
    setAddressLoading(false);
  }, [onLocationSelect]);

  // Real Browser Geolocation Watcher
  const startGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError({ title: 'Geolocation Not Supported', message: 'Browser location API missing.', code: 0 });
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const cleanAccuracy = Math.min(Math.round(accuracy || 12), 35);

        const newLoc = {
          lat,
          lng,
          accuracy: cleanAccuracy,
          timestamp: new Date(pos.timestamp).toLocaleTimeString(),
        };

        setLocation(newLoc);
        setLoadingLocation(false);
        setLocationError(null);

        fetchAddress(lat, lng, (addr) => {
          if (!pickupLocation && setPickupLocationRef.current) {
            const pt = { lat, lng, address: addr };
            setPickupLocationRef.current(pt);
            setPickupText(addr);
          }
        });
      },
      (err) => {
        setLoadingLocation(false);
        const fallbackLat = 20.2520;
        const fallbackLng = 85.7836;
        const fallbackLoc = { lat: fallbackLat, lng: fallbackLng, accuracy: 15, timestamp: new Date().toLocaleTimeString() };
        setLocation(fallbackLoc);

        fetchAddress(fallbackLat, fallbackLng, (addr) => {
          if (!pickupLocation && setPickupLocationRef.current) {
            const pt = { lat: fallbackLat, lng: fallbackLng, address: addr };
            setPickupLocationRef.current(pt);
            setPickupText(addr);
          }
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [pickupLocation, fetchAddress]);

  useEffect(() => {
    startGeolocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startGeolocation]);

  // Initialize Google Maps Engine & Places Autocomplete
  useEffect(() => {
    if (mapEngine !== 'google' || !mapContainerRef.current || googleMapInstance.current || !window.google) return;

    const initialLat = pickupLocation?.lat || location?.lat || 20.2520;
    const initialLng = pickupLocation?.lng || location?.lng || 85.7836;

    try {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 16,
        tilt: 0,
        heading: 0,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: false,
        styles: mapTheme === 'dark' ? [
          { elementType: "geometry", stylers: [{ color: "#1e2430" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a1e28" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
        ] : [],
      });

      map.addListener('dragstart', () => setIsAutoCentered(false));
      map.addListener('drag', () => setIsAutoCentered(false));
      map.addListener('zoom_changed', () => setIsAutoCentered(false));

      map.addListener('click', (e) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();

        fetchAddress(clickedLat, clickedLng, (formattedAddress) => {
          const point = { lat: clickedLat, lng: clickedLng, address: formattedAddress };
          if (selectionModeRef.current === 'destination') {
            if (setDestinationLocationRef.current) setDestinationLocationRef.current(point);
            setDestText(formattedAddress);
          } else {
            if (setPickupLocationRef.current) setPickupLocationRef.current(point);
            setPickupText(formattedAddress);
          }
        });
      });

      // Google Directions Service
      if (window.google.maps.DirectionsService) {
        gDirectionsService.current = new window.google.maps.DirectionsService();
        gDirectionsRenderer.current = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#00edff',
            strokeWeight: 6,
            strokeOpacity: 0.85,
          }
        });
      }

      map.addListener('dragstart', () => setIsAutoCentered(false));
      googleMapInstance.current = map;
    } catch (err) {
      console.warn('Google map init error, falling back to Leaflet:', err);
      setMapEngine('leaflet');
    }
  }, [mapEngine, mapTheme]);

  // Google Places Autocomplete Binding
  useEffect(() => {
    if (mapEngine !== 'google' || !window.google || !window.google.maps.places) return;

    if (pickupInputRef.current && !pickupInputRef.current._gAutoComplete) {
      const autoP = new window.google.maps.places.Autocomplete(pickupInputRef.current, { types: ['geocode', 'establishment'] });
      autoP.addListener('place_changed', () => {
        const place = autoP.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const addr = place.formatted_address || place.name;
          const pt = { lat, lng, address: addr };
          setPickupText(addr);
          if (setPickupLocationRef.current) setPickupLocationRef.current(pt);
          if (googleMapInstance.current) googleMapInstance.current.panTo({ lat, lng });
        }
      });
      pickupInputRef.current._gAutoComplete = autoP;
    }

    if (destInputRef.current && !destInputRef.current._gAutoComplete) {
      const autoD = new window.google.maps.places.Autocomplete(destInputRef.current, { types: ['geocode', 'establishment'] });
      autoD.addListener('place_changed', () => {
        const place = autoD.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const addr = place.formatted_address || place.name;
          const pt = { lat, lng, address: addr };
          setDestText(addr);
          if (setDestinationLocationRef.current) setDestinationLocationRef.current(pt);
          if (googleMapInstance.current) googleMapInstance.current.panTo({ lat, lng });
        }
      });
      destInputRef.current._gAutoComplete = autoD;
    }
  }, [mapEngine]);

  // Initialize Leaflet Engine Fallback with Cleanup
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !mapContainerRef.current || !window.L || leafletMapInstance.current) return;
    const L = window.L;

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const initialLat = pickupLocation?.lat || location?.lat || 20.2520;
    const initialLng = pickupLocation?.lng || location?.lng || 85.7836;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      dragging: true,
    });

    const tileUrl = mapTheme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    map.on('dragstart movestart zoomstart touchstart', () => setIsAutoCentered(false));
    map.on('click', (e) => {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;

      fetchAddress(clickedLat, clickedLng, (formattedAddress) => {
        const point = { lat: clickedLat, lng: clickedLng, address: formattedAddress };
        if (selectionModeRef.current === 'destination') {
          if (setDestinationLocationRef.current) setDestinationLocationRef.current(point);
          setDestText(formattedAddress);
        } else {
          if (setPickupLocationRef.current) setPickupLocationRef.current(point);
          setPickupText(formattedAddress);
        }
      });
    });

    leafletMapInstance.current = map;
    setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 200);
    setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 800);

    return () => {
      if (leafletMapInstance.current) {
        try { leafletMapInstance.current.remove(); } catch (e) {}
        leafletMapInstance.current = null;
      }
      if (mapContainerRef.current) {
        delete mapContainerRef.current._leaflet_id;
      }
    };
  }, [mapEngine, mapTheme]);


function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

  // ── Uber / Rapido Style Live Driver Tracking & Marker Engine ──
  const lDriverMarkerRef = useRef(null);
  const lPickupMarkerRef = useRef(null);
  const lDropMarkerRef = useRef(null);
  const lRoutePolylineRef = useRef(null);
  const lTripPolylineRef = useRef(null);
  const lTripBadgeMarkerRef = useRef(null);

  const gDriverMarkerRef = useRef(null);
  const gPickupMarkerRef = useRef(null);
  const gDropMarkerRef = useRef(null);
  const gRoutePolylineRef = useRef(null);
  const gTripPolylineRef = useRef(null);
  const gTripBadgeMarkerRef = useRef(null);

  const animFrameRef = useRef(null);
  const lastAcceptedGpsRef = useRef({ lat: null, lng: null, timestamp: 0, sequence: 0 });
  const currentRoutePolylineRef = useRef([]);
  const offRouteCountRef = useRef(0);
  const prevBearingRef = useRef(0);

  const driverStepRef = useRef(0);
  const [driverCurrentPos, setDriverCurrentPos] = useState(null);
  const [liveDistanceText, setLiveDistanceText] = useState('1.8 km away');
  const [liveEtaText, setLiveEtaText] = useState('5 mins away');

  const calculateTelemetry = (lat1, lng1, lat2, lng2) => {
    const distKm = getHaversineDistanceKm(lat1, lng1, lat2, lng2);
    let distStr = '';
    let etaStr = '';

    if (distKm <= 0.05) {
      distStr = '0 m (Arrived)';
      etaStr = 'Arriving Now';
    } else if (distKm < 1.0) {
      const meters = Math.round(distKm * 1000);
      distStr = `${meters} m away`;
      const mins = Math.max(1, Math.round(distKm * 2.5));
      etaStr = mins === 1 ? '1 min' : `${mins} mins`;
    } else {
      distStr = `${distKm.toFixed(1)} km away`;
      const mins = Math.round(distKm * 2.5);
      etaStr = `${mins} mins`;
    }

    return { distKm, distStr, etaStr };
  };

  useEffect(() => {
    if (!mapEngine || (mapEngine !== 'leaflet' && mapEngine !== 'google')) return;

    // Clean up active driver vehicle marker & approach line if not in live ride mode
    if (mode !== 'driver_assigned' && mode !== 'live_ride') {
      if (lDriverMarkerRef.current) { lDriverMarkerRef.current.remove(); lDriverMarkerRef.current = null; }
      if (gDriverMarkerRef.current) { gDriverMarkerRef.current.setMap(null); gDriverMarkerRef.current = null; }
      if (lRoutePolylineRef.current) { lRoutePolylineRef.current.remove(); lRoutePolylineRef.current = null; }
      if (gRoutePolylineRef.current) { gRoutePolylineRef.current.setMap(null); gRoutePolylineRef.current = null; }
      setDriverCurrentPos(null);
    }

    // Pickup & Dropoff coordinates (Anchor to user's real browser GPS blue dot location!)
    const userLat = location?.lat || 20.2520;
    const userLng = location?.lng || 85.7836;

    const isCustomPickup = pickupLocation?.lat && 
      pickupLocation.lat !== 20.3533 && 
      pickupLocation.lat !== 20.2961 && 
      pickupLocation.address !== 'Current Location' && 
      pickupLocation.address !== 'Current GPS Location';

    const pLat = isCustomPickup ? pickupLocation.lat : userLat;
    const pLng = isCustomPickup ? pickupLocation.lng : userLng;

    let dLat = destinationLocation?.lat;
    let dLng = destinationLocation?.lng;

    // Guarantee realistic trip destination coordinates (never default outside to Chandaka!)
    if (!dLat || !isValidCoordinate(dLat, dLng)) {
      dLat = 20.2980; // Master Canteen
      dLng = 85.8350;
    }
    if (Math.abs(dLat - pLat) < 0.003 && Math.abs(dLng - pLng) < 0.003) {
      dLat = pLat - 0.025; // Move SOUTH towards Master Canteen, never north outside!
      dLng = pLng + 0.010;
    }

    // Determine Driver Start and End Target coordinates
    let startLat, startLng, targetLat, targetLng;

    if (mode === 'driver_assigned') {
      // Driver approaches Pickup / User Location (Starts ~700m away)
      startLat = pLat + 0.0055;
      startLng = pLng + 0.0045;
      targetLat = pLat;
      targetLng = pLng;
    } else {
      // Driver moves from Pickup to Dropoff (live_ride)
      startLat = pLat;
      startLng = pLng;
      targetLat = dLat;
      targetLng = dLng;
    }

    // Generate interpolating steps between start and target for realistic movement
    const totalSteps = 120;
    const steps = [];
    for (let i = 0; i <= totalSteps; i++) {
      const frac = i / totalSteps;
      const curveOffset = Math.sin(frac * Math.PI) * 0.0015;
      steps.push([
        startLat + (targetLat - startLat) * frac + curveOffset,
        startLng + (targetLng - startLng) * frac - curveOffset
      ]);
    }

    currentRoutePolylineRef.current = steps;

    // Asynchronously fetch OSRM road route to upgrade straight line steps to genuine road geometry
    fetchOsrmRoadRoute(startLat, startLng, targetLat, targetLng).then(newRoute => {
      if (newRoute && newRoute.leafletPoints && newRoute.leafletPoints.length > 5) {
        currentRoutePolylineRef.current = newRoute.leafletPoints;
      }
    });

    let currentStep = driverStepRef.current % steps.length;
    const initialPos = steps[currentStep];
    const { distKm: initDistKm, distStr: initDistStr, etaStr: initEtaStr } = calculateTelemetry(initialPos[0], initialPos[1], targetLat, targetLng);

    setLiveDistanceText(initDistStr);
    setLiveEtaText(initEtaStr);
    if (onDriverProgress) {
      onDriverProgress({ distanceText: initDistStr, etaText: initEtaStr, rawDistKm: initDistKm, progressPercent: 0 });
    }

    // Helper HTML for Leaflet vehicle marker
    const createDriverIconHtml = (bearingDeg = 0, currentDistStr = '674 m away', currentEtaStr = '2 mins') => {
      const fixedBearing = (Math.round(bearingDeg) - 90 + 360) % 360;
      const svgIconStr = getVehicleSvgString(driver?.vehicleIcon || 'mini');
      return `
        <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; transition: transform 0.4s linear;">
          <div style="background: linear-gradient(145deg, #090a10 0%, #161b2e 100%); border: 2px solid #00edff; color: #ffffff; font-size: 11px; font-weight: 900; padding: 6px 12px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 237, 255, 0.75); white-space: nowrap; display: flex; align-items: center; gap: 8px; font-family: sans-serif;">
            <span style="background: linear-gradient(135deg, #00edff, #3b82f6); color: #090a10; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 999px;">
              📍 ${currentDistStr}
            </span>
            <span style="color: #34d399; font-size: 11px; font-weight: 800;">
              ⏱️ ${currentEtaStr}
            </span>
          </div>
          <div style="width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 3px solid #00edff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 32px rgba(0, 237, 255, 0.95); margin-top: 4px;">
            <div style="transform: rotate(${fixedBearing}deg); transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center;">
              ${svgIconStr}
            </div>
          </div>
        </div>
      `;
    };

    // ── LEAFLET INITIAL OVERLAYS ──
    if (mapEngine === 'leaflet' && leafletMapInstance.current && window.L) {
      const L = window.L;
      const map = leafletMapInstance.current;

      // Pickup Marker: Badge rendered BELOW green dot so it never overlaps driver telemetry badge
      if (!lPickupMarkerRef.current) {
        const pickupIcon = L.divIcon({
          className: 'rapido-pickup-marker',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #10b981; border: 3.5px solid #ffffff; box-shadow: 0 0 18px #10b981;"></div>
              <div style="background: #10b981; color: #ffffff; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 999px; border: 1.5px solid #34d399; box-shadow: 0 4px 14px rgba(16,185,129,0.6); white-space: nowrap; font-family: sans-serif; margin-top: 4px;">📍 PICKUP LOCATION</div>
            </div>
          `,
          iconSize: [140, 50],
          iconAnchor: [70, 11],
        });
        lPickupMarkerRef.current = L.marker([pLat, pLng], { icon: pickupIcon }).addTo(map);
      } else {
        lPickupMarkerRef.current.setLatLng([pLat, pLng]);
      }

      // Dropoff Destination Marker
      if (!lDropMarkerRef.current) {
        const dropIcon = L.divIcon({
          className: 'rapido-drop-marker',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
              <div style="background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 999px; border: 1.5px solid #f87171; box-shadow: 0 4px 14px rgba(239,68,68,0.6); white-space: nowrap; font-family: sans-serif; margin-bottom: 4px;">🏁 DROPOFF DESTINATION</div>
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #ef4444; border: 3.5px solid #ffffff; box-shadow: 0 0 18px #ef4444;"></div>
            </div>
          `,
          iconSize: [150, 50],
          iconAnchor: [75, 42],
        });
        lDropMarkerRef.current = L.marker([dLat, dLng], { icon: dropIcon }).addTo(map);
      } else {
        lDropMarkerRef.current.setLatLng([dLat, dLng]);
      }

      if (mode === 'driver_assigned' || mode === 'live_ride') {
        if (!lDriverMarkerRef.current) {
          const driverIcon = L.divIcon({
            className: 'rapido-live-driver-marker',
            html: createDriverIconHtml(0, initDistStr, initEtaStr),
            iconSize: [220, 80],
            iconAnchor: [110, 75],
          });
          lDriverMarkerRef.current = L.marker(initialPos, { icon: driverIcon }).addTo(map);
        } else {
          lDriverMarkerRef.current.setLatLng(initialPos);
        }

        const polyPoints = [initialPos, [targetLat, targetLng]];
        if (!lRoutePolylineRef.current) {
          lRoutePolylineRef.current = L.polyline(polyPoints, {
            color: '#00edff', weight: 7, opacity: 0.95, dashArray: mode === 'driver_assigned' ? '10, 10' : undefined,
          }).addTo(map);
        } else {
          lRoutePolylineRef.current.setLatLngs(polyPoints);
        }
      }

      // ALWAYS Visible Pickup -> Dropoff Trip Route Polyline
      const tripPolyPoints = [[pLat, pLng], [dLat, dLng]];
      if (!lTripPolylineRef.current) {
        lTripPolylineRef.current = L.polyline(tripPolyPoints, {
          color: '#8b5cf6', weight: 6, opacity: 0.85,
        }).addTo(map);
      } else {
        lTripPolylineRef.current.setLatLngs(tripPolyPoints);
      }

      // Floating Trip Distance Badge at Midpoint of Pickup & Destination
      const tripKm = getHaversineDistanceKm(pLat, pLng, dLat, dLng);
      const tripMins = Math.max(3, Math.round(tripKm * 2.2));
      const midLat = (pLat + dLat) / 2;
      const midLng = (pLng + dLng) / 2;

      const tripBadgeIcon = L.divIcon({
        className: 'ridex-trip-dist-badge-clean',
        html: `
          <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); border: 2px solid #8b5cf6; color: #ffffff; font-size: 11px; font-weight: 900; padding: 6px 14px; border-radius: 999px; box-shadow: 0 4px 22px rgba(139, 92, 246, 0.75); white-space: nowrap; font-family: sans-serif; display: flex; align-items: center; gap: 6px;">
              <span style="color: #a855f7;">🚕 Trip</span>
              <span style="color: #00edff; font-weight: 900;">${Number(tripKm).toFixed(1)} km</span>
              <span style="color: #94a3b8;">•</span>
              <span style="color: #34d399;">${tripMins} min</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (!lTripBadgeMarkerRef.current) {
        lTripBadgeMarkerRef.current = L.marker([midLat, midLng], { icon: tripBadgeIcon, zIndexOffset: 9999 }).addTo(map);
      } else {
        lTripBadgeMarkerRef.current.setLatLng([midLat, midLng]);
        lTripBadgeMarkerRef.current.setIcon(tripBadgeIcon);
      }

      // Auto-fit Leaflet bounds so Pickup, Driver & Dropoff Destination are framed perfectly
      try {
        const bounds = L.latLngBounds([
          initialPos,
          [pLat, pLng],
          [dLat, dLng]
        ]);
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (e) {}
    }

    // ── GOOGLE MAPS INITIAL OVERLAYS ──
    if (mapEngine === 'google' && googleMapInstance.current && window.google) {
      const gMap = googleMapInstance.current;
      const gPos = { lat: initialPos[0], lng: initialPos[1] };
      const gTarget = { lat: targetLat, lng: targetLng };
      const gPickup = { lat: pLat, lng: pLng };
      const gDrop = { lat: dLat, lng: dLng };

      // 1. Pickup Marker on Google Maps
      if (!gPickupMarkerRef.current) {
        gPickupMarkerRef.current = new window.google.maps.Marker({
          position: gPickup,
          map: gMap,
          title: '📍 Pickup Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 4,
          }
        });
      } else {
        gPickupMarkerRef.current.setPosition(gPickup);
      }

      // 2. Dropoff Destination Marker on Google Maps
      if (!gDropMarkerRef.current) {
        gDropMarkerRef.current = new window.google.maps.Marker({
          position: gDrop,
          map: gMap,
          title: '🏁 Dropoff Destination',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 4,
          }
        });
      } else {
        gDropMarkerRef.current.setPosition(gDrop);
      }

      // 3. Driver Route Polyline between vehicle and user (shrinks as driver moves)
      if (mode === 'driver_assigned' || mode === 'live_ride') {
        if (!gRoutePolylineRef.current) {
          gRoutePolylineRef.current = new window.google.maps.Polyline({
            path: [gPos, gTarget],
            geodesic: true,
            strokeColor: '#00edff',
            strokeOpacity: 0.95,
            strokeWeight: 7,
            zIndex: 9999,
            map: gMap
          });
        } else {
          gRoutePolylineRef.current.setPath([gPos, gTarget]);
          gRoutePolylineRef.current.setMap(gMap);
        }
      }

      // 4. Trip Polyline (Pickup -> Dropoff Destination)
      if (!gTripPolylineRef.current) {
        gTripPolylineRef.current = new window.google.maps.Polyline({
          path: [gPickup, gDrop],
          geodesic: true,
          strokeColor: '#8b5cf6',
          strokeOpacity: 0.85,
          strokeWeight: 6,
          zIndex: 9990,
          map: gMap
        });
      } else {
        gTripPolylineRef.current.setPath([gPickup, gDrop]);
        gTripPolylineRef.current.setMap(gMap);
      }

      // 4.5. Centered Trip Telemetry Badge at exact midpoint of road polyline between Pickup & Drop on Google Maps
      const gMidPoint = (currentRoutePolylineRef.current && currentRoutePolylineRef.current.length > 0)
        ? currentRoutePolylineRef.current[Math.floor(currentRoutePolylineRef.current.length / 2)]
        : [(pLat + dLat) / 2, (pLng + dLng) / 2];
      const gMidLat = Array.isArray(gMidPoint) ? gMidPoint[0] : (gMidPoint.lat ?? (pLat + dLat) / 2);
      const gMidLng = Array.isArray(gMidPoint) ? gMidPoint[1] : (gMidPoint.lng ?? (pLng + dLng) / 2);

      const tripKmVal = getHaversineDistanceKm(pLat, pLng, dLat, dLng);
      const tripMinVal = Math.max(3, Math.round(tripKmVal * 2.2));

      const badgeSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="180" height="40" viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="176" height="36" rx="18" fill="#0f172a" stroke="#8b5cf6" stroke-width="2"/>
          <text x="18" y="24" font-size="12" font-weight="900" fill="#a855f7" font-family="sans-serif">🚕 Trip</text>
          <text x="68" y="24" font-size="12" font-weight="900" fill="#00edff" font-family="sans-serif">${tripKmVal} km</text>
          <text x="122" y="24" font-size="12" font-weight="900" fill="#94a3b8" font-family="sans-serif">•</text>
          <text x="134" y="24" font-size="12" font-weight="900" fill="#34d399" font-family="sans-serif">${tripMinVal}m</text>
        </svg>
      `);

      if (!gTripBadgeMarkerRef.current) {
        gTripBadgeMarkerRef.current = new window.google.maps.Marker({
          position: { lat: gMidLat, lng: gMidLng },
          map: gMap,
          title: `Trip ${tripKmVal} km`,
          icon: {
            url: badgeSvg,
            scaledSize: new window.google.maps.Size(180, 40),
            anchor: new window.google.maps.Point(90, 20)
          },
          zIndex: 99999
        });
      } else {
        gTripBadgeMarkerRef.current.setPosition({ lat: gMidLat, lng: gMidLng });
        gTripBadgeMarkerRef.current.setMap(gMap);
      }

      // 5. Initial Fit Bounds for Google Maps so vehicle, pickup & destination are centered
      try {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(gPos);
        bounds.extend(gPickup);
        bounds.extend(gDrop);
        gMap.fitBounds(bounds, { top: 120, bottom: 160, left: 60, right: 60 });
      } catch (e) {}
    }

    // ── Live Animation Loop (Smooth rAF interpolation + Road alignment) ──
    if (mode !== 'driver_assigned' && mode !== 'live_ride') return;

    const getActiveSteps = () => {
      const routePoints = currentRoutePolylineRef.current;
      if (routePoints && routePoints.length > 5) {
        const totalSteps = 260;
        const normalized = [];
        for (let i = 0; i <= totalSteps; i++) {
          const frac = i / totalSteps;
          const indexFloat = frac * (routePoints.length - 1);
          const idx = Math.floor(indexFloat);
          const nextIdx = Math.min(routePoints.length - 1, idx + 1);
          const subFrac = indexFloat - idx;

          const p1 = Array.isArray(routePoints[idx]) ? routePoints[idx] : [routePoints[idx].lat, routePoints[idx].lng];
          const p2 = Array.isArray(routePoints[nextIdx]) ? routePoints[nextIdx] : [routePoints[nextIdx].lat, routePoints[nextIdx].lng];

          normalized.push([
            p1[0] + (p2[0] - p1[0]) * subFrac,
            p1[1] + (p2[1] - p1[1]) * subFrac
          ]);
        }
        return normalized;
      }
      return steps;
    };

    const animInterval = setInterval(() => {
      const activeSteps = getActiveSteps();

      currentStep = Math.min(currentStep + 1, activeSteps.length - 1);
      driverStepRef.current = currentStep;

      const rawTarget = activeSteps[currentStep];
      const rawPrev = activeSteps[Math.max(0, currentStep - 1)];

      const targetPos = Array.isArray(rawTarget) ? rawTarget : [rawTarget.lat, rawTarget.lng];
      const prevPos = Array.isArray(rawPrev) ? rawPrev : [rawPrev.lat, rawPrev.lng];

      const incomingGps = { lat: targetPos[0], lng: targetPos[1], timestamp: Date.now() };
      lastAcceptedGpsRef.current = incomingGps;

      // 1. Match driver GPS to active route polyline & calculate dynamic remaining distance
      let remainingDistKm = 0;
      const activeRoute = currentRoutePolylineRef.current;

      if (activeRoute && activeRoute.length > 5) {
        const trimResult = getMatchedPolylineTrim(targetPos[0], targetPos[1], activeRoute);
        if (trimResult && trimResult.remainingDistanceKm > 0) {
          remainingDistKm = trimResult.remainingDistanceKm;
        }
      }

      // Fallback ground calculation from vehicle position (targetPos) to destination target
      if (!remainingDistKm || remainingDistKm <= 0) {
        remainingDistKm = getHaversineDistanceKm(targetPos[0], targetPos[1], targetLat, targetLng);
      }

      // 2. Off-Route Detection: Genuine deviation check (>150m for 3 consecutive updates)
      const trimResult = getMatchedPolylineTrim(targetPos[0], targetPos[1], activeRoute);
      if (trimResult && trimResult.offRouteDistanceKm > 0.15) {
        offRouteCountRef.current += 1;
        if (offRouteCountRef.current >= 3) {
          console.log('[GPS Reroute] Driver off-route (>150m). Recalculating genuine road route...');
          offRouteCountRef.current = 0;
          fetchOsrmRoadRoute(targetPos[0], targetPos[1], targetLat, targetLng).then(newRoute => {
            if (newRoute && newRoute.leafletPoints && newRoute.leafletPoints.length > 0) {
              currentRoutePolylineRef.current = newRoute.leafletPoints;
            }
          });
        }
      } else {
        offRouteCountRef.current = 0;
      }

      // 3. Smooth bearing calculation (locks rotation if stationary)
      const distMoved = getHaversineDistanceKm(prevPos[0], prevPos[1], targetPos[0], targetPos[1]);
      let bearing = prevBearingRef.current;
      if (distMoved > 0.0005) {
        bearing = calculateBearing(prevPos[0], prevPos[1], targetPos[0], targetPos[1]);
        prevBearingRef.current = bearing;
      }

      setDriverCurrentPos({ lat: targetPos[0], lng: targetPos[1] });

      // 4. Dynamic Telemetry (Distance & ETA update continuously as driver moves)
      const isArrived = currentStep >= activeSteps.length - 1 || (remainingDistKm <= 0.04 && currentStep > activeSteps.length * 0.85);

      let displayDistStr = '';
      let displayEtaStr = '';

      if (isArrived) {
        displayDistStr = '0 m (Arrived)';
        displayEtaStr = 'Arrived Now';
      } else if (remainingDistKm < 1.0) {
        const meters = Math.round(remainingDistKm * 1000);
        displayDistStr = `${meters} m away`;
        const mins = Math.max(1, Math.round(remainingDistKm * 2.2));
        displayEtaStr = mins === 1 ? '1 min' : `${mins} mins`;
      } else {
        displayDistStr = `${remainingDistKm.toFixed(1)} km away`;
        const mins = Math.max(1, Math.round(remainingDistKm * 2.2));
        displayEtaStr = `${mins} mins`;
      }

      setLiveDistanceText(displayDistStr);
      setLiveEtaText(displayEtaStr);

      const progressPercent = isArrived ? 100 : Math.min(99, Math.round((currentStep / (activeSteps.length - 1)) * 100));

      if (onDriverProgress) {
        onDriverProgress({
          distanceText: displayDistStr,
          etaText: displayEtaStr,
          rawDistKm: remainingDistKm,
          progressPercent,
          isArrived
        });
      }

      // 5. Smooth rAF Lerp Animation (Trims route line continuously on every frame!)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const startLat = prevPos[0];
      const startLng = prevPos[1];
      const endLat = targetPos[0];
      const endLng = targetPos[1];
      const startTime = performance.now();
      const duration = 720;

      const animateFrame = (now) => {
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        const curLat = startLat + (endLat - startLat) * p;
        const curLng = startLng + (endLng - startLng) * p;

        // Dynamic road route trimming on every frame
        const frameTrim = getMatchedPolylineTrim(curLat, curLng, currentRoutePolylineRef.current);
        const remainingPoly = frameTrim.remainingPolyline;

        // Leaflet smooth marker & remaining route update
        if (mapEngine === 'leaflet' && lDriverMarkerRef.current && window.L) {
          lDriverMarkerRef.current.setLatLng([curLat, curLng]);
          if (lRoutePolylineRef.current) {
            lRoutePolylineRef.current.setLatLngs(remainingPoly);
          }
        }

        // Google Maps smooth marker & remaining route update
        if (mapEngine === 'google' && gDriverMarkerRef.current && window.google?.maps) {
          gDriverMarkerRef.current.setPosition({ lat: curLat, lng: curLng });
          if (gRoutePolylineRef.current) {
            gRoutePolylineRef.current.setPath(remainingPoly.map(([lat, lng]) => ({ lat, lng })));
          }
        }

        // Per-frame smooth camera follow on vehicle marker when auto-centered (Uber style)
        if (isAutoCentered) {
          if (mapEngine === 'leaflet' && leafletMapInstance.current) {
            leafletMapInstance.current.panTo([curLat, curLng]);
          }
          if (mapEngine === 'google' && googleMapInstance.current) {
            googleMapInstance.current.panTo({ lat: curLat, lng: curLng });
          }
        }

        if (p < 1) {
          animFrameRef.current = requestAnimationFrame(animateFrame);
        }
      };
      animFrameRef.current = requestAnimationFrame(animateFrame);

      // Leaflet HTML update (for badge text & initial icon)
      if (mapEngine === 'leaflet' && lDriverMarkerRef.current && window.L) {
        lDriverMarkerRef.current.setIcon(window.L.divIcon({
          className: 'rapido-live-driver-marker',
          html: createDriverIconHtml(bearing, displayDistStr, displayEtaStr),
          iconSize: [220, 80],
          iconAnchor: [110, 75],
        }));
      }

      // Google Maps Icon SVG update
      if (mapEngine === 'google' && gDriverMarkerRef.current && window.google?.maps) {
        const vehicleEmoji = driver?.vehicleIcon || '🏍️';
        const fixedBearing = (Math.round(bearing) - 90 + 360) % 360;
        const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" fill="#090a10" stroke="#00edff" stroke-width="4"/>
            <g transform="rotate(${fixedBearing}, 32, 32)">
              <text x="32" y="42" font-size="30" text-anchor="middle">${vehicleEmoji}</text>
            </g>
          </svg>
        `);
        gDriverMarkerRef.current.setIcon({
          url: svgUrl,
          scaledSize: new window.google.maps.Size(52, 52),
          anchor: new window.google.maps.Point(26, 26)
        });
        gDriverMarkerRef.current.setTitle(`📍 ${driver?.name || 'Driver'} - ${displayDistStr} (${displayEtaStr})`);
      }

      // Auto-center camera lock on vehicle marker (Uber Style)
      if (isAutoCentered) {
        try {
          if (mapEngine === 'google' && googleMapInstance.current) {
            googleMapInstance.current.panTo({ lat: targetPos[0], lng: targetPos[1] });
          }
          if (mapEngine === 'leaflet' && leafletMapInstance.current) {
            leafletMapInstance.current.panTo([targetPos[0], targetPos[1]], { animate: true, duration: 0.5 });
          }
        } catch (e) {}
      }
    }, 750);

    return () => {
      clearInterval(animInterval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mapEngine, mode, driver?.name, pickupLocation?.lat, pickupLocation?.lng, destinationLocation?.lat, destinationLocation?.lng]);

  // Route Calculation and Real Road Polyline Rendering
  useEffect(() => {
    const currentRequestId = ++routeRequestIdRef.current;
    const abortController = new AbortController();

    let pLat = pickupLocation?.lat;
    let pLng = pickupLocation?.lng;
    let dLat = destinationLocation?.lat;
    let dLng = destinationLocation?.lng;

    // Validate Pickup Location
    if (!isValidCoordinate(pLat, pLng)) {
      pLat = location?.lat && isValidCoordinate(location.lat, location.lng) ? location.lat : 20.3562; // Patia
      pLng = location?.lng && isValidCoordinate(location.lat, location.lng) ? location.lng : 85.8188;
    }

    // Validate Destination Location
    if (!isValidCoordinate(dLat, dLng)) {
      dLat = 20.2980; // Master Canteen
      dLng = 85.8350;
    }

    // Ensure pickup & destination are not identical
    if (Math.abs(pLat - dLat) < 0.0005 && Math.abs(pLng - dLng) < 0.0005) {
      dLat = pLat - 0.025; // Move SOUTH towards Master Canteen, never north outside!
      dLng = pLng + 0.010;
    }

    // Helper to sanitize polyline points strictly between Pickup & Dropoff bounding box
    const sanitizeTripPoints = (rawPts) => {
      if (!Array.isArray(rawPts) || rawPts.length === 0) return [[pLat, pLng], [dLat, dLng]];

      const minLat = Math.min(pLat, dLat) - 0.025;
      const maxLat = Math.max(pLat, dLat) + 0.025;
      const minLng = Math.min(pLng, dLng) - 0.025;
      const maxLng = Math.max(pLng, dLng) + 0.025;

      const filtered = rawPts.filter(pt => {
        const lat = Array.isArray(pt) ? pt[0] : (pt.lat ?? pt[0]);
        const lng = Array.isArray(pt) ? pt[1] : (pt.lng ?? pt[1]);
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      });

      return filtered.length >= 2 ? filtered : [[pLat, pLng], [dLat, dLng]];
    };

    // 1. Instant Haversine fallback calculation for immediate UI response
    const rawDist = getHaversineDistanceKm(pLat, pLng, dLat, dLng);
    const calculatedKm = Math.max(1.5, parseFloat(rawDist.toFixed(1)));
    const durMin = Math.max(3, Math.round(calculatedKm * 2.5));

    const initialInfo = {
      distance: `${calculatedKm} km`,
      duration: `${durMin} mins`,
      distanceKm: calculatedKm,
      durationMin: durMin,
      estimatedFare: Math.round(40 + calculatedKm * 14)
    };

    setRouteInfo(initialInfo);
    if (onRouteCalculated) onRouteCalculated(initialInfo);

    // Apply calculated real road route to Leaflet map
    const applyLeafletRoute = (points, km, mins) => {
      if (currentRequestId !== routeRequestIdRef.current) return;
      const cleanPoints = sanitizeTripPoints(points);
      currentRoutePolylineRef.current = cleanPoints;
      if (!leafletMapInstance.current || !window.L) return;

      const L = window.L;
      const map = leafletMapInstance.current;

      if (lTripPolylineRef.current) {
        lTripPolylineRef.current.remove();
        lTripPolylineRef.current = null;
      }

      lTripPolylineRef.current = L.polyline(cleanPoints, {
        color: '#8b5cf6',
        weight: 6,
        opacity: 0.88,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Fit map bounds once for complete trip view strictly framing Pickup & Dropoff
      try {
        const bounds = L.latLngBounds([[pLat, pLng], [dLat, dLng]]);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: true });
      } catch (e) {}

      // Update midpoint distance badge marker
      const midIdx = Math.floor(cleanPoints.length / 2);
      const midPoint = cleanPoints[midIdx] || [(pLat + dLat) / 2, (pLng + dLng) / 2];

      const tripBadgeIcon = L.divIcon({
        className: 'ridex-trip-dist-badge-clean',
        html: `
          <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); border: 2px solid #8b5cf6; color: #ffffff; font-size: 11px; font-weight: 900; padding: 6px 14px; border-radius: 999px; box-shadow: 0 4px 22px rgba(139, 92, 246, 0.75); white-space: nowrap; font-family: sans-serif; display: flex; align-items: center; gap: 6px;">
              <span style="color: #a855f7;">🚕 Trip</span>
              <span style="color: #00edff; font-weight: 900;">${km} km</span>
              <span style="color: #94a3b8;">•</span>
              <span style="color: #34d399;">${mins} min</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (!lTripBadgeMarkerRef.current) {
        lTripBadgeMarkerRef.current = L.marker(midPoint, { icon: tripBadgeIcon, zIndexOffset: 9999 }).addTo(map);
      } else {
        lTripBadgeMarkerRef.current.setLatLng(midPoint);
        lTripBadgeMarkerRef.current.setIcon(tripBadgeIcon);
      }
    };

    // Apply route to Google Maps
    const applyGoogleRoute = (points, km, mins) => {
      if (currentRequestId !== routeRequestIdRef.current) return;
      const cleanPoints = sanitizeTripPoints(points).map(pt => Array.isArray(pt) ? { lat: pt[0], lng: pt[1] } : pt);
      currentRoutePolylineRef.current = cleanPoints.map(pt => [pt.lat, pt.lng]);
      if (!googleMapInstance.current || !window.google?.maps) return;

      const map = googleMapInstance.current;
      if (gTripPolylineRef.current) {
        gTripPolylineRef.current.setMap(null);
        gTripPolylineRef.current = null;
      }

      gTripPolylineRef.current = new window.google.maps.Polyline({
        path: cleanPoints,
        geodesic: true,
        strokeColor: '#8b5cf6',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map,
      });

      // Update Google Maps trip badge position to middle point of road polyline
      const midIdx = Math.floor(cleanPoints.length / 2);
      const midPt = cleanPoints[midIdx] || { lat: (pLat + dLat) / 2, lng: (pLng + dLng) / 2 };
      const badgeSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="180" height="40" viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="176" height="36" rx="18" fill="#0f172a" stroke="#8b5cf6" stroke-width="2"/>
          <text x="18" y="24" font-size="12" font-weight="900" fill="#a855f7" font-family="sans-serif">🚕 Trip</text>
          <text x="68" y="24" font-size="12" font-weight="900" fill="#00edff" font-family="sans-serif">${km} km</text>
          <text x="122" y="24" font-size="12" font-weight="900" fill="#94a3b8" font-family="sans-serif">•</text>
          <text x="134" y="24" font-size="12" font-weight="900" fill="#34d399" font-family="sans-serif">${mins}m</text>
        </svg>
      `);

      if (!gTripBadgeMarkerRef.current) {
        gTripBadgeMarkerRef.current = new window.google.maps.Marker({
          position: midPt,
          map: map,
          title: `Trip ${km} km`,
          icon: {
            url: badgeSvg,
            scaledSize: new window.google.maps.Size(180, 40),
            anchor: new window.google.maps.Point(90, 20)
          },
          zIndex: 99999
        });
      } else {
        gTripBadgeMarkerRef.current.setPosition(midPt);
        gTripBadgeMarkerRef.current.setMap(map);
      }

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: pLat, lng: pLng });
      bounds.extend({ lat: dLat, lng: dLng });
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    };

    // 2. Google Directions Service if Google Maps engine is active
    let gDirectionsTriggered = false;
    if (gDirectionsService.current && gDirectionsRenderer.current && isValidCoordinate(pLat, pLng) && isValidCoordinate(dLat, dLng)) {
      gDirectionsTriggered = true;
      gDirectionsService.current.route(
        {
          origin: { lat: pLat, lng: pLng },
          destination: { lat: dLat, lng: dLng },
          travelMode: window.google?.maps?.TravelMode?.DRIVING || 'DRIVING',
        },
        (result, status) => {
          if (currentRequestId !== routeRequestIdRef.current) return; // Ignore stale response

          if (status === 'OK' && result.routes[0]) {
            gDirectionsRenderer.current.setDirections(result);
            const leg = result.routes[0].legs[0];
            const distKm = parseFloat((leg.distance.value / 1000).toFixed(1));
            const gDurMin = Math.round(leg.duration.value / 60);
            const fare = Math.round(40 + distKm * 14);

            const exactInfo = {
              distance: leg.distance.text,
              duration: leg.duration.text,
              distanceKm: distKm,
              durationMin: gDurMin,
              estimatedFare: fare,
            };
            setRouteInfo(exactInfo);
            if (onRouteCalculated) onRouteCalculated(exactInfo);
          } else {
            // Google Directions failed -> Fallback to OSRM real road route!
            fetchOsrmRoadRoute(pLat, pLng, dLat, dLng, abortController.signal).then(osrmData => {
              if (currentRequestId !== routeRequestIdRef.current) return;
              if (osrmData && osrmData.googlePoints) {
                applyGoogleRoute(osrmData.googlePoints, osrmData.distKm, osrmData.durMin);
                const exactInfo = {
                  distance: osrmData.distanceText,
                  duration: osrmData.durationText,
                  distanceKm: osrmData.distKm,
                  durationMin: osrmData.durMin,
                  estimatedFare: Math.round(40 + osrmData.distKm * 14),
                };
                setRouteInfo(exactInfo);
                if (onRouteCalculated) onRouteCalculated(exactInfo);
              }
            });
          }
        }
      );
    }

    // 3. Fetch OSRM Real Road Route for Leaflet / non-Google engine
    fetchOsrmRoadRoute(pLat, pLng, dLat, dLng, abortController.signal).then(osrmData => {
      if (currentRequestId !== routeRequestIdRef.current) return; // Ignore stale response

      if (osrmData && osrmData.leafletPoints) {
        if (leafletMapInstance.current) {
          applyLeafletRoute(osrmData.leafletPoints, osrmData.distKm, osrmData.durMin);
        } else if (googleMapInstance.current && !gDirectionsTriggered) {
          applyGoogleRoute(osrmData.googlePoints, osrmData.distKm, osrmData.durMin);
        }

        const exactInfo = {
          distance: osrmData.distanceText,
          duration: osrmData.durationText,
          distanceKm: osrmData.distKm,
          durationMin: osrmData.durMin,
          estimatedFare: Math.round(40 + osrmData.distKm * 14),
        };
        setRouteInfo(exactInfo);
        if (onRouteCalculated) onRouteCalculated(exactInfo);
      } else if (leafletMapInstance.current) {
        // Fallback straight-line only if network OSRM fails completely
        applyLeafletRoute([[pLat, pLng], [dLat, dLng]], calculatedKm, durMin);
      }
    });

    return () => {
      abortController.abort();
    };
  }, [pickupLocation, destinationLocation, location, onRouteCalculated]);

  // Update User GPS Marker
  useEffect(() => {
    if (!location) return;
    const { lat, lng, accuracy } = location;

    if (googleMapInstance.current && window.google && window.google.maps) {
      const map = googleMapInstance.current;
      const pos = { lat, lng };

      if (!gUserMarker.current) {
        gUserMarker.current = new window.google.maps.Marker({
          position: pos,
          map,
          icon: {
            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
            scale: 11,
            fillColor: '#1d4ed8',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3.5,
          },
          title: '📍 Your GPS Location',
        });
      } else {
        gUserMarker.current.setPosition(pos);
      }

      if (!gUserCircle.current) {
        gUserCircle.current = new window.google.maps.Circle({
          map,
          center: pos,
          radius: accuracy,
          fillColor: '#3b82f6',
          fillOpacity: 0.18,
          strokeColor: '#2563eb',
          strokeOpacity: 0.5,
          strokeWeight: 2,
        });
      } else {
        gUserCircle.current.setCenter(pos);
        gUserCircle.current.setRadius(accuracy);
      }

      if (isAutoCentered) map.panTo(pos);
    }

    if (leafletMapInstance.current && window.L) {
      const L = window.L;
      const map = leafletMapInstance.current;

      const userIcon = L.divIcon({
        className: 'custom-user-google-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(0, 237, 255, 0.3); border: 1.5px solid #00edff; box-shadow: 0 0 20px #00edff;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #00edff, #2563eb); border: 3px solid #ffffff; box-shadow: 0 0 20px rgba(0, 237, 255, 0.9); z-index: 2;"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (lUserMarker.current) {
        lUserMarker.current.setLatLng([lat, lng]);
      } else {
        lUserMarker.current = L.marker([lat, lng], { icon: userIcon }).addTo(map);
      }

      if (isAutoCentered) map.panTo([lat, lng]);
    }
  }, [location, isAutoCentered]);

  // ── Uber Style Live Animated Nearby Driver Fleet Engine ──
  useEffect(() => {
    if (!location || mode === 'driver_assigned' || mode === 'live_ride') {
      if (lCabMarkers.current.length > 0) {
        lCabMarkers.current.forEach(m => { try { m.remove(); } catch(e){} });
        lCabMarkers.current = [];
      }
      if (gCabMarkers.current.length > 0) {
        gCabMarkers.current.forEach(m => { try { m.setMap(null); } catch(e){} });
        gCabMarkers.current = [];
      }
      return;
    }

    const { lat, lng } = location;

    // Define 5 initial driver state objects with unique initial angles, radii, colors & speeds
    const driversRef = [
      { id: 'go',      icon: '🚗', type: 'RideX Go',      color: '#00edff', radiusX: 0.0035, radiusY: 0.0028, angle: 0.2, speed: 0.035, dir: 1 },
      { id: 'moto',    icon: '🏍️', type: 'RideX Moto',    color: '#a855f7', radiusX: 0.0042, radiusY: 0.0038, angle: 1.5, speed: 0.050, dir: -1 },
      { id: 'auto',    icon: '🛺', type: 'RideX Auto',    color: '#fbbf24', radiusX: 0.0028, radiusY: 0.0045, angle: 2.8, speed: 0.040, dir: 1 },
      { id: 'premier', icon: '🚘', type: 'RideX Premier', color: '#38bdf8', radiusX: 0.0050, radiusY: 0.0032, angle: 4.1, speed: 0.030, dir: -1 },
      { id: 'xl',      icon: '🚙', type: 'RideX XL',      color: '#34d399', radiusX: 0.0038, radiusY: 0.0052, angle: 5.4, speed: 0.025, dir: 1 }
    ];

    // Clean old markers
    if (lCabMarkers.current.length > 0) {
      lCabMarkers.current.forEach(m => { try { m.remove(); } catch(e){} });
      lCabMarkers.current = [];
    }
    if (gCabMarkers.current.length > 0) {
      gCabMarkers.current.forEach(m => { try { m.setMap(null); } catch(e){} });
      gCabMarkers.current = [];
    }

    // Create Initial Markers
    driversRef.forEach((drv, i) => {
      const initialLat = lat + Math.sin(drv.angle) * drv.radiusX;
      const initialLng = lng + Math.cos(drv.angle) * drv.radiusY;
      drv.lastLat = initialLat;
      drv.lastLng = initialLng;

      // Leaflet
      if (mapEngine === 'leaflet' && leafletMapInstance.current && window.L) {
        const L = window.L;
        const iconHtml = `
          <div style="display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <div class="moving-cab-icon-${i}" style="width: 36px; height: 36px; border-radius: 50%; background: #0f172a; border: 2px solid ${drv.color}; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 0 14px ${drv.color}88; transition: transform 0.25s linear;">
              ${drv.icon}
            </div>
          </div>
        `;
        const divIcon = L.divIcon({
          className: `ridex-nearby-cab-${i}`,
          html: iconHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        const marker = L.marker([initialLat, initialLng], { icon: divIcon, title: `📍 ${drv.type}` }).addTo(leafletMapInstance.current);
        lCabMarkers.current.push(marker);
      }

      // Google Maps
      if (mapEngine === 'google' && googleMapInstance.current && window.google && window.google.maps) {
        const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" fill="#0b0e17" stroke="${drv.color}" stroke-width="3"/>
            <text x="24" y="32" font-size="22" text-anchor="middle">${drv.icon}</text>
          </svg>
        `);
        const marker = new window.google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: googleMapInstance.current,
          title: `📍 ${drv.type}`,
          icon: {
            url: svgUrl,
            scaledSize: new window.google.maps.Size(42, 42),
            anchor: new window.google.maps.Point(21, 21)
          }
        });
        gCabMarkers.current.push(marker);
      }
    });

    // ── Live Motion Loop: Updates position & rotation every 300ms smoothly ──
    const moveInterval = setInterval(() => {
      driversRef.forEach((drv, i) => {
        // Increment orbit angle
        drv.angle += drv.speed * drv.dir * 0.05;

        // Calculate smooth target position
        const nextLat = lat + Math.sin(drv.angle) * drv.radiusX;
        const nextLng = lng + Math.cos(drv.angle) * drv.radiusY;

        // Calculate heading angle
        const bearing = calculateBearing(drv.lastLat, drv.lastLng, nextLat, nextLng);
        drv.lastLat = nextLat;
        drv.lastLng = nextLng;

        // Update Leaflet marker
        if (mapEngine === 'leaflet' && lCabMarkers.current[i] && window.L) {
          const m = lCabMarkers.current[i];
          m.setLatLng([nextLat, nextLng]);
          const rotElem = document.querySelector(`.moving-cab-icon-${i}`);
          if (rotElem) {
            rotElem.style.transform = `rotate(${Math.round(bearing)}deg)`;
          }
        }

        // Update Google Maps marker
        if (mapEngine === 'google' && gCabMarkers.current[i] && window.google) {
          const m = gCabMarkers.current[i];
          m.setPosition({ lat: nextLat, lng: nextLng });
          const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" fill="#0b0e17" stroke="${drv.color}" stroke-width="3"/>
              <g transform="rotate(${Math.round(bearing) - 90}, 24, 24)">
                <text x="24" y="32" font-size="22" text-anchor="middle">${drv.icon}</text>
              </g>
            </svg>
          `);
          m.setIcon({
            url: svgUrl,
            scaledSize: new window.google.maps.Size(42, 42),
            anchor: new window.google.maps.Point(21, 21)
          });
        }
      });
    }, 300);

    return () => {
      clearInterval(moveInterval);
    };
  }, [location, mapEngine, mode]);

  // Recenter handler like Google Maps
  const handleRecenter = () => {
    setLocateState('locating');
    setIsAutoCentered(true);

    const lat = location?.lat || 20.2520;
    const lng = location?.lng || 85.7836;

    if (googleMapInstance.current) {
      googleMapInstance.current.panTo({ lat, lng });
      googleMapInstance.current.setZoom(16.5);
    }
    if (leafletMapInstance.current) {
      leafletMapInstance.current.panTo([lat, lng]);
      leafletMapInstance.current.setZoom(16.5);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: curLat, longitude: curLng, accuracy } = pos.coords;
          const newLoc = { lat: curLat, lng: curLng, accuracy: Math.round(accuracy || 12), timestamp: new Date().toLocaleTimeString() };
          setLocation(newLoc);
          setLocateState('success');

          if (googleMapInstance.current) {
            googleMapInstance.current.panTo({ lat: curLat, lng: curLng });
            googleMapInstance.current.setZoom(16.5);
          }
          if (leafletMapInstance.current) {
            leafletMapInstance.current.panTo([curLat, curLng]);
            leafletMapInstance.current.setZoom(16.5);
          }

          fetchAddress(curLat, curLng, (addr) => {
            if (setPickupLocation) setPickupLocation({ lat: curLat, lng: curLng, address: addr });
            setPickupText(addr);
          });

          setTimeout(() => setLocateState('idle'), 1500);
        },
        () => setLocateState('idle'),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setTimeout(() => setLocateState('idle'), 1000);
    }
  };

  const handleZoomIn = () => {
    setIsAutoCentered(false);
    if (leafletMapInstance.current) {
      leafletMapInstance.current.zoomIn();
    }
    if (googleMapInstance.current) {
      const currentZoom = googleMapInstance.current.getZoom() || 16;
      googleMapInstance.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    setIsAutoCentered(false);
    if (leafletMapInstance.current) {
      leafletMapInstance.current.zoomOut();
    }
    if (googleMapInstance.current) {
      const currentZoom = googleMapInstance.current.getZoom() || 16;
      googleMapInstance.current.setZoom(currentZoom - 1);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: height === '100%' ? '100%' : height,
      minHeight: height === '100%' ? '100%' : height,
      borderRadius: showSearchInputs ? 24 : 0,
      overflow: 'hidden',
      border: showSearchInputs ? '1.5px solid rgba(0, 237, 255, 0.3)' : 'none',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      background: '#0b0e18',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      
      {/* Search Input Bar (Google Places Autocomplete) */}
      {showSearchInputs && (
        <div style={{ padding: 14, background: '#0d101a', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🟢</span>
            <input
              ref={pickupInputRef}
              type="text"
              placeholder="Search Pickup Location (Google Places Autocomplete)..."
              value={pickupText}
              onChange={e => setPickupText(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 38px', background: 'rgba(19,24,36,0.85)', border: '1px solid rgba(0,237,255,0.3)', borderRadius: 14, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔴</span>
            <input
              ref={destInputRef}
              type="text"
              placeholder="Search Destination Drop-off (Google Places Autocomplete)..."
              value={destText}
              onChange={e => setDestText(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 38px', background: 'rgba(19,24,36,0.85)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {/* Map Header Status & API Key Notice */}
      <div style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #181c2b, #0d101a)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>
            {mapEngine === 'google' ? 'Google Maps 3D Vector Engine' : 'Live GPS 3D Location Map'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => {
              const next3D = !is3DMode;
              setIs3DMode(next3D);
              if (googleMapInstance.current) {
                googleMapInstance.current.setTilt(next3D ? 60 : 0);
                googleMapInstance.current.setHeading(next3D ? 30 : 0);
              }
            }}
            style={{
              padding: '5px 12px', borderRadius: 999,
              background: is3DMode ? 'linear-gradient(135deg, #00edff, #3b82f6)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', color: is3DMode ? '#090a10' : '#fff',
              fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: is3DMode ? '0 0 12px rgba(0, 237, 255, 0.5)' : 'none'
            }}
          >
            {is3DMode ? '🧊 3D Perspective' : '🗺️ 2D Flat'}
          </button>

          <button
            onClick={() => setMapTheme(mapTheme === 'google' ? 'dark' : 'google')}
            style={{
              padding: '5px 12px', borderRadius: 999,
              background: mapTheme === 'google' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {mapTheme === 'google' ? '🎨 Google Color' : '🌙 Uber Dark'}
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative', background: '#0b0e18', overflow: 'hidden', perspective: '1000px' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            transform: (is3DMode && mapEngine === 'leaflet') ? 'perspective(900px) rotateX(24deg) scale(1.05)' : 'none',
            transformOrigin: 'center bottom',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* ── Rapido Style Live Driver Tracking & Telemetry Badge (Active Rides Only) ── */}
        {(mode === 'driver_assigned' || mode === 'live_ride') && (
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 400,
            background: 'rgba(9, 10, 16, 0.94)', backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(0, 237, 255, 0.5)', borderRadius: 20,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 10px 32px rgba(0, 237, 255, 0.25)', color: '#fff'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 14,
              background: 'linear-gradient(135deg, #00edff 0%, #3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 4px 15px rgba(0, 237, 255, 0.4)'
            }}>
              {driver?.vehicleIcon || '🏎️'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00edff', boxShadow: '0 0 10px #00edff' }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#00edff', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {mode === 'driver_assigned' ? 'RIDEX ARRIVAL TELEMETRY' : 'LIVE NAVIGATION TELEMETRY'}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>📏 {liveDistanceText}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span style={{ color: '#34d399' }}>⏱️ {liveEtaText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Zoom Controls Stack (+ / -) */}
        <div style={{
          position: 'absolute', bottom: 135, right: 16, zIndex: 400,
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              width: 44, height: 44, borderRadius: 14,
              border: '1.5px solid rgba(0, 237, 255, 0.5)',
              background: 'rgba(19, 24, 36, 0.94)', backdropFilter: 'blur(12px)',
              color: '#00edff', fontSize: 20, fontWeight: 900,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ➕
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              width: 44, height: 44, borderRadius: 14,
              border: '1.5px solid rgba(0, 237, 255, 0.5)',
              background: 'rgba(19, 24, 36, 0.94)', backdropFilter: 'blur(12px)',
              color: '#00edff', fontSize: 20, fontWeight: 900,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ➖
          </button>
        </div>

        {/* Floating "Center Driver" Button (Active Rides Only) */}
        {(mode === 'driver_assigned' || mode === 'live_ride') && driverCurrentPos && (
          <button
            type="button"
            onClick={() => {
              setIsAutoCentered(true);
              if (leafletMapInstance.current) {
                leafletMapInstance.current.setView([driverCurrentPos.lat, driverCurrentPos.lng], 16, { animate: true });
              }
              if (googleMapInstance.current) {
                googleMapInstance.current.panTo({ lat: driverCurrentPos.lat, lng: driverCurrentPos.lng });
                googleMapInstance.current.setZoom(16);
              }
            }}
            style={{
              position: 'absolute', bottom: 76, right: 16, zIndex: 400,
              padding: '10px 14px', borderRadius: 999,
              border: '1.5px solid rgba(0, 237, 255, 0.5)',
              background: 'rgba(19, 24, 36, 0.92)', backdropFilter: 'blur(12px)',
              color: '#00edff', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🎯 Focus Driver
          </button>
        )}

        {/* Floating Google Maps Style Target GPS Button */}
        {!loadingLocation && (
          <button
            type="button" 
            onClick={handleRecenter} 
            disabled={locateState === 'locating'}
            title="Re-center to my location"
            style={{
              position: 'absolute', bottom: 20, right: 16, zIndex: 400,
              width: 50, height: 50, borderRadius: '50%',
              border: isAutoCentered ? '2.5px solid #1a73e8' : '1px solid rgba(0,0,0,0.14)',
              background: '#ffffff', color: isAutoCentered ? '#1a73e8' : '#5f6368',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.32)', outline: 'none',
              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: locateState === 'locating' ? 'scale(1.12)' : 'scale(1)',
            }}
          >
            <TargetIcon color={isAutoCentered ? '#1a73e8' : '#5f6368'} size={24} />
          </button>
        )}

        {/* GPS Badge (Positioned on top-right so it doesn't overlap telemetry badge) */}
        {location && (
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 400, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(59,130,246,0.4)', borderRadius: 999, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: '#0f172a', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 10px #2563eb' }} />
            <span>Google Maps GPS (±{location.accuracy}m)</span>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      {showSummaryBar && routeInfo && (
        <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, rgba(0,237,255,0.1), rgba(59,130,246,0.1))', borderTop: '1px solid rgba(0,237,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00edff', textTransform: 'uppercase' }}>Google Route Calculation</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', marginTop: 2 }}>{routeInfo.distance} · {routeInfo.duration}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>Est. Fare</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399' }}>₹{routeInfo.estimatedFare}</div>
          </div>
        </div>
      )}

      {/* Live Address Card */}
      {showAddressCard && (
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.08)', padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📍</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8, color: '#2563eb', marginBottom: 2 }}>Current GPS Location</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                {addressLoading ? 'Detecting Google Maps landmark...' : address}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
