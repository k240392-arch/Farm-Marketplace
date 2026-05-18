// routes/reviews.js — Farm Produce Marketplace
// Used in TWO ways:
//   1. Nested:    app.use('/api/listings/:id/reviews', router)  → GET / and POST /
//   2. Standalone: app.use('/api/reviews', router)              → GET /my, GET /farmer/received
const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams lets us read :id from parent
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// ── STANDALONE ROUTES (for /api/reviews/my etc) ───────────
// These must come BEFORE the dynamic routes

// GET /api/reviews/my — buyer's own submitted reviews
router.get('/my', protect, async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, l.title AS listing_title, l.image_url
       FROM reviews r
       JOIN listings l ON r.listing_id = l.listing_id
       WHERE r.buyer_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.user_id]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your reviews.' });
  }
});

// GET /api/reviews/farmer/received — all reviews on farmer's listings
router.get('/farmer/received', protect, async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, l.title AS listing_title, u.full_name AS buyer_name
       FROM reviews r
       JOIN listings l ON r.listing_id = l.listing_id
       JOIN users u ON r.buyer_id = u.user_id
       WHERE l.farmer_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.user_id]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching received reviews.' });
  }
});

// POST /api/reviews — submit review (standalone, listing_id in body)
router.post('/', protect, async (req, res) => {
  // Works both as nested (/api/listings/:id/reviews) and standalone (/api/reviews)
  const listing_id = req.params.id || req.body.listing_id;
  const { rating, comment } = req.body;

  if (!listing_id) return res.status(400).json({ message: 'Listing ID required.' });
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  try {
    await db.query(
      'INSERT INTO reviews (buyer_id, listing_id, rating, comment) VALUES (?,?,?,?)',
      [req.user.user_id, listing_id, rating, comment]
    );

    // Update listing average rating
    await db.query(
      `UPDATE listings SET avg_rating = (
         SELECT AVG(rating) FROM reviews WHERE listing_id = ?
       ) WHERE listing_id = ?`,
      [listing_id, listing_id]
    ).catch(() => {}); // ignore if avg_rating column doesn't exist

    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status) VALUES (?, ?, ?, ?, 'success')`,
      [req.user.user_id, 'review_submitted', `Reviewed listing #${listing_id} with ${rating} stars`, req.ip]
    ).catch(() => {});

    res.status(201).json({ message: 'Review submitted!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'You have already reviewed this product.' });
    }
    res.status(500).json({ message: 'Error submitting review.' });
  }
});

// ── NESTED ROUTES (for /api/listings/:id/reviews) ─────────

// GET /api/listings/:id/reviews — all reviews for a listing
router.get('/', async (req, res) => {
  const listing_id = req.params.id;
  if (!listing_id) return res.status(400).json({ message: 'Listing ID required.' });
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.full_name AS buyer_name
       FROM reviews r JOIN users u ON r.buyer_id = u.user_id
       WHERE r.listing_id = ?
       ORDER BY r.created_at DESC`,
      [listing_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
});

module.exports = router;
