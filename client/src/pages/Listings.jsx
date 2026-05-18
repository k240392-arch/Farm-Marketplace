// pages/Listings.jsx — Catalog-driven browse page (Amazon-style)
// Author: CPRO306 Capstone | Date: 2026
//
// v3 — Now fetches from /api/products (the catalog) instead of /api/listings.
// Every category is always populated; products with no farmer offers show
// "Currently unavailable" instead of disappearing.

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// ── Palette ──
const C = {
  forest:    '#253528', moss:      '#3D5B45', sage:      '#A7BFA5',
  cream:     '#F6F3EE', boneWhite: '#FBFAF8', charcoal:  '#1C1F1D',
  mistGray:  '#E7E5E0', white:     '#FFFFFF',
  muted:     '#6B7280', mutedDark: '#4B5563',
  terracotta:'#C46A4A', harvestGold:'#D6A441',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

const FALLBACK = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=75';

const getImg = (url) => {
  if (!url) return FALLBACK;
  if (url.startsWith('http')) return url;
  return `http://localhost:5001${url}`;
};

// ── Inline icons ──
const I = ({ children, size = 16, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const SearchIcon  = (p) => <I {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></I>;
const SlidersIcon = (p) => <I {...p}><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></I>;
const XIcon       = (p) => <I {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></I>;
const HomeIcon    = (p) => <I {...p}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></I>;
const CartIcon    = (p) => <I {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></I>;

// ──────────────────────────────────────────────────────────────
export default function Listings() {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    season:   searchParams.get('season')   || '',
    in_stock: '',
    min: '', max: '',
    sort: 'newest', page: 1,
  });

  // Load font
  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // CSS injection
  useEffect(() => {
    const id = 'listings-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes lsFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      @keyframes lsSpin { to { transform: rotate(360deg); } }
      .ls-fade-up { animation: lsFadeUp .5s cubic-bezier(.22,1,.36,1) both; }
      .ls-pill { transition: background .2s ease, color .2s ease, border-color .2s ease; }
      .ls-pill:hover:not(.ls-pill-active) { background: ${C.cream} !important; color: ${C.forest} !important; }
      .ls-cat-btn { transition: background .15s ease, color .15s ease; }
      .ls-cat-btn:hover:not(.ls-cat-active) { background: ${C.cream} !important; color: ${C.forest} !important; }
      .ls-input::placeholder { color: ${C.muted}; opacity: .7; }
      .ls-input:focus { border-color: ${C.moss} !important; }
      .ls-page-btn { transition: background .2s ease, color .2s ease; }
      .ls-page-btn:hover:not(:disabled) { background: ${C.forest} !important; color: ${C.boneWhite} !important; }
      .ls-page-btn:disabled { opacity: .4; cursor: not-allowed; }
      .ls-clear-link:hover { color: ${C.terracotta} !important; }
      .ls-card { transition: transform .25s ease, box-shadow .25s ease; }
      .ls-card:hover { transform: translateY(-3px); box-shadow: 0 24px 48px -16px rgba(37,53,40,.18); }
      .ls-card:hover .ls-img { transform: scale(1.04); }
      .ls-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
      .ls-cart-btn:not(:disabled):hover { background: ${C.moss} !important; }
      @media (max-width: 900px) {
        .ls-layout { flex-direction: column !important; }
        .ls-sidebar { width: 100% !important; position: static !important; }
        .ls-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .ls-hero-h1 { font-size: 44px !important; }
      }
      @media (max-width: 560px) {
        .ls-grid { grid-template-columns: 1fr !important; }
        .ls-hero-h1 { font-size: 36px !important; }
        .ls-results-row { flex-direction: column !important; align-items: flex-start !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Load categories ONCE
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  // Refetch products whenever filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search)   params.set('search',   filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.season)   params.set('season',   filters.season);
    if (filters.in_stock) params.set('in_stock', '1');
    if (filters.sort)     params.set('sort',     filters.sort);
    params.set('page',  filters.page);
    params.set('limit', '24');

    api.get(`/products?${params}`)
      .then(r => {
        let prods = r.data.products || [];
        // Client-side price filter (server doesn't filter on min_price for catalog)
        if (filters.min) prods = prods.filter(p => p.min_price && p.min_price >= Number(filters.min));
        if (filters.max) prods = prods.filter(p => p.min_price && p.min_price <= Number(filters.max));
        setProducts(prods);
        setTotalCount(r.data.total || prods.length);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const set = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const clearAll = () => setFilters({
    search: '', category: '', season: '', in_stock: '', min: '', max: '', sort: 'newest', page: 1,
  });

  const activeFilterCount = [
    filters.search, filters.category, filters.season, filters.in_stock, filters.min, filters.max
  ].filter(Boolean).length;
  const selectedCat = categories.find(c => c.category_id == filters.category);

  // Add cheapest available offer to cart
  const handleAddToCart = async (product) => {
    if (!product.offers_count || product.total_stock <= 0) return;
    try {
      const res = await api.get(`/products/${product.slug}`);
      const offer = res.data.offers?.[0];
      if (offer) {
        addToCart({
          listing_id:  offer.listing_id,
          title:       product.name,
          price:       offer.price,
          unit:        offer.unit || product.default_unit,
          image_url:   product.image_url,
          farmer_name: offer.farmer_name,
          quantity:    offer.quantity,
        });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{
      background: C.boneWhite,
      color:      C.charcoal,
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight:  '100vh',
    }}>

      {/* HERO */}
      <section style={{
        background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
        padding:    '56px 32px 40px',
        borderBottom: `1px solid ${C.mistGray}`,
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }} className="ls-fade-up">

          <nav style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, marginBottom: 20, color: C.muted,
          }}>
            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              color: C.muted, textDecoration: 'none', fontWeight: 500,
            }}>
              <HomeIcon size={13}/> Home
            </Link>
            <span style={{ color: C.sage, fontSize: 11 }}>›</span>
            <span style={{ color: C.charcoal, fontWeight: 500 }}>
              {selectedCat ? selectedCat.name : 'All Produce'}
            </span>
          </nav>

          <p style={{
            fontSize: 11, fontWeight: 700, color: C.moss,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            margin: '0 0 12px',
          }}>The Marketplace</p>

          <h1 className="ls-hero-h1" style={{
            fontFamily: SERIF, fontSize: 54, fontWeight: 400,
            color: C.charcoal, margin: '0 0 14px',
            letterSpacing: '-0.022em', lineHeight: 1.05,
          }}>
            {selectedCat ? selectedCat.name : (
              <>Browse <span style={{ color: C.moss, fontStyle: 'italic' }}>fresh produce</span></>
            )}
          </h1>

          <p style={{
            fontSize: 17, color: C.mutedDark, lineHeight: 1.6,
            margin: '0 0 28px', maxWidth: 600,
          }}>
            Fresh, locally grown produce from Australian farms — straight to your door.
          </p>

          {/* Quick category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`ls-pill ${filters.category === '' ? 'ls-pill-active' : ''}`}
              onClick={() => set('category', '')}
              style={{ ...pillBase, ...(filters.category === '' ? pillActive : pillIdle) }}>
              All
            </button>
            {categories.map(c => (
              <button key={c.category_id}
                className={`ls-pill ${filters.category == c.category_id ? 'ls-pill-active' : ''}`}
                onClick={() => set('category', String(c.category_id))}
                style={{ ...pillBase, ...(filters.category == c.category_id ? pillActive : pillIdle) }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section style={{ padding: '40px 32px 80px' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div className="ls-layout" style={{
            display: 'flex', gap: 32, alignItems: 'flex-start',
          }}>

            {/* SIDEBAR */}
            <aside className="ls-sidebar" style={{
              width: 260, flexShrink: 0,
              background: C.white, borderRadius: 18, padding: 24,
              border: `1px solid ${C.mistGray}`,
              position: 'sticky', top: 92,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 18,
                paddingBottom: 16, borderBottom: `1px solid ${C.mistGray}`,
              }}>
                <h3 style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  margin: 0, fontSize: 15, fontWeight: 600, color: C.charcoal,
                }}>
                  <SlidersIcon size={15}/> Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="ls-clear-link"
                    style={{
                      fontSize: 12, color: C.muted, background: 'none',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      fontWeight: 500, padding: 0,
                    }}>
                    Clear all ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Search */}
              <FilterSection label="Search produce">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: `1px solid ${C.mistGray}`, borderRadius: 10,
                  padding: '9px 12px', background: C.cream,
                }}>
                  <span style={{ color: C.moss, display: 'flex' }}><SearchIcon size={15}/></span>
                  <input
                    className="ls-input"
                    placeholder="e.g. tomato, mango, salmon..."
                    value={filters.search}
                    onChange={e => set('search', e.target.value)}
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: 14, background: 'transparent',
                      fontFamily: 'inherit', color: C.charcoal,
                    }}/>
                  {filters.search && (
                    <button onClick={() => set('search', '')} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.muted, padding: 0, display: 'flex',
                    }}>
                      <XIcon size={14}/>
                    </button>
                  )}
                </div>
              </FilterSection>

              {/* Category */}
              <FilterSection label="Category">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <CatBtn active={filters.category === ''} onClick={() => set('category', '')}>
                    All Categories
                  </CatBtn>
                  {categories.map(c => (
                    <CatBtn key={c.category_id}
                      active={filters.category == c.category_id}
                      onClick={() => set('category', String(c.category_id))}>
                      {c.name}
                    </CatBtn>
                  ))}
                </div>
              </FilterSection>

              {/* Season */}
              <FilterSection label="Season">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <CatBtn active={filters.season === ''} onClick={() => set('season', '')}>
                    Any season
                  </CatBtn>
                  {['summer','autumn','winter','spring'].map(s => (
                    <CatBtn key={s} active={filters.season === s} onClick={() => set('season', s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </CatBtn>
                  ))}
                </div>
              </FilterSection>

              {/* Availability */}
              <FilterSection label="Availability">
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13.5, color: C.mutedDark,
                  background: filters.in_stock ? 'rgba(167,191,165,0.25)' : 'transparent',
                  fontWeight: filters.in_stock ? 600 : 400,
                  fontFamily: 'inherit',
                }}>
                  <input
                    type="checkbox"
                    checked={!!filters.in_stock}
                    onChange={e => set('in_stock', e.target.checked ? '1' : '')}
                    style={{ accentColor: C.forest, cursor: 'pointer' }}/>
                  Only available now
                </label>
              </FilterSection>

              {/* Price */}
              <FilterSection label="Price range (AUD)" last>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <input type="number" placeholder="Min" min="0"
                    className="ls-input" value={filters.min}
                    onChange={e => set('min', e.target.value)}
                    style={priceInputStyle} />
                  <span style={{ color: C.muted, fontSize: 13 }}>—</span>
                  <input type="number" placeholder="Max" min="0"
                    className="ls-input" value={filters.max}
                    onChange={e => set('max', e.target.value)}
                    style={priceInputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['Under $5', '', '5'], ['$5–$15', '5', '15'], ['$15–$30', '15', '30'], ['$30+', '30', '']].map(([label, mn, mx]) => {
                    const isActive = filters.min === mn && filters.max === mx;
                    return (
                      <button key={label}
                        onClick={() => setFilters(f => ({ ...f, min: mn, max: mx, page: 1 }))}
                        style={{
                          padding: '5px 11px', borderRadius: 999,
                          border: `1px solid ${isActive ? C.forest : C.mistGray}`,
                          background: isActive ? C.forest : C.cream,
                          color: isActive ? C.boneWhite : C.mutedDark,
                          fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .15s ease',
                        }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </FilterSection>
            </aside>

            {/* RESULTS */}
            <main style={{ flex: 1, minWidth: 0 }}>
              <div className="ls-results-row" style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 18, gap: 14,
              }}>
                <p style={{ fontSize: 14, color: C.mutedDark, margin: 0, fontWeight: 500 }}>
                  {loading ? 'Loading…' : (
                    <>
                      <span style={{ color: C.charcoal, fontWeight: 600 }}>{products.length}</span> {products.length === 1 ? 'product' : 'products'}
                      {filters.search && (
                        <span style={{ color: C.muted }}> for <em style={{ color: C.charcoal }}>"{filters.search}"</em></span>
                      )}
                    </>
                  )}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Sort:</label>
                  <select value={filters.sort} onChange={e => set('sort', e.target.value)}
                    style={{
                      padding: '8px 14px', border: `1px solid ${C.mistGray}`,
                      borderRadius: 999, fontSize: 13, fontFamily: 'inherit',
                      outline: 'none', color: C.charcoal, background: C.white,
                      cursor: 'pointer', fontWeight: 500,
                    }}>
                    <option value="newest">Newest first</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="popular">Most farmers</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
              </div>

              {/* Active filter tags */}
              {activeFilterCount > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {filters.search && (
                    <ActiveTag onClear={() => set('search', '')}>Search: "{filters.search}"</ActiveTag>
                  )}
                  {filters.category && selectedCat && (
                    <ActiveTag onClear={() => set('category', '')}>{selectedCat.name}</ActiveTag>
                  )}
                  {filters.season && (
                    <ActiveTag onClear={() => set('season', '')}>{filters.season}</ActiveTag>
                  )}
                  {filters.in_stock && (
                    <ActiveTag onClear={() => set('in_stock', '')}>In stock now</ActiveTag>
                  )}
                  {(filters.min || filters.max) && (
                    <ActiveTag onClear={() => setFilters(f => ({ ...f, min: '', max: '', page: 1 }))}>
                      ${filters.min || '0'} — ${filters.max || '∞'}
                    </ActiveTag>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
                  <div style={{
                    width: 38, height: 38,
                    border: `3px solid ${C.mistGray}`,
                    borderTopColor: C.forest, borderRadius: '50%',
                    animation: 'lsSpin 0.8s linear infinite',
                    margin: '0 auto 14px',
                  }}/>
                  <p style={{ fontSize: 14 }}>Finding fresh produce…</p>
                </div>
              )}

              {/* Empty */}
              {!loading && products.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '80px 24px',
                  background: C.white, borderRadius: 24,
                  border: `1px solid ${C.mistGray}`,
                }}>
                  <p style={{
                    fontFamily: SERIF, fontSize: 32, color: C.charcoal,
                    margin: '0 0 12px', fontWeight: 400, letterSpacing:'-0.015em',
                  }}>
                    No produce found
                  </p>
                  <p style={{
                    color: C.mutedDark, marginBottom: 28, fontSize: 15,
                    lineHeight: 1.6, maxWidth: 400, margin: '0 auto 28px',
                  }}>
                    Try adjusting your filters or search for something else.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={clearAll} style={{
                      padding: '12px 26px', background: C.forest,
                      color: C.boneWhite, border: 'none', borderRadius: 999,
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    }}>
                      Clear all filters
                    </button>
                    <Link to="/" style={{
                      display: 'inline-block', padding: '12px 26px',
                      background: 'transparent', border: `1.5px solid ${C.forest}`,
                      color: C.forest, borderRadius: 999, textDecoration: 'none',
                      fontSize: 14, fontWeight: 500,
                    }}>
                      Back to home
                    </Link>
                  </div>
                </div>
              )}

              {/* Catalog grid */}
              {!loading && products.length > 0 && (
                <>
                  <div className="ls-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 24,
                  }}>
                    {products.map(p => (
                      <CatalogCard key={p.product_id} product={p} onAddToCart={handleAddToCart}/>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: 16, marginTop: 48, paddingTop: 32,
                    borderTop: `1px solid ${C.mistGray}`,
                  }}>
                    <button className="ls-page-btn" disabled={filters.page === 1}
                      onClick={() => set('page', filters.page - 1)} style={pageBtnStyle}>
                      ← Previous
                    </button>
                    <span style={{
                      padding: '8px 18px', background: C.cream,
                      color: C.charcoal, borderRadius: 999,
                      fontWeight: 600, fontSize: 14,
                    }}>
                      Page {filters.page}
                    </span>
                    <button className="ls-page-btn" disabled={products.length < 24}
                      onClick={() => set('page', filters.page + 1)} style={pageBtnStyle}>
                      Next →
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Catalog Card (renders a /products/:slug card) ──
function CatalogCard({ product, onAddToCart }) {
  const isAvailable = product.offers_count > 0 && product.total_stock > 0;
  const { toggleWishlist, isInWishlist } = useWishlist();
  const saved = isInWishlist(product.product_id);

  return (
    <article className="ls-card" style={S.card}>
      <Link to={`/products/${product.slug}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={S.imgWrap}>
          <img src={getImg(product.image_url)} alt={product.name}
            onError={e => { e.currentTarget.src = FALLBACK; }}
            loading="lazy" className="ls-img"
            style={S.img}/>
          {product.category_name && (
            <span style={S.categoryBadge}>{product.category_name}</span>
          )}
          {product.is_seasonal && (
            <span style={S.seasonalBadge}>In Season</span>
          )}
          {!isAvailable && (
            <div style={S.unavailableOverlay}>
              Currently unavailable
            </div>
          )}
          {/* Wishlist heart — placed bottom-right so it doesn't clash with the
              category/seasonal badges in the top corners. Stops bubbling so
              clicking the heart never triggers the parent <Link>. */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist({
                product_id:    product.product_id,
                name:          product.name,
                slug:          product.slug,
                image_url:     product.image_url,
                default_unit:  product.default_unit,
                min_price:     product.min_price ?? null,
                category_name: product.category_name,
              });
            }}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            style={{
              position: 'absolute', bottom: 12, right: 12,
              width: 38, height: 38,
              background: saved ? C.terracotta : 'rgba(251,250,248,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: saved ? '#fff' : C.charcoal,
              boxShadow: '0 2px 8px rgba(37,53,40,0.12)',
              transition: 'all 0.2s ease',
            }}>
            <svg width="17" height="17" viewBox="0 0 24 24"
                 fill={saved ? 'currentColor' : 'none'}
                 stroke="currentColor" strokeWidth="1.8"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </button>
        </div>
      </Link>

      <div style={S.body}>
        <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={S.title}>{product.name}</h3>
        </Link>

        {isAvailable ? (
          <p style={S.metaLine}>
            From {product.offers_count} {product.offers_count === 1 ? 'farmer' : 'farmers'}
          </p>
        ) : (
          <p style={{ ...S.metaLine, color: C.terracotta }}>
            Awaiting listings
          </p>
        )}

        {product.review_count > 0 && (
          <div style={S.ratingRow}>
            <span style={{ color: C.harvestGold, display: 'flex' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2-6.3-4.4L5.7 20.8 8 13.6 2 9.2h7.6z"/>
              </svg>
            </span>
            <span style={{ fontSize: 13, color: C.charcoal, fontWeight: 500 }}>
              {Number(product.avg_rating || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>({product.review_count})</span>
          </div>
        )}

        <div style={S.footer}>
          <div>
            {product.min_price ? (
              <>
                <span style={S.price}>${Number(product.min_price).toFixed(2)}</span>
                <span style={S.unit}>/{product.default_unit}</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
                Notify when available
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={!isAvailable}
            title={!isAvailable ? 'No farmers listing this yet' : 'Add cheapest offer to cart'}
            className="ls-cart-btn"
            style={{
              ...S.cartBtn,
              background: isAvailable ? C.forest : C.mistGray,
              color:      isAvailable ? C.boneWhite : C.muted,
              cursor:     isAvailable ? 'pointer' : 'not-allowed',
            }}>
            <CartIcon size={16}/>
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Sub-components ────────────────────────────────────────────
function FilterSection({ label, children, last }) {
  return (
    <div style={{
      marginBottom: last ? 0 : 22, paddingBottom: last ? 0 : 22,
      borderBottom: last ? 'none' : `1px solid ${C.mistGray}`,
    }}>
      <label style={{
        display: 'block', fontWeight: 600, fontSize: 11,
        color: C.muted, marginBottom: 12,
        textTransform: 'uppercase', letterSpacing: '0.14em',
      }}>{label}</label>
      {children}
    </div>
  );
}

function CatBtn({ active, onClick, children }) {
  return (
    <button className={`ls-cat-btn ${active ? 'ls-cat-active' : ''}`} onClick={onClick}
      style={{
        display: 'block', padding: '8px 12px', borderRadius: 8,
        border: 'none',
        background: active ? 'rgba(167,191,165,0.25)' : 'transparent',
        cursor: 'pointer', fontSize: 13.5, fontWeight: active ? 600 : 400,
        color: active ? C.forest : C.mutedDark, textAlign: 'left',
        width: '100%', fontFamily: 'inherit',
        textTransform: 'capitalize',
      }}>
      {children}
    </button>
  );
}

function ActiveTag({ children, onClear }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'rgba(167,191,165,0.22)', color: C.forest,
      padding: '6px 8px 6px 14px', borderRadius: 999,
      fontSize: 13, fontWeight: 500,
      textTransform: 'capitalize',
    }}>
      {children}
      <button onClick={onClear} style={{
        background: 'rgba(37,53,40,0.10)', border: 'none',
        borderRadius: '50%', width: 18, height: 18,
        cursor: 'pointer', color: C.forest,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}>
        <XIcon size={11}/>
      </button>
    </span>
  );
}

// ── Style objects ──
const pillBase = {
  padding: '8px 18px', borderRadius: 999,
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', fontFamily: 'inherit', border: 'none',
};
const pillIdle = {
  background: C.white, color: C.mutedDark,
  border: `1px solid ${C.mistGray}`,
};
const pillActive = {
  background: C.forest, color: C.boneWhite,
  border: `1px solid ${C.forest}`,
};
const priceInputStyle = {
  flex: 1, padding: '8px 12px',
  border: `1px solid ${C.mistGray}`, borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  background: C.cream, minWidth: 0, color: C.charcoal,
};
const pageBtnStyle = {
  padding: '10px 22px', background: C.white,
  border: `1.5px solid ${C.mistGray}`, borderRadius: 999,
  fontSize: 13, fontWeight: 500, color: C.charcoal,
  cursor: 'pointer', fontFamily: 'inherit',
};

// Catalog card styles
const S = {
  card: {
    display: 'flex', flexDirection: 'column',
    background: C.white, borderRadius: 18, overflow: 'hidden',
    border: `1px solid ${C.mistGray}`,
  },
  imgWrap: {
    position: 'relative', aspectRatio: '4 / 3',
    overflow: 'hidden', background: C.cream,
  },
  img: {
    width: '100%', height: '100%',
    objectFit: 'cover', display: 'block',
  },
  categoryBadge: {
    position: 'absolute', top: 12, left: 12,
    background: 'rgba(251,250,248,0.95)',
    backdropFilter: 'blur(8px)', color: C.forest,
    fontSize: 10, fontWeight: 600,
    padding: '4px 10px', borderRadius: 999,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    boxShadow: '0 2px 6px rgba(37,53,40,0.06)',
  },
  seasonalBadge: {
    position: 'absolute', top: 12, right: 12,
    background: C.harvestGold, color: '#fff',
    fontSize: 10, fontWeight: 600,
    padding: '4px 10px', borderRadius: 999,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  unavailableOverlay: {
    position: 'absolute', bottom: 12, left: 12, right: 60,
    padding: '6px 12px',
    background: 'rgba(28,31,29,0.85)',
    backdropFilter: 'blur(8px)',
    color: C.boneWhite,
    fontSize: 11, fontWeight: 500,
    borderRadius: 8, textAlign: 'center',
  },
  body: {
    padding: 18, display: 'flex',
    flexDirection: 'column', gap: 6, flex: 1,
  },
  title: {
    fontWeight: 500, fontSize: 16, color: C.charcoal,
    lineHeight: 1.3, margin: 0,
    letterSpacing: '-0.005em',
  },
  metaLine: {
    fontSize: 12, color: C.muted, margin: 0,
  },
  ratingRow: {
    display: 'flex', alignItems: 'center',
    gap: 5, marginTop: 2,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 'auto',
    paddingTop: 14, borderTop: `1px solid ${C.mistGray}`,
  },
  price: {
    fontFamily: SERIF, fontSize: 24,
    fontWeight: 400, color: C.charcoal,
    letterSpacing: '-0.01em',
  },
  unit: {
    fontSize: 12, color: C.muted, marginLeft: 3,
  },
  cartBtn: {
    width: 40, height: 40, borderRadius: '50%',
    border: 'none', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'background .2s ease',
  },
};