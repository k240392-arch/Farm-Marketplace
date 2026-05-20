import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProduceImage } from '../utils/produceImage';
import PromoPopup from '../components/PromoPopup';
import FeedbackWidget from '../components/FeedbackWidget';
import { API_URL } from '../config';

// ──────────────────────────────────────────────────────────────
// PALETTE  (matches zip's design tokens — see styles/theme.css)
// ──────────────────────────────────────────────────────────────
const C = {
  forest:      '#253528',
  moss:        '#3D5B45',
  sage:        '#A7BFA5',
  cream:       '#F6F3EE',
  boneWhite:   '#FBFAF8',
  charcoal:    '#1C1F1D',
  earthBrown:  '#7A5C46',
  terracotta:  '#C46A4A',
  harvestGold: '#D6A441',
  mistGray:    '#E7E5E0',
  white:       '#FFFFFF',
  muted:       '#6B7280',
};

const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

// ──────────────────────────────────────────────────────────────
// INLINE SVG ICONS  (so we don't add lucide-react dep)
// stroke-based, lucide-style, 24×24 viewBox, currentColor
// ──────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, strokeWidth = 2, fill = 'none', children, style }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {d ? <path d={d} /> : children}
  </svg>
);
const SparklesIcon  = (p) => <Icon {...p}>
  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
  <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
</Icon>;
const ArrowRightIcon= (p) => <Icon {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Icon>;
const SearchIcon    = (p) => <Icon {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Icon>;
const TruckIcon     = (p) => <Icon {...p}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></Icon>;
const ShieldIcon    = (p) => <Icon {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></Icon>;
const LeafIcon      = (p) => <Icon {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></Icon>;
const StarIcon      = (p) => <Icon {...p}><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></Icon>;
const CartIcon      = (p) => <Icon {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></Icon>;
const HeartIcon     = (p) => <Icon {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></Icon>;
const MapPinIcon    = (p) => <Icon {...p}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></Icon>;
const AwardIcon     = (p) => <Icon {...p}><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></Icon>;
const MailIcon      = (p) => <Icon {...p}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Icon>;

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const getImg = (image_url) => {
  if (!image_url) return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600';
  if (image_url.startsWith('http')) return image_url;
  return `${API_URL}${image_url}`;
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // ── Existing data fetching (preserved from original Home) ────
  const [featured,   setFeatured]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats,      setStats]      = useState({});
  const [farmers,    setFarmers]    = useState([]);
  const [search,     setSearch]     = useState('');

  useEffect(() => {
    api.get('/listings/featured?limit=8').then(r => setFeatured(r.data.listings || [])).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
    api.get('/listings/farmers').then(r => setFarmers(r.data || [])).catch(() => {});
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() =>
      setStats({ total_users: '500+', active_listings: '200+', total_orders: '1,000+' })
    );
  }, []);

  // ── Load Instrument Serif font (only while Home is mounted) ──
  useEffect(() => {
    const id = 'home-instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(link);
    // Don't remove on unmount — caching it across nav is fine.
  }, []);

  // ── Inject keyframes for fade-in animations (one time) ──
  useEffect(() => {
    const id = 'home-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes hmFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
      @keyframes hmFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes hmZoomIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
      .hm-fade-up { animation: hmFadeUp .7s cubic-bezier(.22,1,.36,1) both; }
      .hm-fade-in { animation: hmFadeIn .9s ease-out both; }
      .hm-zoom-in { animation: hmZoomIn .7s cubic-bezier(.22,1,.36,1) both; }
      .hm-img:hover { transform: scale(1.05); }
      .hm-img { transition: transform .7s cubic-bezier(.22,1,.36,1); }
      .hm-card-hover { transition: transform .25s ease, box-shadow .25s ease; }
      .hm-card-hover:hover { transform: translateY(-4px); box-shadow: 0 24px 48px -12px rgba(37,53,40,.18); }
      .hm-btn-hover { transition: transform .2s ease, background .2s ease, color .2s ease; }
      .hm-btn-hover:hover { transform: scale(1.04); }
      .hm-cat:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(37,53,40,.12); }
      .hm-cat { transition: transform .25s ease, box-shadow .25s ease; }
      .hm-cat:hover .hm-cat-icon { transform: scale(1.1); }
      .hm-cat-icon { transition: transform .25s ease; }
      .hm-prod:hover .hm-prod-img { transform: scale(1.08); }
      .hm-prod-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
      .hm-prod:hover .hm-fav { opacity: 1; }
      .hm-fav { opacity: 0; transition: opacity .25s ease, background .2s ease; }
      .hm-fav:hover { background: ${C.white} !important; }
      .hm-link-btn { transition: background .2s ease, color .2s ease, border-color .2s ease; }
      .hm-link-btn:hover { background: ${C.forest}; color: ${C.boneWhite}; }
      .hm-pri-btn:hover { background: ${C.moss} !important; }
      .hm-row-hover { transition: background .2s ease; }
      .hm-row-hover:hover { background: ${C.mistGray}; }
      .hm-news-input::placeholder { color: rgba(167,191,165,.7); }
      .hm-news-btn:hover { background: ${C.sage} !important; color: ${C.boneWhite} !important; }
      @media (max-width: 900px) {
        .hm-2col { grid-template-columns: 1fr !important; }
        .hm-flex-end { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
      }
      @media (max-width: 700px) {
        .hm-img-grid { grid-template-columns: 1fr !important; }
        .hm-img-grid > div:last-child { padding-top: 0 !important; }
        .hm-trust-row { grid-template-columns: 1fr 1fr !important; }
        .hm-cat-grid { grid-template-columns: 1fr 1fr !important; }
        .hm-prod-grid { grid-template-columns: 1fr !important; }
        .hm-farmer-grid { grid-template-columns: 1fr !important; }
        .hm-test-grid { grid-template-columns: 1fr !important; }
        .hm-stats-row { grid-template-columns: 1fr 1fr !important; }
        .hm-news-form { flex-direction: column !important; }
        .hm-hero-h1 { font-size: 48px !important; }
        .hm-section-h2 { font-size: 36px !important; }
        .hm-trust-stats { gap: 24px !important; flex-wrap: wrap; }
        .hm-floating-card { display: none !important; }
        .hm-search-row { flex-direction: column !important; align-items: stretch !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // ── Search handler (preserved) ──
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/listings?search=${encodeURIComponent(search)}`);
    else navigate('/listings');
  };

  // ── Season detection (preserved from original) ──
  const month = new Date().getMonth();
  const season = (() => {
    if (month >= 2 && month <= 4)  return { name: 'Autumn', emoji: '🍂', tagline: "Autumn's Best, Fresh This Week", desc: "As the season changes, so does our selection. This month, we're celebrating the rich, earthy flavors of autumn with hand-selected produce at peak ripeness from farms across Australia.", items: [{name:'Butternut Pumpkin',desc:'Sweet & creamy',emoji:'🎃'},{name:'Brussels Sprouts',desc:'Tender & fresh',emoji:'🥬'},{name:'Heritage Apples',desc:'Crisp & juicy',emoji:'🍎'}], img: 'https://images.unsplash.com/photo-1597474561103-0d3afd8867f3?w=900' };
    if (month >= 5 && month <= 7)  return { name: 'Winter', emoji: '❄️', tagline: "Winter Warmers, Fresh & Hearty", desc: "Winter brings deep flavors and slow-cooked comfort. Stock up on citrus at its juiciest, leafy greens at their crispest, and root vegetables ready for roasting.",                                                                                              items: [{name:'Navel Oranges',desc:'Bright & juicy',emoji:'🍊'},{name:'Curly Kale',desc:'Hearty & rich',emoji:'🥬'},{name:'Garlic',desc:'Bold & aromatic',emoji:'🧄'}],                              img: 'https://images.unsplash.com/photo-1568569350062-ebfa3cb195df?w=900' };
    if (month >= 8 && month <= 10) return { name: 'Spring', emoji: '🌸', tagline: "Spring Awakens, Tender & Fresh", desc: "Spring is a celebration of renewal — tender greens, sweet berries, and the first asparagus shoots of the year. Light, vibrant, and full of life.",                                                                                                       items: [{name:'Strawberries',desc:'Sweet & sun-ripe',emoji:'🍓'},{name:'Asparagus',desc:'Tender spears',emoji:'🌱'},{name:'Garden Peas',desc:'Crisp & sweet',emoji:'🫛'}],                            img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900' };
    return                          { name: 'Summer', emoji: '☀️', tagline: "Summer's Bounty, Sun-Ripened",       desc: "Summer means peak abundance. Tomatoes bursting with flavor, mangoes at their sweetest, and stone fruit picked sun-warm from the tree.",                                                                                                                  items: [{name:'Heirloom Tomatoes',desc:'Vine-ripened',emoji:'🍅'},{name:'Mangoes',desc:'Honey-sweet',emoji:'🥭'},{name:'Sweet Corn',desc:'Tender kernels',emoji:'🌽'}],                                img: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900' };
  })();

  // ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.boneWhite,
      color: C.charcoal,
      fontFamily: "'Inter', system-ui, sans-serif",
      overflowX: 'hidden',
    }}>

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <Hero
        search={search} setSearch={setSearch} onSearch={handleSearch}
        navigate={navigate} stats={stats}
      />

      {/* ═══ TRUST SECTION ═══════════════════════════════════ */}
      <TrustSection />

      {/* ═══ CATEGORY DISCOVERY ══════════════════════════════ */}
      <CategoryDiscovery categories={categories} navigate={navigate} />

      {/* ═══ FEATURED PRODUCTS ═══════════════════════════════ */}
      <FeaturedProducts featured={featured} addToCart={addToCart} navigate={navigate} />

      {/* ═══ SEASONAL SECTION ════════════════════════════════ */}
      <SeasonalSection season={season} navigate={navigate} />

      {/* ═══ FARMERS SECTION ═════════════════════════════════ */}
      <FarmersSection farmers={farmers} navigate={navigate} />

      {/* ═══ TESTIMONIALS ════════════════════════════════════ */}
      <Testimonials />

      {/* ── Floating widgets preserved from original ── */}
      <PromoPopup />
      <FeedbackWidget />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION: HERO
// ══════════════════════════════════════════════════════════════
function Hero({ search, setSearch, onSearch, navigate, stats }) {
  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 32px 100px' }}>
        <div className="hm-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>

          {/* Left — Text */}
          <div className="hm-fade-up">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              background: 'rgba(167,191,165,0.2)',
              borderRadius: 999, marginBottom: 24,
              color: C.moss, fontSize: 14, fontWeight: 500,
            }}>
              <SparklesIcon size={14} />
              Fresh from Australian Farms
            </div>

            <h1 className="hm-hero-h1" style={{
              fontFamily: SERIF,
              fontSize: 76,
              lineHeight: 1.04,
              color: C.charcoal,
              marginBottom: 22,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}>
              Farm-Fresh,<br/>
              <span style={{ color: C.moss, fontStyle: 'italic' }}>delivered direct.</span>
            </h1>

            <p style={{
              fontSize: 17, color: C.mutedDark, lineHeight: 1.7,
              marginBottom: 36, maxWidth: 520,
            }}>
              Connect directly with local Australian farmers. Get the freshest organic produce
              delivered to your door — real food from real farms.
            </p>

            {/* Search bar */}
            <form onSubmit={onSearch} style={{
              display: 'flex',
              background: C.white,
              borderRadius: 999,
              padding: 6,
              border: `1px solid ${C.mistGray}`,
              boxShadow: '0 8px 24px -8px rgba(37,53,40,0.10)',
              marginBottom: 20,
              maxWidth: 560,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 18px', gap: 10, color: C.moss }}>
                <SearchIcon size={18} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search tomatoes, honey, eggs, avocado..."
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent', fontFamily: 'inherit',
                    fontSize: 15, color: C.charcoal, padding: '12px 0',
                  }}
                />
              </div>
              <button type="submit" className="hm-pri-btn hm-btn-hover" style={{
                background: C.forest, color: C.boneWhite,
                border: 'none', padding: '14px 28px',
                borderRadius: 999, fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Search
                <ArrowRightIcon size={16} />
              </button>
            </form>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 8 }}>
              <Link to="/listings" className="hm-pri-btn hm-btn-hover" style={primaryBtn}>
                Start Shopping <ArrowRightIcon size={16} />
              </Link>
              <Link to="/register" className="hm-link-btn" style={ghostBtn}>
                Become a Farmer
              </Link>
            </div>

            {/* Trust stats */}
            <div className="hm-trust-stats" style={{
              display: 'flex', gap: 48, marginTop: 48, paddingTop: 40,
              borderTop: `1px solid rgba(37,53,40,0.10)`,
            }}>
              {[
                { num: stats.total_users     || '500+',   label: 'Local Farmers' },
                { num: stats.total_orders    || '50k+',   label: 'Happy Customers' },
                { num: '100%',                            label: 'Australian Grown' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{
                    fontFamily: SERIF, fontSize: 44,
                    color: C.charcoal, marginBottom: 8,
                    fontWeight: 400, lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}>{s.num}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: C.muted,
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Image grid */}
          <div className="hm-zoom-in" style={{ position: 'relative' }}>
            <div className="hm-img-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ImgTile src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700" alt="Fresh harvest" aspect="1 / 1" />
                <ImgTile src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700" alt="Market stall" aspect="4 / 3" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 48 }}>
                <ImgTile src="https://images.unsplash.com/photo-1467453678174-768ec283a940?w=700" alt="Fresh carrots" aspect="4 / 3" />
                <ImgTile src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=700" alt="Citrus" aspect="1 / 1" />
              </div>
            </div>

            {/* Floating "AI-Powered" badge */}
            <div className="hm-floating-card" style={{
              position: 'absolute', bottom: -24, left: -24,
              background: C.white, padding: 20, borderRadius: 18,
              boxShadow: '0 24px 48px -12px rgba(37,53,40,0.20)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, background: 'rgba(167,191,165,0.25)',
                borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: C.forest,
              }}>
                <SparklesIcon size={22} strokeWidth={1.6}/>
              </div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 16, color: C.charcoal, marginBottom: 2 }}>AI-Powered</div>
                <div style={{ fontSize: 12, color: C.muted }}>Smart recommendations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ImgTile = ({ src, alt, aspect }) => (
  <div style={{
    borderRadius: 24, overflow: 'hidden', aspectRatio: aspect,
    background: C.mistGray,
  }}>
    <img
      src={src} alt={alt} className="hm-img"
      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700'; }}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  </div>
);

// ══════════════════════════════════════════════════════════════
// SECTION: TRUST  (4-feature row)
// ══════════════════════════════════════════════════════════════
function TrustSection() {
  const features = [
    { Icon: TruckIcon,    title: 'Free Delivery',     desc: 'On orders over $50 across Australia' },
    { Icon: ShieldIcon,   title: '100% Secure',       desc: 'Safe payments with Stripe encryption' },
    { Icon: LeafIcon,     title: 'Certified Organic', desc: 'All produce verified by Australian standards' },
    { Icon: SparklesIcon, title: 'AI-Powered',        desc: 'Smart recommendations by Groq AI' },
  ];
  return (
    <section style={{
      padding: '80px 0',
      background: C.boneWhite,
      borderTop: `1px solid rgba(37,53,40,0.08)`,
      borderBottom: `1px solid rgba(37,53,40,0.08)`,
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div className="hm-trust-row" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
        }}>
          {features.map(({ Icon, title, desc }, i) => (
            <div key={title} className="hm-fade-up" style={{ textAlign: 'center', animationDelay: `${i * 0.08}s` }}>
              <div style={{
                width: 64, height: 64,
                background: 'rgba(167,191,165,0.2)',
                borderRadius: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px', color: C.forest,
              }}>
                <Icon size={28} strokeWidth={1.6} />
              </div>
              <h3 style={{ fontSize: 18, color: C.charcoal, marginBottom: 8, fontWeight: 500 }}>{title}</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION: CATEGORY DISCOVERY
// ══════════════════════════════════════════════════════════════
function CategoryDiscovery({ categories, navigate }) {
  // Tinted backgrounds for variety — cycles through these for each card
  const tints = [
    'rgba(167,191,165,0.22)',  // sage
    'rgba(196,106,74,0.16)',   // terracotta
    'rgba(61,91,69,0.18)',     // moss
    'rgba(214,164,65,0.20)',   // harvest gold
    'rgba(246,243,238,0.95)',  // cream
    'rgba(231,229,224,0.7)',   // mist
  ];
  const fallback = [
    { category_id: 0, name: 'Vegetables', icon: '🥕' },
    { category_id: 0, name: 'Fruits',     icon: '🍎' },
    { category_id: 0, name: 'Herbs',      icon: '🌿' },
    { category_id: 0, name: 'Dairy',      icon: '🥛' },
    { category_id: 0, name: 'Eggs',       icon: '🥚' },
    { category_id: 0, name: 'Honey',      icon: '🍯' },
  ];
  const data = categories.length ? categories.slice(0, 6) : fallback;

  return (
    <section style={{ padding: '80px 0', background: C.boneWhite }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ marginBottom: 48 }}>
          <h2 className="hm-section-h2 hm-fade-up" style={{
            fontFamily: SERIF, fontSize: 56, fontWeight: 400,
            color: C.charcoal, marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            Shop by Category
          </h2>
          <p style={{ fontSize: 18, color: C.moss, maxWidth: 640 }}>
            Explore our curated selection of fresh, organic produce directly from Australian farms
          </p>
        </div>

        <div className="hm-cat-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16,
        }}>
          {data.map((cat, i) => (
            <button
              key={`${cat.category_id}-${cat.name}`}
              onClick={() => cat.category_id ? navigate(`/listings?category=${cat.category_id}`) : navigate(`/listings?search=${cat.name}`)}
              className="hm-cat hm-fade-up"
              style={{
                animationDelay: `${i * 0.06}s`,
                background: tints[i % tints.length],
                padding: 24, borderRadius: 20,
                textAlign: 'left',
                border: `1px solid rgba(37,53,40,0.06)`,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'block',
              }}>
              <div className="hm-cat-icon" style={{
                width: 52, height: 52, background: C.white,
                borderRadius: 14, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 26,
              }}>
                {cat.icon}
              </div>
              <h3 style={{ fontSize: 17, color: C.charcoal, marginBottom: 4, fontWeight: 500 }}>{cat.name}</h3>
              <p style={{ fontSize: 13, color: C.muted }}>Explore selection</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION: FEATURED PRODUCTS
// ══════════════════════════════════════════════════════════════
function FeaturedProducts({ featured, addToCart, navigate }) {
  const items = (featured && featured.length ? featured : []).slice(0, 4);
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Decorate listings with a badge if appropriate
  const decorate = (listing, i) => {
    const badges = ['Bestseller', 'Seasonal', 'New', null];
    return { ...listing, badge: badges[i % badges.length] };
  };

  return (
    <section style={{ padding: '80px 0', background: C.cream }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div className="hm-flex-end" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <h2 className="hm-section-h2 hm-fade-up" style={{
              fontFamily: SERIF, fontSize: 56, fontWeight: 400,
              color: C.charcoal, marginBottom: 16, letterSpacing: '-0.02em',
            }}>
              This Week's Freshest
            </h2>
            <p style={{ fontSize: 18, color: C.moss }}>Handpicked selections from our trusted farmers</p>
          </div>
          <Link to="/listings" className="hm-link-btn" style={{
            padding: '14px 28px',
            border: `2px solid ${C.forest}`,
            borderRadius: 999, color: C.forest,
            fontWeight: 500, fontSize: 14, textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            View All Products
          </Link>
        </div>

        {items.length === 0 ? (
          <div style={{
            background: C.white, borderRadius: 24, padding: 64,
            textAlign: 'center', color: C.muted,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <p>No featured products yet. Check back soon!</p>
          </div>
        ) : (
          <div className="hm-prod-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
          }}>
            {items.map((raw, i) => {
              const p = decorate(raw, i);
              return (
                <div key={p.listing_id} className="hm-prod hm-card-hover hm-fade-up"
                     style={{ background: C.white, borderRadius: 24, overflow: 'hidden', animationDelay: `${i * 0.08}s` }}>
                  <Link to={`/listings/${p.listing_id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: C.mistGray }}>
                      <img
                        src={getProduceImage(p, 700)} alt={p.title}
                        onError={(e) => { e.target.src = `https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop&q=80`; }}
                        className="hm-prod-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {p.badge && (
                        <div style={{
                          position: 'absolute', top: 16, left: 16,
                          padding: '5px 12px', background: C.terracotta,
                          color: C.white, fontSize: 11, fontWeight: 600,
                          borderRadius: 999, letterSpacing: '0.02em',
                        }}>
                          {p.badge}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Wishlist works by product_id (catalog ID) so saving
                          // a tomato saves "tomatoes" not "Farmer Joe's tomato listing #42".
                          toggleWishlist({
                            product_id:    p.product_id,
                            name:          p.title,
                            slug:          p.slug || null,
                            image_url:     p.image_url,
                            default_unit:  p.unit,
                            min_price:     p.price,
                            category_name: p.category_name,
                          });
                        }}
                        aria-label={isInWishlist(p.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        title={isInWishlist(p.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        className="hm-fav"
                        style={{
                          position: 'absolute', top: 16, right: 16,
                          width: 40, height: 40,
                          background: isInWishlist(p.product_id) ? 'rgba(196,106,74,0.95)' : 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '50%', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          color: isInWishlist(p.product_id) ? '#fff' : C.charcoal,
                          transition: 'all 0.2s ease',
                        }}>
                        <HeartIcon
                          size={18}
                          strokeWidth={1.8}
                          fill={isInWishlist(p.product_id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                  </Link>

                  <div style={{ padding: 24 }}>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.harvestGold }}>
                        <StarIcon size={15} fill="currentColor" strokeWidth={0}/>
                        <span style={{ fontSize: 13, color: C.charcoal }}>
                          {Number(p.avg_rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: C.muted }}>({p.review_count || 0})</span>
                    </div>
                    <Link to={`/listings/${p.listing_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ fontSize: 17, color: C.charcoal, marginBottom: 4, fontWeight: 500, lineHeight: 1.3 }}>{p.title}</h3>
                    </Link>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>{p.farmer_name || 'Local Farm'}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: SERIF, fontSize: 22, color: C.charcoal, marginBottom: 2, fontWeight: 400 }}>
                          ${Number(p.price).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>per {p.unit || 'kg'}</div>
                      </div>
                      <button
                        onClick={() => p.quantity > 0 && addToCart(p)}
                        disabled={p.quantity === 0}
                        title={p.quantity === 0 ? 'Out of stock' : 'Add to cart'}
                        className="hm-btn-hover"
                        style={{
                          width: 44, height: 44,
                          background: p.quantity === 0 ? C.mistGray : C.forest,
                          color: p.quantity === 0 ? C.muted : C.boneWhite,
                          borderRadius: '50%', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: p.quantity === 0 ? 'not-allowed' : 'pointer',
                        }}>
                        <CartIcon size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION: SEASONAL  (image left, content right)
// ══════════════════════════════════════════════════════════════
function SeasonalSection({ season, navigate }) {
  return (
    <section style={{ padding: '80px 0', background: C.boneWhite }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div className="hm-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left — Image with floating card */}
          <div className="hm-fade-up" style={{ position: 'relative' }}>
            <div style={{ borderRadius: 32, overflow: 'hidden' }}>
              <img src={season.img} alt={`${season.name} produce`}
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900'; }}
                style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}/>
            </div>
            <div className="hm-floating-card" style={{
              position: 'absolute', bottom: -32, right: -32,
              background: C.white, padding: 24, borderRadius: 18,
              boxShadow: '0 24px 48px -12px rgba(37,53,40,0.20)',
              maxWidth: 280,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{season.emoji}</div>
              <h4 style={{ fontFamily: SERIF, fontSize: 22, color: C.charcoal, marginBottom: 8, fontWeight: 400 }}>{season.name} Harvest</h4>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Discover the rich flavors of seasonal produce at their peak freshness
              </p>
            </div>
          </div>

          {/* Right — Content */}
          <div className="hm-fade-up" style={{ animationDelay: '0.1s' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 16px', background: 'rgba(214,164,65,0.18)',
              borderRadius: 999, marginBottom: 24,
              fontSize: 13, color: C.earthBrown, fontWeight: 500,
            }}>
              {new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} Selection
            </div>
            <h2 className="hm-section-h2" style={{
              fontFamily: SERIF, fontSize: 56, lineHeight: 1.05,
              color: C.charcoal, marginBottom: 24, fontWeight: 400,
              letterSpacing: '-0.02em',
            }}>
              {season.tagline.split(',')[0]},<br/>{season.tagline.split(',')[1]?.trim()}
            </h2>
            <p style={{ fontSize: 18, color: C.moss, marginBottom: 32, lineHeight: 1.7 }}>
              {season.desc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
              {season.items.map(item => (
                <div key={item.name} className="hm-row-hover"
                     style={{
                       display: 'flex', alignItems: 'center', gap: 16,
                       padding: 18, background: C.cream, borderRadius: 14,
                       cursor: 'pointer',
                     }}
                     onClick={() => navigate(`/listings?search=${encodeURIComponent(item.name)}`)}>
                  <div style={{ fontSize: 28 }}>{item.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: C.charcoal, marginBottom: 2, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{item.desc}</div>
                  </div>
                  <div style={{ color: C.moss }}><ArrowRightIcon size={18}/></div>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/listings')} className="hm-pri-btn hm-btn-hover" style={primaryBtn}>
              Explore Seasonal <ArrowRightIcon size={16}/>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION: FARMERS
// ══════════════════════════════════════════════════════════════
function FarmersSection({ farmers, navigate }) {
  // Stock farmer profile photos — used because the API doesn't store farmer photos
  const photos = [
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600',
    'https://images.unsplash.com/photo-1595257841889-eca2678454e2?w=600',
    'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600',
  ];
  const specialties = ['Heirloom Vegetables', 'Organic Fruits', 'Citrus & Stone Fruit'];
  const locations   = ['Yarra Valley, VIC', 'Hunter Valley, NSW', 'Mildura, VIC'];
  const fallback = [
    { user_id: 0, full_name: 'Sarah Mitchell', farm_name: 'Sunny Valley Organics' },
    { user_id: 0, full_name: 'Tom Chen',       farm_name: 'Green Acres Co-op' },
    { user_id: 0, full_name: 'Emma Rodriguez', farm_name: 'Coastal Citrus Farm' },
  ];
  const data = (farmers && farmers.length ? farmers : fallback).slice(0, 3);

  return (
    <section style={{ padding: '80px 0', background: C.cream }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 className="hm-section-h2 hm-fade-up" style={{
            fontFamily: SERIF, fontSize: 56, fontWeight: 400,
            color: C.charcoal, marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            Meet Our Farmers
          </h2>
          <p style={{ fontSize: 18, color: C.moss, maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            Every product comes from a real person, a real farm, and a real commitment to
            quality and sustainability
          </p>
        </div>

        <div className="hm-farmer-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
        }}>
          {data.map((f, i) => (
            <div key={`${f.user_id}-${f.farm_name}`} className="hm-card-hover hm-fade-up"
                 style={{
                   background: C.white, borderRadius: 24,
                   overflow: 'hidden',
                   animationDelay: `${i * 0.1}s`,
                 }}>
              <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: C.mistGray }}>
                <img src={photos[i % photos.length]} alt={f.full_name || f.farm_name}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600'; }}
                  className="hm-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 40, height: 40, background: C.forest,
                  color: C.boneWhite, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AwardIcon size={18}/>
                </div>
              </div>
              <div style={{ padding: 28 }}>
                <h3 style={{ fontSize: 21, color: C.charcoal, marginBottom: 4, fontWeight: 500 }}>{f.full_name || 'Local Farmer'}</h3>
                <p style={{ fontFamily: SERIF, fontSize: 18, color: C.moss, marginBottom: 18, fontWeight: 400 }}>{f.farm_name || 'Family Farm'}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.muted }}>
                    <MapPinIcon size={15}/>
                    <span>{locations[i % locations.length]}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: C.muted }}>Specialty: </span>
                    <span style={{ color: C.charcoal }}>{specialties[i % specialties.length]}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => f.user_id ? navigate(`/listings?farmer_id=${f.user_id}`) : navigate('/listings')}
                    className="hm-pri-btn hm-btn-hover"
                    style={{
                      flex: 1, padding: '12px 20px',
                      background: C.forest, color: C.boneWhite,
                      border: 'none', borderRadius: 999,
                      fontFamily: 'inherit', fontSize: 14,
                      fontWeight: 500, cursor: 'pointer',
                    }}>
                    View Products
                  </button>
                  <button
                    title="Save farmer"
                    style={{
                      width: 44, height: 44,
                      border: `2px solid rgba(37,53,40,0.15)`,
                      borderRadius: '50%', background: 'transparent',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: C.charcoal,
                    }}>
                    <HeartIcon size={18} strokeWidth={1.8}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link to="/listings" className="hm-link-btn" style={{
            display: 'inline-block', padding: '14px 32px',
            border: `2px solid ${C.forest}`, borderRadius: 999,
            color: C.forest, fontWeight: 500, fontSize: 14,
            textDecoration: 'none',
          }}>
            Meet All 500+ Farmers
          </Link>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// SECTION: TESTIMONIALS
// ══════════════════════════════════════════════════════════════
function Testimonials() {
  const testimonials = [
    { name: 'Jessica Wong',   location: 'Melbourne, VIC', avatar: '👩🏻‍🦰', rating: 5,
      text: 'The quality is unmatched. I love knowing exactly where my food comes from and supporting local farmers directly.' },
    { name: 'Michael Patel',  location: 'Sydney, NSW',    avatar: '👨🏾',     rating: 5,
      text: 'Best produce delivery service in Australia. The AI recommendations helped me discover vegetables I never knew existed!' },
    { name: 'Emma Thompson',  location: 'Brisbane, QLD',  avatar: '👩🏼',     rating: 5,
      text: 'Finally, a marketplace that treats farmers fairly and delivers genuinely fresh organic produce. Game changer.' },
  ];
  const stats = [
    { num: '4.9',   label: 'Average Rating' },
    { num: '50k+',  label: 'Happy Customers' },
    { num: '98%',   label: 'Would Recommend' },
    { num: '12k+',  label: '5-Star Reviews' },
  ];

  return (
    <section style={{ padding: '80px 0', background: C.boneWhite }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 className="hm-section-h2 hm-fade-up" style={{
            fontFamily: SERIF, fontSize: 56, fontWeight: 400,
            color: C.charcoal, marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            Loved by Thousands
          </h2>
          <p style={{ fontSize: 18, color: C.moss }}>Here's what our community has to say</p>
        </div>

        <div className="hm-test-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
        }}>
          {testimonials.map((t, i) => (
            <div key={t.name} className="hm-card-hover hm-fade-up"
                 style={{
                   background: C.white, padding: 32, borderRadius: 24,
                   animationDelay: `${i * 0.1}s`,
                 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 24, color: C.harvestGold }}>
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <StarIcon key={idx} size={18} fill="currentColor" strokeWidth={0}/>
                ))}
              </div>
              <p style={{ fontFamily: SERIF, fontSize: 18, color: C.charcoal, marginBottom: 24, lineHeight: 1.6, fontStyle: 'italic', fontWeight: 400 }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, background: 'rgba(167,191,165,0.25)',
                  borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 15, color: C.charcoal, marginBottom: 2, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hm-stats-row hm-fade-up" style={{
          marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32, textAlign: 'center', animationDelay: '0.2s',
        }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: SERIF, fontSize: 56, color: C.charcoal, marginBottom: 8, fontWeight: 400 }}>{s.num}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// Shared button styles
// ══════════════════════════════════════════════════════════════
const primaryBtn = {
  padding: '16px 32px',
  background: C.forest,
  color: C.boneWhite,
  borderRadius: 999,
  border: 'none',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  boxShadow: '0 12px 24px -8px rgba(37,53,40,0.30)',
};

const ghostBtn = {
  padding: '16px 32px',
  background: C.boneWhite,
  border: `2px solid rgba(37,53,40,0.20)`,
  color: C.forest,
  borderRadius: 999,
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};