const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, emailSignup, emailLogin, googleLogin } = require('../controllers/authController');

// POST /api/auth/send-otp
router.post('/send-otp', sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/email-signup
router.post('/email-signup', emailSignup);

// POST /api/auth/email-login
router.post('/email-login', emailLogin);

// POST /api/auth/google-login
router.post('/google-login', googleLogin);

module.exports = router;
