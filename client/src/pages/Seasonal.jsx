// pages/Seasonal.jsx — Catalog-driven seasonal page (Amazon-style)
// Author: CPRO306 Capstone | Date: 2026
//
// v3 — All products come from /api/products/seasonal.
// Products always show, even with zero farmer offers ("Currently unavailable").
// Add-to-cart adds the cheapest farmer's listing.

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const C = {
  forest: '#253528', moss: '#3D5B45', sage: '#A7BFA5',
  cream: '#F6F3EE', boneWhite: '#FBFAF8', charcoal: '#1C1F1D',
  mistGray: '#E7E5E0', terracotta: '#C46A4A', harvestGold: '#D6A441',
  white: '#FFFFFF', muted: '#6B7280', mutedDark: '#4B5563',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";
const FALLBACK_PRODUCE = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=75';

const ArrowRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const CartIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
);

const getImg = (image_url) => {
  if (!image_url) return FALLBACK_PRODUCE;
  if (image_url.startsWith('http')) return image_url;
  return `http://localhost:5001${image_url}`;
};

const SEASON_THEMES = {
  autumn: { accent: '#C46A4A', accentBg: 'rgba(196,106,74,0.14)', headline: "Autumn's Bounty",  headline2: 'Rich. Earthy. Comforting.', intro: 'As leaves turn, our farms harvest the deep, hearty flavors of autumn. Pumpkins, apples, and root vegetables reach their peak.', heroImg: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&auto=format&fit=crop&q=75' },
  winter: { accent: '#1565C0', accentBg: 'rgba(21,101,192,0.10)', headline: 'Winter Warmers',   headline2: 'Hearty. Bright. Nourishing.', intro: 'Winter brings deep flavors and slow-cooked comfort. Citrus is at its juiciest, leafy greens at their crispest.', heroImg: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=1200&auto=format&fit=crop&q=75' },
  spring: { accent: '#2E7D32', accentBg: 'rgba(46,125,50,0.10)',  headline: 'Spring Awakens',   headline2: 'Tender. Fresh. Vibrant.',     intro: 'Spring is a celebration of renewal — tender greens, sweet berries, and the first asparagus shoots of the year.', heroImg: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&auto=format&fit=crop&q=75' },
  summer: { accent: '#D6A441', accentBg: 'rgba(214,164,65,0.16)', headline: "Summer's Bounty",  headline2: 'Sun-Ripened. Sweet. Abundant.', intro: 'Summer means peak abundance. Tomatoes bursting with flavor, mangoes at their sweetest, and stone fruit picked sun-warm from the tree.', heroImg: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop&q=75' },
};

export default function Seasonal() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [season,   setSeason]   = useState('summer');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const id = 'seasonal-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes ssFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
      .ss-fade-up { animation: ssFadeUp .7s cubic-bezier(.22,1,.36,1) both; }
      .ss-card { transition: transform .25s ease, box-shadow .25s ease; }
      .ss-card:hover { transform: translateY(-4px); box-shadow: 0 28px 56px -16px rgba(37,53,40,.18); }
      .ss-card:hover .ss-img { transform: scale(1.06); }
      .ss-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
      .ss-btn:hover { background: ${C.moss} !important; }
      @keyframes ssSpin { to { transform: rotate(360deg); } }
      @media (max-width: 1000px) {
        .ss-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        .ss-prod-grid { grid-template-columns: repeat(2, 1fr) !important; }
      }
      @media (max-width: 640px) {
        .ss-hero-h1 { font-size: 56px !important; }
        .ss-headline2 { font-size: 22px !important; }
        .ss-section-h2 { font-size: 36px !important; }
        .ss-prod-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    api.get('/products/seasonal')
      .then(r => {
        setProducts(r.data.products || []);
        setSeason(r.data.season || 'summer');
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const theme = SEASON_THEMES[season] || SEASON_THEMES.summer;
  const seasonName = season.charAt(0).toUpperCase() + season.slice(1);

  // Add cheapest offer to cart (Amazon-style "Buy Box")
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
      background: C.boneWhite, color: C.charcoal,
      fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh',
    }}>
      {/* HERO */}
      <section style={{
        background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
        padding: '88px 32px 96px',
      }}>
        <div className="ss-hero-grid" style={{
          maxWidth: 1300, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 72, alignItems: 'center',
        }}>
          <div className="ss-fade-up">
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '7px 16px', background: theme.accentBg,
              borderRadius: 999, marginBottom: 28,
              color: theme.accent, fontSize: 13, fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              In Season Now · {seasonName}
            </div>
            <h1 className="ss-hero-h1" style={{
              fontFamily: SERIF, fontSize: 80, fontWeight: 400,
              color: C.charcoal, margin: '0 0 14px',
              letterSpacing: '-0.025em', lineHeight: 1.02,
            }}>
              {theme.headline}
            </h1>
            <p className="ss-headline2" style={{
              fontFamily: SERIF, fontSize: 30, color: theme.accent,
              fontStyle: 'italic', margin: '0 0 28px', fontWeight: 400,
              letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>
              {theme.headline2}
            </p>
            <p style={{
              fontSize: 17, color: C.mutedDark, lineHeight: 1.7,
              marginBottom: 36, maxWidth: 520,
            }}>
              {theme.intro}
            </p>
            <Link to="/listings" className="ss-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '15px 30px',
              background: C.forest, color: C.boneWhite,
              borderRadius: 999, textDecoration: 'none',
              fontWeight: 500, fontSize: 15,
            }}>
              Shop Seasonal Produce <ArrowRightIcon size={16}/>
            </Link>
          </div>
          <div className="ss-fade-up" style={{ animationDelay: '0.1s' }}>
            <div style={{
              borderRadius: 28, overflow: 'hidden',
              boxShadow: '0 28px 56px -16px rgba(37,53,40,0.18)',
            }}>
              <img src={theme.heroImg} alt={`${seasonName} produce`}
                onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCE; }}
                style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}/>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section style={{
        padding: '88px 32px',
        background: C.boneWhite,
        borderTop: `1px solid ${C.mistGray}`,
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ marginBottom: 56, maxWidth: 720 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: C.moss,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              margin: '0 0 14px',
            }}>What to Look For</p>
            <h2 className="ss-section-h2" style={{
              fontFamily: SERIF, fontSize: 52, fontWeight: 400,
              color: C.charcoal, margin: '0 0 20px',
              letterSpacing: '-0.02em', lineHeight: 1.08,
            }}>
              At their peak this {seasonName.toLowerCase()}
            </h2>
            <p style={{ fontSize: 17, color: C.mutedDark, lineHeight: 1.7, maxWidth: 600 }}>
              {products.length} {products.length === 1 ? 'product' : 'products'} in season right now.
              Click any item to see all the farmers selling it.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
              <div style={{
                width: 40, height: 40,
                border: `3px solid ${C.mistGray}`,
                borderTopColor: C.forest,
                borderRadius: '50%',
                animation: 'ssSpin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}/>
              <p style={{ fontSize: 14 }}>Loading seasonal produce…</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{
              background: C.cream, borderRadius: 24,
              padding: '72px 24px', textAlign: 'center', color: C.muted,
            }}>
              <p style={{
                fontFamily: SERIF, fontSize: 28, color: C.charcoal,
                margin: '0 0 14px', fontWeight: 400, letterSpacing: '-0.01em',
              }}>
                Catalog coming soon
              </p>
              <p style={{ fontSize: 15 }}>
                Our seasonal collection for {seasonName.toLowerCase()} is being curated.
              </p>
            </div>
          ) : (
            <div className="ss-prod-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
            }}>
              {products.map((p, i) => (
                <article key={p.product_id} className="ss-card ss-fade-up"
                  style={{
                    background: C.white, borderRadius: 22, overflow: 'hidden',
                    border: `1px solid ${C.mistGray}`,
                    animationDelay: `${(i % 8) * 0.05}s`,
                    display: 'flex', flexDirection: 'column',
                  }}>
                  <Link to={`/products/${p.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{
                      aspectRatio: '4 / 3', overflow: 'hidden',
                      background: C.mistGray, position: 'relative',
                    }}>
                      <img src={getImg(p.image_url)} alt={p.name}
                        onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCE; }}
                        loading="lazy" className="ss-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                      <div style={{
                        position: 'absolute', top: 14, left: 14,
                        padding: '4px 11px',
                        background: theme.accent, color: C.white,
                        fontSize: 10, fontWeight: 600, borderRadius: 999,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        Seasonal
                      </div>
                      {/* Wishlist heart — top-right is free here since there's
                          no second badge to compete with. */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist({
                            product_id:    p.product_id,
                            name:          p.name,
                            slug:          p.slug,
                            image_url:     p.image_url,
                            default_unit:  p.default_unit,
                            min_price:     p.min_price ?? null,
                            category_name: p.category_name,
                          });
                        }}
                        aria-label={isInWishlist(p.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        title={isInWishlist(p.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        style={{
                          position: 'absolute', top: 14, right: 14,
                          width: 38, height: 38,
                          background: isInWishlist(p.product_id) ? C.terracotta : 'rgba(251,250,248,0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '50%', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          color: isInWishlist(p.product_id) ? '#fff' : C.charcoal,
                          boxShadow: '0 2px 8px rgba(37,53,40,0.12)',
                          transition: 'all 0.2s ease',
                        }}>
                        <svg width="17" height="17" viewBox="0 0 24 24"
                             fill={isInWishlist(p.product_id) ? 'currentColor' : 'none'}
                             stroke="currentColor" strokeWidth="1.8"
                             strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                      </button>
                      {p.offers_count === 0 && (
                        <div style={{
                          position: 'absolute', bottom: 14, left: 14, right: 14,
                          padding: '6px 12px',
                          background: 'rgba(28,31,29,0.85)',
                          backdropFilter: 'blur(8px)',
                          color: C.boneWhite,
                          fontSize: 11, fontWeight: 500, borderRadius: 8,
                          textAlign: 'center',
                        }}>
                          Currently unavailable
                        </div>
                      )}
                    </div>
                  </Link>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Link to={`/products/${p.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{
                        fontSize: 17, color: C.charcoal, fontWeight: 500,
                        margin: '0 0 4px', lineHeight: 1.3,
                        letterSpacing: '-0.005em',
                      }}>{p.name}</h3>
                    </Link>
                    {p.offers_count > 0 ? (
                      <p style={{ fontSize: 12, color: C.muted, margin: '0 0 14px' }}>
                        From {p.offers_count} {p.offers_count === 1 ? 'farmer' : 'farmers'}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: C.terracotta, margin: '0 0 14px' }}>
                        Awaiting listings
                      </p>
                    )}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginTop: 'auto',
                    }}>
                      <div>
                        {p.min_price ? (
                          <>
                            <span style={{
                              fontFamily: SERIF, fontSize: 22,
                              color: C.charcoal, fontWeight: 400,
                            }}>${Number(p.min_price).toFixed(2)}</span>
                            <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>
                              /{p.default_unit}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
                            Notify when available
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={p.offers_count === 0 || p.total_stock <= 0}
                        title={p.offers_count === 0 ? 'No farmers listing this yet' : 'Add cheapest offer to cart'}
                        style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: p.offers_count > 0 ? C.forest : C.mistGray,
                          color: p.offers_count > 0 ? C.boneWhite : C.muted,
                          border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: p.offers_count > 0 ? 'pointer' : 'not-allowed',
                        }}>
                        <CartIcon size={16}/>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY SEASONAL */}
      <section style={{ padding: '88px 32px', background: C.cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: C.moss,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              margin: '0 0 14px',
            }}>The Why</p>
            <h2 className="ss-section-h2" style={{
              fontFamily: SERIF, fontSize: 48, fontWeight: 400,
              color: C.charcoal, margin: 0,
              letterSpacing: '-0.018em', lineHeight: 1.1,
            }}>
              Why eat with the seasons?
            </h2>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40,
          }}>
            {[
              { title: 'Better flavor',   desc: 'Produce picked at peak ripeness simply tastes better. Sun-ripened tomatoes, tree-ripe peaches — there\'s no comparison.' },
              { title: 'More nutrition',  desc: 'Seasonal produce travels less and is harvested closer to when you eat it, retaining more vitamins and minerals.' },
              { title: 'Lower impact',    desc: 'Less refrigeration, less freight, less packaging. Eating seasonally is one of the easiest ways to reduce food miles.' },
              { title: 'Support farmers', desc: 'Buying in season means farmers get fair prices for their best produce, keeping local agriculture sustainable.' },
            ].map((b, i) => (
              <div key={b.title} className="ss-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{
                  fontFamily: SERIF, fontSize: 40,
                  color: theme.accent, fontWeight: 400,
                  marginBottom: 18, lineHeight: 1, letterSpacing: '-0.01em',
                }}>0{i + 1}</div>
                <h3 style={{
                  fontSize: 19, color: C.charcoal, fontWeight: 600,
                  margin: '0 0 12px', letterSpacing: '-0.005em',
                }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: C.mutedDark, lineHeight: 1.7, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}