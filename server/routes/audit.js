// server/routes/audit.js
// FR-10, FR-45-48: Audit trail and admin monitoring
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── GET /api/audit/logs  ─ Admin: all activity logs
// Query params: page, limit, user_id, action, status, role, search, from, to
//   • role     — 'farmer' | 'buyer' | 'admin' | 'system' (system = user_id IS NULL)
//   • search   — free text matched against user name/email + action + description
router.get('/logs', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action, status, role, search, from, to } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (user_id) { where += ' AND al.user_id = ?'; params.push(user_id); }
    if (action)  { where += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (status)  { where += ' AND al.status = ?'; params.push(status); }
    if (from)    { where += ' AND al.created_at >= ?'; params.push(from); }
    if (to)      { where += ' AND al.created_at <= ?'; params.push(to + ' 23:59:59'); }
    if (role) {
      if (role === 'system') {
        where += ' AND al.user_id IS NULL';
      } else {
        where += ' AND u.role = ?';
        params.push(role);
      }
    }
    if (search) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR al.action LIKE ? OR al.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const [logs] = await db.query(`
      SELECT al.*, u.full_name, u.email, u.role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.user_id
         ${where}`, params
    );

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/audit/user/:userId  ─ User's own audit trail (or admin)
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.user_id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const [logs] = await db.query(`
      SELECT * FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 100
    `, [userId]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/audit/stats  ─ Admin: audit statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*) AS total_events,
        SUM(status = 'success') AS successful,
        SUM(status = 'failed') AS failed,
        SUM(status = 'blocked') AS blocked,
        COUNT(DISTINCT user_id) AS unique_users,
        COUNT(DISTINCT ip_address) AS unique_ips
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    const [topActions] = await db.query(`
      SELECT action, COUNT(*) AS count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY action ORDER BY count DESC LIMIT 10
    `);

    const [dailyActivity] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS events
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({ totals, topActions, dailyActivity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;