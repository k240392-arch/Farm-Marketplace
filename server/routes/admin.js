// routes/admin.js
// Admin-only management routes

const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require login + admin role
router.use(protect, adminOnly);

// ── DASHBOARD STATS ────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [[users]]    = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[listings]] = await db.query('SELECT COUNT(*) AS total FROM listings WHERE is_active=1');
    const [[orders]]   = await db.query('SELECT COUNT(*) AS total FROM orders');
    const [[revenue]]  = await db.query('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status != "cancelled"');
    const [[farmers]]  = await db.query('SELECT COUNT(*) AS total FROM users WHERE role="farmer" AND is_active=1');
    const [latestOrders] = await db.query(`
      SELECT o.order_id, o.created_at, o.items_summary, o.total_amount,
             u.full_name as buyer_name
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.user_id
      ORDER BY o.created_at DESC LIMIT 1
    `);
    const latestOrder = latestOrders[0] || null;

    res.json({
      total_users:     users.total,
      active_listings: listings.total,
      total_orders:    orders.total,
      total_revenue:   revenue.total,
      farmers_online:  farmers.total,
      latestOrder
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats.' });
  }
});

// ── ALL USERS ──────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

// ── SUSPEND / ACTIVATE USER ────────────────────────────────
// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res) => {
  const { is_active } = req.body;
  try {
    await db.query('UPDATE users SET is_active = ? WHERE user_id = ?', [is_active, req.params.id]);
    res.json({ message: `User ${is_active ? 'activated' : 'suspended'}.` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user status.' });
  }
});

// ── BULK DEACTIVATE ORPHANED LISTINGS ─────────────────────
// POST /api/admin/listings/bulk-deactivate-orphaned
router.post('/listings/bulk-deactivate-orphaned', async (req, res) => {
  try {
    // Deactivate out-of-stock listings that belong to deleted/suspended farmers
    const [result] = await db.query(`
      UPDATE listings l
      JOIN users u ON l.farmer_id = u.user_id
      SET l.is_active = 0
      WHERE l.quantity <= 0
      AND (u.is_active = 0 OR u.full_name = 'Deleted User')
    `);
    res.json({
      message: result.affectedRows + ' orphaned out-of-stock listings deactivated.',
      count: result.affectedRows
    });
  } catch (err) {
    console.error('Bulk deactivate error:', err);
    res.status(500).json({ message: 'Failed to deactivate orphaned listings.' });
  }
});

// ── ALL LISTINGS (for moderation) ─────────────────────────
// GET /api/admin/listings
router.get('/listings', async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    let query = `
      SELECT l.*, u.full_name AS farmer_name, u.is_active AS farmer_active,
             c.name AS category_name,
             COALESCE(AVG(r.rating),0) AS avg_rating
      FROM listings l
      JOIN users u ON l.farmer_id = u.user_id
      JOIN categories c ON l.category_id = c.category_id
      LEFT JOIN reviews r ON l.listing_id = r.listing_id
      WHERE 1=1
    `;
    const params = [];
    if (search) { query += ' AND l.title LIKE ?'; params.push(`%${search}%`); }
    if (status === 'active')         { query += ' AND l.is_active = 1'; }
    if (status === 'inactive')       { query += ' AND l.is_active = 0'; }
    if (status === 'out_of_stock')   { query += ' AND l.quantity <= 0'; }
    if (status === 'deleted_farmer') { query += ' AND (u.is_active = 0 OR u.full_name = "Deleted User")'; }
    query += ' GROUP BY l.listing_id ORDER BY l.quantity ASC, l.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings.' });
  }
});

// ── ALL ORDERS ─────────────────────────────────────────────
// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.full_name AS buyer_name
      FROM orders o JOIN users u ON o.buyer_id = u.user_id
      ORDER BY o.created_at DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders.' });
  }
});

module.exports = router;