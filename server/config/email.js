// config/email.js
// Email service using Nodemailer + Gmail SMTP
// Author: CPRO306 Capstone Project | Date: 2026

const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your normal password)
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.log('⚠️  Email service not configured:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

// ── EMAIL TEMPLATES ────────────────────────────────────────

// Shared header/footer HTML
const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f8faf5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1B5E20, #2E7D32); padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: #A5D6A7; margin: 6px 0 0; font-size: 14px; }
    .body { background: #fff; padding: 32px; border-radius: 0 0 12px 12px; }
    .btn { display: inline-block; background: #2E7D32; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px 0; }
    .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 14px 0; font-size: 16px; font-weight: bold; color: #1B5E20; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    .info-box { background: #f8faf5; border-radius: 8px; padding: 14px 18px; margin: 16px 0; }
    .step { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .step-icon { width: 32px; height: 32px; border-radius: 50%; background: #2E7D32; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; text-align: center; line-height: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 FarmMarket</h1>
      <p>Fresh from the farm to your table</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 FarmMarket — CPRO306 Capstone Project — Kent Institute Australia</p>
      <p>Questions? Email us at ALS_MELB@kent.edu.au</p>
    </div>
  </div>
</body>
</html>`;

// ── 1. ORDER CONFIRMATION (to buyer) ──────────────────────
const sendOrderConfirmation = async (buyerEmail, buyerName, order) => {
  const itemsHtml = order.items.map(item => `
    <div class="item-row">
      <span>${item.title} × ${item.quantity}</span>
      <span>$${(item.unit_price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const html = emailWrapper(`
    <h2 style="color:#1B5E20; margin-top:0">Order Confirmed! 🎉</h2>
    <p>Hi <strong>${buyerName}</strong>, your order has been placed successfully.</p>

    <div class="info-box">
      <p style="margin:0; font-size:13px; color:#888">ORDER NUMBER</p>
      <p style="margin:4px 0 0; font-size:22px; font-weight:900; color:#1B5E20">#${order.order_id}</p>
    </div>

    <h3 style="color:#1B5E20; font-size:15px">Your Items</h3>
    ${itemsHtml}
    <div class="total-row">
      <span>Total Paid</span>
      <span>$${Number(order.total_amount).toFixed(2)} AUD</span>
    </div>

    <div class="info-box">
      <p style="margin:0 0 6px; font-weight:bold; font-size:14px">📍 Delivering to:</p>
      <p style="margin:0; color:#555; font-size:14px">${order.delivery_address}</p>
    </div>

    <h3 style="color:#1B5E20; font-size:15px">What Happens Next?</h3>
    <div class="step"><div class="step-icon">✅</div><span style="font-size:14px"><strong>Order Confirmed</strong> — We've received your order</span></div>
    <div class="step"><div class="step-icon">📦</div><span style="font-size:14px"><strong>Being Packed</strong> — The farmer is preparing your produce</span></div>
    <div class="step"><div class="step-icon">🚚</div><span style="font-size:14px"><strong>Shipped</strong> — On its way to you</span></div>
    <div class="step"><div class="step-icon">🏠</div><span style="font-size:14px"><strong>Delivered</strong> — Enjoy your fresh produce!</span></div>

    <center>
      <a href="http://localhost:3000/orders/${order.order_id}/track" class="btn">
        Track My Order →
      </a>
    </center>

    <p style="color:#888; font-size:13px; text-align:center">
      You can track your order anytime by visiting My Orders in the app.
    </p>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket" <${process.env.EMAIL_USER}>`,
    to:      buyerEmail,
    subject: `✅ Order Confirmed #${order.order_id} — FarmMarket`,
    html
  });

  console.log(`📧 Order confirmation sent to ${buyerEmail}`);
};

// ── 2. NEW ORDER ALERT (to farmer) ────────────────────────
const sendFarmerOrderAlert = async (farmerEmail, farmerName, order) => {
  const itemsHtml = order.items.map(item => `
    <div class="item-row">
      <span>${item.title} × ${item.quantity} ${item.unit}</span>
      <span style="color:#2E7D32; font-weight:bold">$${(item.unit_price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const html = emailWrapper(`
    <h2 style="color:#1B5E20; margin-top:0">New Order Received! 🌾</h2>
    <p>Hi <strong>${farmerName}</strong>, you have a new order to fulfil!</p>

    <div class="info-box">
      <p style="margin:0; font-size:13px; color:#888">ORDER NUMBER</p>
      <p style="margin:4px 0 0; font-size:22px; font-weight:900; color:#1B5E20">#${order.order_id}</p>
    </div>

    <h3 style="color:#1B5E20; font-size:15px">Items to Prepare</h3>
    ${itemsHtml}
    <div class="total-row">
      <span>Order Total</span>
      <span>$${Number(order.total_amount).toFixed(2)} AUD</span>
    </div>

    <div class="info-box">
      <p style="margin:0 0 6px; font-weight:bold; font-size:14px">📍 Deliver to:</p>
      <p style="margin:0; color:#555; font-size:14px">${order.delivery_address}</p>
    </div>

    <p style="background:#FFF9C4; padding:12px 16px; border-radius:8px; font-size:14px; color:#E65100; font-weight:bold;">
      ⏰ Please confirm this order within 24 hours to keep your response rate high.
    </p>

    <center>
      <a href="http://localhost:3000/dashboard/farmer" class="btn">
        Go to My Dashboard →
      </a>
    </center>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket" <${process.env.EMAIL_USER}>`,
    to:      farmerEmail,
    subject: `🌾 New Order #${order.order_id} — Action Required`,
    html
  });

  console.log(`📧 Farmer alert sent to ${farmerEmail}`);
};

// ── 3. ORDER STATUS UPDATE (to buyer) ─────────────────────
const sendStatusUpdate = async (buyerEmail, buyerName, order, newStatus) => {
  const statusInfo = {
    confirmed: { icon: '✅', title: 'Order Confirmed',  color: '#1565C0', msg: 'Your farmer has confirmed your order and is now preparing your fresh produce.' },
    shipped:   { icon: '🚚', title: 'Order Shipped!',   color: '#6A1B9A', msg: 'Great news! Your fresh produce is now on its way to you.' },
    delivered: { icon: '🏠', title: 'Order Delivered!', color: '#1B5E20', msg: 'Your order has been delivered. Enjoy your fresh, locally grown produce!' },
    cancelled: { icon: '❌', title: 'Order Cancelled',  color: '#C62828', msg: 'Unfortunately your order has been cancelled. Please contact us if you have questions.' },
  };

  const info = statusInfo[newStatus] || statusInfo.confirmed;

  const html = emailWrapper(`
    <div style="text-align:center; padding:20px 0">
      <div style="font-size:56px; margin-bottom:16px">${info.icon}</div>
      <h2 style="color:${info.color}; margin:0 0 10px">${info.title}</h2>
      <p style="color:#555; font-size:15px; line-height:1.7">${info.msg}</p>
    </div>

    <div class="info-box" style="text-align:center">
      <p style="margin:0; font-size:13px; color:#888">ORDER NUMBER</p>
      <p style="margin:4px 0 0; font-size:24px; font-weight:900; color:#1B5E20">#${order.order_id}</p>
      <span class="badge" style="background:${info.color}20; color:${info.color}; margin-top:8px">
        ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
      </span>
    </div>

    ${newStatus === 'delivered' ? `
    <div style="background:#E8F5E9; border-radius:10px; padding:16px; text-align:center; margin:16px 0">
      <p style="font-weight:bold; color:#1B5E20; margin:0 0 6px">🌟 Enjoying your produce?</p>
      <p style="color:#555; font-size:14px; margin:0">Leave a review to help other buyers and support your local farmer!</p>
    </div>
    ` : ''}

    <center>
      <a href="http://localhost:3000/orders/${order.order_id}/track" class="btn">
        View Order Details →
      </a>
    </center>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket" <${process.env.EMAIL_USER}>`,
    to:      buyerEmail,
    subject: `${info.icon} Order #${order.order_id} — ${info.title}`,
    html
  });

  console.log(`📧 Status update (${newStatus}) sent to ${buyerEmail}`);
};

// ── 4. WELCOME EMAIL (on registration) ────────────────────
const sendWelcomeEmail = async (userEmail, userName, role) => {
  const isFarmer = role === 'farmer';

  const html = emailWrapper(`
    <h2 style="color:#1B5E20; margin-top:0">Welcome to FarmMarket! 🌿</h2>
    <p>Hi <strong>${userName}</strong>, welcome to Australia's freshest marketplace!</p>

    <p style="color:#555; font-size:15px; line-height:1.7">
      ${isFarmer
        ? 'You\'re now set up as a farmer. Start listing your fresh produce and reach thousands of buyers across Australia!'
        : 'You\'re all set to discover and buy fresh, locally grown produce directly from Australian farmers.'}
    </p>

    <div class="info-box">
      <h3 style="color:#1B5E20; margin:0 0 14px; font-size:15px">
        ${isFarmer ? '🌾 Getting Started as a Farmer' : '🛒 Getting Started as a Buyer'}
      </h3>
      ${isFarmer ? `
        <div class="step"><div class="step-icon">1</div><span style="font-size:14px">Go to <strong>My Farm</strong> in the navbar</span></div>
        <div class="step"><div class="step-icon">2</div><span style="font-size:14px">Click <strong>Add Listing</strong> and upload your produce</span></div>
        <div class="step"><div class="step-icon">3</div><span style="font-size:14px">Use <strong>AI Generate</strong> to write a great description</span></div>
        <div class="step"><div class="step-icon">4</div><span style="font-size:14px">Start receiving orders from buyers!</span></div>
      ` : `
        <div class="step"><div class="step-icon">1</div><span style="font-size:14px">Browse fresh produce in <strong>Browse</strong></span></div>
        <div class="step"><div class="step-icon">2</div><span style="font-size:14px">Add your favourite items to the <strong>cart</strong></span></div>
        <div class="step"><div class="step-icon">3</div><span style="font-size:14px">Checkout securely with <strong>Stripe</strong></span></div>
        <div class="step"><div class="step-icon">4</div><span style="font-size:14px">Track your order in <strong>My Orders</strong></span></div>
      `}
    </div>

    <center>
      <a href="http://localhost:3000/${isFarmer ? 'dashboard/farmer' : 'listings'}" class="btn">
        ${isFarmer ? 'Go to My Dashboard →' : 'Start Shopping →'}
      </a>
    </center>

    <p style="color:#888; font-size:13px; text-align:center; margin-top:20px">
      Have questions? Chat with our AI assistant FarmBot on the website!
    </p>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket" <${process.env.EMAIL_USER}>`,
    to:      userEmail,
    subject: `🌿 Welcome to FarmMarket, ${userName}!`,
    html
  });

  console.log(`📧 Welcome email sent to ${userEmail}`);
};



// ── 5. VERIFICATION EMAIL ──────────────────────────────────
const sendVerificationEmail = async (userEmail, userName, token) => {
  const verifyUrl = `${process.env.SERVER_URL || 'http://localhost:5001'}/api/auth/verify/${token}`;

  const html = emailWrapper(`
    <h2 style="color:#1B5E20; margin-top:0">Verify Your Email Address 📧</h2>
    <p>Hi <strong>${userName}</strong>, thanks for registering with FarmMarket!</p>
    <p style="color:#555; font-size:15px; line-height:1.7">
      Please click the button below to verify your email address and activate your account.
      This link expires in <strong>24 hours</strong>.
    </p>

    <center>
      <a href="${verifyUrl}" class="btn" style="font-size:16px; padding:14px 36px;">
        ✅ Verify My Email →
      </a>
    </center>

    <div class="info-box" style="margin-top:24px">
      <p style="margin:0; font-size:13px; color:#888; text-align:center">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin:8px 0 0; font-size:12px; color:#2E7D32; word-break:break-all; text-align:center">
        ${verifyUrl}
      </p>
    </div>

    <p style="color:#aaa; font-size:13px; text-align:center; margin-top:20px">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket" <${process.env.EMAIL_USER}>`,
    to:      userEmail,
    subject: `✅ Verify your FarmMarket account — ${userName}`,
    html
  });

  console.log(`📧 Verification email sent to ${userEmail}`);
};
// ── ADD THIS FUNCTION to server/config/email.js ──────────
// Paste alongside your other email functions (sendOrderConfirmation etc.)

const sendPasswordResetEmail = async (email, name, resetCode) => {

  
  await transporter.sendMail({
    from:    `"FarmMarket" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Your FarmMarket Password Reset Code: ${resetCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
        <!-- Header -->
        <div style="background:#1B5E20;padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">🌿 FarmMarket</h1>
          <p style="color:#A5D6A7;margin:6px 0 0;font-size:13px">Password Reset Request</p>
        </div>

        <!-- Body -->
        <div style="padding:32px;background:#fff">
          <p style="font-size:15px;color:#333;margin:0 0 16px">Hi <strong>${name}</strong>,</p>
          <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6">
            We received a request to reset your FarmMarket password.
            Use the code below to reset it. This code expires in <strong>15 minutes</strong>.
          </p>

          <!-- Code box -->
          <div style="background:#F1F8E9;border:2px solid #1B5E20;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
            <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Your Reset Code</p>
            <p style="font-size:42px;font-weight:900;color:#1B5E20;margin:0;letter-spacing:12px;font-family:monospace">${resetCode}</p>
          </div>

          <p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 16px">
            Enter this code on the password reset page. 
            If you didn't request this, you can safely ignore this email — your password won't change.
          </p>

          <div style="background:#FFF3E0;border-radius:8px;padding:12px 16px;font-size:12px;color:#E65100">
            ⚠️ Never share this code with anyone. FarmMarket staff will never ask for your code.
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;background:#F8FAF5;text-align:center">
          <p style="font-size:11px;color:#aaa;margin:0">
            FarmMarket | CPRO306 Capstone | Kent Institute Australia 2026
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name}, your FarmMarket password reset code is: ${resetCode}. This code expires in 15 minutes.`
  });
};

// ── 6. ADMIN LOGIN ALERT ──────────────────────────────────
// Fires on every successful user login so the admin has an audit trail
// straight to their inbox. Uses ADMIN_EMAIL from .env (falls back to EMAIL_USER).
const sendAdminLoginAlert = async (user, req) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.log('⚠️  ADMIN_EMAIL not set — skipping admin login alert');
    return;
  }

  // Pull IP + user-agent from the request for the audit trail
  const ip        = req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown';
  const userAgent = req?.headers?.['user-agent'] || 'unknown';
  const time      = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });

  const roleBadge = {
    admin:  { bg:'#C62828', text:'ADMIN' },
    farmer: { bg:'#2E7D32', text:'FARMER' },
    buyer:  { bg:'#1565C0', text:'BUYER' },
  }[user.role] || { bg:'#555', text: (user.role || 'USER').toUpperCase() };

  const html = emailWrapper(`
    <h2 style="color:#1B5E20; margin-top:0">🔔 User Login Alert</h2>
    <p>A user has just logged in to FarmMarket.</p>

    <div class="info-box">
      <div class="item-row"><span><strong>Name</strong></span><span>${user.full_name}</span></div>
      <div class="item-row"><span><strong>Email</strong></span><span>${user.email}</span></div>
      <div class="item-row">
        <span><strong>Role</strong></span>
        <span class="badge" style="background:${roleBadge.bg}; color:#fff">${roleBadge.text}</span>
      </div>
      <div class="item-row"><span><strong>User ID</strong></span><span>#${user.user_id}</span></div>
      <div class="item-row"><span><strong>Time</strong></span><span>${time}</span></div>
      <div class="item-row"><span><strong>IP Address</strong></span><span>${ip}</span></div>
      <div class="item-row" style="border-bottom:none">
        <span><strong>Device</strong></span>
        <span style="font-size:12px; color:#666; max-width:300px; text-align:right">${userAgent}</span>
      </div>
    </div>

    <p style="color:#888; font-size:13px; text-align:center; margin-top:20px">
      This is an automated admin notification. You can view the full activity log in the admin dashboard.
    </p>

    <center>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin" class="btn">
        Open Admin Dashboard →
      </a>
    </center>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket Admin Alerts" <${process.env.EMAIL_USER}>`,
    to:      adminEmail,
    subject: `🔔 Login alert — ${user.full_name} (${user.role})`,
    html
  });

  console.log(`📧 Admin login alert sent to ${adminEmail} for user ${user.email}`);
};

// ── 7. ADMIN ORDER ALERT ──────────────────────────────────
// Fires whenever a new order is placed. Gives the admin a quick snapshot of
// who bought what, where it's going, and the dollar total — for monitoring.
const sendAdminOrderAlert = async (buyer, order) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) {
    console.log('⚠️  ADMIN_EMAIL not set — skipping admin order alert');
    return;
  }

  const time = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });

  const itemsHtml = (order.items || []).map(item => `
    <div class="item-row">
      <span>${item.title} × ${item.quantity}</span>
      <span>$${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</span>
    </div>
  `).join('');

  const html = emailWrapper(`
    <h2 style="color:#1B5E20; margin-top:0">🛒 New Order Placed</h2>
    <p>A new order has just been placed on FarmMarket.</p>

    <div class="info-box">
      <p style="margin:0; font-size:13px; color:#888">ORDER NUMBER</p>
      <p style="margin:4px 0 0; font-size:22px; font-weight:900; color:#1B5E20">#${order.order_id}</p>
    </div>

    <h3 style="color:#1B5E20; font-size:15px">Buyer Details</h3>
    <div class="info-box">
      <div class="item-row"><span><strong>Name</strong></span><span>${buyer.full_name}</span></div>
      <div class="item-row"><span><strong>Email</strong></span><span>${buyer.email}</span></div>
      <div class="item-row" style="border-bottom:none"><span><strong>Time</strong></span><span>${time}</span></div>
    </div>

    <h3 style="color:#1B5E20; font-size:15px">Items Ordered</h3>
    ${itemsHtml || '<p style="color:#888">No item details available</p>'}
    <div class="total-row">
      <span>Order Total</span>
      <span>$${Number(order.total_amount).toFixed(2)} AUD</span>
    </div>

    <div class="info-box">
      <p style="margin:0 0 6px; font-weight:bold; font-size:14px">📍 Delivering to:</p>
      <p style="margin:0; color:#555; font-size:14px">${order.delivery_address}</p>
    </div>

    <center>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin" class="btn">
        View in Admin Dashboard →
      </a>
    </center>

    <p style="color:#888; font-size:13px; text-align:center; margin-top:20px">
      This is an automated admin notification sent on every order placement.
    </p>
  `);

  await transporter.sendMail({
    from:    `"🌿 FarmMarket Admin Alerts" <${process.env.EMAIL_USER}>`,
    to:      adminEmail,
    subject: `🛒 New order #${order.order_id} — $${Number(order.total_amount).toFixed(2)} from ${buyer.full_name}`,
    html
  });

  console.log(`📧 Admin order alert sent to ${adminEmail} for order #${order.order_id}`);
};

// Don't forget to export it:
// module.exports = { ..., sendPasswordResetEmail };
module.exports = {
  sendOrderConfirmation,
  sendFarmerOrderAlert,
  sendStatusUpdate,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendAdminLoginAlert,
  sendAdminOrderAlert
};