// pages/About.jsx — About FarmMarket
// Author: CPRO306 Capstone Project | Date: 2026
//
// Editorial about page. Mission, story, values, sustainability, team, contact.
// Matches the earthy palette used in Home / Farmers / Seasonal / Listings.

import { useEffect } from 'react';
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
  earthBrown:'#7A5C46',
  terracotta:'#C46A4A',
  harvestGold:'#D6A441',
  white:     '#FFFFFF',
  muted:     '#6B7280',
  mutedDark: '#4B5563',
};

const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1100&auto=format&fit=crop&q=80';

// ── Inline SVG icons ──────────────────────────────────────────
const I = ({ children, size = 20, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const ArrowRight = ({ size = 16 }) => <I size={size}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></I>;
const LeafIcon   = (p) => <I {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></I>;
const HandshakeIcon = (p) => <I {...p}><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></I>;
const SparkleIcon = (p) => <I {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></I>;
const ShieldIcon  = (p) => <I {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></I>;
const HeartIcon   = (p) => <I {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></I>;
const MailIcon    = (p) => <I {...p}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></I>;

// ──────────────────────────────────────────────────────────────
export default function About() {

  // Load Instrument Serif on this page too
  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Inject animation keyframes
  useEffect(() => {
    const id = 'about-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes abFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
      .ab-fade-up { animation: abFadeUp .7s cubic-bezier(.22,1,.36,1) both; }
      .ab-card { transition: transform .25s ease, box-shadow .25s ease; }
      .ab-card:hover { transform: translateY(-3px); box-shadow: 0 24px 48px -16px rgba(37,53,40,.18); }
      .ab-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
      .ab-card:hover .ab-img { transform: scale(1.05); }
      .ab-btn:hover { background: ${C.moss} !important; }
      @media (max-width: 1000px) {
        .ab-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        .ab-story-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        .ab-story-grid > div:nth-child(2) { order: -1; }
        .ab-values-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .ab-team-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .ab-stats-row { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
      }
      @media (max-width: 600px) {
        .ab-hero-h1 { font-size: 44px !important; }
        .ab-section-h2 { font-size: 36px !important; }
        .ab-values-grid { grid-template-columns: 1fr !important; }
        .ab-team-grid { grid-template-columns: 1fr !important; }
        .ab-stats-row { grid-template-columns: 1fr !important; gap: 24px !important; }
        .ab-floating-card { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={{
      background: C.boneWhite,
      color:      C.charcoal,
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight:  '100vh',
    }}>

      {/* ═══ HERO ═══ */}
      <section style={{
        background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
        padding:    '64px 32px 72px',
      }}>
        <div className="ab-hero-grid" style={{
          maxWidth:           1240,
          margin:             '0 auto',
          display:            'grid',
          gridTemplateColumns:'1.1fr 1fr',
          gap:                64,
          alignItems:         'center',
        }}>

          {/* Left text */}
          <div className="ab-fade-up">
            <div style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          8,
              padding:      '7px 16px',
              background:   'rgba(167,191,165,0.22)',
              color:        C.moss,
              borderRadius: 999,
              fontSize:     13,
              fontWeight:   500,
              letterSpacing:'0.01em',
              marginBottom: 24,
            }}>
              <LeafIcon size={13}/>
              <span>Our Story</span>
            </div>

            <h1 className="ab-hero-h1" style={{
              fontFamily:    SERIF,
              fontSize:      56,
              fontWeight:    400,
              color:         C.charcoal,
              margin:        '0 0 22px',
              letterSpacing: '-0.022em',
              lineHeight:    1.05,
            }}>
              Real food,<br/>
              <span style={{ color: C.moss, fontStyle: 'italic' }}>real people</span>,<br/>
              real farms.
            </h1>

            <p style={{
              fontSize:    16.5,
              color:       C.mutedDark,
              lineHeight:  1.7,
              margin:      '0 0 36px',
              maxWidth:    520,
            }}>
              FarmMarket connects Australians directly with the farmers who grow their food.
              No supermarket middlemen. No mystery supply chains. Just honest produce from
              people you can know by name.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/listings" className="ab-btn" style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            10,
                padding:        '14px 28px',
                background:     C.forest,
                color:          C.boneWhite,
                borderRadius:   999,
                textDecoration: 'none',
                fontWeight:     500,
                fontSize:       15,
              }}>
                Shop Produce <ArrowRight size={15}/>
              </Link>
              <Link to="/farmers" style={{
                display:        'inline-flex',
                alignItems:     'center',
                padding:        '14px 28px',
                background:     'transparent',
                color:          C.forest,
                borderRadius:   999,
                textDecoration: 'none',
                fontWeight:     500,
                fontSize:       15,
                border:         `1.5px solid ${C.forest}`,
              }}>
                Meet our farmers
              </Link>
            </div>
          </div>

          {/* Right image with floating card */}
          <div className="ab-fade-up" style={{
            position:       'relative',
            animationDelay: '0.1s',
          }}>
            <div style={{
              borderRadius: 24,
              overflow:     'hidden',
              boxShadow:    '0 24px 48px -16px rgba(37,53,40,0.18)',
              background:   C.cream,
            }}>
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop&q=80"
                alt="Fresh Australian produce at a farmers market"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                style={{
                  width:       '100%',
                  aspectRatio: '4 / 3',
                  objectFit:   'cover',
                  display:     'block',
                }}
              />
            </div>
            <div className="ab-floating-card" style={{
              position:        'absolute',
              bottom:          -24,
              left:            -24,
              background:      C.white,
              padding:         '18px 22px',
              borderRadius:    18,
              boxShadow:       '0 24px 48px -12px rgba(37,53,40,0.20)',
              display:         'flex',
              alignItems:      'center',
              gap:             14,
              border:          `1px solid ${C.mistGray}`,
            }}>
              <div style={{
                width:           48,
                height:          48,
                background:      'rgba(167,191,165,0.25)',
                borderRadius:    '50%',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                color:           C.forest,
                flexShrink:      0,
              }}>
                <HeartIcon size={20}/>
              </div>
              <div>
                <div style={{
                  fontFamily:   SERIF,
                  fontSize:     18,
                  color:        C.charcoal,
                  fontWeight:   400,
                  marginBottom: 2,
                  letterSpacing:'-0.01em',
                }}>Family-built</div>
                <div style={{ fontSize: 12, color: C.muted }}>Made in Australia, since 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{
        padding: '48px 32px',
        background: C.boneWhite,
        borderTop: `1px solid ${C.mistGray}`,
        borderBottom: `1px solid ${C.mistGray}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="ab-stats-row" style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 48,
            textAlign:           'center',
          }}>
            {[
              { num: '500+',  label: 'Local Farmers' },
              { num: '50k+',  label: 'Happy Customers' },
              { num: '6',     label: 'States Covered' },
              { num: '100%',  label: 'Australian Grown' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily:    SERIF,
                  fontSize:      52,
                  fontWeight:    400,
                  color:         C.charcoal,
                  lineHeight:    1,
                  marginBottom:  10,
                  letterSpacing: '-0.022em',
                }}>{s.num}</div>
                <div style={{
                  fontSize:      11,
                  fontWeight:    600,
                  color:         C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OUR STORY ═══ */}
      <section style={{ padding: '88px 32px', background: C.boneWhite }}>
        <div className="ab-story-grid" style={{
          maxWidth:            1240,
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap:                 64,
          alignItems:          'center',
        }}>

          {/* Left image */}
          <div className="ab-fade-up">
            <div style={{
              borderRadius: 24,
              overflow:     'hidden',
              background:   C.cream,
            }}>
              <img
                src="https://images.unsplash.com/photo-1500076656116-558758c991c1?w=900&auto=format&fit=crop&q=80"
                alt="Australian farmer in field"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                style={{
                  width:       '100%',
                  aspectRatio: '4 / 5',
                  objectFit:   'cover',
                  display:     'block',
                }}
              />
            </div>
          </div>

          {/* Right text */}
          <div className="ab-fade-up" style={{ animationDelay: '0.1s' }}>
            <p style={{
              fontSize:      11,
              fontWeight:    700,
              color:         C.moss,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin:        '0 0 14px',
            }}>Our Story</p>

            <h2 className="ab-section-h2" style={{
              fontFamily:    SERIF,
              fontSize:      48,
              fontWeight:    400,
              color:         C.charcoal,
              margin:        '0 0 24px',
              letterSpacing: '-0.022em',
              lineHeight:    1.08,
            }}>
              Born from a simple <span style={{ color: C.moss, fontStyle: 'italic' }}>frustration</span>
            </h2>

            <p style={{
              fontSize:    16.5,
              color:       C.mutedDark,
              lineHeight:  1.75,
              margin:      '0 0 18px',
            }}>
              In 2026, a group of Kent Institute students kept asking the same question:
              why does a tomato grown two hours away from Melbourne cost more — and taste worse —
              than one shipped halfway across the country?
            </p>
            <p style={{
              fontSize:    16.5,
              color:       C.mutedDark,
              lineHeight:  1.75,
              margin:      '0 0 18px',
            }}>
              We discovered the answer wasn't farming. It was distribution. Layers of
              middlemen, packaging, and transport were squeezing farmers and inflating
              prices for everyone else.
            </p>
            <p style={{
              fontSize:    16.5,
              color:       C.mutedDark,
              lineHeight:  1.75,
              margin:      0,
            }}>
              FarmMarket was built to remove those layers. Farmers list directly. Buyers
              order directly. Produce travels hours, not days. And both sides keep more of
              what's fair.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ VALUES ═══ */}
      <section style={{
        padding:    '88px 32px',
        background: C.cream,
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 640, marginInline: 'auto' }}>
            <p style={{
              fontSize:      11,
              fontWeight:    700,
              color:         C.moss,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin:        '0 0 14px',
            }}>What We Believe</p>
            <h2 className="ab-section-h2" style={{
              fontFamily:    SERIF,
              fontSize:      48,
              fontWeight:    400,
              color:         C.charcoal,
              margin:        '0 0 18px',
              letterSpacing: '-0.022em',
              lineHeight:    1.08,
            }}>
              Four values that <span style={{ color: C.moss, fontStyle: 'italic' }}>guide everything</span> we do
            </h2>
            <p style={{ fontSize: 16, color: C.mutedDark, lineHeight: 1.65 }}>
              These aren't slogans. They shape every decision we make — from which farmers we onboard
              to how we handle delivery windows.
            </p>
          </div>

          <div className="ab-values-grid" style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 24,
          }}>
            {[
              {
                Icon:  HandshakeIcon,
                title: 'Fairness first',
                desc:  'Farmers set their own prices and keep 100% of the sale. No commission, no hidden fees.',
              },
              {
                Icon:  LeafIcon,
                title: 'Real freshness',
                desc:  'Produce moves from farm to table in 48 hours, not 14 days. You can taste the difference.',
              },
              {
                Icon:  ShieldIcon,
                title: 'Honest sourcing',
                desc:  'Every farm is verified. Every product is traceable. Every claim is backed by evidence.',
              },
              {
                Icon:  HeartIcon,
                title: 'Community over scale',
                desc:  'We grow when our farmers thrive. We measure success in family farms saved.',
              },
            ].map((v, i) => (
              <article key={v.title} className="ab-card ab-fade-up"
                       style={{
                         background:    C.white,
                         borderRadius:  20,
                         padding:       28,
                         border:        `1px solid ${C.mistGray}`,
                         animationDelay:`${i * 0.08}s`,
                         display:       'flex',
                         flexDirection: 'column',
                       }}>
                <div style={{
                  width:           52,
                  height:          52,
                  background:      'rgba(167,191,165,0.22)',
                  borderRadius:    14,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  marginBottom:    20,
                  color:           C.forest,
                }}>
                  <v.Icon size={24}/>
                </div>
                <h3 style={{
                  fontFamily:    SERIF,
                  fontSize:      24,
                  color:         C.charcoal,
                  fontWeight:    400,
                  margin:        '0 0 12px',
                  letterSpacing: '-0.012em',
                  lineHeight:    1.2,
                }}>{v.title}</h3>
                <p style={{
                  fontSize:   14,
                  color:      C.mutedDark,
                  lineHeight: 1.65,
                  margin:     0,
                }}>{v.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW WE'RE DIFFERENT ═══ */}
      <section style={{ padding: '88px 32px', background: C.boneWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 640, marginInline: 'auto' }}>
            <p style={{
              fontSize:      11,
              fontWeight:    700,
              color:         C.moss,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin:        '0 0 14px',
            }}>The Difference</p>
            <h2 className="ab-section-h2" style={{
              fontFamily:    SERIF,
              fontSize:      48,
              fontWeight:    400,
              color:         C.charcoal,
              margin:        0,
              letterSpacing: '-0.022em',
              lineHeight:    1.08,
            }}>
              FarmMarket vs the supermarket
            </h2>
          </div>

          {/* Comparison rows */}
          <div style={{
            background:   C.white,
            borderRadius: 24,
            border:       `1px solid ${C.mistGray}`,
            overflow:     'hidden',
          }}>
            {/* Header row */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr',
              padding:             '20px 28px',
              background:          C.cream,
              borderBottom:        `1px solid ${C.mistGray}`,
              fontSize:            11,
              fontWeight:          700,
              color:               C.muted,
              letterSpacing:       '0.14em',
              textTransform:       'uppercase',
            }}>
              <div></div>
              <div style={{ textAlign: 'center' }}>FarmMarket</div>
              <div style={{ textAlign: 'center' }}>Supermarket</div>
            </div>
            {/* Rows */}
            {[
              ['Farm to your door',          '24–48 hours',      '7–14 days'],
              ['Knows your farmer',          'Yes',              'Anonymous'],
              ['Farmer keeps',               '100%',             '~30%'],
              ['Seasonal & local',           'Always',           'Sometimes'],
              ['Hidden middlemen',           'None',             '3–5 layers'],
              ['Verified sourcing',          'Every product',    'Limited'],
            ].map(([label, us, them], i, arr) => (
              <div key={label} style={{
                display:             'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                padding:             '18px 28px',
                borderBottom:        i < arr.length - 1 ? `1px solid ${C.mistGray}` : 'none',
                alignItems:          'center',
              }}>
                <div style={{ fontSize: 14.5, color: C.charcoal, fontWeight: 500 }}>
                  {label}
                </div>
                <div style={{
                  textAlign:  'center',
                  fontSize:   14,
                  color:      C.forest,
                  fontWeight: 600,
                }}>
                  {us}
                </div>
                <div style={{
                  textAlign: 'center',
                  fontSize:  14,
                  color:     C.muted,
                }}>
                  {them}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section style={{ padding: '88px 32px', background: C.cream }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 640, marginInline: 'auto' }}>
            <p style={{
              fontSize:      11,
              fontWeight:    700,
              color:         C.moss,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin:        '0 0 14px',
            }}>The Team</p>
            <h2 className="ab-section-h2" style={{
              fontFamily:    SERIF,
              fontSize:      48,
              fontWeight:    400,
              color:         C.charcoal,
              margin:        '0 0 18px',
              letterSpacing: '-0.022em',
              lineHeight:    1.08,
            }}>
              Built by <span style={{ color: C.moss, fontStyle: 'italic' }}>students</span>, for everyone
            </h2>
            <p style={{ fontSize: 16, color: C.mutedDark, lineHeight: 1.65 }}>
              FarmMarket is a CPRO306 capstone project at Kent Institute Australia.
              We're a small team of developers, designers, and product thinkers who care about food.
            </p>
          </div>

          <div className="ab-team-grid" style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 24,
          }}>
            {[
              { initials: 'MM', name: 'Maneyta',    role: 'Project Lead & Frontend Design',        accent: '#3D5B45', isLead: true },
              { initials: 'BB', name: 'BB',         role: 'Full-Stack Development & Architecture', accent: '#C46A4A' },
              { initials: 'SS', name: 'Sailen',     role: 'Backend & API Architecture',            accent: '#D6A441' },
              { initials: 'AA', name: 'Alisha',     role: 'Database & Data Modeling',              accent: '#7A5C46' },
              { initials: 'SK', name: 'Samikshya',  role: 'AI Integration & Quality Assurance',    accent: '#A7BFA5' },
              { initials: 'ZZ', name: 'Z',          role: 'Security & DevOps',                     accent: '#4B5563' },
            ].map((m, i) => (
              <article key={m.name} className="ab-card ab-fade-up"
                       style={{
                         background:    C.white,
                         borderRadius:  20,
                         padding:       28,
                         border:        `1px solid ${C.mistGray}`,
                         textAlign:     'center',
                         animationDelay:`${i * 0.08}s`,
                       }}>
                <div style={{
                  width:        72,
                  height:       72,
                  borderRadius: '50%',
                  background:   m.accent,
                  color:        C.boneWhite,
                  fontFamily:   SERIF,
                  fontSize:     30,
                  fontWeight:   400,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                  margin:       '0 auto 18px',
                  letterSpacing:'-0.01em',
                }}>{m.initials}</div>
                {m.isLead && (
                  <div style={{
                    display:       'inline-block',
                    fontSize:      10,
                    fontWeight:    700,
                    color:         C.moss,
                    background:    'rgba(167,191,165,0.22)',
                    padding:       '3px 10px',
                    borderRadius:  999,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom:  10,
                  }}>Project Lead</div>
                )}
                <h3 style={{
                  fontSize:    18,
                  color:       C.charcoal,
                  fontWeight:  600,
                  margin:      '0 0 8px',
                  letterSpacing:'-0.005em',
                }}>{m.name}</h3>
                <p style={{
                  fontSize:   13,
                  color:      C.mutedDark,
                  margin:     0,
                  lineHeight: 1.55,
                }}>{m.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TECH WE USE ═══ */}
      <section style={{ padding: '88px 32px', background: C.boneWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="ab-story-grid" style={{
            display:             'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap:                 64,
            alignItems:          'center',
          }}>
            <div className="ab-fade-up">
              <p style={{
                fontSize:      11,
                fontWeight:    700,
                color:         C.moss,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin:        '0 0 14px',
              }}>Built With</p>
              <h2 className="ab-section-h2" style={{
                fontFamily:    SERIF,
                fontSize:      44,
                fontWeight:    400,
                color:         C.charcoal,
                margin:        '0 0 22px',
                letterSpacing: '-0.022em',
                lineHeight:    1.1,
              }}>
                A <span style={{ color: C.moss, fontStyle: 'italic' }}>modern stack</span>, built to last
              </h2>
              <p style={{
                fontSize:    16,
                color:       C.mutedDark,
                lineHeight:  1.7,
                margin:      '0 0 28px',
              }}>
                We chose technologies that prioritize security, performance, and accessibility —
                because a marketplace people trust their groceries to deserves nothing less.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  'React.js', 'Node.js', 'Express', 'MySQL', 'JWT Auth',
                  'Stripe Payments', 'Groq AI', 'PCI-DSS Compliant',
                ].map(t => (
                  <span key={t} style={{
                    padding:       '6px 14px',
                    background:    C.cream,
                    color:         C.charcoal,
                    fontSize:      12.5,
                    fontWeight:    500,
                    borderRadius:  999,
                    border:        `1px solid ${C.mistGray}`,
                  }}>{t}</span>
                ))}
              </div>
            </div>

            <div className="ab-fade-up" style={{ animationDelay: '0.1s' }}>
              <div style={{
                background:    C.forest,
                color:         C.boneWhite,
                borderRadius:  24,
                padding:       40,
                position:      'relative',
                overflow:      'hidden',
              }}>
                <div style={{
                  width:           48,
                  height:          48,
                  background:      'rgba(167,191,165,0.18)',
                  borderRadius:    14,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  marginBottom:    20,
                  color:           C.sage,
                }}>
                  <SparkleIcon size={22}/>
                </div>
                <h3 style={{
                  fontFamily:    SERIF,
                  fontSize:      30,
                  fontWeight:    400,
                  color:         C.boneWhite,
                  margin:        '0 0 14px',
                  letterSpacing: '-0.018em',
                  lineHeight:    1.15,
                }}>
                  AI-powered, human-centered
                </h3>
                <p style={{
                  fontSize:   15,
                  color:      C.sage,
                  lineHeight: 1.65,
                  margin:     '0 0 20px',
                }}>
                  Our FarmBot assistant helps you find seasonal produce, suggests recipes,
                  and writes farmer product descriptions — all powered by Groq's lightning-fast LLMs.
                </p>
                <Link to="/listings" style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            8,
                  color:          C.boneWhite,
                  textDecoration: 'none',
                  fontSize:       14,
                  fontWeight:     500,
                  borderBottom:   `1px solid ${C.sage}`,
                  paddingBottom:  4,
                }}>
                  Try it on the shop page <ArrowRight size={14}/>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT / CTA ═══ removed — clashes with footer's
           green background; the footer's "Contact Us" link in
           Support column already covers this. ═══════════════════ */}
    </div>
  );
}