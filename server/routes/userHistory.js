// routes/userHistory.js
// User history, account closure, and data export (GDPR / Australian Privacy Act).
//
// Endpoints:
//   POST  /api/users/me/close-account            — farmer/buyer closes their own account
//   GET   /api/users/me/history                  — user downloads their own data (JSON)
//   GET   /api/users/me/history.pdf              — user downloads their own data (PDF)
//   GET   /api/admin/users/:id/history           — admin views any user's timeline
//   GET   /api/admin/users/:id/history.pdf       — admin downloads any user's PDF
//
// The PDF rendering uses pdfkit (already a dep via @stripe and others or installable
// via `npm install pdfkit` in the server folder).

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

let PDFDocument;
try { PDFDocument = require('pdfkit'); }
catch { console.warn('⚠️  pdfkit not installed — PDF export will return JSON instead. Run: npm install pdfkit'); }

// ── Auto-migrate: add columns if they don't exist ─────────────────
// Safe to run repeatedly; uses INFORMATION_SCHEMA to detect existing columns.
(async () => {
  try {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
         AND COLUMN_NAME IN ('account_status','closed_at','closure_reason')
    `);
    const have = new Set(cols.map(c => c.COLUMN_NAME));
    if (!have.has('account_status')) {
      await db.query(`ALTER TABLE users ADD COLUMN account_status
        ENUM('active','suspended','closed','anonymised') NOT NULL DEFAULT 'active'
        AFTER is_verified`);
      await db.query(`ALTER TABLE users ADD INDEX idx_account_status (account_status)`).catch(()=>{});
    }
    if (!have.has('closed_at')) {
      await db.query(`ALTER TABLE users ADD COLUMN closed_at DATETIME DEFAULT NULL`);
    }
    if (!have.has('closure_reason')) {
      await db.query(`ALTER TABLE users ADD COLUMN closure_reason VARCHAR(500) DEFAULT NULL`);
    }
    console.log('✅ user account lifecycle columns ready');
  } catch (err) {
    console.error('⚠️  Could not ensure user lifecycle columns:', err.message);
  }
})();

// ═══════════════════════════════════════════════════════════════════
// COLLECT user data — single function used by all history endpoints.
// Returns a fully populated object suitable for JSON download or PDF rendering.
// ═══════════════════════════════════════════════════════════════════
async function collectUserHistory(userId) {
  const [[user]] = await db.query(
    `SELECT user_id, full_name, email, role, phone, address,
            is_active, is_verified, account_status, closed_at, closure_reason,
            created_at, updated_at
       FROM users WHERE user_id = ?`,
    [userId]
  );
  if (!user) return null;

  // Orders placed (as buyer)
  const [ordersPlaced] = await db.query(
    `SELECT order_id, total_amount, status, delivery_address, delivery_time, created_at
       FROM orders WHERE buyer_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  // Listings created (as farmer)
  const [listings] = await db.query(
    `SELECT l.listing_id, l.title, l.price, l.quantity, l.unit, l.location,
            l.is_active, l.avg_rating, l.review_count, l.created_at,
            c.name AS category_name
       FROM listings l
       LEFT JOIN categories c ON l.category_id = c.category_id
      WHERE l.farmer_id = ? ORDER BY l.created_at DESC`,
    [userId]
  );

  // Sales received (as farmer) — orders containing this farmer's listings
  const [salesReceived] = await db.query(
    `SELECT DISTINCT o.order_id, o.status, o.created_at,
            buyer.full_name AS buyer_name
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN listings l ON l.listing_id = oi.listing_id
       JOIN users buyer ON buyer.user_id = o.buyer_id
      WHERE l.farmer_id = ? ORDER BY o.created_at DESC`,
    [userId]
  );

  // Reviews written (as buyer)
  const [reviewsWritten] = await db.query(
    `SELECT r.review_id, r.rating, r.comment, r.created_at,
            l.title AS listing_title
       FROM reviews r
       JOIN listings l ON l.listing_id = r.listing_id
      WHERE r.buyer_id = ? ORDER BY r.created_at DESC`,
    [userId]
  );

  // Reviews received (as farmer)
  const [reviewsReceived] = await db.query(
    `SELECT r.review_id, r.rating, r.comment, r.created_at,
            l.title AS listing_title, u.full_name AS buyer_name
       FROM reviews r
       JOIN listings l ON l.listing_id = r.listing_id
       JOIN users u ON u.user_id = r.buyer_id
      WHERE l.farmer_id = ? ORDER BY r.created_at DESC`,
    [userId]
  );

  // Payouts received (as farmer)
  let payouts = [];
  try {
    const [rows] = await db.query(
      `SELECT payout_id, order_id, gross_amount, commission_amount, net_amount,
              status, paid_at, payment_reference, created_at
         FROM farmer_payouts WHERE farmer_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    payouts = rows;
  } catch { /* table may not exist on very old DBs */ }

  // Activity log
  const [activity] = await db.query(
    `SELECT log_id, action, description, status, ip_address, created_at
       FROM activity_logs WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 1000`,
    [userId]
  );

  // Build a unified chronological timeline (most useful for the admin view)
  const timeline = [];
  timeline.push({ when: user.created_at, kind: 'account', text: `Account created (${user.role})` });
  ordersPlaced.forEach(o    => timeline.push({ when: o.created_at, kind: 'order',   text: `Placed order #${o.order_id} — $${o.total_amount} (${o.status})` }));
  listings.forEach(l        => timeline.push({ when: l.created_at, kind: 'listing', text: `Created listing "${l.title}" — $${l.price}/${l.unit}` }));
  salesReceived.forEach(s   => timeline.push({ when: s.created_at, kind: 'sale',    text: `Received order #${s.order_id} from ${s.buyer_name}` }));
  reviewsWritten.forEach(r  => timeline.push({ when: r.created_at, kind: 'review',  text: `Wrote ${r.rating}-star review on "${r.listing_title}"` }));
  reviewsReceived.forEach(r => timeline.push({ when: r.created_at, kind: 'feedback',text: `Received ${r.rating}-star review on "${r.listing_title}"` }));
  payouts.forEach(p         => timeline.push({ when: p.created_at, kind: 'payout',  text: `Payout #${p.payout_id} — $${p.net_amount} (${p.status})` }));
  activity.forEach(a        => timeline.push({ when: a.created_at, kind: 'audit',   text: a.description || a.action }));
  if (user.closed_at)        timeline.push({ when: user.closed_at, kind: 'closure', text: `Account closed${user.closure_reason ? ` — ${user.closure_reason}` : ''}` });
  // Sort newest-first
  timeline.sort((a, b) => new Date(b.when) - new Date(a.when));

  // Summary stats
  const stats = {
    member_since:        user.created_at,
    total_orders_placed: ordersPlaced.length,
    total_listings:      listings.length,
    active_listings:     listings.filter(l => l.is_active).length,
    total_sales:         salesReceived.length,
    total_reviews_written:  reviewsWritten.length,
    total_reviews_received: reviewsReceived.length,
    total_payouts:       payouts.length,
    gross_earnings:      payouts.reduce((s,p) => s + Number(p.gross_amount || 0), 0).toFixed(2),
    net_earnings:        payouts.reduce((s,p) => s + Number(p.net_amount   || 0), 0).toFixed(2),
    activity_count:      activity.length,
  };

  // Sanitise sensitive fields before returning
  const cleanUser = { ...user };
  delete cleanUser.password_hash;
  delete cleanUser.verification_token;
  delete cleanUser.stripe_customer_id;

  return {
    generated_at: new Date().toISOString(),
    user: cleanUser,
    stats,
    timeline,
    orders_placed:   ordersPlaced,
    listings,
    sales_received:  salesReceived,
    reviews_written: reviewsWritten,
    reviews_received: reviewsReceived,
    payouts,
    activity_logs: activity,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PDF RENDERING — builds a clean multi-section report
// ═══════════════════════════════════════════════════════════════════
function buildPDF(history, res) {
  if (!PDFDocument) {
    return res.json(history); // graceful fallback
  }
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filename = `user-history-${history.user.user_id}-${new Date().toISOString().slice(0,10)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Colour palette (matches the marketplace forest theme)
  const C = { forest:'#1B5E20', moss:'#388E3C', ink:'#111827', muted:'#6B7280', light:'#E8F5E9' };

  const HR = () => { doc.moveDown(0.4).strokeColor('#E5E7EB').lineWidth(1)
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.4); };
  const H1 = (t) => doc.fillColor(C.forest).fontSize(22).font('Helvetica-Bold').text(t).moveDown(0.3);
  const H2 = (t) => { doc.moveDown(0.6).fillColor(C.moss).fontSize(14).font('Helvetica-Bold').text(t).moveDown(0.2); };
  const KV = (k, v) => {
    doc.fontSize(10).fillColor(C.muted).font('Helvetica-Bold').text(k, { continued:true, width: 180 })
       .fillColor(C.ink).font('Helvetica').text('  ' + (v ?? '—'));
  };

  // ── Cover ──
  doc.fillColor(C.forest).fontSize(28).font('Helvetica-Bold').text('Farm Marketplace', { align:'center' }).moveDown(0.2);
  doc.fillColor(C.moss).fontSize(14).font('Helvetica').text('User Account & Activity Record', { align:'center' }).moveDown(2);

  // ── Account info ──
  H1('1. Account Information');
  KV('Account ID',     `#${history.user.user_id}`);
  KV('Full name',      history.user.full_name);
  KV('Email',          history.user.email);
  KV('Role',           history.user.role);
  KV('Phone',          history.user.phone);
  KV('Address',        history.user.address);
  KV('Account status', history.user.account_status || (history.user.is_active ? 'active' : 'inactive'));
  KV('Email verified', history.user.is_verified ? 'yes' : 'no');
  KV('Member since',   history.user.created_at ? new Date(history.user.created_at).toLocaleString('en-AU') : '—');
  if (history.user.closed_at) {
    KV('Closed on',     new Date(history.user.closed_at).toLocaleString('en-AU'));
    KV('Closure reason', history.user.closure_reason || '—');
  }
  KV('Record generated', new Date(history.generated_at).toLocaleString('en-AU'));

  // ── Stats summary ──
  H1('2. Activity Summary');
  const s = history.stats;
  KV('Orders placed (as buyer)',  s.total_orders_placed);
  KV('Listings created',          `${s.total_listings} (${s.active_listings} currently active)`);
  KV('Sales received',            s.total_sales);
  KV('Reviews written',           s.total_reviews_written);
  KV('Reviews received',          s.total_reviews_received);
  KV('Payouts',                   `${s.total_payouts} (gross $${s.gross_earnings}, net $${s.net_earnings})`);
  KV('Audit log entries',         s.activity_count);

  // ── Orders placed ──
  if (history.orders_placed.length) {
    H1('3. Orders Placed');
    history.orders_placed.slice(0, 50).forEach(o => {
      doc.fontSize(10).fillColor(C.ink).font('Helvetica-Bold')
         .text(`Order #${o.order_id}`, { continued:true })
         .font('Helvetica').fillColor(C.muted)
         .text(`  ·  ${new Date(o.created_at).toLocaleDateString('en-AU')}  ·  $${o.total_amount}  ·  ${o.status}`);
      doc.fontSize(9).fillColor(C.muted).text(`   → ${o.delivery_address || ''}`).moveDown(0.3);
    });
    if (history.orders_placed.length > 50) doc.fontSize(9).fillColor(C.muted).text(`... and ${history.orders_placed.length - 50} more.`);
  }

  // ── Listings ──
  if (history.listings.length) {
    H1('4. Listings Created');
    history.listings.slice(0, 50).forEach(l => {
      doc.fontSize(10).fillColor(C.ink).font('Helvetica-Bold').text(l.title, { continued:true })
         .font('Helvetica').fillColor(C.muted)
         .text(`  ·  ${l.category_name || ''}  ·  $${l.price}/${l.unit}  ·  stock: ${l.quantity}  ·  ${l.is_active ? 'active' : 'inactive'}`);
      doc.moveDown(0.2);
    });
  }

  // ── Sales received ──
  if (history.sales_received.length) {
    H1('5. Sales Received');
    history.sales_received.slice(0, 50).forEach(s => {
      doc.fontSize(10).fillColor(C.ink).text(`Order #${s.order_id}  ·  buyer: ${s.buyer_name}  ·  ${new Date(s.created_at).toLocaleDateString('en-AU')}  ·  ${s.status}`).moveDown(0.1);
    });
  }

  // ── Payouts ──
  if (history.payouts.length) {
    H1('6. Payouts');
    history.payouts.slice(0, 50).forEach(p => {
      doc.fontSize(10).fillColor(C.ink)
         .text(`Payout #${p.payout_id}  ·  order #${p.order_id}  ·  gross $${p.gross_amount}  ·  commission $${p.commission_amount}  ·  net $${p.net_amount}  ·  ${p.status}`)
         .moveDown(0.1);
    });
  }

  // ── Reviews ──
  if (history.reviews_written.length) {
    H1('7. Reviews Written');
    history.reviews_written.slice(0, 30).forEach(r => {
      doc.fontSize(10).fillColor(C.ink).font('Helvetica-Bold').text(`${'★'.repeat(r.rating)}  on  ${r.listing_title}`)
         .font('Helvetica').fillColor(C.muted).fontSize(9).text(`   "${r.comment || '(no comment)'}"  ·  ${new Date(r.created_at).toLocaleDateString('en-AU')}`).moveDown(0.3);
    });
  }
  if (history.reviews_received.length) {
    H1('8. Reviews Received');
    history.reviews_received.slice(0, 30).forEach(r => {
      doc.fontSize(10).fillColor(C.ink).font('Helvetica-Bold').text(`${'★'.repeat(r.rating)}  by ${r.buyer_name}  on  ${r.listing_title}`)
         .font('Helvetica').fillColor(C.muted).fontSize(9).text(`   "${r.comment || '(no comment)'}"  ·  ${new Date(r.created_at).toLocaleDateString('en-AU')}`).moveDown(0.3);
    });
  }

  // ── Activity log ──
  if (history.activity_logs.length) {
    H1('9. Activity Log');
    history.activity_logs.slice(0, 100).forEach(a => {
      doc.fontSize(9).fillColor(C.muted).text(`${new Date(a.created_at).toLocaleString('en-AU')}  ·  ${a.action}`, { continued:true })
         .fillColor(C.ink).text(`  ·  ${a.description || ''}`);
    });
    if (history.activity_logs.length > 100) doc.moveDown(0.3).fontSize(9).fillColor(C.muted).text(`... and ${history.activity_logs.length - 100} more entries (full data in JSON export).`);
  }

  // ── Footer ──
  doc.moveDown(2).fontSize(8).fillColor(C.muted).text(
    'This document is your complete record of activity on Farm Marketplace. ' +
    'If any information is incorrect, please contact privacy@farmmarket.com.au. ' +
    'You have the right under the Australian Privacy Act 1988 and the EU GDPR ' +
    'to request correction, restriction, or deletion of your personal data.',
    { align: 'center' }
  );

  doc.end();
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES — user-facing (self-service)
// ═══════════════════════════════════════════════════════════════════

// GET /api/users/me/history — user downloads their own data (JSON)
router.get('/users/me/history', protect, async (req, res) => {
  try {
    const h = await collectUserHistory(req.user.user_id);
    if (!h) return res.status(404).json({ message: 'User not found.' });
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'self_data_export_json', 'User downloaded their own data (JSON)', ?, 'success')`,
      [req.user.user_id, req.ip]
    ).catch(()=>{});
    res.setHeader('Content-Disposition', `attachment; filename="my-data-${req.user.user_id}.json"`);
    res.json(h);
  } catch (err) {
    res.status(500).json({ message: 'Error generating data export.' });
  }
});

// GET /api/users/me/history.pdf — user downloads their own data (PDF)
router.get('/users/me/history.pdf', protect, async (req, res) => {
  try {
    const h = await collectUserHistory(req.user.user_id);
    if (!h) return res.status(404).json({ message: 'User not found.' });
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'self_data_export_pdf', 'User downloaded their own data (PDF)', ?, 'success')`,
      [req.user.user_id, req.ip]
    ).catch(()=>{});
    buildPDF(h, res);
  } catch (err) {
    res.status(500).json({ message: 'Error generating PDF.' });
  }
});

// POST /api/users/me/close-account — farmer/buyer initiates account closure
// Body: { reason?: string, confirm_password: string }
router.post('/users/me/close-account', protect, async (req, res) => {
  const { reason = null, confirm_password } = req.body || {};
  if (!confirm_password) return res.status(400).json({ message: 'Please confirm your password to close the account.' });
  if (req.user.role === 'admin') return res.status(403).json({ message: 'Admin accounts cannot self-close.' });

  const bcrypt = require('bcryptjs');
  const conn = await db.getConnection();
  try {
    const [[u]] = await conn.query('SELECT password_hash, account_status FROM users WHERE user_id = ?', [req.user.user_id]);
    if (!u) return res.status(404).json({ message: 'User not found.' });
    if (u.account_status === 'closed' || u.account_status === 'anonymised') {
      return res.status(400).json({ message: 'Account is already closed.' });
    }
    const ok = await bcrypt.compare(confirm_password, u.password_hash);
    if (!ok) return res.status(401).json({ message: 'Password incorrect.' });

    await conn.beginTransaction();
    // Mark closed (preserve data for audit/history)
    await conn.query(
      `UPDATE users SET account_status='closed', closed_at=NOW(),
                        closure_reason=?, is_active=0
       WHERE user_id = ?`,
      [reason ? String(reason).slice(0, 500) : null, req.user.user_id]
    );
    // Deactivate any active listings (if farmer)
    if (req.user.role === 'farmer') {
      await conn.query('UPDATE listings SET is_active=0 WHERE farmer_id = ?', [req.user.user_id]);
    }
    await conn.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'account_closed_by_user', ?, ?, 'success')`,
      [req.user.user_id, `Account closed by user${reason ? ` — reason: ${reason}` : ''}`, req.ip]
    );
    await conn.commit();
    res.json({
      message: 'Your account has been closed. Your historical data is preserved for compliance but you can no longer log in. Email privacy@farmmarket.com.au within 30 days if you want it reopened.'
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ message: 'Error closing account: ' + err.message });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════════
// ROUTES — admin-facing (monitor any user)
// ═══════════════════════════════════════════════════════════════════
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only.' });
  next();
};

// GET /api/admin/users/:id/history — admin pulls any user's full record
router.get('/admin/users/:id/history', protect, adminOnly, async (req, res) => {
  try {
    const h = await collectUserHistory(req.params.id);
    if (!h) return res.status(404).json({ message: 'User not found.' });
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'admin_user_history_view', ?, ?, 'success')`,
      [req.user.user_id, `Admin viewed full history of user #${req.params.id}`, req.ip]
    ).catch(()=>{});
    res.json(h);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users/:id/history.pdf — admin downloads any user's PDF
router.get('/admin/users/:id/history.pdf', protect, adminOnly, async (req, res) => {
  try {
    const h = await collectUserHistory(req.params.id);
    if (!h) return res.status(404).json({ message: 'User not found.' });
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'admin_user_history_pdf', ?, ?, 'success')`,
      [req.user.user_id, `Admin downloaded PDF of user #${req.params.id}`, req.ip]
    ).catch(()=>{});
    buildPDF(h, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PROFILE UPDATES — change email (and could be extended to password, phone, ...)
// ═══════════════════════════════════════════════════════════════════
// PATCH /api/users/me/email
// Body: { new_email: "you@example.com", confirm_password: "..." }
router.patch('/users/me/email', protect, async (req, res) => {
  const { new_email, confirm_password } = req.body || {};

  // Basic validation
  if (!new_email || !confirm_password) {
    return res.status(400).json({ message: 'Both new_email and confirm_password are required.' });
  }
  const emailTrimmed = String(new_email).trim().toLowerCase();
  // RFC-5322 lite — same regex shape <input type=email> uses
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (emailTrimmed.length > 150) {
    return res.status(400).json({ message: 'Email is too long (max 150 characters).' });
  }

  const bcrypt = require('bcryptjs');
  try {
    const [[user]] = await db.query(
      'SELECT user_id, email, password_hash FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Confirm the user's password before letting them change their email
    const passwordOk = await bcrypt.compare(confirm_password, user.password_hash);
    if (!passwordOk) return res.status(401).json({ message: 'Password incorrect.' });

    // No-op if they're "changing" to the same email
    if (emailTrimmed === user.email.toLowerCase()) {
      return res.status(400).json({ message: 'That is already your current email.' });
    }

    // Uniqueness check — don't leak whose account uses it, just say "in use"
    const [[clash]] = await db.query(
      'SELECT user_id FROM users WHERE LOWER(email) = ? AND user_id != ?',
      [emailTrimmed, req.user.user_id]
    );
    if (clash) return res.status(409).json({ message: 'That email is already in use by another account.' });

    // Update
    await db.query('UPDATE users SET email = ? WHERE user_id = ?', [emailTrimmed, req.user.user_id]);

    // Audit log (trigger trg_users_log_registration only fires on INSERT, so we
    // manually log email-change events for the audit trail)
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'email_changed', ?, ?, 'success')`,
      [req.user.user_id, `Email changed from "${user.email}" to "${emailTrimmed}"`, req.ip]
    ).catch(() => {});

    res.json({
      message: 'Email updated successfully.',
      new_email: emailTrimmed,
    });
  } catch (err) {
    console.error('PATCH /users/me/email error:', err);
    res.status(500).json({ message: 'Could not update email: ' + err.message });
  }
});

module.exports = router;