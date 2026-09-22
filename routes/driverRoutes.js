const express = require('express');
const router = express.Router();
const { protectDriver } = require('../middleware/driverMiddleware');
const {
  driverLogin,
  getDriverList,
  getDriverProfile,
  updateDriverProfile,
  getDriverDashboard,
  updateDriverStatus,
  getRideRequests,
  acceptRideRequest,
  rejectRideRequest,
  updateRideStatus,
  updateDriverLocation,
  getActiveRide,
  getDriverHistory,
  getDriverEarnings,
  getDriverNotifications,
  getDriverFeedback
} = require('../controllers/driverController');

// 🔓 Public / Unprotected Auth Endpoints for Driver App
router.post('/login', driverLogin);
router.get('/list', getDriverList);

// 🔐 Protected Driver Endpoints (Requires Driver Auth)
router.use(protectDriver);

router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);

router.get('/dashboard', getDriverDashboard);
router.patch('/status', updateDriverStatus);

router.get('/requests', getRideRequests);
router.post('/rides/:id/accept', acceptRideRequest);
router.post('/rides/:id/reject', rejectRideRequest);
router.patch('/rides/:id/status', updateRideStatus);

router.post('/location', updateDriverLocation);
router.get('/active-ride', getActiveRide);
router.get('/history', getDriverHistory);
router.get('/earnings', getDriverEarnings);
router.get('/notifications', getDriverNotifications);
router.get('/feedback', getDriverFeedback);

module.exports = router;
