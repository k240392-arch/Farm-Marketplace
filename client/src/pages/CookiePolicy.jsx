// pages/CookiePolicy.jsx — Cookie Policy
// Author: CPRO306 Capstone | Date: 2026

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const C = {
  forest:'#253528', moss:'#3D5B45', sage:'#A7BFA5',
  cream:'#F6F3EE', boneWhite:'#FBFAF8', charcoal:'#1C1F1D',
  mistGray:'#E7E5E0', muted:'#6B7280', mutedDark:'#4B5563',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

export default function CookiePolicy() {
  // Load Instrument Serif
  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Open consent banner from inline button
  const openSettings = () => {
    if (typeof window.openCookieSettings === 'function') {
      window.openCookieSettings();
    } else {
      // Fallback: clear stored choice and reload
      localStorage.removeItem('farmmarket_cookie_consent');
      window.location.reload();
    }
  };

  return (
    <div style={pageBase}>
      {/* HERO */}
      <section style={hero}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={eyebrow}>Legal</p>
          <h1 style={h1}>
            Cookie <span style={{ color: C.moss, fontStyle: 'italic' }}>Policy</span>
          </h1>
          <p style={lead}>
            What cookies we use, why we use them, and how you can control them.
            We aim to be transparent about every piece of information we collect.
          </p>
          <p style={meta}>Last updated: 1 January 2026 · Effective from: 1 January 2026</p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding: '64px 32px 96px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <Section title="What are cookies?">
            <p>
              Cookies are small text files that websites place on your device to remember
              information about your visit. They make sites work, remember your preferences,
              and help us understand how features are used.
            </p>
            <p>
              Some cookies are essential — without them, the site can't keep you logged in or
              remember items in your cart. Others are optional, and you can turn them off
              without breaking anything.
            </p>
          </Section>

          <Section title="The categories we use">
            <CategoryCard
              title="Necessary cookies"
              status="Always on"
              statusColor={C.moss}
              statusBg="rgba(167,191,165,0.22)"
              description="Required for the site to function."
              examples={[
                ['fm_session',     'Keeps you signed in across page loads'],
                ['fm_cart',        'Remembers items in your shopping cart'],
                ['fm_csrf',        'Protects against cross-site request forgery attacks'],
                ['fm_cookie_consent', 'Remembers your cookie preferences (this very banner)'],
              ]}
              retention="Session to 1 year, depending on the cookie"
            />

            <CategoryCard
              title="Analytics cookies"
              status="Optional"
              statusColor={C.charcoal}
              statusBg={C.mistGray}
              description="Help us understand which pages are popular, what's broken, and where people get stuck. All data is anonymous and aggregated."
              examples={[
                ['_ga',           'Distinguishes unique visitors (no personal info)'],
                ['_ga_*',         'Measures session duration and pages per visit'],
                ['fm_analytics',  'Internal: which features are used most'],
              ]}
              retention="Up to 2 years"
            />

            <CategoryCard
              title="Marketing cookies"
              status="Optional"
              statusColor={C.charcoal}
              statusBg={C.mistGray}
              description="Used to show you produce you might like and seasonal recommendations. We do not sell your data to advertisers."
              examples={[
                ['fm_recommendations', 'Personalises product suggestions'],
                ['fm_seasonal_pref',   'Remembers which categories you browse'],
              ]}
              retention="Up to 6 months"
              last
            />
          </Section>

          <Section title="Manage your preferences">
            <p>
              You can change your cookie preferences at any time. Necessary cookies cannot be
              disabled because the site won't work without them.
            </p>
            <button onClick={openSettings} style={primaryBtn}>
              ⚙ Manage cookie preferences
            </button>
            <p style={{ marginTop: 18, fontSize: 14, color: C.muted }}>
              You can also disable cookies entirely in your browser settings.
              Note that this may stop you from logging in or completing checkout.
            </p>
          </Section>

          <Section title="Browser-level controls">
            <p>
              Most modern browsers let you control cookies through their privacy settings.
              Here's where to find them:
            </p>
            <ul style={list}>
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
            </ul>
            <p>
              Disabling cookies will not delete cookies already stored. To clear them, use your browser's "Clear browsing data" option.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>We use the following third-party services that may set their own cookies:</p>
            <ul style={list}>
              <li><strong>Stripe</strong> — for payment processing. <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer" style={inlineLink}>Stripe's cookie policy</a>.</li>
              <li><strong>Google Analytics</strong> (only with your consent) — <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" style={inlineLink}>Google's cookie policy</a>.</li>
            </ul>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this Cookie Policy occasionally. When we do, we'll change the
              "Last updated" date at the top, and material changes will trigger the consent
              banner to reappear so you can review your choices.
            </p>
          </Section>

          <Section title="Contact us" last>
            <p>
              Questions about cookies or how we handle data? Email us at {' '}
              <a href="mailto:ALS_MELB@kent.edu.au" style={inlineLink}>ALS_MELB@kent.edu.au</a>.
            </p>
            <p style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
              See also: <Link to="/privacy" style={inlineLink}>Privacy Policy</Link> · <Link to="/terms" style={inlineLink}>Terms of Service</Link>
            </p>
          </Section>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function Section({ title, children, last }) {
  return (
    <section style={{
      marginBottom: last ? 0 : 48,
      paddingBottom: last ? 0 : 48,
      borderBottom: last ? 'none' : `1px solid ${C.mistGray}`,
    }}>
      <h2 style={h2}>{title}</h2>
      <div style={proseWrap}>{children}</div>
    </section>
  );
}

function CategoryCard({ title, status, statusColor, statusBg, description, examples, retention, last }) {
  return (
    <div style={{
      background: C.boneWhite,
      border: `1px solid ${C.mistGray}`,
      borderRadius: 16, padding: 24,
      marginBottom: last ? 0 : 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{
          fontSize: 17, fontWeight: 600, color: C.charcoal,
          margin: 0, letterSpacing: '-0.005em',
        }}>{title}</h3>
        <span style={{
          fontSize: 10, fontWeight: 700, color: statusColor,
          background: statusBg, padding: '4px 10px', borderRadius: 999,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{status}</span>
      </div>
      <p style={{ fontSize: 14, color: C.mutedDark, margin: '0 0 14px', lineHeight: 1.6 }}>
        {description}
      </p>
      <div style={{ background: C.cream, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: C.muted,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          margin: '0 0 8px',
        }}>Examples</p>
        {examples.map(([name, purpose]) => (
          <div key={name} style={{
            display: 'flex', gap: 14, padding: '4px 0',
            fontSize: 13, lineHeight: 1.55,
          }}>
            <code style={{
              fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
              fontSize: 12, color: C.forest, background: C.boneWhite,
              padding: '2px 8px', borderRadius: 6,
              flexShrink: 0, alignSelf: 'flex-start',
            }}>{name}</code>
            <span style={{ color: C.mutedDark }}>{purpose}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
        <strong style={{ color: C.charcoal }}>Retention:</strong> {retention}
      </p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const pageBase = {
  background: C.boneWhite,
  color:      C.charcoal,
  fontFamily: "'Inter', system-ui, sans-serif",
  minHeight:  '100vh',
};
const hero = {
  background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
  padding:    '72px 32px 56px',
  borderBottom: `1px solid ${C.mistGray}`,
};
const eyebrow = {
  fontSize: 11, fontWeight: 700, color: C.moss,
  letterSpacing: '0.18em', textTransform: 'uppercase',
  margin: '0 0 14px',
};
const h1 = {
  fontFamily: SERIF, fontSize: 56, fontWeight: 400,
  color: C.charcoal, margin: '0 0 18px',
  letterSpacing: '-0.025em', lineHeight: 1.05,
};
const lead = {
  fontSize: 17, color: C.mutedDark, lineHeight: 1.7,
  margin: '0 0 22px', maxWidth: 640,
};
const meta = {
  fontSize: 13, color: C.muted, margin: 0,
};
const h2 = {
  fontFamily: SERIF, fontSize: 30, fontWeight: 400,
  color: C.charcoal, margin: '0 0 18px',
  letterSpacing: '-0.018em', lineHeight: 1.15,
};
const proseWrap = {
  fontSize: 15.5, color: C.mutedDark, lineHeight: 1.75,
};
const list = {
  fontSize: 15, color: C.mutedDark, lineHeight: 1.85,
  paddingLeft: 22, margin: '14px 0',
};
const inlineLink = {
  color: C.moss, textDecoration: 'underline',
  textUnderlineOffset: 2,
};
const primaryBtn = {
  display: 'inline-block', marginTop: 16,
  padding: '13px 26px',
  background: C.forest, color: C.boneWhite,
  border: 'none', borderRadius: 999,
  fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
  cursor: 'pointer',
};