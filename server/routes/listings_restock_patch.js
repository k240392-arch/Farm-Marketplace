// ── ADD THIS to server/routes/listings.js ────────────────
// Place it before: module.exports = router;

// PATCH /api/listings/:id/restock  — farmer restocks an out-of-stock listing
router.patch('/:id/restock', protect, async (req, res) => {
  try {
    const { quantity, price } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Verify farmer owns this listing
    const [rows] = await db.query(
      'SELECT * FROM listings WHERE listing_id = ? AND farmer_id = ?',
      [req.params.id, req.user.user_id]
    );

    if (!rows.length) {
      return res.status(403).json({ message: 'Listing not found or you do not own it' });
    }

    // Update quantity, reactivate listing, optionally update price
    let query = 'UPDATE listings SET quantity = ?, is_active = 1';
    const params = [quantity];

    if (price && price > 0) {
      query += ', price = ?';
      params.push(price);
    }

    query += ', updated_at = NOW() WHERE listing_id = ?';
    params.push(req.params.id);

    await db.query(query, params);

    // Log to audit trail
    await db.query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, status)
       VALUES (?, 'listing_restocked', ?, ?, 'success')`,
      [req.user.user_id, `Restocked listing #${req.params.id} with ${quantity} units`, req.ip]
    );

    // Save version history if table exists
    try {
      const [listing] = await db.query('SELECT * FROM listings WHERE listing_id = ?', [req.params.id]);
      if (listing.length) {
        await db.query(
          `INSERT INTO listing_versions (listing_id, version_number, data_snapshot, changed_by, action)
           VALUES (?, COALESCE((SELECT MAX(version_number) FROM listing_versions lv WHERE lv.listing_id = ?), 0) + 1, ?, ?, 'restocked')`,
          [req.params.id, req.params.id, JSON.stringify(listing[0]), req.user.user_id]
        );
      }
    } catch (e) {
      // listing_versions table may not exist yet — ignore
    }

    res.json({ message: `Listing restocked with ${quantity} units and set to Active!` });

  } catch (err) {
    console.error('Restock error:', err.message);
    res.status(500).json({ message: 'Restock failed: ' + err.message });
  }
});

// Also ensure reviews are accessible via this route as fallback
// In server.js, make sure reviews route is registered BEFORE listings:
// app.use('/api/listings/:id/reviews', require('./routes/reviews'));  ← FIRST
// app.use('/api/listings',             require('./routes/listings'));  ← SECOND
