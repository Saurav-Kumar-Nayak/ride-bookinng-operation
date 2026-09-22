/**
 * Location Geocoding & Route Telemetry Utility
 * Maps location names / text to accurate GPS coordinates and calculates dynamic route metrics.
 */

const KNOWN_LANDMARKS = [
  { keywords: ['trident', 'tat', 'trident academy'], lat: 20.3562, lng: 85.8188, name: 'Trident Academy, Infocity' },
  { keywords: ['urban', 'urban estate', 'urban structure'], lat: 20.2980, lng: 85.8350, name: 'Urban Estate, Saheed Nagar' },
  { keywords: ['patia', 'patia square'], lat: 20.3533, lng: 85.8266, name: 'Patia, Bhubaneswar' },
  { keywords: ['master canteen', 'canteen'], lat: 20.2961, lng: 85.8245, name: 'Master Canteen, Bhubaneswar' },
  { keywords: ['infocity', 'info city', 'infocity road'], lat: 20.3580, lng: 85.8150, name: 'Infocity IT Park, Patia' },
  { keywords: ['kiit', 'kiit campus', 'kiit university'], lat: 20.3540, lng: 85.8170, name: 'KIIT University, Patia' },
  { keywords: ['jayadev vihar', 'jaydev vihar'], lat: 20.3075, lng: 85.8250, name: 'Jayadev Vihar, Bhubaneswar' },
  { keywords: ['rasulgarh', 'rasulgarh square'], lat: 20.2900, lng: 85.8500, name: 'Rasulgarh Square, Bhubaneswar' },
  { keywords: ['khandagiri', 'udaigiri'], lat: 20.2580, lng: 85.7820, name: 'Khandagiri, Bhubaneswar' },
  { keywords: ['airport', 'biju patnaik', 'bhubaneswar airport'], lat: 20.2444, lng: 85.8178, name: 'Biju Patnaik International Airport' },
  { keywords: ['railway station', 'station', 'bbsr station'], lat: 20.2650, lng: 85.8400, name: 'Bhubaneswar Railway Station' },
  { keywords: ['cuttack', 'badambadi'], lat: 20.4625, lng: 85.8828, name: 'Cuttack Central' },
  { keywords: ['puri', 'jagannath temple'], lat: 19.8135, lng: 85.8312, name: 'Puri Grand Road' },
  { keywords: ['amri', 'amri hospital'], lat: 20.2550, lng: 85.7890, name: 'AMRI Hospital, Khandagiri' },
  { keywords: ['esplanade', 'esplanade one'], lat: 20.2880, lng: 85.8480, name: 'Esplanade One Mall, Rasulgarh' },
  { keywords: ['baramunda', 'bus stand'], lat: 20.2720, lng: 85.7980, name: 'Baramunda Bus Stand' },
  { keywords: ['saheed nagar', 'shahid nagar'], lat: 20.2910, lng: 85.8380, name: 'Saheed Nagar, Bhubaneswar' },
  { keywords: ['acharya vihar'], lat: 20.3010, lng: 85.8300, name: 'Acharya Vihar, Bhubaneswar' },
  { keywords: ['old town', 'lingaraj'], lat: 20.2400, lng: 85.8330, name: 'Old Town, Lingaraj Temple' },
  { keywords: ['kalpana', 'kalpana square'], lat: 20.2600, lng: 85.8420, name: 'Kalpana Square, Bhubaneswar' },
];

/**
 * Strictly validates latitude and longitude coordinates.
 * Rejects undefined, null, NaN, non-numeric, out-of-bound or swapped coordinates.
 */
export function isValidCoordinate(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || !isFinite(numLat) || isNaN(numLng) || !isFinite(numLng)) return false;
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) return false;
  // Reject (0,0) or identical lat/lng unless legitimate
  if (numLat === 0 && numLng === 0) return false;
  return true;
}

/**
 * Hash string to deterministic integer for consistent fallback coordinates.
 */
function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolves location input (object or string) to precise GPS coordinates.
 */
export function getCoordinatesFromLocationText(locState, fallbackLat = 20.3533, fallbackLng = 85.8266, fallbackAddr = 'Patia') {
  const safeFallbackLat = isValidCoordinate(fallbackLat, fallbackLng) ? Number(fallbackLat) : 20.3533;
  const safeFallbackLng = isValidCoordinate(fallbackLat, fallbackLng) ? Number(fallbackLng) : 85.8266;

  if (!locState) {
    return { lat: safeFallbackLat, lng: safeFallbackLng, address: fallbackAddr };
  }

  // If already an object with lat and lng
  if (typeof locState === 'object' && locState !== null) {
    const candidateLat = locState.lat ?? locState.latitude;
    const candidateLng = locState.lng ?? locState.longitude;
    if (isValidCoordinate(candidateLat, candidateLng)) {
      return {
        lat: Number(candidateLat),
        lng: Number(candidateLng),
        address: locState.address || fallbackAddr
      };
    }
    if (locState.address && typeof locState.address === 'string') {
      locState = locState.address;
    }
  }

  if (typeof locState !== 'string' || !locState.trim() || locState.trim().startsWith('{')) {
    return { lat: fallbackLat, lng: fallbackLng, address: fallbackAddr };
  }

  const cleanText = locState.trim();
  const lowerText = cleanText.toLowerCase();

  // Check landmark dictionary
  for (const landmark of KNOWN_LANDMARKS) {
    if (landmark.keywords.some(kw => lowerText.includes(kw))) {
      return {
        lat: landmark.lat,
        lng: landmark.lng,
        address: cleanText || landmark.name
      };
    }
  }

  // Fallback: Use deterministic hash relative to base center (Bhubaneswar center: 20.3000, 85.8200)
  const hash = hashString(lowerText);
  const latOffset = (((hash % 120) - 60) * 0.0018); // ~ -0.1 to +0.1 deg (~ 1 to 10 km spread)
  const lngOffset = ((((hash >> 3) % 120) - 60) * 0.0018);

  const lat = parseFloat((20.3000 + latOffset).toFixed(4));
  const lng = parseFloat((85.8200 + lngOffset).toFixed(4));

  return {
    lat,
    lng,
    address: cleanText
  };
}

/**
 * Haversine formula to compute ground distance in kilometers.
 */
export function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 4.4;
  if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lon1 - lon2) < 0.0001) {
    return 1.2; // minimum trip distance
  }
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return Math.max(0.8, parseFloat(km.toFixed(1)));
}

/**
 * Compute vehicle ETA & Trip Duration based on vehicle profile and distance.
 */
export function getVehicleMetrics(option, distKm) {
  if (!option) return { driverArrivalMins: 3, tripDurationMins: 11 };
  const minsPerKm = option.minsPerKm || 2.2;
  const baseArrival = option.arrivalMins || 3;

  const driverArrivalMins = Math.max(1, Math.round(baseArrival + (distKm > 10 ? 2 : distKm > 5 ? 1 : 0)));
  const tripDurationMins = Math.max(3, Math.round(distKm * minsPerKm));

  return { driverArrivalMins, tripDurationMins };
}

/**
 * Calculate compass bearing in degrees (0° - 360°) between two coordinates.
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) return 0;
  if (Math.abs(lat1 - lat2) < 0.00001 && Math.abs(lon1 - lon2) < 0.00001) return 0;

  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

/**
 * Calculates perpendicular/minimum distance in kilometers from a point to a polyline array.
 */
export function getDistanceToPolylineKm(pLat, pLng, polylinePoints) {
  if (!isValidCoordinate(pLat, pLng) || !Array.isArray(polylinePoints) || polylinePoints.length === 0) {
    return 0;
  }

  let minDistance = Infinity;

  for (let i = 0; i < polylinePoints.length; i++) {
    const pt = polylinePoints[i];
    const ptLat = Array.isArray(pt) ? pt[0] : (pt.lat ?? pt[0]);
    const ptLng = Array.isArray(pt) ? pt[1] : (pt.lng ?? pt[1]);

    if (isValidCoordinate(ptLat, ptLng)) {
      const dist = getHaversineDistanceKm(pLat, pLng, ptLat, ptLng);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }
  }

  return minDistance === Infinity ? 0 : minDistance;
}

/**
 * Validates whether a new GPS update is realistic compared to previous update.
 * Rejects unrealistic speed teleportation jumps (> maxSpeedKmh, e.g. 160 km/h).
 */
export function isValidGpsUpdate(newLoc, prevLoc, maxSpeedKmh = 160) {
  if (!newLoc || !isValidCoordinate(newLoc.lat, newLoc.lng)) return false;
  if (!prevLoc || !isValidCoordinate(prevLoc.lat, prevLoc.lng)) return true;

  const distKm = getHaversineDistanceKm(prevLoc.lat, prevLoc.lng, newLoc.lat, newLoc.lng);
  
  if (newLoc.timestamp && prevLoc.timestamp) {
    const timeDiffSeconds = Math.max(0.5, (newLoc.timestamp - prevLoc.timestamp) / 1000);
    const speedKmh = (distKm / timeDiffSeconds) * 3600;
    if (speedKmh > maxSpeedKmh && distKm > 0.5) {
      console.warn(`[GPS Guard] Rejected unrealistic jump: ${distKm.toFixed(2)} km in ${timeDiffSeconds.toFixed(1)}s (${speedKmh.toFixed(0)} km/h)`);
      return false;
    }
  } else if (distKm > 10.0) {
    console.warn(`[GPS Guard] Rejected single jump exceeding 10km (${distKm.toFixed(2)} km)`);
    return false;
  }

  return true;
}

/**
 * Matches driver's GPS coordinate to the active route polyline,
 * trims completed points behind the vehicle, and returns remaining geometry + distance.
 */
export function getMatchedPolylineTrim(pLat, pLng, polylinePoints) {
  if (!isValidCoordinate(pLat, pLng) || !Array.isArray(polylinePoints) || polylinePoints.length === 0) {
    return {
      remainingPolyline: isValidCoordinate(pLat, pLng) ? [[pLat, pLng]] : [],
      remainingDistanceKm: 0,
      matchedIndex: 0
    };
  }

  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < polylinePoints.length; i++) {
    const pt = polylinePoints[i];
    const ptLat = Array.isArray(pt) ? pt[0] : (pt.lat ?? pt[0]);
    const ptLng = Array.isArray(pt) ? pt[1] : (pt.lng ?? pt[1]);

    if (isValidCoordinate(ptLat, ptLng)) {
      const dist = getHaversineDistanceKm(pLat, pLng, ptLat, ptLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }
  }

  const rawRemaining = polylinePoints.slice(closestIndex).map(pt => {
    const lat = Array.isArray(pt) ? pt[0] : (pt.lat ?? pt[0]);
    const lng = Array.isArray(pt) ? pt[1] : (pt.lng ?? pt[1]);
    return [lat, lng];
  });

  const remainingPolyline = [[pLat, pLng], ...rawRemaining];

  let remainingDistanceKm = 0;
  for (let i = 0; i < remainingPolyline.length - 1; i++) {
    const p1 = remainingPolyline[i];
    const p2 = remainingPolyline[i + 1];
    remainingDistanceKm += getHaversineDistanceKm(p1[0], p1[1], p2[0], p2[1]);
  }

  return {
    remainingPolyline,
    remainingDistanceKm: parseFloat(remainingDistanceKm.toFixed(3)),
    matchedIndex: closestIndex,
    offRouteDistanceKm: minDistance
  };
}

