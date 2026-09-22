const https = require('https');

/**
 * Clean 10-digit Indian phone number and return formatted version (+91XXXXXXXXXX)
 */
function formatIndianPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '').slice(-10);
  return {
    clean10: digits,
    fullE164: `+91${digits}`,
  };
}

/**
 * Sends a REAL OTP SMS using configured provider credentials in process.env.
 * Supports:
 * 1. Twilio Verify Service (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID)
 * 2. Fast2SMS (FAST2SMS_API_KEY)
 * 3. Twilio Programmable Messaging (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * 4. MSG91 (MSG91_AUTH_KEY, MSG91_TEMPLATE_ID)
 * 5. 2Factor (TWO_FACTOR_API_KEY)
 */
function sendRealSmsOtp(rawPhone, otpCode) {
  return new Promise((resolve, reject) => {
    const { clean10, fullE164 } = formatIndianPhone(rawPhone);

    if (!clean10 || clean10.length !== 10) {
      return reject(new Error('Invalid mobile number. Please enter a valid 10-digit Indian mobile number.'));
    }

    // -------------------------------------------------------------
    // Option 1: Twilio Verify Service API (Recommended)
    // -------------------------------------------------------------
    const twAccountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const twAuthToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const twVerifySid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim();
    const twPhoneNum = (process.env.TWILIO_PHONE_NUMBER || '').trim();

    if (twAccountSid && twAuthToken && twVerifySid) {
      const accountSid = twAccountSid;
      const authToken = twAuthToken;
      const verifyServiceSid = twVerifySid;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const postData = new URLSearchParams({
        To: fullE164,
        Channel: 'sms',
      }).toString();

      const req = https.request({
        hostname: 'verify.twilio.com',
        path: `/v2/Services/${verifyServiceSid}/Verifications`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && data.status === 'pending') {
              console.log(`[SMS SERVICE] Twilio Verify OTP sent to ${fullE164}`);
              return resolve({ success: true, provider: 'twilio_verify', status: data.status });
            } else {
              const errorMsg = data.message || `Twilio Code ${data.code}: ${data.more_info || 'Verify Service error'}`;
              console.error(`[SMS SERVICE] Twilio Verify API error: ${errorMsg}`);
              return reject(new Error(`Twilio Verify error: ${errorMsg}`));
            }
          } catch (e) {
            return reject(new Error(`Twilio Verify response parse error (${res.statusCode}): ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Twilio Verify connection error: ${err.message}`)));
      req.write(postData);
      req.end();
      return;
    }

    // -------------------------------------------------------------
    // Option 2: Fast2SMS (India)
    // -------------------------------------------------------------
    if (process.env.FAST2SMS_API_KEY) {
      const postData = JSON.stringify({
        route: 'otp',
        variables_values: otpCode,
        numbers: clean10,
      });

      const req = https.request({
        hostname: 'www.fast2sms.com',
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && data.return === true) {
              console.log(`[SMS SERVICE] Fast2SMS OTP sent to +91 ${clean10}`);
              return resolve({ success: true, provider: 'fast2sms', response: data });
            } else {
              const errorMsg = data.message
                ? (Array.isArray(data.message) ? data.message.join(', ') : data.message)
                : `HTTP ${res.statusCode}: ${body}`;
              console.error(`[SMS SERVICE] Fast2SMS error: ${errorMsg}`);
              return reject(new Error(`Fast2SMS error: ${errorMsg}`));
            }
          } catch (e) {
            return reject(new Error(`Fast2SMS response parse error (${res.statusCode}): ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Fast2SMS connection error: ${err.message}`)));
      req.write(postData);
      req.end();
      return;
    }

    // -------------------------------------------------------------
    // Option 3: Twilio Programmable Messaging
    // -------------------------------------------------------------
    if (twAccountSid && twAuthToken && twPhoneNum) {
      const accountSid = twAccountSid;
      const authToken = twAuthToken;
      const fromPhone = twPhoneNum;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const message = `Your RideX verification code is: ${otpCode}. Valid for 5 minutes. Do not share this OTP.`;
      const postData = new URLSearchParams({
        To: fullE164,
        From: fromPhone,
        Body: message,
      }).toString();

      const req = https.request({
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && !data.error_code) {
              console.log(`[SMS SERVICE] Twilio SMS delivered to ${fullE164}. SID: ${data.sid}`);
              return resolve({ success: true, provider: 'twilio_sms', sid: data.sid });
            } else {
              const errorMsg = data.message || `Code ${data.code}: ${data.more_info || 'Twilio SMS error'}`;
              console.error(`[SMS SERVICE] Twilio SMS API error: ${errorMsg}`);
              return reject(new Error(`Twilio SMS error: ${errorMsg}`));
            }
          } catch (e) {
            return reject(new Error(`Twilio SMS response parse error (${res.statusCode}): ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Twilio SMS connection error: ${err.message}`)));
      req.write(postData);
      req.end();
      return;
    }

    // -------------------------------------------------------------
    // Option 4: MSG91 (India)
    // -------------------------------------------------------------
    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
      const postData = JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID.trim(),
        mobile: `91${clean10}`,
        otp: otpCode,
      });

      const req = https.request({
        hostname: 'control.msg91.com',
        path: '/api/v5/otp',
        method: 'POST',
        headers: {
          'authkey': process.env.MSG91_AUTH_KEY.trim(),
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.type === 'success' || res.statusCode === 200) {
              console.log(`[SMS SERVICE] MSG91 OTP delivered to +91 ${clean10}`);
              return resolve({ success: true, provider: 'msg91', response: data });
            } else {
              return reject(new Error(`MSG91 error: ${data.message || body}`));
            }
          } catch (e) {
            return reject(new Error(`MSG91 parse error (${res.statusCode}): ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`MSG91 connection error: ${err.message}`)));
      req.write(postData);
      req.end();
      return;
    }

    // -------------------------------------------------------------
    // Option 5: 2Factor (India)
    // -------------------------------------------------------------
    if (process.env.TWO_FACTOR_API_KEY) {
      const apiKey = process.env.TWO_FACTOR_API_KEY.trim();
      const pathUrl = `/API/V1/${apiKey}/SMS/${clean10}/${otpCode}/AUTOGEN`;

      const req = https.request({
        hostname: '2factor.in',
        path: pathUrl,
        method: 'GET',
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.Status === 'Success') {
              console.log(`[SMS SERVICE] 2Factor OTP delivered to +91 ${clean10}`);
              return resolve({ success: true, provider: '2factor', details: data.Details });
            } else {
              return reject(new Error(`2Factor error: ${data.Details || body}`));
            }
          } catch (e) {
            return reject(new Error(`2Factor parse error (${res.statusCode}): ${body}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`2Factor connection error: ${err.message}`)));
      req.end();
      return;
    }

    // -------------------------------------------------------------
    // No Provider Configured
    // -------------------------------------------------------------
    return reject(new Error("NO_SMS_PROVIDER_CONFIGURED"));
  });
}

/**
 * Verifies a REAL OTP through Twilio Verify API if configured.
 * Returns null if Twilio Verify is not active (falling back to backend database OTP verification).
 */
function verifyTwilioVerifyOtp(rawPhone, inputCode) {
  return new Promise((resolve, reject) => {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const verifyServiceSid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim();

    if (!accountSid || !authToken || !verifyServiceSid) {
      return resolve(null); // Not using Twilio Verify
    }

    const { fullE164 } = formatIndianPhone(rawPhone);

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const postData = new URLSearchParams({
      To: fullE164,
      Code: inputCode.trim(),
    }).toString();

    const req = https.request({
      hostname: 'verify.twilio.com',
      path: `/v2/Services/${verifyServiceSid}/VerificationCheck`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300 && (data.status === 'approved' || data.valid === true)) {
            console.log(`[SMS SERVICE] Twilio Verify OTP approved for ${fullE164}`);
            return resolve({ verified: true, provider: 'twilio_verify' });
          } else {
            console.warn(`[SMS SERVICE] Twilio Verify check failed for ${fullE164}:`, data.message || data.status);
            return resolve({ verified: false, message: data.message || 'Invalid or expired OTP code.' });
          }
        } catch (e) {
          return reject(new Error(`Twilio Verify check parse error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Twilio Verify check connection error: ${err.message}`)));
    req.write(postData);
    req.end();
  });
}

module.exports = {
  formatIndianPhone,
  sendRealSmsOtp,
  verifyTwilioVerifyOtp,
};
