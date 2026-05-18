// pages/Help.jsx — Help Center / Support hub
// Author: CPRO306 Capstone | Date: 2026
//
// Single page that handles all the footer's "Support" + "Learn" topics.
// Sections accessible via anchors: /help#how-it-works, /help#delivery,
// /help#returns, /help#faqs, /help#sustainability, /help#contact

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const C = {
  forest:'#253528', moss:'#3D5B45', sage:'#A7BFA5',
  cream:'#F6F3EE', boneWhite:'#FBFAF8', charcoal:'#1C1F1D',
  mistGray:'#E7E5E0', muted:'#6B7280', mutedDark:'#4B5563',
  terracotta:'#C46A4A', harvestGold:'#D6A441',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

const SECTIONS = [
  { id: 'how-it-works',   label: 'How it works' },
  { id: 'delivery',       label: 'Delivery info' },
  { id: 'returns',        label: 'Returns & refunds' },
  { id: 'faqs',           label: 'FAQs' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'contact',        label: 'Contact us' },
];

export default function Help() {
  const { hash } = useLocation();

  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Auto-scroll to anchor on load
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [hash]);

  useEffect(() => {
    const id = 'help-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .help-nav-link:hover { background: ${C.cream} !important; color: ${C.forest} !important; }
      .help-faq summary { cursor: pointer; list-style: none; }
      .help-faq summary::-webkit-details-marker { display: none; }
      .help-faq[open] summary .help-chevron { transform: rotate(180deg); }
      .help-chevron { transition: transform .25s ease; }
      @media (max-width: 900px) {
        .help-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
        .help-nav { position: static !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={pageBase}>
      {/* HERO */}
      <section style={hero}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={eyebrow}>Help Center</p>
          <h1 style={h1}>
            How can we <span style={{ color: C.moss, fontStyle: 'italic' }}>help?</span>
          </h1>
          <p style={lead}>
            Everything you need to know about ordering, delivery, returns,
            and getting the most out of FarmMarket.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding: '56px 32px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="help-layout" style={layout}>

            {/* Sidebar nav */}
            <aside className="help-nav" style={sidebar}>
              <p style={navLabel}>Jump to section</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SECTIONS.map(s => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="help-nav-link"
                      style={{
                        ...navLink,
                        background: hash === `#${s.id}` ? 'rgba(167,191,165,0.25)' : 'transparent',
                        color: hash === `#${s.id}` ? C.forest : C.mutedDark,
                        fontWeight: hash === `#${s.id}` ? 600 : 400,
                      }}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main content */}
            <main>

              {/* ─── How it works ─── */}
              <Section id="how-it-works" title="How it works">
                <p>
                  FarmMarket is a direct-from-farm marketplace. There are no supermarket
                  middlemen and no anonymous supply chains — just three simple steps:
                </p>
                <Steps steps={[
                  ['Browse the catalog', 'Discover seasonal produce from verified Australian farmers. Filter by category, season, location, or price.'],
                  ['Order direct',       'Add to cart, pay securely via Stripe, and your order is sent straight to the farmer fulfilling it.'],
                  ['Farm to your door',  'Your produce is picked, packed, and delivered within 24–48 hours of harvest.'],
                ]}/>
                <p>
                  Farmers set their own prices and keep 100% of the sale. We make money only
                  through a small delivery coordination fee that's transparent at checkout.
                </p>
              </Section>

              {/* ─── Delivery ─── */}
              <Section id="delivery" title="Delivery info">
                <p>
                  We deliver to all major Australian cities and most regional areas. Specific
                  delivery zones and timelines depend on each farmer and your location.
                </p>
                <InfoGrid items={[
                  { title: 'Standard delivery',  body: '24–48 hours from order confirmation. Free for orders over $50.' },
                  { title: 'Express delivery',   body: 'Same day for orders placed before 9am AEST in Melbourne, Sydney, and Brisbane metro.' },
                  { title: 'Delivery cost',      body: 'Set by individual farmers based on distance. Shown at checkout before payment.' },
                  { title: 'Tracking',           body: 'Real-time order tracking available from your dashboard once your order is dispatched.' },
                ]}/>
                <p>
                  We don't currently ship overseas. If a farmer cannot deliver to your address,
                  you'll see this at checkout before paying.
                </p>
              </Section>

              {/* ─── Returns & refunds ─── */}
              <Section id="returns" title="Returns & refunds">
                <p>
                  Fresh produce can't be "returned" the way packaged goods can, but we still
                  stand behind the quality of what's on the platform.
                </p>
                <h4 style={subhead}>If something's wrong with your order</h4>
                <ul style={list}>
                  <li><strong>Damaged or spoiled produce</strong> — contact the farmer within 24 hours of delivery with a photo. Full refund or replacement at no cost.</li>
                  <li><strong>Missing items</strong> — refund or redelivery within 48 hours of delivery.</li>
                  <li><strong>Items significantly different from listing</strong> — refund or partial credit.</li>
                </ul>
                <h4 style={subhead}>How to start a refund</h4>
                <ol style={list}>
                  <li>Go to your order history in the dashboard.</li>
                  <li>Click "Report an issue" on the order.</li>
                  <li>Add photos and a short description.</li>
                  <li>The farmer will respond within 48 hours. If unresolved, escalate to FarmMarket support and we'll mediate.</li>
                </ol>
                <p style={smallNote}>
                  Refunds are issued to your original payment method and typically appear within 5–10 business days.
                  See our full <Link to="/terms" style={inlineLink}>Terms of Service</Link> for details.
                </p>
              </Section>

              {/* ─── FAQs ─── */}
              <Section id="faqs" title="Frequently asked questions">
                {FAQ_ITEMS.map(([q, a]) => (
                  <details key={q} className="help-faq" style={faqItem}>
                    <summary style={faqSummary}>
                      <span>{q}</span>
                      <span className="help-chevron" style={{ color: C.muted }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </summary>
                    <div style={faqBody}>{a}</div>
                  </details>
                ))}
              </Section>

              {/* ─── Sustainability ─── */}
              <Section id="sustainability" title="Sustainability">
                <p>
                  Direct-from-farm is one of the most powerful things you can do for food
                  sustainability. Here's how FarmMarket measures up:
                </p>
                <InfoGrid items={[
                  { title: 'Less food waste',    body: 'Farmers pick to order rather than to forecast — so produce doesn\'t sit in warehouses degrading before sale.' },
                  { title: 'Fewer food miles',   body: 'Direct delivery means typically 1–2 transport legs instead of 5–7 through traditional distribution.' },
                  { title: 'Plastic-conscious',  body: 'Farmers are encouraged to use minimal, compostable, or returnable packaging. Many offer plastic-free options.' },
                  { title: 'Supporting families', body: 'Farmers keep 100% of their sale price, helping family farms stay viable across generations.' },
                ]}/>
                <p>
                  We're a student capstone project so our sustainability claims are honest
                  about what we can verify: the supply chain is short, the farmers are real,
                  and the impact is measurable per order. We don't claim more than that.
                </p>
              </Section>

              {/* ─── Contact ─── */}
              <Section id="contact" title="Contact us" last>
                <p>
                  Can't find what you need? We respond to all messages within 2 business days.
                </p>
                <div style={contactGrid}>
                  <div style={contactCard}>
                    <p style={contactLabel}>General enquiries</p>
                    <a href="mailto:ALS_MELB@kent.edu.au" style={contactLink}>
                      ALS_MELB@kent.edu.au
                    </a>
                    <p style={contactDetail}>Questions, partnerships, press</p>
                  </div>
                  <div style={contactCard}>
                    <p style={contactLabel}>For farmers</p>
                    <Link to="/register" style={contactLink}>List your farm →</Link>
                    <p style={contactDetail}>Free to join, keep 100% of sales</p>
                  </div>
                  <div style={contactCard}>
                    <p style={contactLabel}>Order issues</p>
                    <Link to="/buyer/orders" style={contactLink}>My orders →</Link>
                    <p style={contactDetail}>Report problems from your dashboard</p>
                  </div>
                </div>
                <p style={{ ...smallNote, marginTop: 28 }}>
                  Kent Institute Australia · CPRO306 Capstone Project · 2026
                </p>
              </Section>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── FAQ content ───────────────────────────────────────────────
const FAQ_ITEMS = [
  ['How fresh is the produce?',
    'Most produce is picked the day before delivery, or the same morning. That means it travels 24–48 hours from soil to your kitchen, compared to 7–14 days through traditional supermarket supply chains.'],
  ['Do I need an account to order?',
    'Yes — you need to sign up to track orders, save addresses, and communicate with farmers. Sign-up is free and takes about 30 seconds.'],
  ['How do I become a farmer on FarmMarket?',
    'Click "Become a Farmer" in the footer, register with role = Farmer, and submit your farm details for verification. Approval typically takes 1–2 business days.'],
  ['Are the farmers certified organic?',
    'Some are, some aren\'t. Each listing shows the farmer\'s certifications (Organic, Biodynamic, Spray-Free, etc.). All farmers undergo basic verification regardless of certification.'],
  ['What if no farmer is selling what I want?',
    'You\'ll see the product page with "Currently unavailable" and can save it to your wishlist. We notify you when a farmer lists it next.'],
  ['How are prices set?',
    'Each farmer sets their own price for each product. You\'ll often see the same product at different prices from different farmers — pick whoever best fits your needs.'],
  ['Is my payment information secure?',
    'Yes. All payments are processed by Stripe (PCI-DSS Level 1 compliant). FarmMarket never sees or stores your full card details.'],
  ['Can I cancel an order?',
    'Orders can be cancelled for a full refund before the farmer marks them "in preparation". Once preparation has started, contact the farmer directly to arrange.'],
  ['Do you ship overseas?',
    'Not currently. We\'re Australia-only for now to keep delivery fast and produce fresh.'],
];

// ── Sub-components ────────────────────────────────────────────
function Section({ id, title, children, last }) {
  return (
    <section id={id} style={{
      marginBottom: last ? 0 : 56,
      paddingBottom: last ? 0 : 56,
      borderBottom: last ? 'none' : `1px solid ${C.mistGray}`,
      scrollMarginTop: 100,
    }}>
      <h2 style={sectionH2}>{title}</h2>
      <div style={{ fontSize: 15.5, color: C.mutedDark, lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function Steps({ steps }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0', counterReset: 'step' }}>
      {steps.map(([title, body], i) => (
        <li key={title} style={{
          display: 'flex', gap: 18, marginBottom: 16,
          padding: 18, background: C.cream, borderRadius: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: C.forest, color: C.boneWhite,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: SERIF, fontSize: 18, flexShrink: 0,
            letterSpacing: '-0.01em',
          }}>{i + 1}</div>
          <div>
            <h4 style={{
              fontSize: 16, fontWeight: 600, color: C.charcoal,
              margin: '0 0 4px', letterSpacing: '-0.005em',
            }}>{title}</h4>
            <p style={{ fontSize: 14, color: C.mutedDark, margin: 0, lineHeight: 1.6 }}>
              {body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16, margin: '20px 0',
    }}>
      {items.map(it => (
        <div key={it.title} style={{
          padding: 18, background: C.cream, borderRadius: 14,
        }}>
          <h4 style={{
            fontSize: 14.5, fontWeight: 600, color: C.charcoal,
            margin: '0 0 6px', letterSpacing: '-0.005em',
          }}>{it.title}</h4>
          <p style={{ fontSize: 13.5, color: C.mutedDark, margin: 0, lineHeight: 1.6 }}>
            {it.body}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const pageBase = { background: C.boneWhite, color: C.charcoal, fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' };
const hero = { background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`, padding: '64px 32px 48px', borderBottom: `1px solid ${C.mistGray}` };
const eyebrow = { fontSize: 11, fontWeight: 700, color: C.moss, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 14px' };
const h1 = { fontFamily: SERIF, fontSize: 54, fontWeight: 400, color: C.charcoal, margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.05 };
const lead = { fontSize: 17, color: C.mutedDark, lineHeight: 1.65, margin: 0, maxWidth: 640 };
const layout = { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 56, alignItems: 'flex-start' };
const sidebar = { position: 'sticky', top: 100, alignSelf: 'flex-start' };
const navLabel = { fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' };
const navLink = { display: 'block', padding: '9px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13.5, transition: 'all .15s ease' };
const sectionH2 = { fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: C.charcoal, margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.15 };
const subhead = { fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: C.charcoal, margin: '24px 0 10px', letterSpacing: '-0.01em' };
const list = { fontSize: 15, color: C.mutedDark, lineHeight: 1.85, paddingLeft: 22, margin: '14px 0' };
const inlineLink = { color: C.moss, textDecoration: 'underline', textUnderlineOffset: 2 };
const smallNote = { fontSize: 13, color: C.muted, marginTop: 18, lineHeight: 1.6 };
const faqItem = { borderBottom: `1px solid ${C.mistGray}`, padding: '4px 0' };
const faqSummary = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', fontSize: 15, fontWeight: 500, color: C.charcoal };
const faqBody = { padding: '0 0 14px', fontSize: 14.5, color: C.mutedDark, lineHeight: 1.7 };
const contactGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0' };
const contactCard = { padding: 22, background: C.cream, borderRadius: 14 };
const contactLabel = { fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' };
const contactLink = { display: 'block', fontFamily: SERIF, fontSize: 20, color: C.charcoal, textDecoration: 'none', margin: '0 0 6px', letterSpacing: '-0.01em' };
const contactDetail = { fontSize: 13, color: C.mutedDark, margin: 0 };