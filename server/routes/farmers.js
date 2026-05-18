// routes/farmers.js — Public farmer storefronts + farmer earnings
//
// Endpoints:
//   GET  /api/farmers/:id           — public storefront (profile, listings, rating)
//   GET  /api/farmers/me/earnings   — logged-in farmer's totals + payout history
//
// The :id route must come AFTER /me/* so /me isn't matched as an id param.

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// ── Helper: is this route segment a numeric ID? ───────────────
const isNumericId = (s) => /^\d+$/.test(String(s));

// ══════════════════════════════════════════════════════════════
// GET /api/farmers/me/earnings  — current farmer's earnings dashboard
// ══════════════════════════════════════════════════════════════
router.get('/me/earnings', protect, async (req, res) => {
  try {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Farmer access only.' });
    }
    const fid = req.user.user_id;

    // Totals across all payouts
    const [[totals]] = await db.query(
      `SELECT
         COALESCE(SUM(gross_amount), 0)      AS gross_total,
         COALESCE(SUM(commission_amount), 0) AS commission_total,
         COALESCE(SUM(net_amount), 0)        AS net_total,
         COALESCE(SUM(CASE WHEN status='pending' THEN net_amount ELSE 0 END), 0) AS pending_amount,
         COALESCE(SUM(CASE WHEN status='paid'    THEN net_amount ELSE 0 END), 0) AS paid_amount,
         COUNT(*)                            AS payout_count
       FROM farmer_payouts WHERE farmer_id = ?`,
      [fid]
    );

    // Recent payouts (last 50)
    const [payouts] = await db.query(
      `SELECT fp.*, o.created_at AS order_created_at, o.status AS order_status
         FROM farmer_payouts fp
         JOIN orders o ON o.order_id = fp.order_id
        WHERE fp.farmer_id = ?
        ORDER BY fp.created_at DESC
        LIMIT 50`,
      [fid]
    );

    res.json({ totals, payouts });
  } catch (err) {
    console.error('GET /farmers/me/earnings error:', err);
    res.status(500).json({ message: 'Error fetching earnings.' });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/farmers/:id  — public storefront page
// ══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  const fid = req.params.id;
  if (!isNumericId(fid)) return res.status(400).json({ message: 'Invalid farmer id.' });

  try {
    // 1. Farmer profile (only the public fields)
    const [[farmer]] = await db.query(
      `SELECT user_id, full_name, profile_image, created_at
         FROM users
        WHERE user_id = ? AND role = 'farmer' AND is_active = 1`,
      [fid]
    );
    if (!farmer) return res.status(404).json({ message: 'Farmer not found.' });

    // 2. Their active listings with rating
    const [listings] = await db.query(
      `SELECT l.listing_id, l.title, l.description, l.price, l.quantity,
              l.unit, l.location, l.image_url, l.created_at,
              c.name AS category_name,
              COALESCE(AVG(r.rating), 0)  AS avg_rating,
              COUNT(r.review_id)          AS review_count
         FROM listings l
         JOIN categories c ON l.category_id = c.category_id
         LEFT JOIN reviews r ON l.listing_id = r.listing_id
        WHERE l.farmer_id = ? AND l.is_active = 1
        GROUP BY l.listing_id
        ORDER BY l.created_at DESC`,
      [fid]
    );

    // 3. Aggregated farmer rating — flat average across all reviews of all
    //    their listings. We compute it directly so it's accurate even when
    //    some listings have no reviews.
    const [[rating]] = await db.query(
      `SELECT
         COALESCE(AVG(r.rating), 0) AS farmer_avg_rating,
         COUNT(r.review_id)         AS farmer_review_count
       FROM reviews r
       JOIN listings l ON l.listing_id = r.listing_id
       WHERE l.farmer_id = ?`,
      [fid]
    );

    // 4. Total sales count (delivered orders that contained any of their listings)
    const [[sales]] = await db.query(
      `SELECT COUNT(DISTINCT o.order_id) AS sales_count
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.order_id
         JOIN listings l ON l.listing_id = oi.listing_id
        WHERE l.farmer_id = ? AND o.status = 'delivered'`,
      [fid]
    );

    // 5. Recent reviews across all their listings (last 6, for the storefront)
    const [recentReviews] = await db.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
              u.full_name AS buyer_name,
              l.title     AS listing_title,
              l.listing_id
         FROM reviews r
         JOIN listings l ON r.listing_id = l.listing_id
         JOIN users u    ON r.buyer_id = u.user_id
        WHERE l.farmer_id = ?
        ORDER BY r.created_at DESC
        LIMIT 6`,
      [fid]
    );

    res.json({
      farmer: {
        ...farmer,
        avg_rating:    Number(rating.farmer_avg_rating) || 0,
        review_count:  Number(rating.farmer_review_count) || 0,
        sales_count:   Number(sales.sales_count) || 0,
        listing_count: listings.length,
      },
      listings,
      recent_reviews: recentReviews,
    });
  } catch (err) {
    console.error('GET /farmers/:id error:', err);
    res.status(500).json({ message: 'Error fetching farmer storefront.' });
  }
});

module.exports = router;