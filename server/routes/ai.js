// routes/ai.js
// AI features using Groq API (free) — FarmBot chatbot + description generator
const express   = require('express');
const router    = express.Router();
const Groq      = require('groq-sdk');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const db        = require('../config/db');

// Initialise Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Rate limit — max 20 AI requests per minute per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many AI requests. Please wait a moment.' }
});

// ── BUYER CHATBOT ──────────────────────────────────────────
// POST /api/ai/chat
router.post('/chat', aiLimiter, [
  body('message').trim().notEmpty().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { message, history = [] } = req.body;
  const startTime = Date.now();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are FarmBot, a helpful and friendly assistant for the 
          Farm Produce Marketplace — an Australian platform connecting local 
          farmers directly with consumers. Help users find fresh produce, 
          suggest seasonal availability in Australia, recommend recipes using 
          farm-fresh ingredients, and answer questions about the platform.
          Be warm, concise, and knowledgeable about Australian agriculture 
          and seasonal produce. Always encourage users to browse the marketplace.
          Keep responses under 120 words.`
        },
        ...history.slice(-6),
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const reply      = completion.choices[0].message.content;
    const latency    = Date.now() - startTime;
    const usage      = completion.usage || {};

    // Log AI usage to database
    db.query(
      `INSERT INTO ai_usage_logs
       (user_id, feature, prompt_tokens, completion_tokens, total_tokens, latency_ms, model, status)
       VALUES (?, 'chat', ?, ?, ?, ?, 'llama-3.3-70b-versatile', 'success')`,
      [
        req.user?.user_id || null,
        usage.prompt_tokens     || 0,
        usage.completion_tokens || 0,
        usage.total_tokens      || 0,
        latency
      ]
    ).catch(e => console.log('AI log error:', e.message));

    res.json({ reply });

  } catch (err) {
    console.error('Groq chat error:', err.message);

    // Log failed attempt
    db.query(
      `INSERT INTO ai_usage_logs
       (user_id, feature, total_tokens, latency_ms, model, status)
       VALUES (?, 'chat', 0, ?, 'llama-3.3-70b-versatile', 'error')`,
      [req.user?.user_id || null, Date.now() - startTime]
    ).catch(() => {});

    res.status(500).json({ message: 'AI service temporarily unavailable.' });
  }
});

// ── PRODUCT DESCRIPTION GENERATOR (farmers only) ──────────
// POST /api/ai/describe
router.post('/describe', protect, aiLimiter, [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('category').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, category, price, unit = 'kg' } = req.body;
  const startTime = Date.now();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `Write a compelling 2-3 sentence product description for an 
        Australian farm marketplace listing. Make it sound fresh, natural and 
        appealing — emphasising local origin, freshness and quality.
        Keep it under 60 words. No emojis. No price mentions.
        
        Product: ${title}
        Category: ${category}
        Price: $${price || 'varies'} per ${unit}`
      }],
      max_tokens: 150,
      temperature: 0.8
    });

    const description = completion.choices[0].message.content.trim();
    const latency     = Date.now() - startTime;
    const usage       = completion.usage || {};

    // Log AI usage to database
    db.query(
      `INSERT INTO ai_usage_logs
       (user_id, feature, prompt_tokens, completion_tokens, total_tokens, latency_ms, model, status)
       VALUES (?, 'description', ?, ?, ?, ?, 'llama-3.3-70b-versatile', 'success')`,
      [
        req.user.user_id,
        usage.prompt_tokens     || 0,
        usage.completion_tokens || 0,
        usage.total_tokens      || 0,
        latency
      ]
    ).catch(e => console.log('AI log error:', e.message));

    res.json({ description });

  } catch (err) {
    console.error('Groq describe error:', err.message);

    // Log failed attempt
    db.query(
      `INSERT INTO ai_usage_logs
       (user_id, feature, total_tokens, latency_ms, model, status)
       VALUES (?, 'description', 0, ?, 'llama-3.3-70b-versatile', 'error')`,
      [req.user?.user_id || null, Date.now() - startTime]
    ).catch(() => {});

    res.status(500).json({ message: 'AI service temporarily unavailable.' });
  }
});

// ── ADMIN ASSISTANT (admin only) ───────────────────────────
// POST /api/ai/admin-chat — AI helper for the admin dashboard.
// Has live platform-stat context so the admin can ask "how many farmers?",
// "any pending orders?", "any blocked IPs?", etc.
const { adminOnly } = require('../middleware/authMiddleware');

router.post('/admin-chat', protect, adminOnly, aiLimiter, [
  body('message').trim().notEmpty().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { message, history = [] } = req.body;
  const startTime = Date.now();

  // Pull a small live snapshot of platform health so the LLM can answer factually.
  // We swallow individual errors so the chat keeps working even if one query fails.
  const safeCount = async (sql) => {
    try { const [[r]] = await db.query(sql); return r?.n ?? 0; } catch { return 'n/a'; }
  };

  const [
    totalUsers, totalFarmers, totalBuyers,
    activeListings, outOfStockListings,
    totalOrders, pendingOrders, deliveredOrders,
    blockedIPs, failedLogins24h
  ] = await Promise.all([
    safeCount("SELECT COUNT(*) AS n FROM users"),
    safeCount("SELECT COUNT(*) AS n FROM users WHERE role='farmer'"),
    safeCount("SELECT COUNT(*) AS n FROM users WHERE role='buyer'"),
    safeCount("SELECT COUNT(*) AS n FROM listings WHERE is_active=1 AND quantity>0"),
    safeCount("SELECT COUNT(*) AS n FROM listings WHERE is_active=1 AND quantity=0"),
    safeCount("SELECT COUNT(*) AS n FROM orders"),
    safeCount("SELECT COUNT(*) AS n FROM orders WHERE status='pending'"),
    safeCount("SELECT COUNT(*) AS n FROM orders WHERE status='delivered'"),
    safeCount("SELECT COUNT(*) AS n FROM blocked_ips WHERE expires_at > NOW() OR expires_at IS NULL"),
    safeCount("SELECT COUNT(*) AS n FROM activity_logs WHERE action='login_failed' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)")
  ]);

  const platformSnapshot = `
LIVE PLATFORM SNAPSHOT (as of ${new Date().toISOString()}):
- Users: ${totalUsers} total (${totalFarmers} farmers, ${totalBuyers} buyers)
- Listings: ${activeListings} active in stock, ${outOfStockListings} out of stock
- Orders: ${totalOrders} total — ${pendingOrders} pending, ${deliveredOrders} delivered
- Security: ${blockedIPs} blocked IPs, ${failedLogins24h} failed logins in last 24h
`.trim();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are AdminBot, an AI assistant embedded in the admin
dashboard of the Farm Produce Marketplace — an Australian platform connecting
local farmers with consumers. You help administrators understand the platform,
explain what they're seeing, and suggest actions.

You can answer questions about: user management (farmers, buyers, suspending
or deleting users), listings and stock (restocking, out-of-stock items),
orders (pending, delivered, cancellations), payments, security (blocked IPs,
failed logins, suspicious activity), and platform features.

You have access to the live platform snapshot below — use it to answer
factual questions about current state. If a question goes beyond the snapshot,
explain what an admin would do in the relevant dashboard tab (Users, Listings,
Orders, Security, Audit Trail, Compliance, Settings).

${platformSnapshot}

Be concise, professional, and helpful. Use short paragraphs and bullet lists
when appropriate. Keep responses under 180 words unless the admin asks for detail.
Never invent numbers — if you don't know, say so.`
        },
        ...history.slice(-6),
        { role: 'user', content: message }
      ],
      max_tokens: 400,
      temperature: 0.4
    });

    const reply   = completion.choices[0].message.content;
    const latency = Date.now() - startTime;
    const usage   = completion.usage || {};

    db.query(
      `INSERT INTO ai_usage_logs
       (user_id, feature, prompt_tokens, completion_tokens, total_tokens, latency_ms, model, status)
       VALUES (?, 'admin_chat', ?, ?, ?, ?, 'llama-3.3-70b-versatile', 'success')`,
      [
        req.user.user_id,
        usage.prompt_tokens     || 0,
        usage.completion_tokens || 0,
        usage.total_tokens      || 0,
        latency
      ]
    ).catch(e => console.log('AI log error:', e.message));

    res.json({ reply });
  } catch (err) {
    console.error('Groq admin-chat error:', err.message);
    db.query(
      `INSERT INTO ai_usage_logs
       (user_id, feature, total_tokens, latency_ms, model, status)
       VALUES (?, 'admin_chat', 0, ?, 'llama-3.3-70b-versatile', 'error')`,
      [req.user?.user_id || null, Date.now() - startTime]
    ).catch(() => {});
    res.status(500).json({ message: 'AI service temporarily unavailable.' });
  }
});

module.exports = router;