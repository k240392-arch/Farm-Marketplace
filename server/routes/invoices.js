// server/routes/invoices.js
// FR-30: Invoice generation and download
const express = require('express');
const router  = express.Router();
const PDFDocument = require('pdfkit');
const db      = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// ── GET /api/invoices/:orderId  ───────────────────────
// Download invoice as PDF — buyer or admin only
router.get('/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.user_id;
    const role   = req.user.role;

    // Fetch order with all details
    let orderQuery = `
      SELECT o.*,
        u.full_name AS buyer_name, u.email AS buyer_email,
        f.full_name AS farmer_name, f.email AS farmer_email
      FROM orders o
      JOIN users u ON o.buyer_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN listings l ON oi.listing_id = l.listing_id
      LEFT JOIN users f ON l.farmer_id = f.user_id
      WHERE o.order_id = ?`;

    const params = [orderId];
    if (role !== 'admin') {
      orderQuery += ' AND o.buyer_id = ?';
      params.push(userId);
    }

    const [orders] = await db.query(orderQuery, params);
    if (!orders.length) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orders[0];

    // Fetch order items
    const [items] = await db.query(`
      SELECT oi.quantity, oi.unit_price,
             l.title, l.unit,
             u.full_name AS farmer_name
      FROM order_items oi
      JOIN listings l ON oi.listing_id = l.listing_id
      JOIN users u ON l.farmer_id = u.user_id
      WHERE oi.order_id = ?
    `, [orderId]);

    const subtotal   = parseFloat(order.total_amount) / 1.10;
    const gst        = parseFloat(order.total_amount) - subtotal;
    const invoiceNum = `INV-${String(orderId).padStart(6, '0')}`;
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-AU', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    // ── BUILD PDF ───────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoiceNum}.pdf"`);
    doc.pipe(res);

    // Header bar
    doc.rect(0, 0, 595, 80).fill('#1B5E20');
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
       .text('FarmMarket', 50, 26);
    doc.fontSize(10).font('Helvetica')
       .text('Australia\'s Farm-to-Table Marketplace', 50, 52);
    doc.fillColor('#A5D6A7').fontSize(10)
       .text('TAX INVOICE', 450, 26)
       .text(invoiceNum, 450, 42)
       .text(invoiceDate, 450, 58);

    // Reset color
    doc.fillColor('#000000');
    let y = 110;

    // Bill To section
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2E7D32')
       .text('BILL TO', 50, y);
    doc.fillColor('#000000').font('Helvetica')
       .text(order.buyer_name, 50, y + 16)
       .text(order.buyer_email, 50, y + 30)
       .text(order.delivery_address, 50, y + 44, { width: 200 });

    // Order info
    doc.font('Helvetica-Bold').fillColor('#2E7D32')
       .text('ORDER DETAILS', 350, y);
    doc.fillColor('#000000').font('Helvetica')
       .text(`Order #: ${orderId}`, 350, y + 16)
       .text(`Status: ${order.status.toUpperCase()}`, 350, y + 30)
       .text(`Payment: Stripe (${order.stripe_payment_id || 'N/A'})`, 350, y + 44, { width: 180 });

    if (order.delivery_time) {
      doc.text(`Delivery time: ${order.delivery_time}`, 350, y + 58);
      y += 14;
    }

    y += 90;

    // Divider
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#2E7D32').lineWidth(1.5).stroke();
    y += 12;

    // Table header
    doc.rect(50, y, 495, 24).fill('#E8F5E9');
    doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(9)
       .text('PRODUCT', 60, y + 7)
       .text('FARMER', 240, y + 7)
       .text('QTY', 350, y + 7)
       .text('UNIT PRICE', 395, y + 7)
       .text('AMOUNT', 480, y + 7);
    y += 24;

    // Items
    doc.fillColor('#000000').font('Helvetica').fontSize(9);
    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
      const amount = (item.quantity * item.unit_price).toFixed(2);
      doc.rect(50, y, 495, 22).fill(bg);
      doc.fillColor('#000000')
         .text(item.title, 60, y + 6, { width: 170 })
         .text(item.farmer_name, 240, y + 6, { width: 100 })
         .text(`${item.quantity} ${item.unit || ''}`, 350, y + 6)
         .text(`$${parseFloat(item.unit_price).toFixed(2)}`, 395, y + 6)
         .text(`$${amount}`, 480, y + 6);
      y += 22;
    });

    // Totals
    y += 12;
    doc.moveTo(350, y).lineTo(545, y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
    y += 8;

    const totalsX = 380;
    doc.font('Helvetica').fontSize(10)
       .text('Subtotal (excl. GST):', totalsX, y)
       .text(`$${subtotal.toFixed(2)}`, 490, y, { align: 'right', width: 55 });
    y += 18;
    doc.text('GST (10%):', totalsX, y)
       .text(`$${gst.toFixed(2)}`, 490, y, { align: 'right', width: 55 });
    y += 8;

    doc.moveTo(350, y).lineTo(545, y).strokeColor('#2E7D32').lineWidth(1).stroke();
    y += 10;

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B5E20')
       .text('TOTAL (incl. GST):', totalsX, y)
       .text(`$${parseFloat(order.total_amount).toFixed(2)}`, 490, y, { align: 'right', width: 55 });

    // Footer
    const footerY = 750;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#2E7D32').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#888888')
       .text('FarmMarket | CPRO306 Capstone Project | Kent Institute Australia 2026', 50, footerY + 8, { align: 'center', width: 495 })
       .text('This is a tax invoice for GST purposes. ABN: 00 000 000 000 (demo only)', 50, footerY + 20, { align: 'center', width: 495 });

    doc.end();

    // Log to audit
    await db.query(`INSERT INTO activity_logs (user_id, action, description, ip_address, status)
      VALUES (?, 'invoice_downloaded', ?, ?, 'success')`,
      [userId, `Invoice downloaded for order #${orderId}`, req.ip]);

  } catch (err) {
    console.error('Invoice error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Invoice generation failed' });
  }
});

module.exports = router;