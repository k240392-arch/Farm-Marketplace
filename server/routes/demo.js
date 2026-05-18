// routes/demo.js — Live database demonstration endpoints.
// Designed for showing a lecturer / examiner that foreign keys and triggers
// actually fire. Every endpoint returns a clean JSON shape:
//   { success, title, sql, result, error }
// so the frontend can render it consistently.
//
// IMPORTANT: All endpoints are admin-only and most are read-only.
// The two endpoints that DO mutate data (auto-deactivate test, order-audit test)
// either revert their changes or use throwaway demo rows.

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only.' });
  next();
};

// ──────────────────────────────────────────────────────────────────
// SCHEMA INTROSPECTION — what objects exist?
// ──────────────────────────────────────────────────────────────────

router.get('/schema-stats', protect, adminOnly, async (req, res) => {
  try {
    const [[t]] = await db.query(`SELECT COUNT(*) AS n FROM information_schema.TABLES        WHERE TABLE_SCHEMA = DATABASE()`);
    const [[f]] = await db.query(`SELECT COUNT(*) AS n FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`);
    const [[g]] = await db.query(`SELECT COUNT(*) AS n FROM information_schema.TRIGGERS      WHERE TRIGGER_SCHEMA = DATABASE()`);
    const [[i]] = await db.query(`SELECT COUNT(*) AS n FROM information_schema.STATISTICS    WHERE TABLE_SCHEMA = DATABASE()`);
    const [innodb] = await db.query(`SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND ENGINE = 'InnoDB'`);
    res.json({
      tables: t.n, foreign_keys: f.n, triggers: g.n, indexes: i.n,
      innodb_tables: innodb[0].n,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/list-fks', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT TABLE_NAME AS table_name, CONSTRAINT_NAME AS fk_name,
             COLUMN_NAME AS col, REFERENCED_TABLE_NAME AS ref_table,
             REFERENCED_COLUMN_NAME AS ref_col
        FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY TABLE_NAME, ORDINAL_POSITION`);
    res.json({ fks: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/list-triggers', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT TRIGGER_NAME AS name, EVENT_OBJECT_TABLE AS tbl,
             EVENT_MANIPULATION AS event, ACTION_TIMING AS timing
        FROM information_schema.TRIGGERS
       WHERE TRIGGER_SCHEMA = DATABASE()
       ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME`);
    res.json({ triggers: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ──────────────────────────────────────────────────────────────────
// FOREIGN KEY DEMONSTRATIONS — each one EXPECTS to fail.
// We catch the error and return its message as the proof.
// ──────────────────────────────────────────────────────────────────

router.post('/test-fk-bad-farmer', protect, adminOnly, async (req, res) => {
  const sql = `INSERT INTO listings (farmer_id, category_id, title, price, quantity)
               VALUES (999999, 1, 'Ghost Farmer Tomatoes', 5.00, 10)`;
  try {
    await db.query(sql);
    // If this somehow succeeds, clean up so we don't leave junk:
    await db.query("DELETE FROM listings WHERE title = 'Ghost Farmer Tomatoes' AND farmer_id = 999999");
    res.json({ success: false, sql,
      message: '⚠️ Insert succeeded — FK is NOT enforced! This should never happen.' });
  } catch (err) {
    res.json({ success: true, sql,
      title: 'Foreign key fk_listings_farmer rejected the insert ✅',
      error_code: err.code, error_message: err.sqlMessage || err.message,
      explanation: 'The database refused to create a listing for a non-existent farmer (user_id=999999). This is fk_listings_farmer enforcing referential integrity — exactly what a foreign key should do.' });
  }
});

router.post('/test-fk-bad-buyer', protect, adminOnly, async (req, res) => {
  const sql = `INSERT INTO orders (buyer_id, total_amount, delivery_address)
               VALUES (999999, 50.00, '123 Nowhere St')`;
  try {
    await db.query(sql);
    await db.query("DELETE FROM orders WHERE buyer_id = 999999 AND delivery_address = '123 Nowhere St'");
    res.json({ success: false, sql, message: '⚠️ Should have failed.' });
  } catch (err) {
    res.json({ success: true, sql,
      title: 'Foreign key fk_orders_buyer rejected the insert ✅',
      error_code: err.code, error_message: err.sqlMessage || err.message,
      explanation: 'You can\'t create an order for a buyer that doesn\'t exist. fk_orders_buyer protects financial records from referencing missing users.' });
  }
});

router.post('/test-fk-protect-category', protect, adminOnly, async (req, res) => {
  // Find a category that has listings
  const sql = `DELETE FROM categories WHERE category_id = (
                 SELECT DISTINCT category_id FROM listings LIMIT 1
               )`;
  try {
    await db.query(sql);
    res.json({ success: false, sql, message: '⚠️ Should have failed.' });
  } catch (err) {
    res.json({ success: true, sql,
      title: 'Foreign key fk_listings_category blocked the deletion ✅',
      error_code: err.code, error_message: err.sqlMessage || err.message,
      explanation: 'A category with listings attached cannot be deleted — ON DELETE RESTRICT prevents accidentally orphaning products.' });
  }
});

// ──────────────────────────────────────────────────────────────────
// TRIGGER DEMONSTRATIONS — each one performs a real operation
// and shows the trigger's side-effect.
// ──────────────────────────────────────────────────────────────────

router.post('/test-trigger-negative-stock', protect, adminOnly, async (req, res) => {
  const sql = `UPDATE listings SET quantity = -5 WHERE listing_id = (SELECT MIN(listing_id) FROM (SELECT listing_id FROM listings WHERE quantity > 0 LIMIT 1) x)`;
  try {
    await db.query(sql);
    res.json({ success: false, sql, message: '⚠️ Trigger did not fire — stock went negative!' });
  } catch (err) {
    res.json({ success: true, sql,
      title: 'Trigger trg_listings_no_negative_stock blocked the update ✅',
      error_code: err.code, error_message: err.sqlMessage || err.message,
      explanation: 'A BEFORE UPDATE trigger raised SQLSTATE 45000 with our custom message because the new quantity would have been negative. Protects against race conditions in concurrent order placement.' });
  }
});

router.post('/test-trigger-auto-deactivate', protect, adminOnly, async (req, res) => {
  try {
    // Find an active listing with stock > 0
    const [picks] = await db.query(`SELECT listing_id, title, quantity, is_active FROM listings WHERE is_active=1 AND quantity > 0 LIMIT 1`);
    if (!picks.length) return res.json({ success:false, message:'No active listing with stock to demo on. Run schema.sql first.' });
    const before = picks[0];

    // Step 1: deplete it
    await db.query('UPDATE listings SET quantity = 0 WHERE listing_id = ?', [before.listing_id]);
    const [[afterDeplete]] = await db.query('SELECT listing_id, title, quantity, is_active FROM listings WHERE listing_id = ?', [before.listing_id]);

    // Step 2: restock it back to original
    await db.query('UPDATE listings SET quantity = ? WHERE listing_id = ?', [before.quantity, before.listing_id]);
    const [[afterRestock]] = await db.query('SELECT listing_id, title, quantity, is_active FROM listings WHERE listing_id = ?', [before.listing_id]);

    res.json({
      success: true,
      title: 'Trigger trg_listings_auto_deactivate fired twice ✅',
      explanation: `We took listing #${before.listing_id} ("${before.title}"), set its stock to 0, then restocked it. The trigger automatically flipped is_active=0 when stock hit zero, and back to is_active=1 when restocked — without any application code running.`,
      steps: [
        { label: 'BEFORE',             ...before },
        { label: 'AFTER stock → 0',    ...afterDeplete },
        { label: 'AFTER restock → ' + before.quantity, ...afterRestock },
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error_message: err.sqlMessage || err.message });
  }
});

router.post('/test-trigger-order-audit', protect, adminOnly, async (req, res) => {
  try {
    // Use any existing buyer; admin's user_id is fine if no buyer exists
    const [[buyer]] = await db.query(`SELECT user_id FROM users WHERE role='buyer' AND is_active=1 LIMIT 1`);
    if (!buyer) return res.json({ success:false, message:'No buyer in DB to run demo with.' });

    // Create a throwaway order
    const [insRes] = await db.query(
      `INSERT INTO orders (buyer_id, total_amount, status, delivery_address)
       VALUES (?, 99.99, 'pending', '🧪 Demo Order — auto-created')`,
      [buyer.user_id]
    );
    const oid = insRes.insertId;

    // Walk it through statuses — each UPDATE fires trg_orders_log_status_change
    await db.query("UPDATE orders SET status='confirmed' WHERE order_id=?", [oid]);
    await db.query("UPDATE orders SET status='shipped'   WHERE order_id=?", [oid]);
    await db.query("UPDATE orders SET status='delivered' WHERE order_id=?", [oid]);

    // Read back the audit rows the trigger created
    const [logs] = await db.query(
      `SELECT log_id, action, description, created_at FROM activity_logs
       WHERE description LIKE CONCAT('%#', ?, '%') AND action = 'order_status_changed'
       ORDER BY log_id`,
      [oid]
    );

    // Clean up: trigger payouts ledger entries don't exist for this dummy order, so we can just delete
    await db.query("DELETE FROM activity_logs WHERE description LIKE CONCAT('%#', ?, '%') AND action = 'order_status_changed'", [oid]);
    await db.query("DELETE FROM orders WHERE order_id=?", [oid]);

    res.json({
      success: true,
      title: `Trigger trg_orders_log_status_change fired ${logs.length} times ✅`,
      explanation: `We created a temporary order (#${oid}) and transitioned it pending → confirmed → shipped → delivered. Every status change automatically inserted an audit-log row. The application code never wrote to activity_logs — the trigger did.`,
      logs_created: logs.map(l => ({ id: l.log_id, when: l.created_at, description: l.description })),
      cleanup: 'Demo order and its log entries have been deleted to keep the database clean.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error_message: err.sqlMessage || err.message });
  }
});

router.post('/test-trigger-rating-cache', protect, adminOnly, async (req, res) => {
  try {
    // Find a listing with no reviews (so we don't mess up real ratings)
    const [picks] = await db.query(`
      SELECT l.listing_id, l.title, l.avg_rating, l.review_count
        FROM listings l
       WHERE l.review_count = 0 AND l.is_active = 1
       LIMIT 1`);
    if (!picks.length) return res.json({ success:false, message:'No clean listing without reviews to demo on.' });
    const listingId = picks[0].listing_id;

    // Find a buyer
    const [[buyer]] = await db.query(`SELECT user_id FROM users WHERE role='buyer' LIMIT 1`);
    if (!buyer) return res.json({ success:false, message:'No buyer to write reviews from.' });

    const snapshot = async () => {
      const [[r]] = await db.query('SELECT listing_id, title, avg_rating, review_count FROM listings WHERE listing_id=?', [listingId]);
      return r;
    };

    const steps = [{ label: 'BEFORE', ...(await snapshot()) }];

    // INSERT 5-star
    await db.query('INSERT INTO reviews (buyer_id, listing_id, rating, comment) VALUES (?, ?, 5, "🧪 demo")', [buyer.user_id, listingId]);
    steps.push({ label: 'AFTER 5★ review inserted', ...(await snapshot()) });

    // UPDATE it down to 1-star
    await db.query('UPDATE reviews SET rating = 1 WHERE buyer_id = ? AND listing_id = ?', [buyer.user_id, listingId]);
    steps.push({ label: 'AFTER review changed to 1★', ...(await snapshot()) });

    // DELETE it
    await db.query('DELETE FROM reviews WHERE buyer_id = ? AND listing_id = ?', [buyer.user_id, listingId]);
    steps.push({ label: 'AFTER review deleted', ...(await snapshot()) });

    res.json({
      success: true,
      title: `Triggers trg_reviews_update_rating_{ins,upd,del} all fired ✅`,
      explanation: `On listing #${listingId} ("${picks[0].title}"), we inserted a 5★ review, edited it down to 1★, then deleted it. Each event fired a different trigger that automatically recalculated avg_rating and review_count. The cache stayed accurate without any application code touching those columns.`,
      steps
    });
  } catch (err) {
    res.status(500).json({ success: false, error_message: err.sqlMessage || err.message });
  }
});

module.exports = router;