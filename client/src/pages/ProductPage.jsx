// pages/ProductPage.jsx — Single product detail (Amazon-style)
// Author: CPRO306 Capstone | Date: 2026
//
// Shows the canonical product (catalog) and ALL farmer offers selling it.
// User picks an offer + qty, then adds that specific listing to cart.
// "Currently unavailable" if no offers.

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
const FALLBACK = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=75';

const getImg = (url) => {
  if (!url) return FALLBACK;
  if (url.startsWith('http')) return url;
  return `http://localhost:5001${url}`;
};

const I = ({ children, size = 18, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const ArrowLeft  = (p) => <I {...p}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></I>;
const ArrowRight = (p) => <I {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></I>;
const CartIcon   = (p) => <I {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></I>;
const StarIcon   = ({ size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2-6.3-4.4L5.7 20.8 8 13.6 2 9.2h7.6z"/></svg>);
const MapPinIcon = (p) => <I {...p} sw={1.7}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></I>;
const CheckIcon  = (p) => <I {...p}><path d="M20 6 9 17l-5-5"/></I>;
const PackageIcon = (p) => <I {...p} sw={1.7}><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></I>;

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [offers,  setOffers]  = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(null);

  // Load font + animations
  useEffect(() => {
    const fid = 'instrument-serif-font';
    if (!document.getElementById(fid)) {
      const link = document.createElement('link');
      link.id = fid; link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
    const sid = 'product-page-styles';
    if (!document.getElementById(sid)) {
      const style = document.createElement('style');
      style.id = sid;
      style.textContent = `
        @keyframes ppFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes ppSpin { to { transform: rotate(360deg); } }
        .pp-fade-up { animation: ppFadeUp .6s cubic-bezier(.22,1,.36,1) both; }
        .pp-offer:hover { background: ${C.cream} !important; }
        .pp-offer-selected { border-color: ${C.forest} !important; background: rgba(167,191,165,0.12) !important; }
        .pp-related-card { transition: transform .25s ease; }
        .pp-related-card:hover { transform: translateY(-3px); }
        .pp-btn-primary:hover:not(:disabled) { background: ${C.moss} !important; }
        .pp-qty-btn:hover:not(:disabled) { background: ${C.mistGray} !important; }
        @media (max-width: 900px) {
          .pp-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pp-related-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .pp-related-grid { grid-template-columns: 1fr !important; }
          .pp-h1 { font-size: 36px !important; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Fetch the product
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/products/${slug}`)
      .then(r => {
        setProduct(r.data.product);
        setOffers(r.data.offers || []);
        setRelated(r.data.related || []);
        // Pre-select the cheapest (first) offer
        if (r.data.offers && r.data.offers.length) {
          setSelectedOfferId(r.data.offers[0].listing_id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Product fetch error:', err);
        setError(err.response?.status === 404 ? 'Product not found' : 'Failed to load product');
        setLoading(false);
      });
  }, [slug]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleAddToCart = () => {
    const offer = offers.find(o => o.listing_id === selectedOfferId);
    if (!offer || !product) return;
    for (let i = 0; i < qty; i++) {
      addToCart({
        listing_id:  offer.listing_id,
        title:       product.name,
        price:       offer.price,
        unit:        offer.unit || product.default_unit,
        image_url:   product.display_image,
        farmer_name: offer.farmer_name,
        quantity:    offer.quantity,
      });
    }
    showToast(`✓ Added ${qty} × ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => navigate('/cart'), 300);
  };

  // ── States ──
  if (loading) {
    return (
      <div style={pageBase}>
        <div style={{ textAlign: 'center', padding: '120px 20px' }}>
          <div style={{
            width: 44, height: 44,
            border: `3px solid ${C.mistGray}`,
            borderTopColor: C.forest,
            borderRadius: '50%',
            animation: 'ppSpin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}/>
          <p style={{ color: C.muted, fontSize: 14 }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={pageBase}>
        <div style={{ textAlign: 'center', padding: '120px 20px', maxWidth: 480, margin: '0 auto' }}>
          <p style={{
            fontFamily: SERIF, fontSize: 36, color: C.charcoal,
            fontWeight: 400, margin: '0 0 14px', letterSpacing: '-0.015em',
          }}>
            {error || 'Product not found'}
          </p>
          <p style={{ color: C.mutedDark, marginBottom: 28, lineHeight: 1.6 }}>
            The product you're looking for doesn't exist or has been removed from the catalog.
          </p>
          <Link to="/listings" style={primaryLink}>← Back to all produce</Link>
        </div>
      </div>
    );
  }

  const selectedOffer = offers.find(o => o.listing_id === selectedOfferId);
  const isAvailable   = product.is_available && offers.length > 0;
  const cheapestOffer = offers[0];

  return (
    <div style={pageBase}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 100, right: 24, zIndex: 200,
          background: C.forest, color: C.boneWhite,
          padding: '14px 22px', borderRadius: 12,
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 12px 32px -8px rgba(37,53,40,0.30)',
          animation: 'ppFadeUp .3s ease both',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* Breadcrumb */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: C.muted, marginBottom: 32,
        }}>
          <Link to="/" style={{ color: C.muted, textDecoration: 'none' }}>Home</Link>
          <span style={{ color: C.sage }}>›</span>
          <Link to="/listings" style={{ color: C.muted, textDecoration: 'none' }}>Shop</Link>
          <span style={{ color: C.sage }}>›</span>
          <Link to={`/listings?category=${product.category_id}`}
                style={{ color: C.muted, textDecoration: 'none' }}>
            {product.category_name}
          </Link>
          <span style={{ color: C.sage }}>›</span>
          <span style={{ color: C.charcoal, fontWeight: 500 }}>{product.name}</span>
        </nav>

        {/* MAIN GRID — image | info | offers */}
        <div className="pp-grid pp-fade-up" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56,
          marginBottom: 80,
        }}>

          {/* LEFT: Image */}
          <div>
            <div style={{
              borderRadius: 24, overflow: 'hidden',
              background: C.cream,
              border: `1px solid ${C.mistGray}`,
            }}>
              <img src={getImg(product.display_image)} alt={product.name}
                onError={(e) => { e.currentTarget.src = FALLBACK; }}
                style={{
                  width: '100%', aspectRatio: '1 / 1',
                  objectFit: 'cover', display: 'block',
                }}/>
            </div>
            {product.is_seasonal && (
              <div style={{
                marginTop: 16,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 16px',
                background: 'rgba(214,164,65,0.16)',
                color: '#9c6f1d',
                borderRadius: 999,
                fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
              }}>
                ⌕ Seasonal · {product.season}
              </div>
            )}
          </div>

          {/* RIGHT: Info + Offers */}
          <div>
            {/* Category eyebrow */}
            <p style={{
              fontSize: 11, fontWeight: 700, color: C.moss,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              margin: '0 0 12px',
            }}>{product.category_name}</p>

            {/* Title */}
            <h1 className="pp-h1" style={{
              fontFamily: SERIF, fontSize: 48, fontWeight: 400,
              color: C.charcoal, margin: '0 0 16px',
              letterSpacing: '-0.022em', lineHeight: 1.05,
            }}>
              {product.name}
            </h1>

            {/* Price + availability */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              marginBottom: 8, flexWrap: 'wrap',
            }}>
              {isAvailable ? (
                <>
                  <span style={{
                    fontFamily: SERIF, fontSize: 40, fontWeight: 400,
                    color: C.charcoal, letterSpacing: '-0.02em',
                  }}>${Number(product.min_price).toFixed(2)}</span>
                  {product.max_price && product.max_price > product.min_price && (
                    <span style={{ color: C.muted, fontSize: 16 }}>
                      – ${Number(product.max_price).toFixed(2)}
                    </span>
                  )}
                  <span style={{ color: C.muted, fontSize: 14 }}>
                    /{product.default_unit}
                  </span>
                </>
              ) : (
                <span style={{
                  fontFamily: SERIF, fontSize: 28, fontStyle: 'italic',
                  color: C.terracotta, fontWeight: 400,
                }}>
                  Currently unavailable
                </span>
              )}
            </div>

            {/* Stock + offers count */}
            {isAvailable && (
              <p style={{
                fontSize: 13, color: C.moss, margin: '0 0 24px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckIcon size={14}/>
                In stock — {product.total_stock} {product.default_unit} available from {offers.length} {offers.length === 1 ? 'farmer' : 'farmers'}
              </p>
            )}

            {/* Description */}
            {product.description && (
              <p style={{
                fontSize: 16, color: C.mutedDark, lineHeight: 1.7,
                margin: '0 0 32px', maxWidth: 540,
              }}>
                {product.description}
              </p>
            )}

            {/* OFFERS LIST — Amazon-style "Available from these farmers" */}
            {isAvailable ? (
              <div style={{ marginBottom: 24 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: C.muted,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  margin: '0 0 12px',
                }}>Available from</p>

                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  maxHeight: 280, overflowY: 'auto',
                }}>
                  {offers.map(offer => {
                    const isSelected = offer.listing_id === selectedOfferId;
                    return (
                      <button
                        key={offer.listing_id}
                        onClick={() => setSelectedOfferId(offer.listing_id)}
                        className={`pp-offer ${isSelected ? 'pp-offer-selected' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 16px',
                          background: C.white,
                          border: `1.5px solid ${isSelected ? C.forest : C.mistGray}`,
                          borderRadius: 14,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'all .15s ease',
                          width: '100%',
                        }}>
                        {/* Selected indicator */}
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${isSelected ? C.forest : C.mistGray}`,
                          background: isSelected ? C.forest : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          color: C.boneWhite,
                        }}>
                          {isSelected && <CheckIcon size={11}/>}
                        </div>
                        {/* Farmer info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, color: C.charcoal, fontWeight: 600,
                            marginBottom: 2,
                          }}>
                            {offer.farmer_name}
                          </div>
                          <div style={{
                            fontSize: 12, color: C.muted,
                            display: 'flex', alignItems: 'center', gap: 12,
                          }}>
                            {offer.location && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <MapPinIcon size={11}/> {offer.location}
                              </span>
                            )}
                            <span>{offer.quantity} {offer.unit} in stock</span>
                            {offer.review_count > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: C.harvestGold }}>
                                <StarIcon size={11}/>
                                <span style={{ color: C.charcoal }}>
                                  {Number(offer.avg_rating || 0).toFixed(1)}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Price */}
                        <div style={{
                          fontFamily: SERIF, fontSize: 22,
                          color: C.charcoal, fontWeight: 400,
                          letterSpacing: '-0.01em',
                        }}>
                          ${Number(offer.price).toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                background: C.cream, borderRadius: 14,
                padding: '24px', marginBottom: 24,
                border: `1px solid ${C.mistGray}`,
              }}>
                <p style={{
                  fontSize: 14, color: C.charcoal, fontWeight: 500,
                  margin: '0 0 6px',
                }}>
                  No farmers are listing this item right now
                </p>
                <p style={{ fontSize: 13, color: C.mutedDark, margin: 0, lineHeight: 1.5 }}>
                  Check back soon — our farmers add new produce every day, especially during peak season.
                </p>
              </div>
            )}

            {/* QUANTITY + ADD TO CART */}
            {isAvailable && selectedOffer && (
              <div style={{
                display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap',
              }}>
                {/* Qty stepper */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: C.cream, borderRadius: 999,
                  border: `1.5px solid ${C.mistGray}`,
                  padding: 4,
                }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="pp-qty-btn"
                    disabled={qty <= 1}
                    style={qtyBtnStyle}>−</button>
                  <span style={{
                    minWidth: 36, textAlign: 'center',
                    fontSize: 16, fontWeight: 600, color: C.charcoal,
                  }}>{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(selectedOffer.quantity, qty + 1))}
                    className="pp-qty-btn"
                    disabled={qty >= selectedOffer.quantity}
                    style={qtyBtnStyle}>+</button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  className="pp-btn-primary"
                  style={{
                    flex: 1, minWidth: 200,
                    padding: '14px 24px',
                    background: C.forest, color: C.boneWhite,
                    border: 'none', borderRadius: 999,
                    fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                  <CartIcon size={16}/>
                  Add to cart — ${(Number(selectedOffer.price) * qty).toFixed(2)}
                </button>

                {/* Buy now */}
                <button
                  onClick={handleBuyNow}
                  style={{
                    padding: '14px 24px',
                    background: 'transparent',
                    color: C.forest, border: `1.5px solid ${C.forest}`,
                    borderRadius: 999,
                    fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  Buy now
                </button>

                {/* Wishlist toggle */}
                <button
                  onClick={() => {
                    toggleWishlist(product);
                    showToast(isInWishlist(product.product_id) ? '♡ Removed from wishlist' : '♥ Saved to wishlist');
                  }}
                  aria-label={isInWishlist(product.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                  title={isInWishlist(product.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                  style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: isInWishlist(product.product_id) ? 'rgba(196,106,74,0.12)' : 'transparent',
                    color: isInWishlist(product.product_id) ? C.terracotta : C.muted,
                    border: `1.5px solid ${isInWishlist(product.product_id) ? C.terracotta : C.mistGray}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all .2s ease',
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"
                       fill={isInWishlist(product.product_id) ? 'currentColor' : 'none'}
                       stroke="currentColor" strokeWidth="1.8"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Trust strip */}
            <div style={{
              marginTop: 32, paddingTop: 24,
              borderTop: `1px solid ${C.mistGray}`,
              display: 'flex', flexWrap: 'wrap', gap: 24,
              fontSize: 12, color: C.muted,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={13}/> Verified farms
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <PackageIcon size={13}/> Farm to door in 48hr
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                ⚡ Secure Stripe checkout
              </span>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: C.moss,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              margin: '0 0 14px',
            }}>You may also like</p>
            <h2 style={{
              fontFamily: SERIF, fontSize: 36, fontWeight: 400,
              color: C.charcoal, margin: '0 0 32px',
              letterSpacing: '-0.018em',
            }}>
              More from {product.category_name.toLowerCase()}
            </h2>
            <div className="pp-related-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20,
            }}>
              {related.map(r => (
                <Link key={r.product_id} to={`/products/${r.slug}`}
                  className="pp-related-card"
                  style={{
                    background: C.white, borderRadius: 16, overflow: 'hidden',
                    border: `1px solid ${C.mistGray}`,
                    textDecoration: 'none', color: 'inherit',
                  }}>
                  <div style={{
                    aspectRatio: '1 / 1', overflow: 'hidden', background: C.cream,
                  }}>
                    <img src={getImg(r.image_url)} alt={r.name}
                      onError={(e) => { e.currentTarget.src = FALLBACK; }}
                      loading="lazy"
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                      }}/>
                  </div>
                  <div style={{ padding: 14 }}>
                    <h4 style={{
                      fontSize: 14, color: C.charcoal,
                      fontWeight: 500, margin: '0 0 4px',
                      lineHeight: 1.3,
                    }}>{r.name}</h4>
                    {r.min_price ? (
                      <p style={{
                        fontFamily: SERIF, fontSize: 17,
                        color: C.charcoal, fontWeight: 400, margin: 0,
                      }}>
                        ${Number(r.min_price).toFixed(2)}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                        View details
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Shared styles
const pageBase = {
  background: C.boneWhite,
  color:      C.charcoal,
  fontFamily: "'Inter', system-ui, sans-serif",
  minHeight:  '100vh',
};
const primaryLink = {
  display: 'inline-block',
  padding: '14px 28px',
  background: C.forest, color: C.boneWhite,
  borderRadius: 999, textDecoration: 'none',
  fontWeight: 500, fontSize: 15,
};
const qtyBtnStyle = {
  width: 36, height: 36,
  border: 'none', background: 'transparent',
  borderRadius: '50%', cursor: 'pointer',
  fontSize: 18, fontWeight: 600, color: C.charcoal,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
};