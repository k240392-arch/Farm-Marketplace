// routes/orders.js — Farm Produce Marketplace
const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { sendOrderConfirmation, sendFarmerOrderAlert, sendStatusUpdate } = require('../config/email');

// ── Auto-ensure schema for commission ledger ──────────────
// Runs once at module load. Idempotent — safe to call repeatedly.
(async () => {
  try {
    // 1. Global key/value settings table (used for platform_commission_rate, etc.)
    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        setting_key   VARCHAR(64)  PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        updated_by    INT          DEFAULT NULL,
        updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    // Seed commission rate at 10% if not set
    await db.query(`
      INSERT IGNORE INTO platform_settings (setting_key, setting_value)
      VALUES ('platform_commission_rate', '0.10')
    `);

    // 2. Per-farmer payout ledger — one row per (order, farmer) combination
    await db.query(`
      CREATE TABLE IF NOT EXISTS farmer_payouts (
        payout_id         INT             AUTO_INCREMENT PRIMARY KEY,
        order_id          INT             NOT NULL,
        farmer_id         INT             NOT NULL,
        gross_amount      DECIMAL(10,2)   NOT NULL,
        commission_rate   DECIMAL(5,4)    NOT NULL,
        commission_amount DECIMAL(10,2)   NOT NULL,
        net_amount        DECIMAL(10,2)   NOT NULL,
        status            ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
        paid_at           DATETIME        DEFAULT NULL,
        paid_by           INT             DEFAULT NULL,
        payment_reference VARCHAR(255)    DEFAULT NULL,
        notes             TEXT            DEFAULT NULL,
        created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id)  REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (farmer_id) REFERENCES users(user_id)   ON DELETE CASCADE,
        UNIQUE KEY uniq_order_farmer (order_id, farmer_id),
        INDEX idx_status (status),
        INDEX idx_farmer (farmer_id)
      )
    `);
    console.log('✅ farmer_payouts + platform_settings ready');
  } catch (err) {
    console.error('⚠️  Could not ensure payouts schema:', err.message);
  }
})();

// Helper: read current commission rate (cached fallback to 0.10)
async function getCommissionRate() {
  try {
    const [[row]] = await db.query(
      `SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_commission_rate'`
    );
    const rate = Number(row?.setting_value);
    if (!isFinite(rate) || rate < 0 || rate >= 1) return 0.10;
    return rate;
  } catch {
    return 0.10;
  }
}

// ══ SPECIFIC NAMED ROUTES FIRST (before /:id) ════════════

// GET /api/orders/my — buyer's own order history
router.get('/my', protect, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*,
         GROUP_CONCAT(DISTINCT l.title SEPARATOR ', ') AS items_summary,
         MIN(l.title) AS listing_title,
         MIN(l.listing_id) AS listing_id
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN listings l ON oi.listing_id = l.listing_id
       WHERE o.buyer_id = ?
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [req.user.user_id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your orders.' });
  }
});

// GET /api/orders/farmer/received — all orders containing farmer's listings
router.get('/farmer/received', protect, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT DISTINCT o.*, u.full_name AS buyer_name, u.email AS buyer_email,
         GROUP_CONCAT(DISTINCT l.title SEPARATOR ', ') AS items_summary
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN listings l ON oi.listing_id = l.listing_id
       JOIN users u ON o.buyer_id = u.user_id
       WHERE l.farmer_id = ?
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [req.user.user_id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching farmer orders.' });
  }
});

// ══ PLACE ORDER ══════════════════════════════════════════

// POST /api/orders — place order + send emails
router.post('/', protect, async (req, res) => {
  const { items, delivery_address, delivery_time, stripe_payment_id, total_amount } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: 'No items.' });
  if (!delivery_address) return res.status(400).json({ message: 'Delivery address required.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const enriched = [];
    const farmerEmails = new Map();

    for (const item of items) {
      // Validate the cart item shape first — most "Listing not found" issues
      // are actually missing/invalid listing_id from a stale cart.
      if (!item.listing_id || isNaN(Number(item.listing_id))) {
        throw new Error(`Cart item has invalid listing_id (got: ${JSON.stringify(item.listing_id)}). This usually means the cart has stale items from before the database was reset — please empty your cart and try again.`);
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        throw new Error(`Cart item has invalid quantity (got: ${JSON.stringify(item.quantity)}) for listing #${item.listing_id}. Please remove this item from your cart and re-add it.`);
      }

      const [rows] = await conn.query(
        `SELECT l.listing_id, l.price, l.quantity, l.title, l.is_active,
                u.email AS farmer_email, u.full_name AS farmer_name, u.user_id AS farmer_id
         FROM listings l JOIN users u ON l.farmer_id = u.user_id
         WHERE l.listing_id = ?`,
        [item.listing_id]
      );
      if (!rows.length) {
        // Check whether the listing exists at all (vs just being inactive)
        const [[exists]] = await conn.query(
          'SELECT listing_id, is_active FROM listings WHERE listing_id = ?',
          [item.listing_id]
        );
        if (!exists) {
          throw new Error(`Listing #${item.listing_id} no longer exists. This often means your cart has items from before the database was reset — please empty your cart and re-add items from the marketplace.`);
        }
      }
      if (!rows.length || !rows[0].is_active) {
        throw new Error(`Listing #${item.listing_id} is no longer available (it may be out of stock or removed by the farmer). Please remove it from your cart.`);
      }
      if (rows[0].quantity < item.quantity) {
        throw new Error(`Not enough stock for "${rows[0].title}" — only ${rows[0].quantity} ${rows[0].quantity === 1 ? 'unit' : 'units'} available, you requested ${item.quantity}.`);
      }

      total += rows[0].price * item.quantity;
      enriched.push({ ...item, unit_price: rows[0].price, title: rows[0].title });

      if (!farmerEmails.has(rows[0].farmer_id)) {
        farmerEmails.set(rows[0].farmer_id, { email: rows[0].farmer_email, name: rows[0].farmer_name, items: [] });
      }
      farmerEmails.get(rows[0].farmer_id).items.push({
        title: rows[0].title, quantity: item.quantity, unit: 'kg', unit_price: rows[0].price
      });
    }

    const [result] = await conn.query(
      `INSERT INTO orders (buyer_id, total_amount, delivery_address, delivery_time, stripe_payment_id)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, total.toFixed(2), delivery_address, delivery_time || 'flexible', stripe_payment_id || null]
    );
    const order_id = result.insertId;

    for (const item of enriched) {
      await conn.query(
        'INSERT INTO order_items (order_id, listing_id, quantity, unit_price) VALUES (?,?,?,?)',
        [order_id, item.listing_id, item.quantity, item.unit_price]
      );
      await conn.query(
        'UPDATE listings SET quantity = quantity - ? WHERE listing_id = ?',
        [item.quantity, item.listing_id]
      );
    }

    // ── Commission ledger: one farmer_payouts row per farmer in this order ──
    // We do this inside the same transaction so it commits atomically with the
    // order. If the platform commission rate query fails we fall back to 10%.
    const commissionRate = await getCommissionRate();
    for (const [farmer_id, farmer] of farmerEmails.entries()) {
      const grossAmount = farmer.items.reduce(
        (sum, i) => sum + Number(i.unit_price) * Number(i.quantity), 0
      );
      const commissionAmount = Math.round(grossAmount * commissionRate * 100) / 100;
      const netAmount        = Math.round((grossAmount - commissionAmount) * 100) / 100;

      await conn.query(
        `INSERT INTO farmer_payouts
           (order_id, farmer_id, gross_amount, commission_rate, commission_amount, net_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [order_id, farmer_id, grossAmount.toFixed(2), commissionRate, commissionAmount.toFixed(2), netAmount.toFixed(2)]
      );
    }

    await conn.commit();

    // Log to audit
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?, ?, ?, ?, 'success')`,
      [req.user.user_id, 'order_placed', `Placed order #${order_id} for $${total.toFixed(2)}`, req.ip]
    );

    // Send emails async
    const [buyer] = await db.query('SELECT full_name, email FROM users WHERE user_id = ?', [req.user.user_id]);
    if (buyer.length) {
      sendOrderConfirmation(buyer[0].email, buyer[0].full_name, { order_id, total_amount: total.toFixed(2), delivery_address, items: enriched })
        .catch(e => console.log('Buyer email failed:', e.message));
    }
    farmerEmails.forEach(farmer => {
      sendFarmerOrderAlert(farmer.email, farmer.name, { order_id, total_amount: total.toFixed(2), delivery_address, items: farmer.items })
        .catch(e => console.log('Farmer email failed:', e.message));
    });

    res.status(201).json({ message: 'Order placed!', order_id, total });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ message: err.message || 'Error placing order.' });
  } finally {
    conn.release();
  }
});

// ══ DYNAMIC ROUTES (/:id must come last) ════════════════

// GET /api/orders/:id — single order with timeline
router.get('/:id', protect, async (req, res) => {
  try {
    const [order] = await db.query(
      `SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email
       FROM orders o JOIN users u ON o.buyer_id = u.user_id
       WHERE o.order_id = ? AND (o.buyer_id = ? OR ? = 'admin')`,
      [req.params.id, req.user.user_id, req.user.role]
    );
    if (!order.length) return res.status(404).json({ message: 'Order not found.' });

    const [items] = await db.query(
      `SELECT oi.*, l.title, l.image_url, l.unit, u.full_name AS farmer_name
       FROM order_items oi
       JOIN listings l ON oi.listing_id = l.listing_id
       JOIN users u ON l.farmer_id = u.user_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    const statuses = ['pending','confirmed','shipped','delivered'];
    const currentIdx = statuses.indexOf(order[0].status);
    const icons = ['📋','✅','🚚','🏠'];
    const descriptions = [
      'Order received and being processed',
      'Farmer confirmed and is preparing your order',
      'Your order is on its way to you',
      'Order delivered successfully'
    ];
    const timeline = statuses.map((s, i) => ({
      status: s, label: s.charAt(0).toUpperCase() + s.slice(1),
      done: i <= currentIdx, current: i === currentIdx,
      icon: icons[i], description: descriptions[i]
    }));

    res.json({ ...order[0], items, timeline });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order.' });
  }
});

// PATCH /api/orders/:id/status — farmer updates order status
router.patch('/:id/status', protect, async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed','shipped','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

  try {
    if (req.user.role === 'farmer') {
      const [check] = await db.query(
        `SELECT o.order_id FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN listings l ON oi.listing_id = l.listing_id
         WHERE o.order_id = ? AND l.farmer_id = ?`,
        [req.params.id, req.user.user_id]
      );
      if (!check.length) return res.status(403).json({ message: 'Not your order.' });
    }

    await db.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?', [status, req.params.id]);

    // Send status email to buyer
    const [orderInfo] = await db.query(
      `SELECT o.order_id, o.total_amount, o.delivery_address, u.full_name AS buyer_name, u.email AS buyer_email
       FROM orders o JOIN users u ON o.buyer_id = u.user_id WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (orderInfo.length) {
      const o = orderInfo[0];
      sendStatusUpdate(o.buyer_email, o.buyer_name, { order_id: o.order_id, total_amount: o.total_amount, delivery_address: o.delivery_address }, status)
        .catch(e => console.log('Status email failed:', e.message));
    }

    res.json({ message: `Order updated to "${status}"!`, status });
  } catch (err) {
    res.status(500).json({ message: 'Error updating order.' });
  }
});

// PATCH /api/orders/:id/cancel — buyer cancels pending order
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM orders WHERE order_id = ? AND buyer_id = ? AND status = 'pending'`,
      [req.params.id, req.user.user_id]
    );
    if (!rows.length) return res.status(400).json({ message: 'Order not found or cannot be cancelled after dispatch.' });

    await db.query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE order_id = ?`, [req.params.id]);

    // Cancel related payout rows so they don't show up as owed to farmers
    await db.query(
      `UPDATE farmer_payouts SET status = 'cancelled'
       WHERE order_id = ? AND status = 'pending'`,
      [req.params.id]
    );

    // Restore stock
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await db.query('UPDATE listings SET quantity = quantity + ? WHERE listing_id = ?', [item.quantity, item.listing_id]);
    }

    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?, ?, ?, ?, 'success')`,
      [req.user.user_id, 'order_cancelled', `Order #${req.params.id} cancelled by buyer`, req.ip]
    );

    res.json({ message: 'Order cancelled and stock restored.' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling order.' });
  }
});

module.exports = router;