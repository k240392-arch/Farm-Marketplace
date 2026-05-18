// middleware/security.js
// Activity logging + attack detection + IP blocking
// Author: CPRO306 Capstone Project | Date: 2026

const db = require('../config/db');
const loginAttempts = new Map();

const getIP = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

// These IPs are NEVER blocked (localhost development)
const WHITELISTED = ['::1', '127.0.0.1', 'localhost', '::ffff:127.0.0.1'];

const isWhitelisted = (ip) => WHITELISTED.includes(ip);

// ── LOG ACTIVITY ───────────────────────────────────────────
const logActivity = async (userId, action, description, req, status = 'success') => {
  try {
    await db.query(
      `INSERT INTO activity_logs
        (user_id, action, description, ip_address, user_agent, status)
       VALUES (?,?,?,?,?,?)`,
      [
        userId || null,
        action,
        description,
        getIP(req),
        req.headers['user-agent']?.substring(0, 500) || null,
        status
      ]
    );
  } catch (err) { /* silent fail */ }
};

// ── LOG SECURITY EVENT ─────────────────────────────────────
const logSecurityEvent = async (eventType, severity, req, description, userId = null, block = false) => {
  const ip = getIP(req);

  // Never block whitelisted IPs
  if (isWhitelisted(ip)) block = false;

  try {
    await db.query(
      `INSERT INTO security_events
        (event_type, severity, ip_address, user_id, description, is_blocked)
       VALUES (?,?,?,?,?,?)`,
      [eventType, severity, ip, userId || null, description, block ? 1 : 0]
    );

    if (block) {
      await db.query(
        `INSERT INTO blocked_ips (ip_address, reason, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
         ON DUPLICATE KEY UPDATE reason = VALUES(reason), expires_at = VALUES(expires_at)`,
        [ip, description]
      );
      console.warn(`🚫 IP BLOCKED: ${ip} — ${description}`);
    }

    if (severity === 'high' || severity === 'critical') {
      console.warn(`⚠️  SECURITY [${severity.toUpperCase()}]: ${eventType} — ${description}`);
    }
  } catch (err) { /* silent fail */ }
};

// ── BRUTE FORCE PROTECTION ─────────────────────────────────
const checkBruteForce = async (req, res, next) => {
  const ip = getIP(req);

  // NEVER block localhost/development IPs
  if (isWhitelisted(ip)) {
    req.trackLoginResult = async () => {};
    return next();
  }

  const now     = Date.now();
  const WINDOW  = 15 * 60 * 1000;
  const MAX_FAIL = 10;

  // Check database for blocked IP
  try {
    const [blocked] = await db.query(
      `SELECT id FROM blocked_ips
       WHERE ip_address = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [ip]
    );
    if (blocked.length > 0) {
      await logSecurityEvent('blocked_ip_attempt', 'high', req, 'Request from blocked IP');
      return res.status(429).json({
        message: '🚫 Too many failed attempts. Try again in 1 hour.'
      });
    }
  } catch (err) { /* allow through if DB check fails */ }

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { count: 0, firstAttempt: now });
  }
  const attempts = loginAttempts.get(ip);
  if (now - attempts.firstAttempt > WINDOW) {
    loginAttempts.set(ip, { count: 0, firstAttempt: now });
  }

  req.trackLoginResult = async (success) => {
    if (success) {
      loginAttempts.delete(ip);
    } else {
      attempts.count++;
      if (attempts.count >= MAX_FAIL) {
        await logSecurityEvent('brute_force_detected', 'critical', req,
          `${attempts.count} failed attempts`, null, true);
      } else if (attempts.count >= 5) {
        await logSecurityEvent('multiple_failed_logins', 'medium', req,
          `${attempts.count} failed attempts`);
      }
    }
  };

  next();
};

// ── SQL INJECTION DETECTION ─────────────────────────────────
const detectSQLInjection = async (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  if (!req.body || Object.keys(req.body).length === 0) return next();

  const patterns = [
    /(\bDROP\s+TABLE\b|\bDROP\s+DATABASE\b)/i,
    /(\bUNION\s+SELECT\b|\bUNION\s+ALL\s+SELECT\b)/i,
    /(';|';\s*--|\bOR\b\s+'1'\s*=\s*'1')/i,
    /(\bEXEC\s*\(|\bEXECUTE\s*\(|xp_cmdshell)/i,
  ];

  const check = (val) => typeof val === 'string' && patterns.some(p => p.test(val));
  const scan  = (obj, d = 0) => d > 3 ? false : Object.values(obj || {}).some(v =>
    typeof v === 'string' ? check(v) : typeof v === 'object' && v ? scan(v, d + 1) : false
  );

  if (scan(req.body)) {
    await logSecurityEvent('sql_injection_attempt', 'critical', req,
      `SQL injection in ${req.method} ${req.path}`, req.user?.user_id, !isWhitelisted(getIP(req)));
    return res.status(400).json({ message: '🚫 Invalid input detected.' });
  }
  next();
};

// ── XSS DETECTION ──────────────────────────────────────────
const detectXSS = async (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  if (!req.body || Object.keys(req.body).length === 0) return next();

  const patterns = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /javascript\s*:/gi,
    /on(load|click|error|mouseover|submit|focus)\s*=/gi,
    /<iframe[\s\S]*?>/gi,
  ];

  const check = (val) => typeof val === 'string' && patterns.some(p => p.test(val));
  const scan  = (obj, d = 0) => d > 3 ? false : Object.values(obj || {}).some(v =>
    typeof v === 'string' ? check(v) : typeof v === 'object' && v ? scan(v, d + 1) : false
  );

  if (scan(req.body)) {
    await logSecurityEvent('xss_attempt', 'high', req,
      `XSS attempt in ${req.method} ${req.path}`, req.user?.user_id);
    return res.status(400).json({ message: '🚫 Invalid input detected.' });
  }
  next();
};

// ── ACTIVITY LOGGER ────────────────────────────────────────
const activityLogger = (action, getDesc) => async (req, res, next) => {
  const orig = res.json.bind(res);
  res.json = (data) => {
    const desc = typeof getDesc === 'function' ? getDesc(req, data) : getDesc;
    logActivity(req.user?.user_id || null, action, desc, req,
      res.statusCode < 400 ? 'success' : 'failed').catch(() => {});
    return orig(data);
  };
  next();
};

module.exports = {
  logActivity, logSecurityEvent,
  checkBruteForce, detectSQLInjection, detectXSS,
  activityLogger, getIP
};