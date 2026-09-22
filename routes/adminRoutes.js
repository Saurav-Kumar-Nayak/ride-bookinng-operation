const express = require('express');
const router = express.Router();
const {
  verifyAdminPasscode,
  getAdminStats,
  getAdminUsers,
  toggleUserStatus,
  getAdminDrivers,
  toggleDriverStatus,
  getAdminRides,
  getAdminRevenue,
  getAdminLiveMapData,
  updateDriverLocation,
  getAdminAnalytics,
  getAnalyticsRides,
  getAnalyticsRevenue,
  getAnalyticsUsers,
  getAnalyticsDrivers,
  getAdminNotifications
} = require('../controllers/adminController');

// 🔐 Admin Passcode Authentication
router.post('/login', verifyAdminPasscode);
router.post('/verify-passcode', verifyAdminPasscode);

// 📊 Stats & KPIs
router.get('/stats', getAdminStats);

// 📈 Dynamic Time-Series Analytics & Sub-Endpoints
router.get('/analytics', getAdminAnalytics);
router.get('/analytics/rides', getAnalyticsRides);
router.get('/analytics/revenue', getAnalyticsRevenue);
router.get('/analytics/users', getAnalyticsUsers);
router.get('/analytics/drivers', getAnalyticsDrivers);

// 🔔 Admin Dynamic Notifications
router.get('/notifications', getAdminNotifications);

// 👥 Users Management
router.get('/users', getAdminUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

// 🚗 Drivers Management
router.get('/drivers', getAdminDrivers);
router.put('/drivers/:id/toggle-status', toggleDriverStatus);

// 🚕 Rides Master List
router.get('/rides', getAdminRides);

// 💰 Revenue Analytics
router.get('/revenue', getAdminRevenue);

// 🗺️ Live Map Telemetry
router.get('/live-map', getAdminLiveMapData);
router.post('/drivers/location', updateDriverLocation);

// 🧠 AI Operations Intelligence Router
const adminIntelligenceRoutes = require('./adminIntelligenceRoutes');
router.use('/intelligence', adminIntelligenceRoutes);

module.exports = router;

