// server.js — Farm Produce Marketplace Backend
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { detectSQLInjection, detectXSS, logActivity } = require('./middleware/security');

const app  = express();
const PORT = process.env.PORT || 5001;

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ── CORE MIDDLEWARE ────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const passport = require('./config/passport');
app.use(passport.initialize());

// ── SECURITY MIDDLEWARE ────────────────────────────────────
app.use(detectSQLInjection);
app.use(detectXSS);

app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    // Colour-tag status: 2xx green-ish, 4xx yellow, 5xx red — readable in plain console too
    const code = res.statusCode;
    const tag  = code >= 500 ? '🔴' : code >= 400 ? '🟡' : '🟢';
    console.log(`[${new Date().toLocaleTimeString()}] ${tag} ${code} ${req.method} ${req.path} (${ms}ms)`);
  });
  next();
});

// ── API ROUTES ─────────────────────────────────────────────
app.use('/api/auth',                 require('./routes/auth'));
app.use('/api/settings',             require('./routes/settings'));
app.use('/api/listings/:id/reviews', require('./routes/reviews'));  // nested — MUST be before /listings
app.use('/api/listings',             require('./routes/listings'));
app.use('/api/reviews',              require('./routes/reviews'));   // standalone for /my, /farmer/received
app.use('/api/orders',               require('./routes/orders'));
app.use('/api/ai',                   require('./routes/ai'));
app.use('/api/payments',             require('./routes/payments'));  // only ONCE
app.use('/api/invoices',             require('./routes/invoices'));
app.use('/api/audit',                require('./routes/audit'));
app.use('/api/admin',                require('./routes/admin_enhanced'));
app.use('/api/products',             require('./routes/products'));
app.use('/api/farmers',              require('./routes/farmers'));
app.use('/api',                      require('./routes/userHistory'));

// ── CATEGORIES ─────────────────────────────────────────────
const db = require('./config/db');
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories.' });
  }
});

// ── SECURITY DASHBOARD ROUTES (admin only) ─────────────────
const { protect, adminOnly } = require('./middleware/authMiddleware');

app.get('/api/security/logs', protect, adminOnly, async (req, res) => {
  try {
    const { limit = 50, action, status } = req.query;
    let query = `SELECT al.*, u.full_name, u.email, u.role
      FROM activity_logs al LEFT JOIN users u ON al.user_id = u.user_id WHERE 1=1`;
    const params = [];
    if (action) { query += ' AND al.action = ?'; params.push(action); }
    if (status) { query += ' AND al.status = ?'; params.push(status); }
    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs.' });
  }
});

app.get('/api/security/events', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT se.*, u.full_name, u.email FROM security_events se
      LEFT JOIN users u ON se.user_id = u.user_id
      ORDER BY se.created_at DESC LIMIT 100`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching security events.' });
  }
});

app.get('/api/security/blocked-ips', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM blocked_ips ORDER BY blocked_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching blocked IPs.' });
  }
});

// keep old route name too for compatibility
app.get('/api/security/blocked', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM blocked_ips ORDER BY blocked_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching blocked IPs.' });
  }
});

app.delete('/api/security/blocked/:ip', protect, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM blocked_ips WHERE ip_address = ?', [req.params.ip]);
    await logActivity(req.user.user_id, 'unblock_ip', `Unblocked IP: ${req.params.ip}`, req);
    res.json({ message: `IP ${req.params.ip} unblocked.` });
  } catch (err) {
    res.status(500).json({ message: 'Error unblocking IP.' });
  }
});

app.get('/api/security/stats', protect, adminOnly, async (req, res) => {
  try {
    const [[totalLogins]]    = await db.query("SELECT COUNT(*) AS n FROM activity_logs WHERE action='login_success'");
    const [[failedLogins]]   = await db.query("SELECT COUNT(*) AS n FROM activity_logs WHERE action='login_failed' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    const [[blockedIPs]]     = await db.query("SELECT COUNT(*) AS n FROM blocked_ips WHERE expires_at > NOW() OR expires_at IS NULL");
    const [[sqlAttempts]]    = await db.query("SELECT COUNT(*) AS n FROM security_events WHERE event_type='sql_injection_attempt'");
    const [[xssAttempts]]    = await db.query("SELECT COUNT(*) AS n FROM security_events WHERE event_type='xss_attempt'");
    const [[criticalEvents]] = await db.query("SELECT COUNT(*) AS n FROM security_events WHERE severity IN ('high','critical') AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    const [recentLogins]     = await db.query(`
      SELECT al.created_at, al.ip_address, al.status, u.full_name, u.email, u.role
      FROM activity_logs al LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.action IN ('login_success','login_failed')
      ORDER BY al.created_at DESC LIMIT 10`);
    res.json({ total_logins: totalLogins.n, failed_logins_24h: failedLogins.n,
      blocked_ips: blockedIPs.n, sql_attempts: sqlAttempts.n,
      xss_attempts: xssAttempts.n, critical_events_24h: criticalEvents.n,
      recent_logins: recentLogins });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching security stats.' });
  }
});

// ── HEALTH CHECK ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Farm Marketplace API running!', time: new Date() });
});

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found.` }));
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Server error.' });
});

// REPLACE with this — kills any existing process on the port first:
const server = app.listen(PORT, () => {
  console.log(`\n🌿 Farm Produce Marketplace API`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security monitoring active`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} busy — retrying in 1 second...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 1000);
  }
});