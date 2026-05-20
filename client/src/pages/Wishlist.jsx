// pages/Wishlist.jsx — Saved favorites
// Author: CPRO306 Capstone | Date: 2026

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const C = {
  forest:'#253528', moss:'#3D5B45', sage:'#A7BFA5',
  cream:'#F6F3EE', boneWhite:'#FBFAF8', charcoal:'#1C1F1D',
  mistGray:'#E7E5E0', white:'#FFFFFF',
  terracotta:'#C46A4A', muted:'#6B7280', mutedDark:'#4B5563',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";
const FALLBACK = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=75';

const getImg = (url) => {
  if (!url) return FALLBACK;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

const I = ({ children, size = 18, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const HeartIcon  = (p) => <I {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></I>;
const CartIcon   = (p) => <I {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></I>;
const TrashIcon  = (p) => <I {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></I>;
const ArrowRight = (p) => <I {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></I>;

export default function Wishlist() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Load Instrument Serif
  useEffect(() => {
    const id = 'instrument-serif-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Add the cheapest available farmer offer to cart
  const moveToCart = async (item) => {
    try {
      const res = await api.get(`/products/${item.slug}`);
      const offer = res.data.offers?.[0];
      if (offer) {
        addToCart({
          listing_id:  offer.listing_id,
          title:       item.name,
          price:       offer.price,
          unit:        offer.unit || item.default_unit,
          image_url:   item.image_url,
          farmer_name: offer.farmer_name,
          quantity:    offer.quantity,
        });
        removeFromWishlist(item.product_id);
      } else {
        alert('No farmers are currently selling this. We\'ll keep it saved for you.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={pageBase}>

      {/* HERO */}
      <section style={hero}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={eyebrow}>Your Saved Items</p>
          <h1 style={h1}>
            My <span style={{ color: C.moss, fontStyle: 'italic' }}>Wishlist</span>
          </h1>
          <p style={lead}>
            {items.length === 0
              ? "Nothing saved yet. Tap the heart on any product to keep track of what you love."
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} saved for later.`
            }
          </p>
        </div>
      </section>

      <section style={{ padding: '48px 32px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {items.length === 0 ? (
            // ── Empty state ───────────────────────────────
            <div style={emptyBox}>
              <div style={emptyIcon}>
                <HeartIcon size={32}/>
              </div>
              <h2 style={{
                fontFamily: SERIF, fontSize: 32, fontWeight: 400,
                color: C.charcoal, margin: '0 0 12px',
                letterSpacing: '-0.018em',
              }}>
                Your wishlist is empty
              </h2>
              <p style={{
                fontSize: 15, color: C.mutedDark, lineHeight: 1.7,
                margin: '0 auto 28px', maxWidth: 420,
              }}>
                Save your favorite produce, farmers, and seasonal picks here for easy access later.
              </p>
              <Link to="/listings" style={primaryBtn}>
                Browse fresh produce <ArrowRight size={15}/>
              </Link>
            </div>
          ) : (
            <>
              {/* Action bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12,
              }}>
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                  Items remain saved across browser sessions on this device.
                </p>
                <button onClick={() => {
                  if (window.confirm('Remove all items from your wishlist?')) clearWishlist();
                }} style={clearBtn}>
                  <TrashIcon size={14}/> Clear wishlist
                </button>
              </div>

              {/* Grid */}
              <div style={grid}>
                {items.map(item => (
                  <article key={item.product_id} style={card}>
                    <Link to={`/products/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={imgWrap}>
                        <img src={getImg(item.image_url)} alt={item.name}
                          onError={e => { e.currentTarget.src = FALLBACK; }}
                          loading="lazy"
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', display: 'block',
                          }}/>
                        {item.category_name && (
                          <span style={categoryBadge}>{item.category_name}</span>
                        )}
                      </div>
                    </Link>
                    <div style={cardBody}>
                      <Link to={`/products/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={cardTitle}>{item.name}</h3>
                      </Link>
                      {item.min_price ? (
                        <p style={priceLine}>
                          <span style={{
                            fontFamily: SERIF, fontSize: 22, color: C.charcoal,
                          }}>${Number(item.min_price).toFixed(2)}</span>
                          <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>
                            /{item.default_unit}
                          </span>
                        </p>
                      ) : (
                        <p style={{ fontSize: 13, color: C.terracotta, fontStyle: 'italic' }}>
                          Currently unavailable
                        </p>
                      )}
                      <p style={savedDate}>
                        Saved {new Date(item.added_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      <div style={cardActions}>
                        <button onClick={() => moveToCart(item)}
                          disabled={!item.min_price}
                          title={item.min_price ? 'Add cheapest offer to cart' : 'No farmers selling this yet'}
                          style={{
                            ...cartBtnSmall,
                            opacity: item.min_price ? 1 : 0.5,
                            cursor: item.min_price ? 'pointer' : 'not-allowed',
                          }}>
                          <CartIcon size={14}/> Add to cart
                        </button>
                        <button onClick={() => removeFromWishlist(item.product_id)}
                          aria-label="Remove from wishlist"
                          style={removeBtn}>
                          <TrashIcon size={14}/>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const pageBase = {
  background: C.boneWhite, color: C.charcoal,
  fontFamily: "'Inter', system-ui, sans-serif",
  minHeight: '100vh',
};
const hero = {
  background: `linear-gradient(180deg, ${C.cream} 0%, ${C.boneWhite} 100%)`,
  padding: '64px 32px 40px',
  borderBottom: `1px solid ${C.mistGray}`,
};
const eyebrow = {
  fontSize: 11, fontWeight: 700, color: C.moss,
  letterSpacing: '0.18em', textTransform: 'uppercase',
  margin: '0 0 14px',
};
const h1 = {
  fontFamily: SERIF, fontSize: 52, fontWeight: 400,
  color: C.charcoal, margin: '0 0 14px',
  letterSpacing: '-0.022em', lineHeight: 1.05,
};
const lead = {
  fontSize: 16, color: C.mutedDark, lineHeight: 1.65,
  margin: 0, maxWidth: 640,
};

const emptyBox = {
  textAlign: 'center', padding: '80px 24px',
  background: C.white, borderRadius: 24,
  border: `1px solid ${C.mistGray}`,
  maxWidth: 640, margin: '0 auto',
};
const emptyIcon = {
  width: 72, height: 72, borderRadius: 18,
  background: 'rgba(167,191,165,0.22)',
  color: C.moss,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 22px',
};
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '13px 26px',
  background: C.forest, color: C.boneWhite,
  borderRadius: 999, textDecoration: 'none',
  fontWeight: 500, fontSize: 14,
};
const clearBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', color: C.muted,
  border: `1px solid ${C.mistGray}`, borderRadius: 999,
  padding: '7px 14px', fontSize: 12.5, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 20,
};
const card = {
  background: C.white, borderRadius: 18,
  overflow: 'hidden', border: `1px solid ${C.mistGray}`,
  display: 'flex', flexDirection: 'column',
};
const imgWrap = {
  position: 'relative', aspectRatio: '4 / 3',
  overflow: 'hidden', background: C.cream,
};
const categoryBadge = {
  position: 'absolute', top: 12, left: 12,
  background: 'rgba(251,250,248,0.95)',
  backdropFilter: 'blur(8px)', color: C.forest,
  fontSize: 10, fontWeight: 600,
  padding: '4px 10px', borderRadius: 999,
  letterSpacing: '0.06em', textTransform: 'uppercase',
};
const cardBody = {
  padding: 18, display: 'flex', flexDirection: 'column',
  gap: 6, flex: 1,
};
const cardTitle = {
  fontSize: 15.5, fontWeight: 500, color: C.charcoal,
  lineHeight: 1.3, margin: 0,
  letterSpacing: '-0.005em',
};
const priceLine = {
  margin: 0,
};
const savedDate = {
  fontSize: 11, color: C.muted, margin: '0 0 12px',
};
const cardActions = {
  display: 'flex', gap: 6, marginTop: 'auto',
};
const cartBtnSmall = {
  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 6, padding: '10px 12px',
  background: C.forest, color: C.boneWhite,
  border: 'none', borderRadius: 999,
  fontSize: 12.5, fontWeight: 500,
  fontFamily: 'inherit',
};
const removeBtn = {
  width: 38, height: 38, borderRadius: '50%',
  background: C.cream, color: C.muted,
  border: `1px solid ${C.mistGray}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
};