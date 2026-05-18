// server/routes/payments.js
// Stripe payment intents + saved payment methods for buyers.
//
// IMPORTANT: We NEVER touch raw card numbers, CVVs, or expiry dates server-side.
// Stripe Elements collects them in an iframe and gives us back a safe
// `payment_method_id` token — that's all we store, along with brand/last4/exp
// for display. This keeps us PCI-DSS-compliant.

const express = require('express');
const router  = express.Router();
const Stripe  = require('stripe');
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ── Auto-ensure schema on module load ─────────────────────
// 1. payment_methods table holds card metadata (no raw card data)
// 2. users.stripe_customer_id links each user to a Stripe customer record
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        payment_method_id        INT          AUTO_INCREMENT PRIMARY KEY,
        user_id                  INT          NOT NULL,
        stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
        card_brand               VARCHAR(20)  DEFAULT NULL,
        card_last4               VARCHAR(4)   DEFAULT NULL,
        card_exp_month           TINYINT      DEFAULT NULL,
        card_exp_year            SMALLINT     DEFAULT NULL,
        is_default               TINYINT(1)   NOT NULL DEFAULT 0,
        created_at               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
      )
    `);
    // Add stripe_customer_id to users if missing (idempotent)
    const [cols] = await db.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'stripe_customer_id'`
    );
    if (!cols.length) {
      await db.query(`ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL`);
    }
    console.log('✅ payment_methods table ready');
  } catch (err) {
    console.error('⚠️  Could not ensure payments schema:', err.message);
  }
})();

// ── Helper: get or create a Stripe customer for the user ──
async function getOrCreateStripeCustomer(user) {
  const [rows] = await db.query(
    `SELECT stripe_customer_id, full_name, email FROM users WHERE user_id = ?`,
    [user.user_id]
  );
  const u = rows[0];
  if (!u) throw new Error('User not found.');
  if (u.stripe_customer_id) return u.stripe_customer_id;

  const customer = await stripe.customers.create({
    email:    u.email,
    name:     u.full_name,
    metadata: { user_id: String(user.user_id) },
  });
  await db.query(
    `UPDATE users SET stripe_customer_id = ? WHERE user_id = ?`,
    [customer.id, user.user_id]
  );
  return customer.id;
}

// ──────────────────────────────────────────────────────────
//  EXISTING: one-time payment intent (used by Checkout)
// ──────────────────────────────────────────────────────────
// POST /api/payments/create-intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount),   // cents
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ message: 'Payment failed: ' + err.message });
  }
});

// ──────────────────────────────────────────────────────────
//  NEW: saved payment methods
// ──────────────────────────────────────────────────────────

// GET /api/payments/payment-methods
// → list all of the current user's saved cards
router.get('/payment-methods', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT payment_method_id, stripe_payment_method_id, card_brand,
              card_last4, card_exp_month, card_exp_year, is_default, created_at
         FROM payment_methods
        WHERE user_id = ?
        ORDER BY is_default DESC, created_at DESC`,
      [req.user.user_id]
    );
    res.json({ payment_methods: rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load payment methods: ' + err.message });
  }
});

// POST /api/payments/setup-intent
// → returns a SetupIntent client_secret. The frontend uses this with Stripe
//   Elements to collect the card and confirm on the client side. No charge
//   happens — it just attaches the card to the customer for future use.
router.post('/setup-intent', protect, async (req, res) => {
  try {
    const customerId = await getOrCreateStripeCustomer(req.user);
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage:    'off_session',
      payment_method_types: ['card'],
    });
    res.json({ clientSecret: setupIntent.client_secret, customerId });
  } catch (err) {
    console.error('SetupIntent error:', err.message);
    res.status(500).json({ message: 'Could not start card setup: ' + err.message });
  }
});

// POST /api/payments/payment-methods
// → after Stripe confirms the card on the client, the client posts back
//   { payment_method_id } so we can store the safe metadata in our DB.
//   We re-fetch the PaymentMethod from Stripe to get authoritative brand/last4
//   rather than trusting the client.
router.post('/payment-methods', protect, async (req, res) => {
  try {
    const { payment_method_id } = req.body || {};
    if (!payment_method_id || typeof payment_method_id !== 'string') {
      return res.status(400).json({ message: 'payment_method_id is required.' });
    }

    // Fetch from Stripe (server-side, authoritative)
    const pm = await stripe.paymentMethods.retrieve(payment_method_id);
    if (!pm || pm.type !== 'card' || !pm.card) {
      return res.status(400).json({ message: 'Not a valid card payment method.' });
    }

    // Make sure it belongs to (or is attached to) this user's customer
    const customerId = await getOrCreateStripeCustomer(req.user);
    if (pm.customer && pm.customer !== customerId) {
      return res.status(403).json({ message: 'Card belongs to a different customer.' });
    }
    if (!pm.customer) {
      // Attach to our customer if not already attached
      await stripe.paymentMethods.attach(pm.id, { customer: customerId });
    }

    // Is this the first card? If so, mark it default.
    const [existingRows] = await db.query(
      `SELECT COUNT(*) AS n FROM payment_methods WHERE user_id = ?`,
      [req.user.user_id]
    );
    const isFirst = existingRows[0].n === 0;

    await db.query(
      `INSERT INTO payment_methods
         (user_id, stripe_payment_method_id, card_brand, card_last4,
          card_exp_month, card_exp_year, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE card_brand = VALUES(card_brand),
                               card_last4 = VALUES(card_last4),
                               card_exp_month = VALUES(card_exp_month),
                               card_exp_year = VALUES(card_exp_year)`,
      [
        req.user.user_id,
        pm.id,
        pm.card.brand,
        pm.card.last4,
        pm.card.exp_month,
        pm.card.exp_year,
        isFirst ? 1 : 0,
      ]
    );

    db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'card_added', ?, ?, 'success')`,
      [req.user.user_id, `Added ${pm.card.brand} •••• ${pm.card.last4}`, req.ip]
    ).catch(() => {});

    res.json({ message: 'Card saved!', card: { brand: pm.card.brand, last4: pm.card.last4, is_default: isFirst } });
  } catch (err) {
    console.error('Save card error:', err.message);
    res.status(500).json({ message: 'Could not save card: ' + err.message });
  }
});

// DELETE /api/payments/payment-methods/:id
router.delete('/payment-methods/:id', protect, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid payment method id.' });

    const [rows] = await db.query(
      `SELECT stripe_payment_method_id, is_default FROM payment_methods
        WHERE payment_method_id = ? AND user_id = ?`,
      [id, req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Card not found.' });

    // Detach from Stripe (best-effort — don't block delete if Stripe call fails)
    try { await stripe.paymentMethods.detach(rows[0].stripe_payment_method_id); }
    catch (e) { console.warn('Stripe detach failed:', e.message); }

    await db.query(
      `DELETE FROM payment_methods WHERE payment_method_id = ? AND user_id = ?`,
      [id, req.user.user_id]
    );

    // If we just deleted the default, promote another card to default (if any)
    if (rows[0].is_default) {
      await db.query(
        `UPDATE payment_methods SET is_default = 1
          WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [req.user.user_id]
      );
    }
    res.json({ message: 'Card removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove card: ' + err.message });
  }
});

// PATCH /api/payments/payment-methods/:id/default
router.patch('/payment-methods/:id/default', protect, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid payment method id.' });

    // Verify the card belongs to this user
    const [rows] = await db.query(
      `SELECT 1 FROM payment_methods WHERE payment_method_id = ? AND user_id = ?`,
      [id, req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Card not found.' });

    // Atomically: clear all defaults for this user, then set this one
    await db.query(`UPDATE payment_methods SET is_default = 0 WHERE user_id = ?`, [req.user.user_id]);
    await db.query(`UPDATE payment_methods SET is_default = 1 WHERE payment_method_id = ?`, [id]);
    res.json({ message: 'Default card updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update default: ' + err.message });
  }
});

module.exports = router;