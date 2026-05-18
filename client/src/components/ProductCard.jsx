// components/ProductCard.jsx

import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProduceImage } from '../utils/produceImage';

// ── Palette (matches Home / Listings / Farmers / Seasonal) ──
const C = {
  forest:    '#253528',
  moss:      '#3D5B45',
  cream:     '#F6F3EE',
  boneWhite: '#FBFAF8',
  charcoal:  '#1C1F1D',
  mistGray:  '#E7E5E0',
  white:     '#FFFFFF',
  muted:     '#6B7280',
  mutedDark: '#4B5563',
  harvestGold:'#D6A441',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

// ── Helpers ──
// (image resolution moved to utils/produceImage.js — getProduceImage handles
// real uploads + smart category-based placeholders when image_url is missing)

// ── Inline icons ──
const I = ({ children, size = 16, sw = 2, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const StarIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2-6.3-4.4L5.7 20.8 8 13.6 2 9.2h7.6z"/>
  </svg>
);
const CartIcon = (p) => <I {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></I>;
const WheatIcon = (p) => <I {...p} sw={1.7}><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/></I>;
const MapPinIcon = (p) => <I {...p} sw={1.7}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></I>;

// ──────────────────────────────────────────────────────────────
export default function ProductCard({ listing }) {
  const { addToCart } = useCart();
  const outOfStock = listing.quantity === 0;

  return (
    <article className="pc-card" style={S.card}>
      <Link
        to={`/listings/${listing.listing_id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={S.imgWrap}>
          <img
            src={getProduceImage(listing, 600)}
            alt={listing.title}
            loading="lazy"
            className="pc-img"
            onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'; }}
            style={S.img}
          />
          {listing.category_name && (
            <span style={S.categoryBadge}>{listing.category_name}</span>
          )}
          {outOfStock && (
            <span style={S.soldOutBadge}>Sold out</span>
          )}
        </div>
      </Link>

      <div style={S.body}>
        <Link to={`/listings/${listing.listing_id}`} style={{ textDecoration: 'none' }}>
          <h3 style={S.title}>{listing.title}</h3>
        </Link>

        <div style={S.metaRow}>
          {listing.farmer_id ? (
            <Link
              to={`/farmers/${listing.farmer_id}`}
              onClick={(e) => e.stopPropagation()}
              style={{ ...S.metaItem, textDecoration:'none', color:'inherit' }}
              title={`View ${listing.farmer_name}'s storefront`}>
              <span style={{ color: C.moss, display: 'flex' }}><WheatIcon size={13}/></span>
              <span style={{ borderBottom:'1px dashed transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = C.moss}
                    onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}>
                {listing.farmer_name}
              </span>
            </Link>
          ) : (
            <span style={S.metaItem}>
              <span style={{ color: C.moss, display: 'flex' }}><WheatIcon size={13}/></span>
              {listing.farmer_name}
            </span>
          )}
          {listing.location && (
            <span style={S.metaItem}>
              <span style={{ color: C.moss, display: 'flex' }}><MapPinIcon size={13}/></span>
              {listing.location}
            </span>
          )}
        </div>

        <div style={S.ratingRow}>
          <span style={{ color: C.harvestGold, display: 'flex' }}><StarIcon size={13}/></span>
          <span style={S.ratingText}>
            {Number(listing.avg_rating || 0).toFixed(1)}
          </span>
          <span style={S.reviewCount}>({listing.review_count || 0})</span>
        </div>

        <div style={S.footer}>
          <div>
            <span style={S.price}>${Number(listing.price).toFixed(2)}</span>
            <span style={S.unit}>/{listing.unit || 'kg'}</span>
          </div>
          <button
            onClick={() => !outOfStock && addToCart(listing)}
            disabled={outOfStock}
            title={outOfStock ? 'Out of stock' : 'Add to cart'}
            className="pc-cart-btn"
            style={{
              ...S.cartBtn,
              background: outOfStock ? C.mistGray : C.forest,
              color:      outOfStock ? C.muted : C.boneWhite,
              cursor:     outOfStock ? 'not-allowed' : 'pointer',
            }}>
            <CartIcon size={16}/>
          </button>
        </div>
      </div>

      {/* Hover styles (inline for self-contained component) */}
      <style>{`
        .pc-card { transition: transform .25s ease, box-shadow .25s ease; }
        .pc-card:hover { transform: translateY(-3px); box-shadow: 0 24px 48px -16px rgba(37,53,40,.18); }
        .pc-card:hover .pc-img { transform: scale(1.04); }
        .pc-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
        .pc-cart-btn:not(:disabled):hover { background: ${C.moss} !important; }
      `}</style>
    </article>
  );
}

// ── Styles ──
const S = {
  card: {
    display:       'flex',
    flexDirection: 'column',
    background:    C.white,
    borderRadius:  18,
    overflow:      'hidden',
    border:        `1px solid ${C.mistGray}`,
    fontFamily:    "'Inter', system-ui, sans-serif",
  },
  imgWrap: {
    position:    'relative',
    aspectRatio: '4 / 3',
    overflow:    'hidden',
    background:  C.cream,
  },
  img: {
    width:    '100%',
    height:   '100%',
    objectFit:'cover',
    display:  'block',
  },
  categoryBadge: {
    position:        'absolute',
    top:             12,
    left:            12,
    background:      'rgba(251,250,248,0.95)',
    backdropFilter:  'blur(8px)',
    color:           C.forest,
    fontSize:        10,
    fontWeight:      600,
    padding:         '4px 10px',
    borderRadius:    999,
    letterSpacing:   '0.06em',
    textTransform:   'uppercase',
    boxShadow:       '0 2px 6px rgba(37,53,40,0.06)',
  },
  soldOutBadge: {
    position:     'absolute',
    top:          12,
    right:        12,
    background:   '#C62828',
    color:        C.white,
    fontSize:     10,
    fontWeight:   600,
    padding:      '4px 10px',
    borderRadius: 999,
    letterSpacing:'0.06em',
    textTransform:'uppercase',
  },
  body: {
    padding:       18,
    display:       'flex',
    flexDirection: 'column',
    gap:           8,
    flex:          1,
  },
  title: {
    fontWeight:    500,
    fontSize:      16,
    color:         C.charcoal,
    textDecoration:'none',
    lineHeight:    1.3,
    margin:        0,
    letterSpacing: '-0.005em',
  },
  metaRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           4,
    marginTop:     2,
  },
  metaItem: {
    display:    'inline-flex',
    alignItems: 'center',
    gap:        6,
    fontSize:   12.5,
    color:      C.mutedDark,
  },
  ratingRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        5,
    marginTop:  2,
  },
  ratingText: {
    fontSize:   13,
    color:      C.charcoal,
    fontWeight: 500,
  },
  reviewCount: {
    fontSize: 12,
    color:    C.muted,
  },
  footer: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      'auto',
    paddingTop:     14,
    borderTop:      `1px solid ${C.mistGray}`,
  },
  price: {
    fontFamily:    SERIF,
    fontSize:      24,
    fontWeight:    400,
    color:         C.charcoal,
    letterSpacing: '-0.01em',
  },
  unit: {
    fontSize:   12,
    color:      C.muted,
    marginLeft: 3,
  },
  cartBtn: {
    width:           40,
    height:          40,
    borderRadius:    '50%',
    border:          'none',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    transition:      'background .2s ease',
  },
};