// pages/Farmers.jsx — Our Farmers directory
// Author: CPRO306 Capstone Project | Date: 2026
//
// v2 — Loads Instrument Serif explicitly, refined typography hierarchy,
// vetted farmer photos, tighter layout proportions.

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

// ── Palette (matches Home.jsx) ────────────────────────────────
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

// Vetted farmer/agriculture photos (all confirmed working on Unsplash)
const FARMER_PHOTOS = [
  'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1620200423727-8127f75d4f53?w=800&auto=format&fit=crop&q=75',
];
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&auto=format&fit=crop&q=75';

const SPECIALTIES = [
  'Heirloom Vegetables', 'Stone Fruit & Berries', 'Citrus & Olives',
  'Free-range Eggs & Honey', 'Leafy Greens', 'Native Bushfoods',
];
const LOCATIONS = [
  'Yarra Valley, VIC', 'Hunter Valley, NSW', 'Mildura, VIC',
  'Margaret River, WA', 'Adelaide Hills, SA', 'Sunshine Coast, QLD',
];
const FARM_STORIES = [
  'Three generations of organic farming on rolling hills.',
  'Heritage seeds, regenerative practices, honest produce.',
  'Family-run since 1987, certified biodynamic.',
  'Small-scale market gardening with maximum flavor.',
  'Pasture-raised, ethically managed, deeply local.',
  'Sustainable apiary with wildflower meadows.',
];

// ── Inline icons ──────────────────────────────────────────────
const ArrowRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const MapPinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const LeafIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
  </svg>
);
const SearchIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

// ──────────────────────────────────────────────────────────────
export default function Farmers() {
  const navigate = useNavigate();
  const [farmers,  setFarmers]  = useState([]);
  const [counts,   setCounts]   = useState({});
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  // Load Instrument Serif — make sure it's available on this page even if
  // Home was never visited first.
  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Inject animation keyframes once
  useEffect(() => {
    const id = 'farmers-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes fmFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
      .fm-fade-up { animation: fmFadeUp .6s cubic-bezier(.22,1,.36,1) both; }
      .fm-card { transition: transform .25s ease, box-shadow .25s ease; }
      .fm-card:hover { transform: translateY(-4px); box-shadow: 0 28px 56px -16px rgba(37,53,40,.18); }
      .fm-card:hover .fm-img { transform: scale(1.06); }
      .fm-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
      .fm-btn { transition: background .2s ease, transform .15s ease; }
      .fm-btn:hover { background: ${C.moss} !important; }
      .fm-search-input::placeholder { color: ${C.muted}; opacity: .8; }
      @keyframes fmSpin { to { transform: rotate(360deg); } }
      @media (max-width: 1000px) {
        .fm-grid { grid-template-columns: 1fr 1fr !important; }
        .fm-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; text-align: center !important; }
        .fm-hero-grid .fm-hero-text { max-width: 640px; margin: 0 auto; }
        .fm-hero-grid .fm-stats-row { justify-content: center !important; }
        .fm-hero-img-wrap { max-width: 560px; margin: 0 auto; }
      }
      @media (max-width: 720px) {
        .fm-hero-h1 { font-size: 42px !important; }
        .fm-grid { grid-template-columns: 1fr !important; }
        .fm-stats-row { gap: 28px !important; }
        .fm-browse-row { flex-direction: column !important; align-items: flex-start !important; }
        .fm-browse-row > div:last-child { width: 100% !important; }
        .fm-floating-card { display: none !important; }
      }
      @media (max-width: 520px) {
        .fm-hero-h1 { font-size: 36px !important; }
        .fm-stats-row { gap: 18px !important; }
        .fm-stat-num { font-size: 28px !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Load farmers + listings counts
  useEffect(() => {
    Promise.all([
      api.get('/listings/farmers').then(r => r.data || []).catch(() => []),
      api.get('/listings?limit=200').then(r => r.data.listings || []).catch(() => []),
    ]).then(([farmerList, allListings]) => {
      const c = {};
      allListings.forEach(l => { c[l.farmer_id] = (c[l.farmer_id] || 0) + 1; });
      setCounts(c);
      setFarmers(farmerList);
      setLoading(false);
    });
  }, []);

  const fallbackFarmers = [
    { user_id: 1, farm_name: 'Sarah Mitchell — Sunny Valley Organics' },
    { user_id: 2, farm_name: 'Tom Chen — Green Acres Co-op' },
    { user_id: 3, farm_name: 'Emma Rodriguez — Coastal Citrus Farm' },
    { user_id: 4, farm_name: 'James Walker — Walker Family Farms' },
    { user_id: 5, farm_name: 'Priya Patel — Highland Heritage Produce' },
    { user_id: 6, farm_name: 'Daniel Lee — Mountain View Apiaries' },
  ];
  const data = farmers.length ? farmers : fallbackFarmers;
  const filtered = search
    ? data.filter(f => (f.farm_name || '').toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div style={{
      background: C.boneWhite,
      color: C.charcoal,
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: '100vh',
    }}>

      {/* ═══ HERO ═══ */}
      <section style={{
        background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
        padding: '64px 32px 72px',
      }}>
        <div className="fm-hero-grid" style={{
          maxWidth:           1240,
          margin:             '0 auto',
          display:            'grid',
          gridTemplateColumns:'1.1fr 1fr',
          gap:                64,
          alignItems:         'center',
        }}>

          {/* ─── Left: Text column ─── */}
          <div className="fm-fade-up fm-hero-text">

            {/* Eyebrow tag */}
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
              marginBottom: 28,
            }}>
              <LeafIcon size={13}/>
              <span>Real People · Real Farms</span>
            </div>

            {/* Headline — properly sized for split layout */}
            <h1 className="fm-hero-h1" style={{
              fontFamily:    SERIF,
              fontSize:      56,
              fontWeight:    400,
              color:         C.charcoal,
              margin:        '0 0 22px',
              letterSpacing: '-0.022em',
              lineHeight:    1.05,
            }}>
              Meet the farmers<br/>
              <span style={{
                color:     C.moss,
                fontStyle: 'italic',
              }}>behind your food</span>
            </h1>

            {/* Lead paragraph */}
            <p style={{
              fontSize:    16.5,
              color:       C.mutedDark,
              lineHeight:  1.65,
              margin:      '0 0 32px',
              maxWidth:    520,
              fontWeight:  400,
            }}>
              Every product on FarmMarket comes from a real Australian farmer with a
              real story. Get to know the people growing your food and supporting
              sustainable agriculture.
            </p>

            {/* Stats row — integrated into text column */}
            <div className="fm-stats-row" style={{
              display:    'flex',
              gap:        48,
              flexWrap:   'wrap',
              paddingTop: 28,
              borderTop:  `1px solid rgba(37,53,40,0.10)`,
            }}>
              {[
                { num: data.length || '500+', label: 'Active Farmers' },
                { num: '6',                   label: 'States Covered' },
                { num: '100%',                label: 'Australian Grown' },
              ].map(s => (
                <div key={s.label}>
                  <div className="fm-stat-num" style={{
                    fontFamily:    SERIF,
                    fontSize:      36,
                    fontWeight:    400,
                    color:         C.charcoal,
                    lineHeight:    1,
                    marginBottom:  6,
                    letterSpacing: '-0.02em',
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

          {/* ─── Right: Image column with floating credit card ─── */}
          <div className="fm-fade-up fm-hero-img-wrap" style={{
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
                src="https://images.unsplash.com/photo-1592420114011-ee3a18ca6164?w=1000&auto=format&fit=crop&q=80"
                alt="Australian farmer at a market stall with fresh vegetables"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1000&auto=format&fit=crop&q=80';
                }}
                style={{
                  width:       '100%',
                  aspectRatio: '4 / 3',
                  objectFit:   'cover',
                  display:     'block',
                }}
              />
            </div>

            {/* Floating "Verified Farms" badge — bottom-left of image */}
            <div className="fm-floating-card" style={{
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
              maxWidth:        280,
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
                <LeafIcon size={20}/>
              </div>
              <div>
                <div style={{
                  fontFamily: SERIF,
                  fontSize:   18,
                  color:      C.charcoal,
                  fontWeight: 400,
                  marginBottom: 2,
                  letterSpacing: '-0.01em',
                }}>Verified Farms</div>
                <div style={{
                  fontSize: 12,
                  color:    C.muted,
                }}>Every farmer hand-vetted</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BROWSE HEADER + SEARCH ═══ */}
      <section style={{
        padding: '72px 32px 40px',
        borderTop: `1px solid ${C.mistGray}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="fm-browse-row" style={{
            display:        'flex',
            alignItems:     'flex-end',
            justifyContent: 'space-between',
            gap:            24,
            marginBottom:   48,
          }}>
            <div>
              <p style={{
                fontSize:      11,
                fontWeight:    700,
                color:         C.moss,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin:        '0 0 14px',
              }}>Browse</p>
              <h2 style={{
                fontFamily:    SERIF,
                fontSize:      44,
                fontWeight:    400,
                color:         C.charcoal,
                margin:        0,
                letterSpacing: '-0.018em',
                lineHeight:    1.1,
              }}>
                {filtered.length} {filtered.length === 1 ? 'farmer' : 'farmers'}
                {search && (
                  <span style={{
                    color:    C.muted,
                    fontSize: 28,
                    fontStyle:'italic',
                    marginLeft: 8,
                  }}>matching "{search}"</span>
                )}
              </h2>
            </div>

            {/* Search input */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              gap:            10,
              background:     C.cream,
              border:         `1px solid ${C.mistGray}`,
              borderRadius:   999,
              padding:        '12px 20px',
              minWidth:       320,
            }}>
              <span style={{ color: C.moss, display: 'flex' }}><SearchIcon size={15}/></span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or farm..."
                className="fm-search-input"
                style={{
                  flex:       1,
                  border:     'none',
                  outline:    'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize:   14,
                  color:      C.charcoal,
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  border:     'none',
                  background: 'transparent',
                  cursor:     'pointer',
                  color:      C.muted,
                  fontSize:   16,
                  padding:    0,
                  lineHeight: 1,
                }}>×</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FARMERS GRID ═══ */}
      <section style={{ padding: '0 32px 96px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: C.muted }}>
              <div style={{
                width:        40,
                height:       40,
                border:       `3px solid ${C.mistGray}`,
                borderTopColor: C.forest,
                borderRadius: '50%',
                animation:    'fmSpin 0.8s linear infinite',
                margin:       '0 auto 16px',
              }}/>
              <p style={{ fontSize: 14 }}>Loading farmers…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding:   '80px 24px',
              background: C.cream,
              borderRadius: 24,
              color: C.muted,
            }}>
              <p style={{
                fontFamily: SERIF,
                fontSize:   28,
                color:      C.charcoal,
                margin:     '0 0 10px',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}>
                No farmers match "{search}"
              </p>
              <p style={{ fontSize: 14 }}>Try a different search term.</p>
            </div>
          ) : (
            <div className="fm-grid" style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 32,
            }}>
              {filtered.map((f, i) => {
                const parts      = (f.farm_name || '').split(/[—–-]/).map(s => s.trim());
                const farmerName = parts.length > 1 ? parts[0] : 'Local Farmer';
                const farmName   = parts.length > 1 ? parts[1] : (parts[0] || 'Family Farm');
                const photo      = FARMER_PHOTOS[i % FARMER_PHOTOS.length];
                const specialty  = SPECIALTIES[i % SPECIALTIES.length];
                const location   = LOCATIONS[i % LOCATIONS.length];
                const story      = FARM_STORIES[i % FARM_STORIES.length];
                const count      = counts[f.user_id] || 0;

                return (
                  <article key={f.user_id || `${f.farm_name}-${i}`}
                       className="fm-card fm-fade-up"
                       style={{
                         background:   C.white,
                         borderRadius: 22,
                         overflow:     'hidden',
                         border:       `1px solid ${C.mistGray}`,
                         animationDelay: `${(i % 6) * 0.06}s`,
                         display:      'flex',
                         flexDirection:'column',
                       }}>
                    {/* Photo */}
                    <div style={{
                      position:   'relative',
                      aspectRatio:'4 / 3',
                      overflow:   'hidden',
                      background: C.cream,
                    }}>
                      <img src={photo} alt={farmerName}
                           onError={(e) => { e.currentTarget.src = FALLBACK_PHOTO; }}
                           className="fm-img"
                           loading="lazy"
                           style={{
                             width:    '100%',
                             height:   '100%',
                             objectFit:'cover',
                             display:  'block',
                           }}/>
                      {/* Verified ribbon */}
                      <div style={{
                        position:        'absolute',
                        top:             16,
                        left:            16,
                        padding:         '6px 13px',
                        background:      'rgba(251,250,248,0.95)',
                        backdropFilter:  'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        color:           C.forest,
                        fontSize:        11,
                        fontWeight:      600,
                        borderRadius:    999,
                        letterSpacing:   '0.04em',
                        display:         'flex',
                        alignItems:      'center',
                        gap:             6,
                        boxShadow:       '0 2px 8px rgba(37,53,40,0.08)',
                      }}>
                        <LeafIcon size={11}/> Verified
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{
                      padding:       28,
                      display:       'flex',
                      flexDirection: 'column',
                      flex:          1,
                    }}>
                      <p style={{
                        fontSize:      11,
                        color:         C.moss,
                        fontWeight:    700,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        margin:        '0 0 10px',
                      }}>{specialty}</p>
                      <h3 style={{
                        fontSize:      22,
                        color:         C.charcoal,
                        fontWeight:    500,
                        margin:        '0 0 4px',
                        letterSpacing: '-0.01em',
                        lineHeight:    1.25,
                      }}>{farmerName}</h3>
                      <p style={{
                        fontFamily:   SERIF,
                        fontSize:     22,
                        color:        C.moss,
                        fontStyle:    'italic',
                        fontWeight:   400,
                        margin:       '0 0 16px',
                        lineHeight:   1.2,
                        letterSpacing:'-0.005em',
                      }}>{farmName}</p>

                      <p style={{
                        fontSize:    14,
                        color:       C.mutedDark,
                        lineHeight:  1.6,
                        margin:      '0 0 20px',
                      }}>{story}</p>

                      <div style={{
                        display:        'flex',
                        flexDirection:  'column',
                        gap:            8,
                        marginBottom:   24,
                        paddingTop:     16,
                        borderTop:      `1px solid ${C.mistGray}`,
                      }}>
                        <div style={{
                          display:    'flex',
                          alignItems: 'center',
                          gap:        8,
                          fontSize:   13,
                          color:      C.mutedDark,
                        }}>
                          <span style={{ color: C.moss, display: 'flex' }}><MapPinIcon size={14}/></span>
                          {location}
                        </div>
                        <div style={{
                          fontSize:   13,
                          color:      C.mutedDark,
                          paddingLeft: 22,
                        }}>
                          <span style={{ color: C.charcoal, fontWeight: 600 }}>{count}</span>{' '}
                          {count === 1 ? 'product' : 'products'} available
                        </div>
                      </div>

                      <button
                        onClick={() => f.user_id ? navigate(`/farmers/${f.user_id}`) : navigate('/farmers')}
                        className="fm-btn"
                        style={{
                          width:           '100%',
                          padding:         '13px 20px',
                          background:      C.forest,
                          color:           C.boneWhite,
                          border:          'none',
                          borderRadius:    999,
                          fontFamily:      'inherit',
                          fontSize:        14,
                          fontWeight:      500,
                          cursor:          'pointer',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          gap:             8,
                          marginTop:       'auto',
                        }}>
                        View Produce <ArrowRightIcon size={15}/>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ JOIN AS FARMER CTA ═══ removed — duplicates footer's
           "Become a Farmer" link, and the green panel was clashing
           with the footer beneath it. ═══════════════════════════ */}
    </div>
  );
}