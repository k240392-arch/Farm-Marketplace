// routes/auth.js — with email verification + security logging + OAuth
// Author: CPRO306 Capstone Project | Date: 2026

const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const crypto     = require('crypto');
const { body, validationResult } = require('express-validator');
const db         = require('../config/db');
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');
const { logActivity, logSecurityEvent, checkBruteForce } = require('../middleware/security');
const passport   = require('../config/passport');

// ── OAUTH SUCCESS HELPER ───────────────────────────────────
// Creates JWT and redirects to frontend — role already set from picker
const oauthSuccess = (req, res) => {
  const token = jwt.sign(
    { user_id: req.user.user_id, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  const user = encodeURIComponent(JSON.stringify({
    user_id:   req.user.user_id,
    full_name: req.user.full_name,
    email:     req.user.email,
    role:      req.user.role,
  }));
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}&user=${user}`);
};

// ── OAUTH ROUTES ───────────────────────────────────────────
// Role is passed via ?role=buyer|farmer from the frontend modal
// We encode it as state so it survives the OAuth redirect roundtrip

// Google
router.get('/google', (req, res, next) => {
  const role  = ['farmer','buyer'].includes(req.query.role) ? req.query.role : 'buyer';
  const state = encodeURIComponent(JSON.stringify({ role }));
  passport.authenticate('google', { scope: ['profile','email'], state })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { session:false, failureRedirect:`${process.env.CLIENT_URL}/login?error=oauth` }), oauthSuccess);

// GitHub
router.get('/github', (req, res, next) => {
  const role  = ['farmer','buyer'].includes(req.query.role) ? req.query.role : 'buyer';
  const state = encodeURIComponent(JSON.stringify({ role }));
  passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
});
router.get('/github/callback', passport.authenticate('github', { session:false, failureRedirect:`${process.env.CLIENT_URL}/login?error=oauth` }), oauthSuccess);

// Facebook
router.get('/facebook', (req, res, next) => {
  const role  = ['farmer','buyer'].includes(req.query.role) ? req.query.role : 'buyer';
  const state = encodeURIComponent(JSON.stringify({ role }));
  passport.authenticate('facebook', { scope: ['email'], state })(req, res, next);
});
router.get('/facebook/callback', passport.authenticate('facebook', { session:false, failureRedirect:`${process.env.CLIENT_URL}/login?error=oauth` }), oauthSuccess);

// ── OAUTH ROLE UPDATE ──────────────────────────────────────
// PATCH /api/auth/oauth-role — lets brand-new OAuth users pick farmer or buyer
router.patch('/oauth-role', protect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be farmer or buyer.' });
    }
    await db.query(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?',
      [role, req.user.user_id]
    );
    await logActivity(req.user.user_id, 'oauth_role_set', `OAuth user set role to: ${role}`, req).catch(() => {});
    res.json({ message: `Role updated to ${role}`, role });
  } catch (err) {
    console.error('OAuth role update error:', err.message);
    res.status(500).json({ message: 'Failed to update role.' });
  }
});

// ── REGISTER ───────────────────────────────────────────────
router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('role').isIn(['farmer','buyer']).withMessage('Role must be farmer or buyer'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { full_name, email, password, role } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT user_id, is_verified FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      if (!existing[0].is_verified) {
        const token   = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.query(
          'UPDATE users SET verification_token=?, verification_expires=? WHERE email=?',
          [token, expires, email]
        );
        sendVerificationEmail(email, full_name, token).catch(() => {});
        return res.status(400).json({
          message: 'Email registered but not verified. Verification email resent.'
        });
      }
      await logActivity(null, 'register_duplicate', `Duplicate register attempt: ${email}`, req, 'failed');
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const password_hash        = await bcrypt.hash(password, 12);
    const verification_token   = crypto.randomBytes(32).toString('hex');
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_verified, verification_token, verification_expires)
       VALUES (?,?,?,?,0,?,?)`,
      [full_name, email, password_hash, role, verification_token, verification_expires]
    );

    await logActivity(result.insertId, 'register', `New ${role} registered: ${email}`, req);

    sendVerificationEmail(email, full_name, verification_token)
      .catch(e => console.log('Verification email failed:', e.message));

    res.status(201).json({
      message: `Account created! Please check ${email} and click the verification link.`,
      requiresVerification: true
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ── VERIFY EMAIL ───────────────────────────────────────────
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, role, verification_expires
       FROM users WHERE verification_token = ? AND is_verified = 0`,
      [token]
    );

    if (rows.length === 0)
      return res.send(verifyPage(false, 'Invalid or already used verification link.'));

    const user = rows[0];
    if (new Date() > new Date(user.verification_expires))
      return res.send(verifyPage(false, 'Verification link expired. Please register again.'));

    await db.query(
      'UPDATE users SET is_verified=1, verification_token=NULL, verification_expires=NULL WHERE user_id=?',
      [user.user_id]
    );

    await logActivity(user.user_id, 'email_verified', `Email verified: ${user.email}`, req);
    sendWelcomeEmail(user.email, user.full_name, user.role).catch(() => {});

    return res.send(verifyPage(true, user.full_name));
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).send(verifyPage(false, 'Server error. Please try again.'));
  }
});

// ── RESEND VERIFICATION ────────────────────────────────────
router.post('/resend-verification', [body('email').isEmail()], async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, is_verified FROM users WHERE email=?', [email]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Email not found.' });
    if (rows[0].is_verified) return res.status(400).json({ message: 'Already verified. Please login.' });

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
      'UPDATE users SET verification_token=?, verification_expires=? WHERE user_id=?',
      [token, expires, rows[0].user_id]
    );
    sendVerificationEmail(email, rows[0].full_name, token).catch(() => {});
    res.json({ message: 'Verification email resent! Check your inbox.' });
  } catch (err) {
    res.status(500).json({ message: 'Error resending email.' });
  }
});

// ── LOGIN (with brute force protection) ───────────────────
router.post('/login', checkBruteForce, [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, password_hash, role, is_active, is_verified
       FROM users WHERE email=?`,
      [email]
    );

    if (rows.length === 0) {
      await req.trackLoginResult?.(false);
      await logActivity(null, 'login_failed', `Login failed — unknown email: ${email}`, req, 'failed');
      await logSecurityEvent('failed_login', 'low', req, `Unknown email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (!user.is_verified) {
      await logActivity(user.user_id, 'login_unverified', `Login blocked — unverified: ${email}`, req, 'failed');
      return res.status(403).json({
        message: 'Please verify your email first. Check your inbox.',
        requiresVerification: true,
        email: user.email
      });
    }

    if (!user.is_active) {
      await logActivity(user.user_id, 'login_suspended', `Login blocked — suspended: ${email}`, req, 'blocked');
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await req.trackLoginResult?.(false);
      await logActivity(user.user_id, 'login_failed', `Wrong password for: ${email}`, req, 'failed');
      await logSecurityEvent('failed_login', 'medium', req, `Wrong password for: ${email}`, user.user_id);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await req.trackLoginResult?.(true);
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    await logActivity(user.user_id, 'login_success', `Logged in as ${user.role}: ${email}`, req);

    res.json({
      message: 'Login successful!',
      token,
      user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// ── LOGOUT ─────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await logActivity(decoded.user_id, 'logout', `User logged out`, req);
    } catch {}
  }
  res.json({ message: 'Logged out successfully.' });
});

// ── UPDATE PROFILE ─────────────────────────────────────────
// ── GET CURRENT USER (full profile incl. phone/address) ────
router.get('/me', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, role, phone, address FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile: ' + err.message });
  }
});

router.patch('/profile', protect, async (req, res) => {
  try {
    const { full_name, phone, address, location } = req.body;
    // accept either `address` or `location` from the client (Settings UI uses "location")
    const addr = address ?? location ?? null;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }
    await db.query(
      `UPDATE users SET full_name = ?, phone = ?, address = ?, updated_at = NOW() WHERE user_id = ?`,
      [full_name.trim(), phone || null, addr, req.user.user_id]
    );
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'profile_updated', 'User updated their profile', ?, 'success')`,
      [req.user.user_id, req.ip]
    ).catch(() => {});

    // Return the updated user so the client can refresh AuthContext + localStorage
    // (bio lives in user_settings — the client fetches it via /api/settings)
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, role, phone, address FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    res.json({ message: 'Profile updated successfully!', user: rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed: ' + err.message });
  }
});

// ── FARM DETAILS / PREFERENCES ─────────────────────────────
// These are handled by the dedicated /api/settings router
// (server/routes/settings.js). Don't duplicate them here.

// ── CHANGE PASSWORD ────────────────────────────────────────
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Both fields are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    const [rows] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [req.user.user_id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?', [newHash, req.user.user_id]);
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?, ?, ?, ?, 'success')`,
      [req.user.user_id, 'password_changed', 'User changed their password', req.ip]
    ).catch(() => {});
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed: ' + err.message });
  }
});

// ── FORGOT PASSWORD ────────────────────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid email address.' });

  const { email } = req.body;
  try {
    const [users] = await db.query(
      'SELECT user_id, full_name, email FROM users WHERE email = ? AND is_active = 1',
      [email]
    );
    if (!users.length) {
      return res.json({ message: 'If an account exists, a reset code has been sent.' });
    }
    const user = users[0];
    const resetCode    = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await db.query(
      `UPDATE users SET verification_token = ?, verification_expires = ? WHERE user_id = ?`,
      [resetCode, resetExpires, user.user_id]
    );
    await sendPasswordResetEmail(user.email, user.full_name, resetCode)
      .catch(e => console.log('Reset email error:', e.message));
    await logActivity(user.user_id, 'password_reset_requested', `Reset code sent to ${email}`, req).catch(() => {});
    res.json({ message: 'Reset code sent! Check your email.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Failed to send reset code. Please try again.' });
  }
});

// ── VERIFY RESET CODE ──────────────────────────────────────
router.post('/verify-reset-code', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min:6, max:6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input.' });

  const { email, code } = req.body;
  try {
    const [users] = await db.query(
      `SELECT user_id FROM users WHERE email = ? AND verification_token = ? AND verification_expires > NOW()`,
      [email, code]
    );
    if (!users.length) {
      return res.status(400).json({ message: 'Invalid or expired code. Please request a new one.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    await db.query(
      `UPDATE users SET verification_token = ?, verification_expires = ? WHERE user_id = ?`,
      [resetToken, new Date(Date.now() + 10 * 60 * 1000), users[0].user_id]
    );
    res.json({ resetToken, message: 'Code verified! You can now set a new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// ── RESET PASSWORD ─────────────────────────────────────────
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('resetToken').notEmpty(),
  body('newPassword').isLength({ min:6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input.' });

  const { email, resetToken, newPassword } = req.body;
  try {
    const [users] = await db.query(
      `SELECT user_id FROM users WHERE email = ? AND verification_token = ? AND verification_expires > NOW()`,
      [email, resetToken]
    );
    if (!users.length) {
      return res.status(400).json({ message: 'Reset link expired. Please start again.' });
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query(
      `UPDATE users SET password_hash = ?, verification_token = NULL, verification_expires = NULL, updated_at = NOW() WHERE user_id = ?`,
      [newHash, users[0].user_id]
    );
    await logActivity(users[0].user_id, 'password_reset_completed', `Password reset via email code`, req).catch(() => {});
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
});

// ── SECURITY STATUS ────────────────────────────────────────
// Returns the real state of the security cards shown in Settings → Security.
// Computed live from `users` + `activity_logs` — no hard-coded values.
router.get('/security-status', protect, async (req, res) => {
  try {
    const [[u]] = await db.query(
      `SELECT is_verified, password_hash, created_at, updated_at
         FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (!u) return res.status(404).json({ message: 'User not found.' });

    // Last password change = most recent password_changed / password_reset_completed event.
    // Falls back to account creation if the password has never been changed.
    const [pwRows] = await db.query(
      `SELECT created_at FROM activity_logs
        WHERE user_id = ?
          AND action IN ('password_changed', 'password_reset_completed')
        ORDER BY created_at DESC LIMIT 1`,
      [req.user.user_id]
    );
    const passwordLastChanged = pwRows[0]?.created_at || u.created_at;
    const daysSince = Math.floor(
      (Date.now() - new Date(passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24)
    );

    // "Login alerts" = at least one login_success has been logged with user_agent
    // (the security middleware records device/IP on every successful login).
    const [[alerts]] = await db.query(
      `SELECT COUNT(*) AS n FROM activity_logs
        WHERE user_id = ? AND action = 'login_success'`,
      [req.user.user_id]
    );

    // 2FA — the schema doesn't have a column for it yet, so report false
    // (matches reality: the feature isn't implemented). When you add a
    // `two_factor_enabled` column to users, swap this line out.
    const twoFactorEnabled = false;

    res.json({
      email_verified:         !!u.is_verified,
      password_last_changed:  passwordLastChanged,
      password_age_days:      daysSince,
      two_factor_enabled:     twoFactorEnabled,
      login_alerts_enabled:   alerts.n > 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load security status: ' + err.message });
  }
});

// ── ACTIVE SESSIONS ────────────────────────────────────────
// Derived from `activity_logs`: each unique (user_agent, ip_address) pair that
// has a recent successful login is treated as one session. The most recent one
// for the current request's user-agent is flagged as the current session.
router.get('/sessions', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_agent, ip_address, MAX(created_at) AS last_seen
         FROM activity_logs
        WHERE user_id = ?
          AND action = 'login_success'
          AND created_at > (NOW() - INTERVAL 30 DAY)
        GROUP BY user_agent, ip_address
        ORDER BY last_seen DESC
        LIMIT 10`,
      [req.user.user_id]
    );

    // Pull revoked sessions so we can hide them
    const [revoked] = await db.query(
      `SELECT description FROM activity_logs
        WHERE user_id = ? AND action = 'session_revoked'`,
      [req.user.user_id]
    );
    const revokedKeys = new Set(revoked.map(r => r.description));

    const currentUA = req.headers['user-agent'] || '';

    // Tiny user-agent parser — good enough for a friendly label.
    const labelFor = (ua = '') => {
      const s = String(ua);
      let device = '💻 Desktop';
      if (/iPhone/i.test(s))      device = '📱 iPhone';
      else if (/iPad/i.test(s))   device = '📱 iPad';
      else if (/Android/i.test(s))device = '📱 Android';
      else if (/Macintosh/i.test(s)) device = '💻 MacBook';
      else if (/Windows/i.test(s))   device = '💻 Windows PC';
      else if (/Linux/i.test(s))     device = '💻 Linux';
      let browser = '';
      if (/Edg\//i.test(s))         browser = ' · Edge';
      else if (/Chrome\//i.test(s)) browser = ' · Chrome';
      else if (/Firefox\//i.test(s))browser = ' · Firefox';
      else if (/Safari\//i.test(s) && !/Chrome/i.test(s)) browser = ' · Safari';
      return device + browser;
    };

    const sessions = rows
      .map(r => {
        const key = `${r.user_agent || ''}|${r.ip_address || ''}`;
        return {
          id:         Buffer.from(key).toString('base64').slice(0, 32),
          key,
          device:     labelFor(r.user_agent),
          user_agent: r.user_agent,
          ip_address: r.ip_address,
          last_seen:  r.last_seen,
          is_current: r.user_agent === currentUA, // best-effort match
        };
      })
      .filter(s => !revokedKeys.has(s.key));

    // If nothing matched currentUA, mark the most recent one as current
    if (sessions.length && !sessions.some(s => s.is_current)) {
      sessions[0].is_current = true;
    }

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load sessions: ' + err.message });
  }
});

// ── REVOKE SESSION ─────────────────────────────────────────
// Logs a session_revoked event so the entry is hidden from /sessions.
// Note: real token-level revocation would need a token blacklist or shorter-
// lived JWTs + refresh tokens. This endpoint is honest about what it does:
// it removes the session from the visible list and audit-logs the action.
router.post('/sessions/revoke', protect, async (req, res) => {
  try {
    const { key } = req.body || {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ message: 'Session key is required.' });
    }
    // Prevent revoking the current session via this endpoint
    const currentKey = `${req.headers['user-agent'] || ''}|${req.ip}`;
    if (key === currentKey) {
      return res.status(400).json({ message: 'You cannot revoke your current session here. Use Logout instead.' });
    }
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'session_revoked', ?, ?, 'success')`,
      [req.user.user_id, key, req.ip]
    );
    res.json({ message: 'Session revoked.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke session: ' + err.message });
  }
});

// ── VERIFY PAGE HTML ───────────────────────────────────────
function verifyPage(success, nameOrMsg) {
  const color   = success ? '#2E7D32' : '#C62828';
  const icon    = success ? '✅' : '❌';
  const title   = success ? `Welcome, ${nameOrMsg}!` : 'Verification Failed';
  const message = success
    ? 'Your email has been verified. You can now login to FarmMarket!'
    : nameOrMsg;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title} — FarmMarket</title>
<style>
body{margin:0;font-family:Arial,sans-serif;background:#f8faf5;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.card{background:#fff;border-radius:20px;padding:48px 40px;text-align:center;max-width:440px;box-shadow:0 8px 32px rgba(0,0,0,0.10);}
.icon{font-size:64px;margin-bottom:20px;}
h1{color:${color};font-size:24px;margin:0 0 12px;}
p{color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;}
a{display:inline-block;background:${color};color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;}
.logo{font-size:20px;font-weight:bold;color:#2E7D32;margin-bottom:24px;}
</style>
</head>
<body>
<div class="card">
  <div class="logo">🌿 FarmMarket</div>
  <div class="icon">${icon}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a href="${clientUrl}/${success ? 'login' : 'register'}">
    ${success ? 'Login to FarmMarket →' : 'Back to Register →'}
  </a>
</div>
</body>
</html>`;
}

module.exports = router;
