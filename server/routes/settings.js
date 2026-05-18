// routes/settings.js
// User preferences storage — one row per user, JSON columns per section.
// Sections: farm_details, notifications, privacy, payouts, appearance, bio
//
// Auto-creates the table on first load so there's no migration to run.

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// ── Auto-create table on module load ──
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id        INT          PRIMARY KEY,
        farm_details   TEXT         DEFAULT NULL,
        notifications  TEXT         DEFAULT NULL,
        privacy        TEXT         DEFAULT NULL,
        payouts        TEXT         DEFAULT NULL,
        appearance     TEXT         DEFAULT NULL,
        bio            TEXT         DEFAULT NULL,
        updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ user_settings table ready');
  } catch (err) {
    console.error('⚠️  Could not ensure user_settings table:', err.message);
  }
})();

// Allowed JSON sections + the bio plain-text field
const JSON_SECTIONS = ['farm_details', 'notifications', 'privacy', 'payouts', 'appearance'];
const ALL_FIELDS    = [...JSON_SECTIONS, 'bio'];

// Defaults returned when nothing has been saved yet
const DEFAULTS = {
  farm_details:  { farm_name: '', abn: '', description: '', delivery_radius: '25', pickup: true },
  notifications: { new_orders: true, order_updates: true, low_stock: true, weekly_report: true, buyer_messages: false, promotions: false, order_updates_buyer: true, new_arrivals: true, weekly_digest: true, sms_alerts: false, push_browser: true },
  privacy:       { profile_public: true, show_reviews: true, data_analytics: false, marketing: false },
  payouts:       { bank_name: '', bsb: '', account: '', schedule: 'weekly' },
  appearance:    { theme: 'light', language: 'en-AU', currency: 'AUD', density: 'comfortable' },
  bio:           '',
};

function safeParse(s, fallback) {
  if (s == null) return fallback;
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return fallback; }
}

// ── GET ALL SETTINGS for current user ──
router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT farm_details, notifications, privacy, payouts, appearance, bio
       FROM user_settings WHERE user_id = ?`,
      [req.user.user_id]
    );
    const row = rows[0] || {};
    res.json({
      farm_details:  safeParse(row.farm_details,  DEFAULTS.farm_details),
      notifications: safeParse(row.notifications, DEFAULTS.notifications),
      privacy:       safeParse(row.privacy,       DEFAULTS.privacy),
      payouts:       safeParse(row.payouts,       DEFAULTS.payouts),
      appearance:    safeParse(row.appearance,    DEFAULTS.appearance),
      bio:           row.bio ?? DEFAULTS.bio,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load settings: ' + err.message });
  }
});

// ── PATCH a single section ──
// Body: { section: 'notifications', value: {...} }   (value can be object OR plain string for `bio`)
router.patch('/', protect, async (req, res) => {
  try {
    const { section, value } = req.body;
    if (!section || !ALL_FIELDS.includes(section)) {
      return res.status(400).json({ message: 'Invalid settings section.' });
    }

    let stored;
    if (section === 'bio') {
      // bio is a plain text column; coerce to string and cap length
      stored = String(value ?? '').slice(0, 2000);
    } else {
      // JSON sections: must be an object
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return res.status(400).json({ message: 'Section value must be an object.' });
      }
      stored = JSON.stringify(value);
    }

    // Upsert: insert a row if missing, otherwise update just this column
    // Build the SQL dynamically but with a fixed whitelist (ALL_FIELDS) — safe.
    const col = section; // already validated against ALL_FIELDS
    await db.query(
      `INSERT INTO user_settings (user_id, ${col}) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ${col} = VALUES(${col}), updated_at = CURRENT_TIMESTAMP`,
      [req.user.user_id, stored]
    );

    // Audit log (best-effort)
    db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'settings_updated', ?, ?, 'success')`,
      [req.user.user_id, `Updated settings section: ${section}`, req.ip]
    ).catch(() => {});

    res.json({ message: 'Settings saved!', section, value: section === 'bio' ? stored : JSON.parse(stored) });
  } catch (err) {
    res.status(500).json({ message: 'Settings save failed: ' + err.message });
  }
});

module.exports = router;