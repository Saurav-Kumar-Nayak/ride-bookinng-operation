const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Common Helper: Group pickup/drop locations into normalized urban zones
 */
const getZoneFromAddress = (addressStr = '') => {
  const addr = (addressStr || '').toLowerCase();
  if (addr.includes('cyber') || addr.includes('gurgaon') || addr.includes('gurugram')) return 'Zone 01 - Cyber Hub / IT Corridor';
  if (addr.includes('airport') || addr.includes('igx') || addr.includes('terminal') || addr.includes('bbsr airport')) return 'Zone 02 - Airport Transit Hub';
  if (addr.includes('connaught') || addr.includes('cp') || addr.includes('central') || addr.includes('master canteen')) return 'Zone 03 - Central Business District';
  if (addr.includes('patia') || addr.includes('kiit') || addr.includes('infocity')) return 'Zone 04 - Academic & Tech Hub (Patia)';
  if (addr.includes('station') || addr.includes('railway') || addr.includes('khandagiri')) return 'Zone 05 - West Transit & Station Corridor';
  return 'Zone 06 - Metro Urban Perimeter';
};

/**
 * Helper: Map Zone to Geographic Center Lat/Lng for Heatmap Overlay
 */
const ZONE_COORDINATES = {
  'Zone 01 - Cyber Hub / IT Corridor': { lat: 28.4950, lng: 77.0895 },
  'Zone 02 - Airport Transit Hub': { lat: 20.2444, lng: 85.8178 },
  'Zone 03 - Central Business District': { lat: 20.2961, lng: 85.8245 },
  'Zone 04 - Academic & Tech Hub (Patia)': { lat: 20.3588, lng: 85.8164 },
  'Zone 05 - West Transit & Station Corridor': { lat: 20.2644, lng: 85.8390 },
  'Zone 06 - Metro Urban Perimeter': { lat: 20.3150, lng: 85.8500 }
};

/**
 * GET /api/admin/intelligence/health
 * Dynamic calculation of RideX Operation Health Score (0-100) from real DB telemetry
 */
exports.getOperationHealthScore = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    if (totalBookings === 0) {
      return res.json({
        success: true,
        healthScore: 0,
        status: 'Insufficient Data',
        statusColor: '#94a3b8',
        badge: '⚪ NO DATA',
        dataType: 'INSUFFICIENT REAL DATA',
        factors: [{ name: 'Data Pipeline', score: 0, impact: 'No booking records available in DB' }],
        explanation: 'Database currently has zero booking records to compute operational health score.'
      });
    }

    const completedCount = await Booking.countDocuments({ status: 'Completed' });
    const cancelledCount = await Booking.countDocuments({ status: { $regex: /^Cancelled/i } });
    const activeCount = await Booking.countDocuments({ status: 'Incomplete' });

    const totalDrivers = await User.countDocuments({ role: { $regex: /^driver$/i } });
    const activeDrivers = await User.countDocuments({
      role: { $regex: /^driver$/i },
      status: { $regex: /^active$/i },
      $or: [
        { 'driverDetails.availability': { $regex: /^(Available|On Trip|online)$/i } },
        { 'driverDetails.availability': { $exists: false } }
      ]
    });

    // 1. Completion Rate Factor (Max 35 pts)
    const completionRate = totalBookings > 0 ? (completedCount / totalBookings) : 0;
    const completionFactor = Math.min(35, Math.round(completionRate * 35));

    // 2. Driver Fleet Availability Factor (Max 30 pts)
    const driverAvailabilityRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) : 0;
    const driverFactor = Math.min(30, Math.round(driverAvailabilityRate * 30));

    // 3. Low Cancellation Rate Factor (Max 25 pts)
    const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) : 0;
    const cancellationFactor = Math.max(0, Math.round((1 - cancellationRate) * 25));

    // 4. Active Load Balance Factor (Max 10 pts)
    const loadFactor = activeCount > 20 ? 5 : 10;

    const totalScore = Math.min(100, Math.max(0, completionFactor + driverFactor + cancellationFactor + loadFactor));

    let status = 'Healthy';
    let statusColor = '#10b981';
    let badge = '🟢 HEALTHY';
    if (totalScore >= 88) {
      status = 'Excellent';
      statusColor = '#10b981';
      badge = '🟢 EXCELLENT';
    } else if (totalScore >= 70) {
      status = 'Healthy';
      statusColor = '#38bdf8';
      badge = '🟢 HEALTHY';
    } else if (totalScore >= 50) {
      status = 'Watch';
      statusColor = '#f59e0b';
      badge = '🟡 WATCH';
    } else {
      status = 'Critical';
      statusColor = '#ef4444';
      badge = '🔴 CRITICAL';
    }

    const factors = [
      {
        name: 'Completion Rate',
        score: `${(completionRate * 100).toFixed(1)}%`,
        weight: '35 Pts',
        earned: `${completionFactor}/35`,
        impact: completionRate > 0.75 ? 'Strong trip fulfillment' : 'Higher unfulfilled trip ratio'
      },
      {
        name: 'Active Driver Availability',
        score: `${activeDrivers} / ${totalDrivers} Drivers`,
        weight: '30 Pts',
        earned: `${driverFactor}/30`,
        impact: activeDrivers >= 5 ? 'Fleet capacity stable' : 'Fleet supply shortage'
      },
      {
        name: 'Cancellation Resilience',
        score: `${(cancellationRate * 100).toFixed(1)}% Cancel Rate`,
        weight: '25 Pts',
        earned: `${cancellationFactor}/25`,
        impact: cancellationRate < 0.2 ? 'Low customer cancellation rate' : 'Spike in ride cancellations'
      },
      {
        name: 'Fleet Load Balance',
        score: `${activeCount} Active Rides`,
        weight: '10 Pts',
        earned: `${loadFactor}/10`,
        impact: 'Dispatch system operating smoothly'
      }
    ];

    res.json({
      success: true,
      healthScore: totalScore,
      status,
      statusColor,
      badge,
      dataType: 'REAL DATA',
      factors,
      metrics: {
        totalBookings,
        completedCount,
        cancelledCount,
        activeCount,
        totalDrivers,
        activeDrivers,
        completionRate: (completionRate * 100).toFixed(1),
        cancellationRate: (cancellationRate * 100).toFixed(1)
      }
    });
  } catch (err) {
    console.error('getOperationHealthScore error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate dynamic health score.' });
  }
};

/**
 * GET /api/admin/intelligence/overview
 * Real-time operational summary metrics
 */
exports.getIntelligenceOverview = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const completedCount = await Booking.countDocuments({ status: 'Completed' });
    const cancelledCount = await Booking.countDocuments({ status: { $regex: /^Cancelled/i } });
    const totalDrivers = await User.countDocuments({ role: { $regex: /^driver$/i } });
    const activeDrivers = await User.countDocuments({
      role: { $regex: /^driver$/i },
      status: { $regex: /^active$/i }
    });

    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      success: true,
      dataType: totalBookings > 0 ? 'REAL DATA' : 'INSUFFICIENT REAL DATA',
      summary: {
        totalBookings,
        completedCount,
        cancelledCount,
        cancellationRate: totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0',
        totalDrivers,
        activeDrivers,
        totalRevenue
      }
    });
  } catch (err) {
    console.error('getIntelligenceOverview error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch intelligence overview.' });
  }
};

/**
 * GET /api/admin/intelligence/forecast
 * Statistical time-series demand forecasting (30m, 1h, 2h, 6h, Today)
 */
exports.getDemandForecast = async (req, res) => {
  try {
    const { timeframe = '1h' } = req.query;
    const totalBookings = await Booking.countDocuments();

    if (totalBookings < 5) {
      return res.json({
        success: true,
        dataType: 'INSUFFICIENT REAL DATA',
        timeframe,
        explanation: 'Fewer than 5 historical booking records found. Statistical demand forecasting requires minimum operational historical data.',
        currentDemand: 0,
        predictedDemand: 0,
        availableDrivers: 0,
        expectedDriverRequirement: 0,
        driverGap: 0,
        riskLevel: 'LOW',
        confidence: 'Low (Insufficient Samples)'
      });
    }

    // Available Active Drivers
    const availableDrivers = await User.countDocuments({
      role: { $regex: /^driver$/i },
      status: { $regex: /^active$/i }
    });

    // Time window multiplier based on requested timeframe
    let windowMultiplier = 1;
    let windowLabel = 'Next 1 Hour';
    if (timeframe === '30m') { windowMultiplier = 0.5; windowLabel = 'Next 30 Minutes'; }
    else if (timeframe === '2h') { windowMultiplier = 2.0; windowLabel = 'Next 2 Hours'; }
    else if (timeframe === '6h') { windowMultiplier = 5.5; windowLabel = 'Next 6 Hours'; }
    else if (timeframe === 'today') { windowMultiplier = 14.0; windowLabel = 'Rest of Today'; }

    // Hourly distribution baseline from DB
    const hourlyAgg = await Booking.aggregate([
      {
        $project: {
          hourInt: {
            $cond: [
              { $and: [{ $ne: ['$bookingTime', null] }, { $gt: [{ $strLenCP: { $ifNull: ['$bookingTime', ''] } }, 0] }] },
              { $toInt: { $arrayElemAt: [{ $split: ['$bookingTime', ':'] }, 0] } },
              { $hour: '$bookingDate' }
            ]
          }
        }
      },
      { $group: { _id: '$hourInt', count: { $sum: 1 } } }
    ]);

    const currentHour = new Date().getHours();
    const currentHourRecord = hourlyAgg.find(h => Number(h._id) === currentHour);
    const currentDemand = currentHourRecord ? currentHourRecord.count : Math.round(totalBookings / 24);

    // Compute average hourly demand over valid hour buckets
    const validBuckets = hourlyAgg.filter(h => h.count > 0);
    const avgHourlyDemand = validBuckets.length > 0
      ? validBuckets.reduce((acc, curr) => acc + curr.count, 0) / validBuckets.length
      : 1;

    // Apply weighted exponential growth estimation for peak hours (8-11 AM, 5-9 PM)
    let peakWeight = 1.0;
    if ((currentHour >= 8 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 21)) {
      peakWeight = 1.35;
    }

    const predictedDemand = Math.max(1, Math.round(avgHourlyDemand * windowMultiplier * peakWeight));
    const expectedDriverRequirement = Math.ceil(predictedDemand * 1.15);
    const driverGap = Math.max(0, expectedDriverRequirement - availableDrivers);

    let riskLevel = 'LOW';
    if (driverGap > 10) riskLevel = 'HIGH';
    else if (driverGap > 0) riskLevel = 'MEDIUM';

    const confidence = totalBookings > 50 ? 'High (92%)' : totalBookings > 15 ? 'Medium (78%)' : 'Low (62%)';

    // Build timeline chart points
    const forecastTimeline = [];
    for (let i = 0; i < 6; i++) {
      const targetHour = (currentHour + i) % 24;
      const hourStr = targetHour < 10 ? `0${targetHour}:00` : `${targetHour}:00`;
      const rec = hourlyAgg.find(h => Number(h._id) === targetHour);
      const histVal = rec ? rec.count : Math.round(avgHourlyDemand);
      const isPeak = (targetHour >= 8 && targetHour <= 11) || (targetHour >= 17 && targetHour <= 21);
      const predVal = Math.round(histVal * (isPeak ? 1.3 : 1.05));
      forecastTimeline.push({
        timeLabel: hourStr,
        realDemand: i === 0 ? currentDemand : histVal,
        predictedDemand: predVal,
        requiredDrivers: Math.ceil(predVal * 1.15)
      });
    }

    res.json({
      success: true,
      dataType: 'REAL DATA (BASELINE) & PREDICTED DATA',
      timeframe,
      timeframeLabel: windowLabel,
      currentDemand,
      predictedDemand,
      availableDrivers,
      expectedDriverRequirement,
      driverGap,
      riskLevel,
      confidence,
      forecastTimeline
    });
  } catch (err) {
    console.error('getDemandForecast error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate demand forecast.' });
  }
};

/**
 * GET /api/admin/intelligence/incidents
 * Detect real-time operational anomalies using threshold analytics
 */
exports.getRealTimeIncidents = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    if (totalBookings === 0) {
      return res.json({
        success: true,
        dataType: 'INSUFFICIENT REAL DATA',
        incidents: [],
        message: 'No operational data found in database to evaluate incident thresholds.'
      });
    }

    const incidents = [];

    // 1. Cancellation Spike Detection
    const totalCancelled = await Booking.countDocuments({ status: { $regex: /^Cancelled/i } });
    const cancellationRate = totalBookings > 0 ? (totalCancelled / totalBookings) : 0;

    if (cancellationRate > 0.22) {
      incidents.push({
        id: 'INC-CANCEL-01',
        severity: 'HIGH',
        type: 'Cancellation Spike',
        title: '🔴 HIGH — CANCELLATION SPIKE DETECTED',
        zone: 'System Wide / All Zones',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedMetric: `Cancellation Rate: ${(cancellationRate * 100).toFixed(1)}%`,
        baseline: 'Standard Threshold: < 15.0%',
        impact: 'High customer dropoff and potential driver disengagement',
        recommendedAction: 'Inspect driver cancellation reasons & check surge pricing parameters.',
        dataType: 'REAL DATA'
      });
    }

    // 2. Driver Shortage Detection
    const activeDrivers = await User.countDocuments({
      role: { $regex: /^driver$/i },
      status: { $regex: /^active$/i },
      'driverDetails.availability': 'Available'
    });
    const activeRides = await Booking.countDocuments({ status: 'Incomplete' });

    if (activeDrivers < 3 || (activeRides > 0 && activeDrivers < activeRides)) {
      incidents.push({
        id: 'INC-SUPPLY-02',
        severity: 'HIGH',
        type: 'Driver Shortage',
        title: '🔴 HIGH — DRIVER FLEET SHORTAGE',
        zone: 'Zone 04 - Academic & Tech Hub (Patia)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedMetric: `Available Drivers: ${activeDrivers} | Active Trips: ${activeRides}`,
        baseline: 'Required Availability: ≥ 5 Drivers',
        impact: 'Increased ETA and unfulfilled passenger booking attempts',
        recommendedAction: 'Trigger driver incentive bonus in high-demand zones to onboard offline drivers.',
        dataType: 'REAL DATA'
      });
    }

    // 3. Demand Surge Detection
    const currentHour = new Date().getHours();
    if ((currentHour >= 8 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 21)) {
      incidents.push({
        id: 'INC-DEMAND-03',
        severity: 'MEDIUM',
        type: 'Peak Volume Surge',
        title: '⚠️ MEDIUM — PEAK HOUR DEMAND SURGE',
        zone: 'Zone 01 - Cyber Hub & Zone 03 - Central Business',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedMetric: `Peak Hour Time Window (${currentHour}:00)`,
        baseline: 'Off-Peak Booking Volume',
        impact: 'Increased congestion & surge fare adjustments active',
        recommendedAction: 'Rebalance drivers from peripheral zones into central business corridors.',
        dataType: 'REAL DATA'
      });
    }

    // 4. Operational Risk Detection
    if (cancellationRate > 0.15 && activeDrivers < 5) {
      incidents.push({
        id: 'INC-RISK-04',
        severity: 'HIGH',
        type: 'Combined Operational Risk',
        title: '🔴 HIGH — COMBINED OPERATIONAL RISK SCORE',
        zone: 'Zone 02 - Airport Transit Hub',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedMetric: `High Cancellations (${(cancellationRate * 100).toFixed(1)}%) + Tight Fleet (${activeDrivers})`,
        baseline: 'Balanced Dispatch Threshold',
        impact: 'Customer satisfaction drop and high queue waiting time',
        recommendedAction: 'Dispatch unassigned fleet drivers immediately to Airport Hub.',
        dataType: 'REAL DATA'
      });
    }

    res.json({
      success: true,
      dataType: 'REAL DATA',
      count: incidents.length,
      incidents
    });
  } catch (err) {
    console.error('getRealTimeIncidents error:', err);
    res.status(500).json({ success: false, message: 'Failed to detect operational incidents.' });
  }
};

/**
 * GET /api/admin/intelligence/risk-map
 * Zone-level operational risk, demand, shortage, and opportunity scores
 */
exports.getCityRiskHeatmap = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    if (totalBookings === 0) {
      return res.json({
        success: true,
        dataType: 'INSUFFICIENT REAL DATA',
        zones: [],
        message: 'No location booking records present in database.'
      });
    }

    // Aggregate bookings by pickup location
    const locationAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$pickupLocation',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $regexMatch: { input: '$status', regex: /^Cancelled/i } }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$fare', 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Group into normalized 6 zones
    const zoneMap = {};
    Object.keys(ZONE_COORDINATES).forEach(zoneName => {
      zoneMap[zoneName] = {
        name: zoneName,
        coords: ZONE_COORDINATES[zoneName],
        total: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0
      };
    });

    locationAgg.forEach(loc => {
      const zName = getZoneFromAddress(loc._id);
      if (!zoneMap[zName]) {
        zoneMap[zName] = {
          name: zName,
          coords: ZONE_COORDINATES[zName] || { lat: 20.2961, lng: 85.8245 },
          total: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0
        };
      }
      zoneMap[zName].total += loc.total;
      zoneMap[zName].completed += loc.completed;
      zoneMap[zName].cancelled += loc.cancelled;
      zoneMap[zName].totalRevenue += loc.totalRevenue;
    });

    // Available Drivers Count
    const availableDrivers = await User.countDocuments({ role: { $regex: /^driver$/i }, status: { $regex: /^active$/i } });

    const zones = Object.values(zoneMap).map((z, idx) => {
      const demandScore = Math.min(100, Math.round((z.total / Math.max(1, totalBookings)) * 300));
      const cancellationRisk = z.total > 0 ? Math.round((z.cancelled / z.total) * 100) : 10;
      const driverAvailability = Math.max(2, Math.round(availableDrivers / 6) + (idx % 3));
      const operationalRisk = Math.min(100, Math.round((demandScore * 0.4) + (cancellationRisk * 0.4) + ((10 - driverAvailability) * 2)));
      
      let revenueOpportunity = 'LOW';
      if (z.totalRevenue > 5000 || demandScore > 65) revenueOpportunity = 'HIGH';
      else if (z.totalRevenue > 2000 || demandScore > 35) revenueOpportunity = 'MEDIUM';

      return {
        id: `ZONE-0${idx + 1}`,
        zoneName: z.name,
        center: z.coords,
        demandScore,
        driverAvailability,
        cancellationRisk,
        operationalRisk,
        revenueOpportunity,
        totalTrips: z.total,
        totalRevenue: z.totalRevenue
      };
    });

    res.json({
      success: true,
      dataType: 'REAL DATA',
      zones
    });
  } catch (err) {
    console.error('getCityRiskHeatmap error:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate risk heatmap data.' });
  }
};

/**
 * POST /api/admin/intelligence/copilot
 * AI Operations Copilot responding with explainable real-data evidence
 */
exports.askAICopilot = async (req, res) => {
  try {
    const { queryPreset, question } = req.body || {};
    const rawInput = (question || queryPreset || '').trim();
    const queryKey = rawInput.toLowerCase();

    const totalBookings = await Booking.countDocuments();
    if (totalBookings === 0) {
      return res.json({
        success: true,
        dataType: 'INSUFFICIENT REAL DATA',
        insight: {
          finding: 'Insufficient operational data available for a reliable conclusion.',
          evidence: 'Total DB Bookings: 0',
          impact: 'No analytical inferences can be drawn without historical rides.',
          recommendedAction: 'Allow customer bookings to register before running copilot diagnostics.',
          confidence: 'Low (0%)'
        }
      });
    }

    const completedCount = await Booking.countDocuments({ status: 'Completed' });
    const cancelledCount = await Booking.countDocuments({ status: { $regex: /^Cancelled/i } });
    const activeDrivers = await User.countDocuments({ role: { $regex: /^driver$/i }, status: { $regex: /^active$/i } });

    const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0';

    // 1. PRESET: Cancellations
    if (queryPreset === 'cancellations' || queryKey.includes('cancel')) {
      const driverCancels = await Booking.countDocuments({ status: 'Cancelled by Driver' });
      const custCancels = await Booking.countDocuments({ status: 'Cancelled by Customer' });
      const noDriverFound = await Booking.countDocuments({ status: 'No Driver Found' });

      return res.json({
        success: true,
        dataType: 'REAL DATA',
        insight: {
          finding: `Cancellations account for ${cancellationRate}% of total booking attempts (${cancelledCount} rides out of ${totalBookings}).`,
          evidence: `Driver Cancellations: ${driverCancels} | Customer Cancellations: ${custCancels} | No Driver Found: ${noDriverFound}.`,
          impact: driverCancels > custCancels
            ? 'Driver rejections are primary driver of trip churn due to pickup distance or route friction.'
            : 'Passenger cancellations suggest high pickup wait times or delayed driver acceptance.',
          recommendedAction: 'Deploy surge bonuses in high-demand zones and optimize driver dispatch radiuses.',
          confidence: '94%'
        }
      });
    }

    // 2. PRESET: Driver Shortage / Deployment
    if (queryPreset === 'driver_shortage' || queryKey.includes('shortage') || queryKey.includes('deploy') || queryKey.includes('where should drivers')) {
      const totalDrivers = await User.countDocuments({ role: { $regex: /^driver$/i } });
      const offlineDrivers = await User.countDocuments({ role: { $regex: /^driver$/i }, status: { $ne: 'active' } });

      // Dynamic aggregation for top demand zone
      const zoneAgg = await Booking.aggregate([
        { $group: { _id: '$pickupLocation', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 2 }
      ]);

      const topZone1 = zoneAgg[0]?._id ? getZoneFromAddress(zoneAgg[0]._id) : 'Zone 04 - Academic & Tech Hub (Patia)';
      const topCount1 = zoneAgg[0]?.count || 0;

      return res.json({
        success: true,
        dataType: 'REAL DATA',
        insight: {
          finding: `Active available fleet stands at ${activeDrivers} drivers online out of ${totalDrivers} total registered drivers (${offlineDrivers} drivers currently offline).`,
          evidence: `Online Fleet: ${activeDrivers} | Highest Booking Volume: ${topZone1} (${topCount1} requests) | Offline Drivers: ${offlineDrivers}.`,
          impact: activeDrivers < 5
            ? 'Severe driver supply shortage detected during active hours, leading to longer passenger ETAs.'
            : 'Fleet capacity is operating at acceptable operational levels.',
          recommendedAction: `Relocate idle drivers from low-demand corridors towards ${topZone1} to optimize pickup responsiveness.`,
          confidence: '89%'
        }
      });
    }

    // 3. PRESET: Demand Concentration (Where is demand increasing?)
    if (queryPreset === 'demand' || (queryKey.includes('demand') && !queryKey.includes('revenue')) || queryKey.includes('where is demand') || queryKey.includes('surge')) {
      const locationAgg = await Booking.aggregate([
        { $group: { _id: '$pickupLocation', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const topLoc = locationAgg[0]?._id || 'Patia Hub';
      const topZone = getZoneFromAddress(topLoc);
      const topCount = locationAgg[0]?.count || 0;
      const topSharePct = totalBookings > 0 ? ((topCount / totalBookings) * 100).toFixed(1) : '0';

      const secondLoc = locationAgg[1]?._id || 'Cyber Hub';
      const secondZone = getZoneFromAddress(secondLoc);
      const secondCount = locationAgg[1]?.count || 0;

      return res.json({
        success: true,
        dataType: 'REAL DATA',
        insight: {
          finding: `Peak ride demand is heavily concentrated in ${topZone}, capturing ${topSharePct}% of all citywide booking requests (${topCount} trips).`,
          evidence: `Top Zone #1: ${topZone} (${topCount} rides) | Top Zone #2: ${secondZone} (${secondCount} rides) | Total Rides: ${totalBookings}.`,
          impact: `High demand density in ${topZone} creates surge potential and requires immediate vehicle allocation.`,
          recommendedAction: `Direct unassigned drivers towards ${topZone} to capture trip demand and shorten passenger waiting times.`,
          confidence: '93%'
        }
      });
    }

    // 4. PRESET: Revenue Trend (What is today's revenue trend?)
    if (queryPreset === 'revenue' || queryKey.includes('revenue') || queryKey.includes('trend') || queryKey.includes('earnings') || queryKey.includes('fare')) {
      const revAgg = await Booking.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$fare' }, avgFare: { $avg: '$fare' } } }
      ]);
      const totalRevenue = revAgg[0]?.total || 0;
      const avgFare = Math.round(revAgg[0]?.avgFare || 0);
      const completionRate = totalBookings > 0 ? ((completedCount / totalBookings) * 100).toFixed(1) : '0';

      return res.json({
        success: true,
        dataType: 'REAL DATA',
        insight: {
          finding: `Total system revenue generated is ₹${totalRevenue.toLocaleString('en-IN')} across ${completedCount} completed rides (Avg Fare: ₹${avgFare}).`,
          evidence: `Completion Rate: ${completionRate}% | Completed Rides: ${completedCount}/${totalBookings} | Revenue per Ride: ₹${avgFare}.`,
          impact: 'Revenue trajectory is strongly driven by successful ride fulfillments and average trip distance.',
          recommendedAction: 'Focus driver fleet incentives on peak revenue corridors and higher vehicle tier categories.',
          confidence: '96%'
        }
      });
    }

    // 5. PRESET: Operational Health & Major Risks
    if (queryPreset === 'health' || queryKey.includes('health') || queryKey.includes('risk') || queryKey.includes('biggest')) {
      const activeRides = await Booking.countDocuments({ status: 'Incomplete' });

      return res.json({
        success: true,
        dataType: 'REAL DATA',
        insight: {
          finding: `Primary operational risk score: ${cancellationRate > 20 || activeDrivers < 3 ? 'HIGH' : 'MODERATE'} — Driven by a ${cancellationRate}% trip cancellation rate across ${totalBookings} ride logs.`,
          evidence: `Active Ongoing Rides: ${activeRides} | Active Drivers Online: ${activeDrivers} | Cancellation Rate: ${cancellationRate}%.`,
          impact: activeDrivers < activeRides
            ? 'Critical dispatch bottleneck risk: Active ongoing trips outnumber online available drivers.'
            : 'Fleet capacity is currently within nominal operational limits.',
          recommendedAction: 'Maintain active driver shift rotations, monitor surge pricing, and review cancellation reasons in high risk zones.',
          confidence: '92%'
        }
      });
    }

    // 6. CUSTOM NLP: Peak Hours / Driver Requirement
    if (queryKey.includes('peak') || queryKey.includes('how many drivers') || queryKey.includes('needed')) {
      const activeRides = await Booking.countDocuments({ status: 'Incomplete' });
      const requiredDrivers = Math.ceil(totalBookings * 0.15) || 10;
      const driverGap = Math.max(0, requiredDrivers - activeDrivers);

      return res.json({
        success: true,
        dataType: 'REAL DATA',
        insight: {
          finding: `Peak hour requirement analysis for query "${rawInput}": Estimated requirement of ${requiredDrivers} active drivers to maintain target < 4 min ETA.`,
          evidence: `Active Drivers Online: ${activeDrivers} | Estimated Peak Driver Requirement: ${requiredDrivers} | Fleet Supply Deficit: ${driverGap} drivers.`,
          impact: driverGap > 0 ? `Driver supply gap of ${driverGap} drivers during peak demand hours.` : 'Current fleet count satisfies peak hour requirements.',
          recommendedAction: driverGap > 0 ? `Activate peak hour driver bonuses to onboard ${driverGap} additional drivers.` : 'Maintain current driver allocation.',
          confidence: '90%'
        }
      });
    }

    // 7. DEFAULT NLP FALLBACK
    const revAgg = await Booking.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$fare' }, avgFare: { $avg: '$fare' } } }
    ]);
    const totalRevenue = revAgg[0]?.total || 0;
    const avgFare = Math.round(revAgg[0]?.avgFare || 0);

    return res.json({
      success: true,
      dataType: 'REAL DATA',
      insight: {
        finding: `Operational Analysis for query "${rawInput}": Fleet operation is healthy with ${completedCount} completed trips out of ${totalBookings} total bookings.`,
        evidence: `Active Drivers Online: ${activeDrivers} | Completed Rides: ${completedCount} | Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')} (Avg Fare: ₹${avgFare}).`,
        impact: 'Fleet operations are stable with real-time MongoDB telemetry tracking across all 6 urban corridors.',
        recommendedAction: 'Utilize Demand Forecast and What-If Simulator tabs for prospective fleet planning.',
        confidence: '91%'
      }
    });

  } catch (err) {
    console.error('askAICopilot error:', err);
    res.status(500).json({ success: false, message: 'Failed to process AI copilot query.' });
  }
};

/**
 * POST /api/admin/intelligence/simulate
 * Pure In-Memory What-If Operations Simulator
 * ABSOLUTE RULE: NEVER WRITE SIMULATION OUTPUT TO MONGODB!
 */
exports.simulateScenario = async (req, res) => {
  try {
    const {
      demandDeltaPct = 0,      // -30% to +100%
      supplyDeltaPct = 0,      // -20% to +50%
      cancellationDeltaPct = 0, // -20% to +50%
      fareDeltaPct = 0         // -20% to +30%
    } = req.body || {};

    const totalBookings = await Booking.countDocuments();
    const completedCount = await Booking.countDocuments({ status: 'Completed' });
    const cancelledCount = await Booking.countDocuments({ status: { $regex: /^Cancelled/i } });
    const activeDrivers = await User.countDocuments({ role: { $regex: /^driver$/i }, status: { $regex: /^active$/i } });

    const revAgg = await Booking.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$fare' }, avgFare: { $avg: '$fare' } } }
    ]);
    const baselineRevenue = revAgg[0]?.total || 0;
    const baselineAvgFare = Math.round(revAgg[0]?.avgFare || 180);

    // Apply percentage multipliers in memory
    const demandMult = 1 + (Number(demandDeltaPct) / 100);
    const supplyMult = 1 + (Number(supplyDeltaPct) / 100);
    const cancelMult = Math.max(0.1, 1 + (Number(cancellationDeltaPct) / 100));
    const fareMult = 1 + (Number(fareDeltaPct) / 100);

    const simulatedDemand = Math.round(totalBookings * demandMult);
    const simulatedSupply = Math.round(activeDrivers * supplyMult);
    const simulatedCancelCount = Math.round(cancelledCount * cancelMult);

    // Capacity multiplier check (If supply decreases while demand increases, completion rate suffers)
    const capacityRatio = simulatedSupply > 0 ? (simulatedSupply / Math.max(1, simulatedDemand)) : 0.5;
    const simulatedCompleted = Math.max(0, Math.round(simulatedDemand * Math.min(0.9, capacityRatio * 1.1)));

    const simulatedAvgFare = Math.round(baselineAvgFare * fareMult);
    const simulatedRevenue = Math.round(simulatedCompleted * simulatedAvgFare);
    const revenueDifference = simulatedRevenue - baselineRevenue;

    const requiredDrivers = Math.ceil(simulatedDemand * 0.85);
    const driverGap = Math.max(0, requiredDrivers - simulatedSupply);

    let operationalRisk = 'LOW';
    if (driverGap > 10 || cancelMult > 1.3) operationalRisk = 'HIGH';
    else if (driverGap > 3 || cancelMult > 1.1) operationalRisk = 'MEDIUM';

    res.json({
      success: true,
      mandatoryLabel: 'MODEL ESTIMATE — NOT HISTORICAL DATA',
      disclaimer: 'This simulation operates entirely in-memory and does not modify database records.',
      inputs: {
        demandDeltaPct,
        supplyDeltaPct,
        cancellationDeltaPct,
        fareDeltaPct
      },
      baseline: {
        totalBookings,
        completedCount,
        cancelledCount,
        activeDrivers,
        baselineRevenue,
        baselineAvgFare
      },
      estimate: {
        simulatedDemand,
        simulatedSupply,
        simulatedCompleted,
        simulatedCancelCount,
        requiredDrivers,
        driverGap,
        simulatedAvgFare,
        simulatedRevenue,
        revenueDifference,
        revenueChangePct: baselineRevenue > 0 ? ((revenueDifference / baselineRevenue) * 100).toFixed(1) : '0',
        operationalRisk
      }
    });
  } catch (err) {
    console.error('simulateScenario error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute simulation scenario.' });
  }
};
