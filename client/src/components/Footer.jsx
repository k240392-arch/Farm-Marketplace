// components/Footer.jsx — Site footer
// Author: CPRO306 Capstone Project | Date: 2026
//
// Two-tier forest-green canvas:
//   1. Brand + 4 link columns (Shop, Learn, Support)
//   2. Copyright + legal links
//
// Self-contained — no Home.jsx dependency. Hidden on dashboards/login
// via FooterConditional in App.jsx.

import { Link } from 'react-router-dom';

// ── Palette ───────────────────────────────────────────────────
const C = {
  forest:    '#253528',
  moss:      '#3D5B45',
  sage:      '#A7BFA5',
  cream:     '#F6F3EE',
  boneWhite: '#FBFAF8',
  charcoal:  '#1C1F1D',
  mistGray:  '#E7E5E0',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

// ── Inline icons ──────────────────────────────────────────────
const I = ({ children, size = 18, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const InstagramIcon = (p) => <I {...p}><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></I>;
const FacebookIcon  = (p) => <I {...p}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></I>;
const TwitterIcon   = (p) => <I {...p}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></I>;
const MailIcon      = (p) => <I {...p}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></I>;

// Refined logo mark — same as Navbar
const LogoMark = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18.5" stroke={C.sage} strokeWidth="1.3" fill="rgba(167,191,165,0.15)"/>
    <path d="M20 9 C 13 12, 11 19, 14 27 C 17 25, 21 22, 22 17 C 22 23, 20 27, 17 30 C 22 31, 27 27, 28 21 C 29 15, 25 10, 20 9 Z"
          fill={C.sage}/>
    <path d="M19 12 C 18 17, 17 23, 16 28" stroke={C.forest} strokeWidth="0.9" strokeLinecap="round"/>
    <circle cx="26" cy="14" r="1.6" fill={C.cream}/>
  </svg>
);

// ──────────────────────────────────────────────────────────────
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={S.footer}>

      {/* ═══ Brand + Link columns ═══════════════════════════════ */}
      <section style={S.linksTier}>
        <div style={S.linksInner}>
          <div style={S.cols} className="ft-cols">

            {/* Brand */}
            <div style={S.brandCol} className="ft-brand-col">
              <div style={S.logo}>
                <LogoMark/>
                <span style={S.logoText}>FarmMarket</span>
              </div>
              <p style={S.tagline}>
                Fresh from Australian Farms — Delivered Direct.
                Connecting local farmers with conscious consumers since 2026.
              </p>
              <div style={S.socials}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                   aria-label="Instagram" style={S.social} className="ft-social">
                  <InstagramIcon size={15}/>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                   aria-label="Facebook" style={S.social} className="ft-social">
                  <FacebookIcon size={15}/>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                   aria-label="Twitter" style={S.social} className="ft-social">
                  <TwitterIcon size={15}/>
                </a>
                <a href="mailto:ALS_MELB@kent.edu.au"
                   aria-label="Email" style={S.social} className="ft-social">
                  <MailIcon size={15}/>
                </a>
              </div>
            </div>

            <FooterColumn title="Shop" links={[
              { label: 'All Products', to: '/listings' },
              { label: 'Vegetables',   to: '/listings?category=1' },
              { label: 'Fruits',       to: '/listings?category=2' },
              { label: 'Seasonal',     to: '/seasonal' },
              { label: 'Our Farmers',  to: '/farmers' },
            ]}/>
            <FooterColumn title="Learn" links={[
              { label: 'Our Story',      to: '/about' },
              { label: 'Our Farmers',    to: '/farmers' },
              { label: 'Sustainability', to: '/help#sustainability' },
              { label: 'How It Works',   to: '/help#how-it-works' },
              { label: 'FAQs',           to: '/help#faqs' },
            ]}/>
            <FooterColumn title="Support" links={[
              { label: 'Help Center',     to: '/help' },
              { label: 'Delivery Info',   to: '/help#delivery' },
              { label: 'Returns',         to: '/help#returns' },
              { label: 'Contact Us',      to: '/help#contact' },
              { label: 'Become a Farmer', to: '/register' },
            ]}/>
          </div>
        </div>
      </section>

      {/* ═══ Legal row ═══════════════════════════════════════════ */}
      <section style={S.legalTier}>
        <div style={S.legalInner} className="ft-bottom">
          <p style={S.copyright}>
            © {year} FarmMarket. All rights reserved.
          </p>
          <div style={S.legal}>
            <Link to="/privacy"        style={S.legalLink} className="ft-legal">Privacy Policy</Link>
            <Link to="/terms"          style={S.legalLink} className="ft-legal">Terms of Service</Link>
            <Link to="/cookie-policy"  style={S.legalLink} className="ft-legal">Cookie Policy</Link>
          </div>
        </div>
      </section>

      {/* Hover effects + responsive */}
      <style>{`
        .ft-link:hover         { color: ${C.boneWhite} !important; }
        .ft-legal:hover        { color: ${C.boneWhite} !important; }
        .ft-social             { transition: background .2s ease, color .2s ease, transform .2s ease; }
        .ft-social:hover       { background: ${C.moss} !important; color: ${C.boneWhite} !important; transform: translateY(-2px); }

        @media (max-width: 880px) {
          .ft-cols { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
          .ft-brand-col { grid-column: 1 / -1 !important; max-width: none !important; }
        }
        @media (max-width: 540px) {
          .ft-cols   { grid-template-columns: 1fr !important; gap: 32px !important; }
          .ft-bottom { flex-direction: column !important; gap: 14px !important; align-items: flex-start !important; }
        }
      `}</style>
    </footer>
  );
}

// ── Sub-component ─────────────────────────────────────────────
function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 style={S.colTitle}>{title}</h4>
      <ul style={S.colList}>
        {links.map(l => (
          <li key={l.label} style={S.colItem}>
            <Link to={l.to} style={S.colLink} className="ft-link">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  footer: {
    background: C.forest,
    color:      C.sage,
    fontFamily: "'Inter', system-ui, sans-serif",
    marginTop:  'auto',
  },

  // ── Brand + Links ──
  linksTier: {
    padding: '56px 32px 40px',
  },
  linksInner: {
    maxWidth: 1300,
    margin:   '0 auto',
  },
  cols: {
    display:             'grid',
    gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
    gap:                 56,
  },
  brandCol: {
    maxWidth: 320,
  },
  logo: {
    display:      'flex',
    alignItems:   'center',
    gap:          10,
    marginBottom: 16,
  },
  logoText: {
    fontFamily:    SERIF,
    fontSize:      24,
    fontWeight:    400,
    color:         C.boneWhite,
    letterSpacing: '-0.015em',
    lineHeight:    1,
  },
  tagline: {
    fontSize:    13.5,
    lineHeight:  1.65,
    color:       C.sage,
    margin:      '0 0 22px',
    opacity:     0.9,
  },
  socials: {
    display: 'flex',
    gap:     8,
  },
  social: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          34,
    height:         34,
    borderRadius:   '50%',
    background:     'rgba(167,191,165,0.10)',
    color:          C.sage,
    textDecoration: 'none',
    border:         '1px solid rgba(167,191,165,0.18)',
  },
  colTitle: {
    fontSize:      13,
    fontWeight:    600,
    color:         C.boneWhite,
    margin:        '0 0 18px',
    letterSpacing: '0.02em',
  },
  colList: {
    listStyle: 'none',
    padding:   0,
    margin:    0,
    display:   'flex',
    flexDirection: 'column',
    gap:       11,
  },
  colItem: { margin: 0 },
  colLink: {
    color:          C.sage,
    textDecoration: 'none',
    fontSize:       13.5,
    transition:     'color .15s ease',
  },

  // ── TIER 3 — Legal ──
  legalTier: {
    borderTop: '1px solid rgba(167,191,165,0.12)',
    padding:   '20px 32px',
  },
  legalInner: {
    maxWidth:       1300,
    margin:         '0 auto',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:            16,
  },
  copyright: {
    fontSize: 12,
    color:    C.sage,
    margin:   0,
    opacity:  0.7,
  },
  legal: {
    display:  'flex',
    gap:      24,
    flexWrap: 'wrap',
  },
  legalLink: {
    color:          C.sage,
    textDecoration: 'none',
    fontSize:       12,
    transition:     'color .15s ease',
  },
};