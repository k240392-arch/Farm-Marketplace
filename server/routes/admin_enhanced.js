// server/routes/admin_enhanced.js
// FR-09, FR-18, FR-45-51: Enhanced admin management
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ══ USER MANAGEMENT ══════════════════════════════════

// GET /api/admin/users  — all users with stats
// By default, anonymised users (email like 'deleted_*@removed.com') are hidden.
// Pass ?show_archived=1 to include them.
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status, show_archived } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (role)   { where += ' AND u.role = ?'; params.push(role); }
    if (status) { where += ' AND u.is_active = ?'; params.push(status === 'active' ? 1 : 0); }
    if (search) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    // Hide anonymised users unless explicitly requested.
    if (show_archived !== '1' && show_archived !== 'true') {
      where += " AND u.email NOT REGEXP '^deleted_[0-9]+@removed\\\\.com$'";
    }

    const [users] = await db.query(`
      SELECT u.*,
        COUNT(DISTINCT l.listing_id) AS listing_count,
        COUNT(DISTINCT o.order_id)   AS order_count,
        COALESCE(SUM(o.total_amount),0) AS total_spent
      FROM users u
      LEFT JOIN listings l ON l.farmer_id = u.user_id
      LEFT JOIN orders o   ON o.buyer_id  = u.user_id
      ${where}
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`, params
    );

    // Remove hashes
    users.forEach(u => delete u.password_hash);
    res.json({ users, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users/:id  — single user full profile
router.get('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.*,
        COUNT(DISTINCT l.listing_id) AS listings,
        COUNT(DISTINCT o.order_id) AS orders,
        COALESCE(SUM(o.total_amount),0) AS total_spent,
        COUNT(DISTINCT r.review_id) AS reviews_given
      FROM users u
      LEFT JOIN listings l ON l.farmer_id = u.user_id
      LEFT JOIN orders o   ON o.buyer_id  = u.user_id
      LEFT JOIN reviews r  ON r.buyer_id  = u.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `, [req.params.id]);

    if (!users.length) return res.status(404).json({ message: 'User not found' });
    const user = users[0];
    delete user.password_hash;

    // Recent activity
    const [activity] = await db.query(`
      SELECT action, status, ip_address, created_at
      FROM activity_logs WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 20
    `, [req.params.id]);

    // Recent orders
    const [orders] = await db.query(`
      SELECT order_id, total_amount, status, created_at
      FROM orders WHERE buyer_id = ?
      ORDER BY created_at DESC LIMIT 10
    `, [req.params.id]);

    res.json({ user, activity, orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    await db.query(
      'UPDATE users SET is_active = 0 WHERE user_id = ?',
      [req.params.id]
    );
    await db.query(`INSERT INTO activity_logs (user_id, action, description, ip_address, status)
      VALUES (?, 'admin_suspend_user', ?, ?, 'success')`,
      [req.user.user_id, `Admin suspended user #${req.params.id}: ${reason}`, req.ip]);
    res.json({ message: 'User suspended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/activate
router.patch('/users/:id/activate', protect, adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = 1 WHERE user_id = ?', [req.params.id]);
    await db.query(`INSERT INTO activity_logs (user_id, action, description, ip_address, status)
      VALUES (?, 'admin_activate_user', ?, ?, 'success')`,
      [req.user.user_id, `Admin activated user #${req.params.id}`, req.ip]);
    res.json({ message: 'User activated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══ COMPLIANCE / DATA HANDLING ════════════════════════

// GET /api/admin/compliance/export/:userId  — export user data (GDPR)
router.get('/compliance/export/:userId', protect, adminOnly, async (req, res) => {
  try {
    const uid = req.params.userId;
    const [[user]] = await db.query('SELECT * FROM users WHERE user_id = ?', [uid]);
    delete user?.password_hash;
    const [orders]   = await db.query('SELECT * FROM orders WHERE buyer_id = ?', [uid]);
    const [listings] = await db.query('SELECT * FROM listings WHERE farmer_id = ?', [uid]);
    const [reviews]  = await db.query('SELECT * FROM reviews WHERE buyer_id = ?', [uid]);
    const [logs]     = await db.query('SELECT action, status, created_at FROM activity_logs WHERE user_id = ? LIMIT 500', [uid]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user, orders, listings, reviews,
      activity_logs: logs
    };

    await db.query(`INSERT INTO activity_logs (user_id, action, description, ip_address, status)
      VALUES (?, 'compliance_data_export', ?, ?, 'success')`,
      [req.user.user_id, `Data export for user #${uid}`, req.ip]);

    res.setHeader('Content-Disposition', `attachment; filename="user-data-${uid}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/compliance/delete/:userId  — right to erasure
router.delete('/compliance/delete/:userId', protect, adminOnly, async (req, res) => {
  try {
    const uid = req.params.userId;
    // Anonymise instead of hard delete (preserve referential integrity)
    await db.query(`
      UPDATE users SET
        full_name = 'Deleted User',
        email = CONCAT('deleted_', user_id, '@removed.com'),
        password_hash = 'DELETED',
        phone = NULL,
        profile_image = NULL,
        is_active = 0,
        is_verified = 0
      WHERE user_id = ?
    `, [uid]);

    await db.query(`INSERT INTO activity_logs (user_id, action, description, ip_address, status)
      VALUES (?, 'compliance_user_deleted', ?, ?, 'success')`,
      [req.user.user_id, `User #${uid} data anonymised per privacy request`, req.ip]);

    res.json({ message: 'User data anonymised successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id/permanent  — HARD delete a user (and cascade their data)
// Strategy:
//   1. Refuse to delete other admins or self (safety).
//   2. Detect referential blockers BEFORE attempting delete, so we can give a
//      specific, actionable message instead of a generic FK error.
//   3. Try a full DELETE inside a transaction. Schema cascades will remove their
//      listings, cart_items, wishlist, reviews, etc.
//   4. If anything is still referenced (orders.buyer_id is ON DELETE RESTRICT,
//      order_items.listing_id is RESTRICT), fall back to anonymising — but only
//      if the user isn't already anonymised. If they are, just tell the admin.
router.delete('/users/:id/permanent', protect, adminOnly, async (req, res) => {
  const uid = req.params.id;

  if (Number(uid) === Number(req.user.user_id)) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[user]] = await conn.query(
      'SELECT user_id, full_name, email, role FROM users WHERE user_id = ?', [uid]
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role === 'admin') {
      await conn.rollback();
      return res.status(403).json({ message: 'Cannot permanently delete another admin account.' });
    }

    // Was this user already anonymised by a previous delete attempt?
    const alreadyAnonymised = /^deleted_\d+@removed\.com$/i.test(user.email || '');

    // Inspect referential blockers up-front so we can explain why a hard delete fails:
    //   • buyer_orders     — orders placed BY this user (orders.buyer_id RESTRICT)
    //   • items_referencing_their_listings — order_items pointing to their listings
    //     (order_items.listing_id RESTRICT). This blocks farmer deletion even when
    //     the farmer themselves placed no orders.
    const [[{ buyer_orders }]] = await conn.query(
      'SELECT COUNT(*) AS buyer_orders FROM orders WHERE buyer_id = ?', [uid]
    );
    const [[{ items_referencing_their_listings }]] = await conn.query(
      `SELECT COUNT(*) AS items_referencing_their_listings
       FROM order_items oi
       JOIN listings l ON l.listing_id = oi.listing_id
       WHERE l.farmer_id = ?`, [uid]
    );

    const blockers = [];
    if (buyer_orders > 0) blockers.push(`${buyer_orders} order(s) they placed as a buyer`);
    if (items_referencing_their_listings > 0) {
      blockers.push(`${items_referencing_their_listings} order item(s) referencing their listings (sold to other buyers)`);
    }

    // Attempt hard delete. Cascade handles listings/cart/wishlist/reviews when
    // there's nothing protecting them.
    try {
      await conn.query('DELETE FROM users WHERE user_id = ?', [uid]);
      await conn.commit();

      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
         VALUES (?, 'admin_user_hard_deleted', ?, ?, 'success')`,
        [req.user.user_id, `Permanently deleted user #${uid} (${user.email}, role: ${user.role})`, req.ip]
      ).catch(() => {});

      return res.json({
        message: `User "${user.full_name}" permanently deleted.`,
        mode: 'hard_delete'
      });
    } catch (delErr) {
      await conn.rollback();
      const isFkErr = delErr.code === 'ER_ROW_IS_REFERENCED_2' || delErr.code === 'ER_ROW_IS_REFERENCED';
      if (!isFkErr) throw delErr;

      // FK blocked the delete. Branch on whether the user is already anonymised.
      if (alreadyAnonymised) {
        // Nothing more we can do — record is already scrubbed and audit history is locked.
        // Tell the admin and let the frontend hide the row from view.
        await db.query(
          `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
           VALUES (?, 'admin_user_delete_blocked', ?, ?, 'success')`,
          [req.user.user_id, `Cannot hard-delete already-anonymised user #${uid}: ${blockers.join('; ') || 'FK constraint'}`, req.ip]
        ).catch(() => {});

        return res.json({
          message:
            `User #${uid} is already anonymised but cannot be fully removed because ` +
            `${blockers.join(' and ')}. ` +
            `These records are kept for audit/accounting and cannot be deleted. ` +
            `The user has been hidden from your active users list.`,
          mode: 'already_anonymised',
          blockers
        });
      }

      // First-time delete attempt blocked by FK → anonymise + deactivate listings.
      await conn.query(`
        UPDATE users SET
          full_name     = 'Deleted User',
          email         = CONCAT('deleted_', user_id, '@removed.com'),
          password_hash = 'DELETED',
          phone         = NULL,
          profile_image = NULL,
          is_active     = 0,
          is_verified   = 0
        WHERE user_id = ?
      `, [uid]);
      await conn.query('UPDATE listings SET is_active = 0 WHERE farmer_id = ?', [uid]);

      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
         VALUES (?, 'admin_user_anonymised', ?, ?, 'success')`,
        [req.user.user_id,
         `Hard delete of user #${uid} blocked by: ${blockers.join('; ')}. Anonymised + listings deactivated.`,
         req.ip]
      ).catch(() => {});

      const reason = blockers.length
        ? blockers.join(' and ')
        : 'referenced records that must be kept for audit';

      return res.json({
        message:
          `Cannot fully delete "${user.full_name}" because of ${reason}. ` +
          `Their personal details have been anonymised, all their listings deactivated, ` +
          `and the account has been removed from your active users list.`,
        mode: 'anonymised_fallback',
        blockers
      });
    }
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('Permanent delete error:', err);
    res.status(500).json({ message: 'Error deleting user: ' + err.message });
  } finally {
    conn.release();
  }
});


// ══ AI USAGE LOGS ════════════════════════════════════

// ── PAYOUTS / COMMISSION ─────────────────────────────────
// GET /api/admin/payouts?status=pending&farmer_id=3
router.get('/payouts', protect, adminOnly, async (req, res) => {
  try {
    const { status, farmer_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status)    { where += ' AND fp.status = ?';    params.push(status); }
    if (farmer_id) { where += ' AND fp.farmer_id = ?'; params.push(farmer_id); }

    const [rows] = await db.query(`
      SELECT fp.*,
             u.full_name AS farmer_name, u.email AS farmer_email,
             o.created_at AS order_created_at, o.status AS order_status,
             buyer.full_name AS buyer_name
        FROM farmer_payouts fp
        JOIN users u ON u.user_id = fp.farmer_id
        JOIN orders o ON o.order_id = fp.order_id
        JOIN users buyer ON buyer.user_id = o.buyer_id
        ${where}
        ORDER BY fp.created_at DESC
        LIMIT 200
    `, params);

    // Aggregate totals
    const [[totals]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status='pending' THEN net_amount END),0)     AS pending_total,
        COALESCE(SUM(CASE WHEN status='paid'    THEN net_amount END),0)     AS paid_total,
        COALESCE(SUM(commission_amount),0)                                  AS commission_total,
        COUNT(CASE WHEN status='pending' THEN 1 END)                        AS pending_count,
        COUNT(CASE WHEN status='paid'    THEN 1 END)                        AS paid_count
      FROM farmer_payouts
    `);

    res.json({ payouts: rows, totals });
  } catch (err) {
    console.error('GET /admin/payouts error:', err);
    res.status(500).json({ message: 'Error fetching payouts.' });
  }
});

// PATCH /api/admin/payouts/:id/mark-paid
//   body: { payment_reference?: string, notes?: string }
router.patch('/payouts/:id/mark-paid', protect, adminOnly, async (req, res) => {
  try {
    const { payment_reference, notes } = req.body || {};
    const [result] = await db.query(
      `UPDATE farmer_payouts
         SET status = 'paid',
             paid_at = NOW(),
             paid_by = ?,
             payment_reference = ?,
             notes = ?
       WHERE payout_id = ? AND status = 'pending'`,
      [req.user.user_id, payment_reference || null, notes || null, req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(400).json({ message: 'Payout not found or already paid/cancelled.' });
    }
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'admin_payout_marked_paid', ?, ?, 'success')`,
      [req.user.user_id, `Marked payout #${req.params.id} as paid` + (payment_reference ? ` (ref: ${payment_reference})` : ''), req.ip]
    ).catch(() => {});
    res.json({ message: 'Payout marked as paid.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating payout: ' + err.message });
  }
});

// PATCH /api/admin/payouts/bulk-mark-paid  — pay many at once
// body: { payout_ids: number[] }
router.patch('/payouts/bulk-mark-paid', protect, adminOnly, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.payout_ids) ? req.body.payout_ids.filter(n => Number.isInteger(n)) : [];
    if (!ids.length) return res.status(400).json({ message: 'No payout_ids provided.' });

    const placeholders = ids.map(() => '?').join(',');
    const [result] = await db.query(
      `UPDATE farmer_payouts
         SET status = 'paid', paid_at = NOW(), paid_by = ?
       WHERE payout_id IN (${placeholders}) AND status = 'pending'`,
      [req.user.user_id, ...ids]
    );
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'admin_payout_bulk_paid', ?, ?, 'success')`,
      [req.user.user_id, `Bulk-paid ${result.affectedRows} payouts`, req.ip]
    ).catch(() => {});
    res.json({ message: `Marked ${result.affectedRows} payouts as paid.`, paid_count: result.affectedRows });
  } catch (err) {
    res.status(500).json({ message: 'Error bulk-updating payouts: ' + err.message });
  }
});

// GET /api/admin/settings/commission-rate
router.get('/settings/commission-rate', protect, adminOnly, async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT setting_value, updated_at FROM platform_settings WHERE setting_key = 'platform_commission_rate'`
    );
    const rate = row ? Number(row.setting_value) : 0.10;
    res.json({ rate, rate_percent: Math.round(rate * 10000) / 100, updated_at: row?.updated_at || null });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching commission rate.' });
  }
});

// PATCH /api/admin/settings/commission-rate
//   body: { rate: 0.10 }   (must be between 0 and 0.5 = 50%)
router.patch('/settings/commission-rate', protect, adminOnly, async (req, res) => {
  try {
    const rate = Number(req.body?.rate);
    if (!isFinite(rate) || rate < 0 || rate > 0.5) {
      return res.status(400).json({ message: 'Rate must be between 0 and 0.5 (i.e. 0% to 50%).' });
    }
    await db.query(`
      INSERT INTO platform_settings (setting_key, setting_value, updated_by)
      VALUES ('platform_commission_rate', ?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)
    `, [String(rate), req.user.user_id]);
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'admin_commission_rate_changed', ?, ?, 'success')`,
      [req.user.user_id, `Platform commission rate set to ${(rate*100).toFixed(2)}%`, req.ip]
    ).catch(() => {});
    res.json({ message: 'Commission rate updated.', rate, rate_percent: Math.round(rate * 10000) / 100 });
  } catch (err) {
    res.status(500).json({ message: 'Error updating commission rate.' });
  }
});

// GET /api/admin/ai-logs  — admin view of all AI usage
router.get('/ai-logs', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, feature, from, to } = req.query;
    const offset = (page - 1) * 50;
    let where = 'WHERE 1=1';
    const params = [];
    if (feature) { where += ' AND al.feature = ?'; params.push(feature); }
    if (from)    { where += ' AND al.created_at >= ?'; params.push(from); }
    if (to)      { where += ' AND al.created_at <= ?'; params.push(to + ' 23:59:59'); }

    const [logs] = await db.query(`
      SELECT al.*, u.full_name, u.email
      FROM ai_usage_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT 50 OFFSET ?
    `, [...params, offset]);

    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total_calls,
        SUM(total_tokens) AS total_tokens,
        AVG(latency_ms) AS avg_latency,
        SUM(feature = 'chat') AS chat_calls,
        SUM(feature = 'description') AS desc_calls
      FROM ai_usage_logs ${where}
    `, params);

    res.json({ logs, stats });
  } catch (err) {
    // Table may not exist yet
    res.json({ logs: [], stats: { total_calls: 0, total_tokens: 0 } });
  }
});

// ══ DASHBOARD STATS ═══════════════════════════════════

router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const [[users]] = await db.query(`
      SELECT COUNT(*) AS total,
        SUM(role='farmer') AS farmers,
        SUM(role='buyer') AS buyers,
        SUM(is_active=0) AS suspended,
        SUM(DATE(created_at)=CURDATE()) AS new_today
      FROM users`);

    const [[listings]] = await db.query(`
      SELECT COUNT(*) AS total,
        SUM(is_active=1) AS active,
        SUM(is_active=0) AS inactive
      FROM listings`);

    const [[orders]] = await db.query(`
      SELECT COUNT(*) AS total,
        SUM(status='pending') AS pending,
        SUM(status='confirmed') AS confirmed,
        SUM(status='delivered') AS delivered,
        SUM(status='cancelled') AS cancelled,
        COALESCE(SUM(total_amount),0) AS total_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at)=CURDATE() THEN total_amount END),0) AS today_revenue
      FROM orders`);

    const [[security]] = await db.query(`
      SELECT COUNT(*) AS total_events,
        SUM(event_type='sql_injection_attempt') AS sql_injections,
        SUM(event_type='xss_attempt') AS xss_attempts,
        SUM(event_type='brute_force_detected') AS brute_force,
        (SELECT COUNT(*) FROM blocked_ips WHERE expires_at > NOW()) AS blocked_ips
      FROM security_events`);

    const [recentOrders] = await db.query(`
      SELECT o.order_id, o.total_amount, o.status, o.created_at,
        u.full_name AS buyer_name
      FROM orders o JOIN users u ON o.buyer_id=u.user_id
      ORDER BY o.created_at DESC LIMIT 5`);

    const [recentUsers] = await db.query(`
      SELECT user_id, full_name, email, role, created_at
      FROM users ORDER BY created_at DESC LIMIT 5`);

    res.json({ users, listings, orders, security, recentOrders, recentUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADD THESE to server/routes/admin_enhanced.js ─────────
// Paste just before: module.exports = router;

// GET /api/admin/listings — all listings for admin
router.get('/listings', protect, adminOnly, async (req, res) => {
  try {
    const { search = '', status = '', category = '' } = req.query;
    let query = `
      SELECT l.*, u.full_name AS farmer_name, u.email AS farmer_email,
             c.name AS category_name,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(DISTINCT r.review_id) AS review_count,
             COUNT(DISTINCT oi.item_id) AS total_sold
      FROM listings l
      JOIN users u ON l.farmer_id = u.user_id
      JOIN categories c ON l.category_id = c.category_id
      LEFT JOIN reviews r ON l.listing_id = r.listing_id
      LEFT JOIN order_items oi ON l.listing_id = oi.listing_id
      WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (l.title LIKE ? OR u.full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === 'active')   { query += ' AND l.is_active = 1'; }
    if (status === 'inactive') { query += ' AND l.is_active = 0'; }
    if (category) { query += ' AND l.category_id = ?'; params.push(category); }

    query += ' GROUP BY l.listing_id ORDER BY l.created_at DESC LIMIT 100';

    const [listings] = await db.query(query, params);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/listings/:id/toggle — admin toggle listing status
router.patch('/listings/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT is_active FROM listings WHERE listing_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Listing not found.' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE listings SET is_active = ? WHERE listing_id = ?', [newStatus, req.params.id]);
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?,?,?,?,'success')`,
      [req.user.user_id, 'admin_listing_toggle', `Admin toggled listing #${req.params.id} to ${newStatus ? 'active' : 'inactive'}`, req.ip]
    );
    res.json({ message: `Listing ${newStatus ? 'activated' : 'deactivated'}`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/listings/:id — admin delete listing
router.delete('/listings/:id', protect, adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE listings SET is_active = 0 WHERE listing_id = ?', [req.params.id]);
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?,?,?,?,'success')`,
      [req.user.user_id, 'admin_listing_deleted', `Admin deleted listing #${req.params.id}`, req.ip]
    );
    res.json({ message: 'Listing removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/orders — all orders for admin
router.get('/orders', protect, adminOnly, async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    let query = `
      SELECT o.*,
             u.full_name AS buyer_name, u.email AS buyer_email,
             GROUP_CONCAT(DISTINCT l.title SEPARATOR ', ') AS items_summary,
             COUNT(DISTINCT oi.item_id) AS item_count
      FROM orders o
      JOIN users u ON o.buyer_id = u.user_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN listings l ON oi.listing_id = l.listing_id
      WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR o.order_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { query += ' AND o.status = ?'; params.push(status); }

    query += ' GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT 100';

    const [orders] = await db.query(query, params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/orders/:id/status — admin update order status
router.patch('/orders/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','confirmed','shipped','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    await db.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?', [status, req.params.id]);
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?,?,?,?,'success')`,
      [req.user.user_id, 'admin_order_updated', `Admin updated order #${req.params.id} to ${status}`, req.ip]
    );
    res.json({ message: `Order updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;