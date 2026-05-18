// server/routes/products.js
// ════════════════════════════════════════════════════════════════
// PRODUCTS CATALOG ROUTES — Amazon-style architecture
// Author: CPRO306 Capstone | Date: 2026
//
// These endpoints expose the canonical product catalog (Layer 1).
// Each product can have 0..N farmer listings (Layer 2 = offers).
//
// Key design decisions:
//   • Products always show up in search, even with zero offers
//     (page just shows "Currently unavailable")
//   • When listings exist, we surface min_price, total_stock, count
//   • Single product page returns ALL farmer offers, sorted by price
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ────────────────────────────────────────────────────────────────
// GET /api/products
// List products with filters. Always populated (catalog-first).
// Query params:
//   ?search=tomato        — fuzzy search on name + description
//   ?category=1           — filter by category_id
//   ?season=summer        — filter by season (summer/autumn/winter/spring)
//   ?in_stock=1           — only products with at least one farmer offer
//   ?sort=price_asc|price_desc|newest|popular
//   ?page=1&limit=24
// ────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      search, category, season,
      in_stock, sort = 'newest',
      page = 1, limit = 24,
    } = req.query;

    const lim    = Math.min(parseInt(limit, 10) || 24, 60);
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    // Build WHERE clauses safely with parameterised queries
    const where  = ['p.is_active = 1'];
    const params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      where.push('p.category_id = ?');
      params.push(category);
    }
    if (season) {
      where.push('p.season = ? AND p.is_seasonal = 1');
      params.push(season);
    }
    if (in_stock === '1') {
      // Only products with at least one active listing that has stock
      where.push(`EXISTS (
        SELECT 1 FROM listings l
        WHERE l.product_id = p.product_id
          AND l.is_active  = 1
          AND l.quantity   > 0
      )`);
    }

    // ORDER BY (whitelist sort options to prevent SQL injection)
    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc')  orderBy = 'min_price ASC';
    if (sort === 'price_desc') orderBy = 'min_price DESC';
    if (sort === 'popular')    orderBy = 'offers_count DESC, p.name ASC';
    if (sort === 'name')       orderBy = 'p.name ASC';

    // The big query: products + aggregated offer stats
    const [rows] = await db.query(
      `SELECT
         p.product_id, p.name, p.slug, p.description,
         p.default_image, p.default_unit, p.is_seasonal, p.season,
         p.category_id, c.name AS category_name, c.icon AS category_icon,
         COUNT(DISTINCT CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.listing_id END) AS offers_count,
         MIN(CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.price END) AS min_price,
         MAX(CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.price END) AS max_price,
         COALESCE(SUM(CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.quantity END), 0) AS total_stock,
         COALESCE(
           (SELECT l2.image_url
              FROM listings l2
             WHERE l2.product_id = p.product_id
               AND l2.is_active = 1
               AND l2.image_url IS NOT NULL
             LIMIT 1),
           p.default_image
         ) AS image_url,
         (SELECT AVG(r.rating)
            FROM reviews r
            JOIN listings l3 ON l3.listing_id = r.listing_id
           WHERE l3.product_id = p.product_id
         ) AS avg_rating,
         (SELECT COUNT(*)
            FROM reviews r
            JOIN listings l3 ON l3.listing_id = r.listing_id
           WHERE l3.product_id = p.product_id
         ) AS review_count
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN listings l ON l.product_id = p.product_id
       WHERE ${where.join(' AND ')}
       GROUP BY p.product_id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );

    // Total count (for pagination)
    const [countRows] = await db.query(
      `SELECT COUNT(DISTINCT p.product_id) AS total
       FROM products p
       LEFT JOIN listings l ON l.product_id = p.product_id
       WHERE ${where.join(' AND ')}`,
      params
    );

    res.json({
      products:    rows,
      total:       countRows[0].total,
      page:        parseInt(page, 10),
      limit:       lim,
      total_pages: Math.ceil(countRows[0].total / lim),
    });
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ message: 'Error fetching products.' });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /api/products/seasonal
// Returns products marked seasonal for the CURRENT Australian month.
// Used by the Seasonal page hero and "what's in season now" grid.
// ────────────────────────────────────────────────────────────────
router.get('/seasonal', async (req, res) => {
  try {
    const month = new Date().getMonth();          // 0–11
    const seasonOf = (m) => {
      if (m >= 2 && m <= 4)  return 'autumn';
      if (m >= 5 && m <= 7)  return 'winter';
      if (m >= 8 && m <= 10) return 'spring';
      return 'summer';                            // Dec, Jan, Feb
    };
    const currentSeason = req.query.season || seasonOf(month);

    const [rows] = await db.query(
      `SELECT
         p.product_id, p.name, p.slug, p.description,
         p.default_image, p.default_unit, p.season,
         p.category_id, c.name AS category_name, c.icon AS category_icon,
         COUNT(DISTINCT CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.listing_id END) AS offers_count,
         MIN(CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.price END) AS min_price,
         COALESCE(SUM(CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.quantity END), 0) AS total_stock,
         COALESCE(
           (SELECT l2.image_url FROM listings l2
             WHERE l2.product_id = p.product_id AND l2.is_active = 1 AND l2.image_url IS NOT NULL
             LIMIT 1),
           p.default_image
         ) AS image_url
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN listings l ON l.product_id = p.product_id
       WHERE p.is_active = 1 AND p.is_seasonal = 1 AND p.season = ?
       GROUP BY p.product_id
       ORDER BY p.name ASC`,
      [currentSeason]
    );

    res.json({
      season:   currentSeason,
      month:    month + 1,
      products: rows,
    });
  } catch (err) {
    console.error('GET /api/products/seasonal error:', err);
    res.status(500).json({ message: 'Error fetching seasonal products.' });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /api/products/categories
// Quick endpoint: list categories WITH a product count.
// Useful for category nav so we know which categories aren't empty.
// ────────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         c.category_id, c.name, c.icon, c.description,
         COUNT(DISTINCT p.product_id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.category_id AND p.is_active = 1
       GROUP BY c.category_id
       ORDER BY product_count DESC, c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/products/categories error:', err);
    res.status(500).json({ message: 'Error fetching categories.' });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /api/products/:slug
// Single product page. Returns the catalog entry PLUS every farmer
// offer (sorted by price asc) so the frontend can render the
// "Available from N farmers" panel.
// ────────────────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    // 1. The catalog product itself
    const [productRows] = await db.query(
      `SELECT
         p.*, c.name AS category_name, c.icon AS category_icon
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );

    if (!productRows.length) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const product = productRows[0];

    // 2. All active farmer offers for this product
    const [offers] = await db.query(
      `SELECT
         l.listing_id, l.price, l.quantity, l.unit, l.location, l.image_url,
         l.description AS offer_description,
         l.created_at AS listed_at,
         u.user_id   AS farmer_id,
         u.full_name AS farmer_name,
         u.email     AS farmer_email,
         (SELECT AVG(r.rating)  FROM reviews r WHERE r.listing_id = l.listing_id) AS avg_rating,
         (SELECT COUNT(*)       FROM reviews r WHERE r.listing_id = l.listing_id) AS review_count
       FROM listings l
       JOIN users u ON u.user_id = l.farmer_id
       WHERE l.product_id = ? AND l.is_active = 1 AND l.quantity > 0
       ORDER BY l.price ASC`,
      [product.product_id]
    );

    // 3. Aggregated stats
    const min_price   = offers.length ? Math.min(...offers.map(o => parseFloat(o.price))) : null;
    const max_price   = offers.length ? Math.max(...offers.map(o => parseFloat(o.price))) : null;
    const total_stock = offers.reduce((sum, o) => sum + (o.quantity || 0), 0);

    // 4. Use a real listing image if available, else the catalog default
    const display_image = (offers.find(o => o.image_url) || {}).image_url || product.default_image;

    // 5. Related products (same category, popular)
    const [related] = await db.query(
      `SELECT
         p.product_id, p.name, p.slug, p.default_image, p.default_unit,
         COALESCE(
           (SELECT l2.image_url FROM listings l2
             WHERE l2.product_id = p.product_id AND l2.is_active = 1 AND l2.image_url IS NOT NULL
             LIMIT 1),
           p.default_image
         ) AS image_url,
         MIN(CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.price END) AS min_price,
         COUNT(DISTINCT CASE WHEN l.is_active = 1 AND l.quantity > 0 THEN l.listing_id END) AS offers_count
       FROM products p
       LEFT JOIN listings l ON l.product_id = p.product_id
       WHERE p.is_active = 1
         AND p.category_id = ?
         AND p.product_id != ?
       GROUP BY p.product_id
       ORDER BY offers_count DESC, p.name ASC
       LIMIT 6`,
      [product.category_id, product.product_id]
    );

    res.json({
      product: {
        ...product,
        display_image,
        min_price,
        max_price,
        total_stock,
        offers_count: offers.length,
        is_available: offers.length > 0 && total_stock > 0,
      },
      offers,
      related,
    });
  } catch (err) {
    console.error('GET /api/products/:slug error:', err);
    res.status(500).json({ message: 'Error fetching product.' });
  }
});

module.exports = router;