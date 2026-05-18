// routes/listings.js
// CRUD for product listings

const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const multer   = require('multer');
const path     = require('path');

// ── MULTER FILE UPLOAD SETUP ───────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Images only (jpg, png, webp)'));
  }
});

// ── GET ALL FARMERS (public) — for buyer filter dropdown ───
// GET /api/listings/farmers
router.get('/farmers', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT u.user_id, u.full_name AS farm_name
       FROM users u
       JOIN listings l ON l.farmer_id = u.user_id
       WHERE u.role = 'farmer' AND l.is_active = 1
       ORDER BY u.full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching farmers.' });
  }
});

// ── GET ALL LISTINGS (public) ──────────────────────────────
// GET /api/listings?category=1&search=tomato&min=5&max=20&farmer_id=3&page=1
router.get('/', async (req, res) => {
  const { category, search, min, max, farmer_id, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT l.*, u.full_name AS farmer_name, c.name AS category_name,
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           COUNT(r.review_id) AS review_count
    FROM listings l
    JOIN users u ON l.farmer_id = u.user_id
    JOIN categories c ON l.category_id = c.category_id
    LEFT JOIN reviews r ON l.listing_id = r.listing_id
    WHERE l.is_active = 1
  `;
  const params = [];

  if (category)  { query += ' AND l.category_id = ?';  params.push(category); }
  if (search)    { query += ' AND l.title LIKE ?';      params.push(`%${search}%`); }
  if (min)       { query += ' AND l.price >= ?';        params.push(min); }
  if (max)       { query += ' AND l.price <= ?';        params.push(max); }
  if (farmer_id) { query += ' AND l.farmer_id = ?';     params.push(farmer_id); }

  query += ' GROUP BY l.listing_id ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  try {
    const [rows] = await db.query(query, params);
    res.json({ listings: rows, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching listings.' });
  }
});

// ── GET FEATURED LISTINGS (public, home page) ──────────────
// GET /api/listings/featured?limit=8
// Returns a curated mix with farmer + category variety.
// Strategy: pick at most ONE listing per farmer, then at most ONE per category,
// then fall back to fill the rest. This stops the home page from showing 8
// listings from the same person.
router.get('/featured', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 8, 20);
  try {
    // Pull a wider candidate pool sorted by appeal (has image, has rating, recency).
    const [rows] = await db.query(`
      SELECT l.*, u.full_name AS farmer_name, c.name AS category_name,
             COALESCE(AVG(r.rating), 0) AS avg_rating,
             COUNT(r.review_id) AS review_count,
             CASE WHEN l.image_url IS NOT NULL AND l.image_url <> '' THEN 1 ELSE 0 END AS has_image
      FROM listings l
      JOIN users u ON l.farmer_id = u.user_id
      JOIN categories c ON l.category_id = c.category_id
      LEFT JOIN reviews r ON l.listing_id = r.listing_id
      WHERE l.is_active = 1 AND l.quantity > 0
      GROUP BY l.listing_id
      ORDER BY has_image DESC, avg_rating DESC, review_count DESC, l.created_at DESC
      LIMIT 80
    `);

    // Diversify: walk the pool, keep one per farmer first, then fill in.
    const seenFarmer   = new Set();
    const seenCategory = new Set();
    const featured     = [];
    const leftovers    = [];

    for (const row of rows) {
      if (featured.length >= limit) break;
      if (!seenFarmer.has(row.farmer_id) && !seenCategory.has(row.category_id)) {
        featured.push(row);
        seenFarmer.add(row.farmer_id);
        seenCategory.add(row.category_id);
      } else {
        leftovers.push(row);
      }
    }
    // Top up from leftovers — relax category constraint, keep farmer variety
    for (const row of leftovers) {
      if (featured.length >= limit) break;
      if (!seenFarmer.has(row.farmer_id)) {
        featured.push(row);
        seenFarmer.add(row.farmer_id);
      }
    }
    // Final top-up — accept anything to meet `limit`
    for (const row of leftovers) {
      if (featured.length >= limit) break;
      if (!featured.find(f => f.listing_id === row.listing_id)) featured.push(row);
    }

    // De-duplicate identical image_urls — if 3 listings share one uploaded image,
    // null the duplicates so the frontend helper picks varied placeholders instead.
    const seenUrls = new Set();
    for (const row of featured) {
      if (row.image_url) {
        if (seenUrls.has(row.image_url)) {
          row.image_url = null;        // force the frontend to fall back
        } else {
          seenUrls.add(row.image_url);
        }
      }
    }

    res.json({ listings: featured });
  } catch (err) {
    console.error('Error in /featured:', err);
    res.status(500).json({ message: 'Error fetching featured listings.' });
  }
});

// ── GET SINGLE LISTING (public) ────────────────────────────
// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.full_name AS farmer_name, u.email AS farmer_email,
             c.name AS category_name,
             COALESCE(AVG(r.rating), 0) AS avg_rating
      FROM listings l
      JOIN users u ON l.farmer_id = u.user_id
      JOIN categories c ON l.category_id = c.category_id
      LEFT JOIN reviews r ON l.listing_id = r.listing_id
      WHERE l.listing_id = ? AND l.is_active = 1
      GROUP BY l.listing_id
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listing.' });
  }
});

// ── CREATE LISTING (farmer only) ───────────────────────────
// POST /api/listings
router.post('/', protect, farmerOnly, upload.single('image'), async (req, res) => {
  const { product_id, title, description, price, quantity, unit, category_id, location } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !price || !category_id) {
    return res.status(400).json({ message: 'Title, price, and category are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO listings (farmer_id, product_id, category_id, title, description, price, quantity, unit, location, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, product_id || null, category_id, title, description, price, quantity, unit || 'kg', location, image_url]
    );
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'listing_created', ?, ?, 'success')`,
      [req.user.user_id, `Created listing #${result.insertId} "${title}" — $${price}/${unit || 'kg'}, stock ${quantity}`, req.ip]
    ).catch(() => {});
    res.status(201).json({ message: 'Listing created!', listing_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating listing.' });
  }
});

// ── UPDATE LISTING (farmer only) ───────────────────────────
// PUT /api/listings/:id
router.put('/:id', protect, farmerOnly, upload.single('image'), async (req, res) => {
  const { title, description, price, quantity, unit, category_id, location, is_active } = req.body;

  try {
    // Pull current state for audit-trail diff
    const [rows] = await db.query(
      'SELECT * FROM listings WHERE listing_id = ?', [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found.' });
    const before = rows[0];

    // Owner check — admins can also edit (used by admin restock)
    if (before.farmer_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your listing.' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    const fields = { title, description, price, quantity, unit, category_id, location, is_active };
    if (image_url) fields.image_url = image_url;

    await db.query('UPDATE listings SET ? WHERE listing_id = ?', [fields, req.params.id]);

    // ── Audit log: build a human-readable diff of what changed ──
    const changes = [];
    if (title       !== undefined && String(title)       !== String(before.title))       changes.push(`title: "${before.title}" → "${title}"`);
    if (price       !== undefined && Number(price)       !== Number(before.price))       changes.push(`price: $${before.price} → $${price}`);
    if (quantity    !== undefined && Number(quantity)    !== Number(before.quantity))    changes.push(`stock: ${before.quantity} → ${quantity}`);
    if (unit        !== undefined && String(unit)        !== String(before.unit))        changes.push(`unit: ${before.unit} → ${unit}`);
    if (category_id !== undefined && Number(category_id) !== Number(before.category_id)) changes.push(`category_id: ${before.category_id} → ${category_id}`);
    if (location    !== undefined && String(location)    !== String(before.location))    changes.push(`location: "${before.location}" → "${location}"`);
    if (is_active   !== undefined && Number(is_active)   !== Number(before.is_active))   changes.push(`active: ${before.is_active ? 'yes' : 'no'} → ${Number(is_active) ? 'yes' : 'no'}`);
    if (image_url)                                                                       changes.push(`image replaced`);

    if (changes.length) {
      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
         VALUES (?, 'listing_updated', ?, ?, 'success')`,
        [req.user.user_id, `Listing #${req.params.id} ("${before.title}") — ${changes.join('; ')}`, req.ip]
      ).catch(() => {});
    }

    res.json({ message: 'Listing updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating listing.' });
  }
});

// ── DELETE LISTING (farmer or admin) ───────────────────────────
// DELETE /api/listings/:id
router.delete('/:id', protect, farmerOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT farmer_id, title FROM listings WHERE listing_id = ?', [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found.' });
    if (rows[0].farmer_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your listing.' });
    }

    // Soft delete — keeps order history intact
    await db.query('UPDATE listings SET is_active = 0 WHERE listing_id = ?', [req.params.id]);

    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'listing_deleted', ?, ?, 'success')`,
      [req.user.user_id, `Listing #${req.params.id} ("${rows[0].title}") deleted`, req.ip]
    ).catch(() => {});

    res.json({ message: 'Listing deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting listing.' });
  }
});

// ── RESTOCK LISTING ────────────────────────────────────────
// PATCH /api/listings/:id/restock
router.patch('/:id/restock', protect, farmerOnly, async (req, res) => {
  const { add_quantity } = req.body;
  if (!add_quantity || isNaN(add_quantity) || Number(add_quantity) <= 0) {
    return res.status(400).json({ message: 'Provide a valid add_quantity > 0.' });
  }
  try {
    const [rows] = await db.query('SELECT farmer_id, title, quantity FROM listings WHERE listing_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found.' });
    if (rows[0].farmer_id !== req.user.user_id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not your listing.' });

    await db.query(
      'UPDATE listings SET quantity = quantity + ?, is_active = 1 WHERE listing_id = ?',
      [Number(add_quantity), req.params.id]
    );
    const [updated] = await db.query('SELECT quantity FROM listings WHERE listing_id = ?', [req.params.id]);

    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'listing_restocked', ?, ?, 'success')`,
      [req.user.user_id, `Restocked listing #${req.params.id} ("${rows[0].title}") — added ${add_quantity} (now ${updated[0].quantity})`, req.ip]
    ).catch(() => {});

    res.json({ message: 'Restocked!', new_quantity: updated[0].quantity });
  } catch (err) {
    res.status(500).json({ message: 'Error restocking.' });
  }
});

// ── MARK OUT OF STOCK ──────────────────────────────────────
// PATCH /api/listings/:id/out-of-stock
router.patch('/:id/out-of-stock', protect, farmerOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT farmer_id, title FROM listings WHERE listing_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found.' });
    if (rows[0].farmer_id !== req.user.user_id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not your listing.' });

    await db.query('UPDATE listings SET quantity = 0 WHERE listing_id = ?', [req.params.id]);

    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'listing_out_of_stock', ?, ?, 'success')`,
      [req.user.user_id, `Marked listing #${req.params.id} ("${rows[0].title}") as out of stock`, req.ip]
    ).catch(() => {});

    res.json({ message: 'Marked as out of stock.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating stock.' });
  }
});

// ── MARK IN STOCK ──────────────────────────────────────────
// PATCH /api/listings/:id/in-stock
router.patch('/:id/in-stock', protect, farmerOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT farmer_id, title FROM listings WHERE listing_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found.' });
    if (rows[0].farmer_id !== req.user.user_id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not your listing.' });

    await db.query('UPDATE listings SET is_active = 1 WHERE listing_id = ?', [req.params.id]);

    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'listing_in_stock', ?, ?, 'success')`,
      [req.user.user_id, `Marked listing #${req.params.id} ("${rows[0].title}") as in stock again`, req.ip]
    ).catch(() => {});

    res.json({ message: 'Marked as in stock.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating stock.' });
  }
});

// ── MY LISTINGS (farmer's own) ─────────────────────────────
// GET /api/listings/farmer/mine
router.get('/farmer/mine', protect, farmerOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, c.name AS category_name FROM listings l
       JOIN categories c ON l.category_id = c.category_id
       WHERE l.farmer_id = ? ORDER BY l.created_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your listings.' });
  }
});

module.exports = router;