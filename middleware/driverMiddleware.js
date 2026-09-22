const User = require('../models/User');

/**
 * Middleware to protect driver routes and verify Driver Role & Authentication.
 * Expects header 'Authorization: Bearer <driverIdOrToken>' or 'x-driver-id' or 'x-driver-phone'.
 */
exports.protectDriver = async (req, res, next) => {
  try {
    let driverIdentifier = null;

    // Check Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      driverIdentifier = authHeader.split(' ')[1];
    } else if (req.headers['x-driver-id']) {
      driverIdentifier = req.headers['x-driver-id'];
    } else if (req.headers['x-driver-phone']) {
      driverIdentifier = req.headers['x-driver-phone'];
    } else if (req.query.driverId) {
      driverIdentifier = req.query.driverId;
    }

    if (!driverIdentifier) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Missing driver authentication header or token.'
      });
    }

    // Try finding driver by ObjectId, phone, or email
    let driver = null;
    if (driverIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      driver = await User.findById(driverIdentifier);
    }

    if (!driver) {
      driver = await User.findOne({
        $or: [
          { phone: driverIdentifier },
          { email: driverIdentifier }
        ]
      });
    }

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Driver account not found.'
      });
    }

    // Ensure role is 'driver' (case insensitive match)
    if (!driver.role || !/^driver$/i.test(driver.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Account does not have driver authorization.'
      });
    }

    // Check account status
    if (driver.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Driver account is currently suspended or inactive.'
      });
    }

    req.driver = driver;
    req.user = driver;
    next();
  } catch (err) {
    console.error('protectDriver middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during driver authorization check.'
    });
  }
};
