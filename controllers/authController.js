const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { formatIndianPhone, sendRealSmsOtp, verifyTwilioVerifyOtp } = require('../utils/smsProvider');

// In-Memory Backup Store for OTPs (ensures 100% resilience if MongoDB is reconnecting)
const inMemoryOtpStore = new Map();
const inMemoryUserStore = new Map();
const rateLimitStore = new Map();

// Helper to hash strings
function hashOtp(otpCode) {
  return crypto.createHash('sha256').update(otpCode).digest('hex');
}

/**
 * POST /api/auth/send-otp
 */
exports.sendOtp = async (req, res) => {
  try {
    const { phone: rawPhone } = req.body;
    const { clean10: phone, fullE164 } = formatIndianPhone(rawPhone);

    // 1. Validate 10-digit Indian mobile number format
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Please enter a valid 10-digit Indian mobile number.',
      });
    }

    // 2. Rate Limiting Check (Max 3 OTP requests per 5 minutes per phone)
    const now = Date.now();
    const rateData = rateLimitStore.get(phone) || { count: 0, firstReset: now };
    if (now - rateData.firstReset > 5 * 60 * 1000) {
      rateData.count = 0;
      rateData.firstReset = now;
    }
    if (rateData.count >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait 5 minutes before trying again.',
      });
    }
    rateData.count += 1;
    rateLimitStore.set(phone, rateData);

    // 3. Generate Secure 6-Digit OTP Code
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(otpCode);
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes validity

    // 4. Save OTP Record in DB/Memory
    try {
      await Otp.deleteMany({ phone });
      await Otp.create({ phone, otpHash, expiresAt, attempts: 0 });
    } catch (dbErr) {
      console.warn('[AUTH] MongoDB OTP write warning, using memory fallback:', dbErr.message);
    }

    inMemoryOtpStore.set(phone, {
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // 5. Send REAL SMS via Provider (Twilio Verify / Fast2SMS / Twilio SMS / MSG91 / 2Factor)
    let isRealSmsSent = false;
    let devOtpHint = null;

    try {
      await sendRealSmsOtp(phone, otpCode);
      isRealSmsSent = true;
    } catch (smsErr) {
      if (smsErr.message === 'NO_SMS_PROVIDER_CONFIGURED') {
        console.log(`[AUTH] No SMS provider credentials configured. Using Dev Mode OTP for ${fullE164}: ${otpCode}`);
        devOtpHint = otpCode;
      } else {
        return res.status(500).json({
          success: false,
          error: 'SMS_DELIVERY_FAILED',
          message: `Failed to deliver real SMS: ${smsErr.message}`,
        });
      }
    }

    // 6. Return Success Response
    return res.status(200).json({
      success: true,
      message: isRealSmsSent
        ? `Real SMS OTP sent successfully to ${fullE164}`
        : `OTP generated for +91 ${phone}`,
      devOtp: devOtpHint,
      expiresInSeconds: 300,
    });
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.',
    });
  }
};

/**
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone: rawPhone, otp: inputOtp } = req.body;
    const { clean10: phone } = formatIndianPhone(rawPhone);

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format.',
      });
    }

    if (!inputOtp || !/^\d{6}$/.test(String(inputOtp).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit OTP code.',
      });
    }

    const cleanOtp = String(inputOtp).trim();
    const now = Date.now();

    let isProviderVerified = false;
    try {
      const twilioResult = await verifyTwilioVerifyOtp(phone, cleanOtp);
      if (twilioResult !== null) {
        if (!twilioResult.verified) {
          return res.status(400).json({
            success: false,
            message: twilioResult.message || 'Invalid or expired OTP code.',
          });
        }
        isProviderVerified = true;
      }
    } catch (verifyErr) {
      return res.status(500).json({
        success: false,
        message: `Twilio Verify service error: ${verifyErr.message}`,
      });
    }

    if (!isProviderVerified) {
      const inputHash = hashOtp(cleanOtp);
      let otpRecord = null;
      let isFromDb = false;

      try {
        otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });
        if (otpRecord) isFromDb = true;
      } catch (dbErr) {
        console.warn('[AUTH] DB fetch error, falling back to memory store:', dbErr.message);
      }

      if (!otpRecord) {
        otpRecord = inMemoryOtpStore.get(phone);
      }

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'No active OTP request found for this mobile number. Please request a new OTP.',
        });
      }

      const expiresAtMs = new Date(otpRecord.expiresAt).getTime();
      if (now > expiresAtMs) {
        if (isFromDb) await Otp.deleteOne({ _id: otpRecord._id });
        inMemoryOtpStore.delete(phone);

        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please click Resend OTP to get a new code.',
        });
      }

      const currentAttempts = (otpRecord.attempts || 0) + 1;
      if (currentAttempts > 5) {
        if (isFromDb) await Otp.deleteOne({ _id: otpRecord._id });
        inMemoryOtpStore.delete(phone);

        return res.status(429).json({
          success: false,
          message: 'Too many incorrect OTP attempts. Security lock triggered. Please request a new OTP.',
        });
      }

      if (isFromDb) {
        await Otp.updateOne({ _id: otpRecord._id }, { $set: { attempts: currentAttempts } });
      }
      inMemoryOtpStore.set(phone, { ...otpRecord, attempts: currentAttempts });

      if (otpRecord.otpHash !== inputHash) {
        const remaining = 5 - currentAttempts;
        return res.status(400).json({
          success: false,
          message: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new OTP.'}`,
        });
      }

      if (isFromDb) {
        await Otp.deleteMany({ phone });
      }
      inMemoryOtpStore.delete(phone);
    }

    let user = null;
    try {
      user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({
          phone,
          name: 'Saurav Kumar Nayak',
          email: 'nayaksauravkumar830@gmail.com',
          role: 'passenger',
        });
      } else {
        if (!user.name || user.name.startsWith('Passenger (')) {
          user.name = 'Saurav Kumar Nayak';
        }
        user.lastLoginAt = new Date();
        await user.save();
      }
    } catch (dbErr) {
      console.warn('[AUTH] User DB write warning, using memory session:', dbErr.message);
      user = inMemoryUserStore.get(phone) || {
        _id: `mem_${phone}`,
        phone,
        name: 'Saurav Kumar Nayak',
        email: 'nayaksauravkumar830@gmail.com',
        role: 'passenger',
      };
      inMemoryUserStore.set(phone, user);
    }

    const authToken = crypto.randomBytes(32).toString('hex');

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully!',
      token: authToken,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email || '',
        role: user.role || 'passenger',
      },
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    });
  }
};

/**
 * POST /api/auth/email-signup
 */
exports.emailSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, Email and Password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    let existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please Sign In.' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role: 'passenger',
    });

    const authToken = crypto.randomBytes(32).toString('hex');
    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        role: user.role || 'passenger',
      },
    });
  } catch (err) {
    console.error('emailSignup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
};

/**
 * POST /api/auth/email-login
 */
exports.emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and Password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    let user = await User.findOne({ email: cleanEmail });
    if (!user || user.password !== passwordHash) {
      return res.status(400).json({ success: false, message: 'Invalid email or password. Please check your credentials.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const authToken = crypto.randomBytes(32).toString('hex');
    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        role: user.role || 'passenger',
      },
    });
  } catch (err) {
    console.error('emailLogin error:', err);
    return res.status(500).json({ success: false, message: 'Failed to sign in. Please try again.' });
  }
};

/**
 * POST /api/auth/google-login
 */
exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for Google Sign-In.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({ $or: [{ googleId }, { email: cleanEmail }] });

    if (!user) {
      user = await User.create({
        googleId: googleId || `g_${Date.now()}`,
        email: cleanEmail,
        name: name || 'Google User',
        avatar: avatar || '',
        role: 'passenger',
      });
    } else {
      if (googleId) user.googleId = googleId;
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const authToken = crypto.randomBytes(32).toString('hex');
    return res.status(200).json({
      success: true,
      message: 'Google Sign-In successful!',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'passenger',
      },
    });
  } catch (err) {
    console.error('googleLogin error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
};
