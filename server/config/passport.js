// config/passport.js — Google, GitHub, Facebook OAuth strategies
// Author: CPRO306 Capstone Project | Date: 2026

const passport         = require('passport');
const GoogleStrategy   = require('passport-google-oauth20').Strategy;
const GitHubStrategy   = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db               = require('./db');

// ── Helper: find or create user from OAuth ───────────────
async function findOrCreateOAuthUser(email, fullName, role) {
  // role comes from the ?role= query param the user chose BEFORE the OAuth redirect
  const chosenRole = ['farmer', 'buyer'].includes(role) ? role : 'buyer';

  // Check if user already exists
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (rows.length > 0) {
    const existingUser = rows[0];
    // If user picked a different role this time, update it
    // (only update if not admin — never downgrade admin via OAuth)
    if (existingUser.role !== 'admin' && existingUser.role !== chosenRole) {
      await db.query(
        'UPDATE users SET role = ? WHERE user_id = ?',
        [chosenRole, existingUser.user_id]
      );
      existingUser.role = chosenRole;
    }
    return existingUser;
  }

  // Brand new OAuth user — save with the role they picked
  const [result] = await db.query(
    `INSERT INTO users
       (full_name, email, password_hash, role, is_verified, is_active)
     VALUES (?, ?, ?, ?, 1, 1)`,
    [fullName, email, 'OAUTH_NO_PASSWORD', chosenRole]
  );

  const [newUser] = await db.query(
    'SELECT * FROM users WHERE user_id = ?',
    [result.insertId]
  );

  return newUser[0];
}

// ── GOOGLE ───────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value;
      const fullName = profile.displayName || 'Google User';
      const role     = req.query?.state ? JSON.parse(decodeURIComponent(req.query.state)).role : 'buyer';

      if (!email) return done(new Error('No email from Google'), null);

      const user = await findOrCreateOAuthUser(email, fullName, role);
      return done(null, user);
    } catch (err) {
      console.error('Google OAuth error:', err.message);
      return done(err, null);
    }
  }
));

// ── GITHUB ───────────────────────────────────────────────
passport.use(new GitHubStrategy(
  {
    clientID:     process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:  '/api/auth/github/callback',
    scope:        ['user:email'],
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value
                    || `github_${profile.id}@noemail.farmmarket`;
      const fullName = profile.displayName || profile.username || 'GitHub User';
      const role     = req.query?.state ? JSON.parse(decodeURIComponent(req.query.state)).role : 'buyer';

      const user = await findOrCreateOAuthUser(email, fullName, role);
      return done(null, user);
    } catch (err) {
      console.error('GitHub OAuth error:', err.message);
      return done(err, null);
    }
  }
));

// ── FACEBOOK ─────────────────────────────────────────────
passport.use(new FacebookStrategy(
  {
    clientID:      process.env.FACEBOOK_APP_ID,
    clientSecret:  process.env.FACEBOOK_APP_SECRET,
    callbackURL:   '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'displayName'],
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value
                    || `fb_${profile.id}@noemail.farmmarket`;
      const fullName = profile.displayName || 'Facebook User';
      const role     = req.query?.state ? JSON.parse(decodeURIComponent(req.query.state)).role : 'buyer';

      const user = await findOrCreateOAuthUser(email, fullName, role);
      return done(null, user);
    } catch (err) {
      console.error('Facebook OAuth error:', err.message);
      return done(err, null);
    }
  }
));

module.exports = passport;