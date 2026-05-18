// pages/FarmerStorefront.jsx — Public per-farmer storefront
// Shows farmer profile, all their listings, aggregated rating, and recent reviews.
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

// Palette consistent with Farmers.jsx
const C = {
  forest:    '#253528',
  moss:      '#3D5B45',
  sage:      '#A7BFA5',
  cream:     '#F6F3EE',
  boneWhite: '#FBFAF8',
  charcoal:  '#1C1F1D',
  mistGray:  '#E7E5E0',
  earthBrown:'#7A5C46',
  harvestGold:'#D6A441',
  white:     '#FFFFFF',
  muted:     '#6B7280',
};

const FARMER_PHOTOS = [
  'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=75',
  'https://images.unsplash.com/photo-1620200423727-8127f75d4f53?w=800&auto=format&fit=crop&q=75',
];
const photoFor = (id) => FARMER_PHOTOS[(Number(id) || 0) % FARMER_PHOTOS.length];

// ── Star icon ─────────────────────────────────────────────────
function Stars({ value = 0, size = 14 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
             fill={i <= Math.round(v) ? C.harvestGold : 'none'}
             stroke={C.harvestGold} strokeWidth="1.8" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

export default function FarmerStorefront() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api.get(`/farmers/${id}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load farmer.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <div style={{ ...S.skeleton, height:280, marginBottom:32 }}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:18 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ ...S.skeleton, height:280 }}/>)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={S.page}>
        <div style={{ ...S.container, textAlign:'center', padding:'80px 20px' }}>
          <p style={{ fontSize:64, margin:'0 0 12px' }}>🌾</p>
          <h2 style={{ color:C.forest, fontSize:24, margin:'0 0 8px' }}>{error || 'Farmer not found'}</h2>
          <p style={{ color:C.muted, marginBottom:24 }}>This farm page may have been removed.</p>
          <Link to="/farmers" style={S.backBtn}>← Back to all farmers</Link>
        </div>
      </div>
    );
  }

  const { farmer, listings, recent_reviews } = data;
  const heroPhoto = farmer.profile_image
    ? (farmer.profile_image.startsWith('http')
        ? farmer.profile_image
        : `http://localhost:5001${farmer.profile_image}`)
    : photoFor(farmer.user_id);

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* Back link */}
        <Link to="/farmers" style={S.crumb}>← All Farmers</Link>

        {/* ── Hero ── */}
        <div style={S.hero}>
          <div style={S.heroImageWrap}>
            <img src={heroPhoto} alt={farmer.full_name} style={S.heroImage}
                 onError={e => { e.target.src = photoFor(farmer.user_id); }}/>
          </div>
          <div style={S.heroInfo}>
            <p style={S.heroEyebrow}>FARMER STOREFRONT</p>
            <h1 style={S.heroTitle}>{farmer.full_name}</h1>
            <div style={S.heroStatsRow}>
              <div style={S.heroStat}>
                <Stars value={farmer.avg_rating} size={16}/>
                <span style={S.heroStatVal}>
                  {farmer.review_count > 0 ? Number(farmer.avg_rating).toFixed(1) : '—'}
                </span>
                <span style={S.heroStatLabel}>
                  ({farmer.review_count} {farmer.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <div style={S.heroStatDiv}/>
              <div style={S.heroStat}>
                <span style={S.heroStatVal}>{farmer.listing_count}</span>
                <span style={S.heroStatLabel}>{farmer.listing_count === 1 ? 'product' : 'products'}</span>
              </div>
              <div style={S.heroStatDiv}/>
              <div style={S.heroStat}>
                <span style={S.heroStatVal}>{farmer.sales_count}</span>
                <span style={S.heroStatLabel}>orders fulfilled</span>
              </div>
            </div>
            <p style={S.heroSince}>
              Selling on FarmMarket since{' '}
              {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString('en-AU', { year:'numeric', month:'long' }) : '—'}
            </p>
          </div>
        </div>

        {/* ── Listings grid ── */}
        <h2 style={S.sectionTitle}>Available from this farm</h2>
        {listings.length === 0 ? (
          <p style={S.emptyState}>This farmer has no active listings right now.</p>
        ) : (
          <div style={S.grid}>
            {listings.map(l => {
              const stock = Number(l.quantity);
              const outOfStock = stock <= 0;
              return (
                <div key={l.listing_id} style={S.card}>
                  <div style={S.cardImgWrap}
                       onClick={() => navigate(`/listings/${l.listing_id}`)}>
                    <img
                      src={l.image_url
                        ? (l.image_url.startsWith('http') ? l.image_url : `http://localhost:5001${l.image_url}`)
                        : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=70'}
                      alt={l.title}
                      style={S.cardImg}
                      onError={e => { e.target.src='https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=70'; }}
                    />
                    {outOfStock && <span style={S.outBadge}>Out of stock</span>}
                  </div>
                  <div style={S.cardBody}>
                    <p style={S.cardCat}>{l.category_name}</p>
                    <h3 style={S.cardTitle}>{l.title}</h3>
                    <div style={S.cardRating}>
                      <Stars value={l.avg_rating} size={12}/>
                      <span style={{ fontSize:11, color:C.muted, marginLeft:4 }}>
                        ({l.review_count})
                      </span>
                    </div>
                    <div style={S.cardFooter}>
                      <div>
                        <span style={S.cardPrice}>${Number(l.price).toFixed(2)}</span>
                        <span style={S.cardUnit}>/{l.unit}</span>
                      </div>
                      <button
                        disabled={outOfStock}
                        onClick={() => !outOfStock && addToCart({
                          listing_id: l.listing_id,
                          title: l.title,
                          price: l.price,
                          unit: l.unit,
                          image_url: l.image_url,
                          farmer_name: farmer.full_name,
                          quantity: l.quantity,
                        })}
                        style={{
                          ...S.cardBtn,
                          background: outOfStock ? C.mistGray : C.forest,
                          color: outOfStock ? C.muted : C.white,
                          cursor: outOfStock ? 'not-allowed' : 'pointer',
                        }}>
                        {outOfStock ? 'Out' : '+ Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Recent reviews ── */}
        {recent_reviews && recent_reviews.length > 0 && (
          <>
            <h2 style={{ ...S.sectionTitle, marginTop:48 }}>Recent reviews</h2>
            <div style={S.reviewsGrid}>
              {recent_reviews.map(r => (
                <div key={r.review_id} style={S.reviewCard}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <strong style={{ color:C.charcoal, fontSize:14 }}>{r.buyer_name}</strong>
                    <Stars value={r.rating} size={13}/>
                  </div>
                  <p style={{ color:C.muted, fontSize:11, margin:'0 0 8px' }}>
                    on <Link to={`/listings/${r.listing_id}`} style={{ color:C.moss, textDecoration:'none' }}>{r.listing_title}</Link>
                    {' · '}
                    {new Date(r.created_at).toLocaleDateString('en-AU')}
                  </p>
                  {r.comment && <p style={{ color:C.charcoal, fontSize:13, margin:0, lineHeight:1.5 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const S = {
  page:      { minHeight:'100vh', background:C.boneWhite, padding:'32px 20px 80px', fontFamily:"'Segoe UI',system-ui,sans-serif" },
  container: { maxWidth:1100, margin:'0 auto' },
  crumb:     { display:'inline-block', color:C.moss, textDecoration:'none', fontSize:13, fontWeight:600, marginBottom:18 },

  hero:      { display:'flex', gap:32, alignItems:'center', background:C.white, borderRadius:20, padding:24, boxShadow:'0 2px 16px rgba(37,53,40,0.06)', border:`1px solid ${C.mistGray}`, marginBottom:36, flexWrap:'wrap' },
  heroImageWrap: { width:220, height:220, flexShrink:0, borderRadius:16, overflow:'hidden', background:C.cream },
  heroImage:  { width:'100%', height:'100%', objectFit:'cover' },
  heroInfo:   { flex:1, minWidth:240 },
  heroEyebrow:{ fontSize:11, fontWeight:800, letterSpacing:2, color:C.moss, margin:'0 0 8px', textTransform:'uppercase' },
  heroTitle:  { fontSize:36, fontWeight:800, color:C.forest, margin:'0 0 14px', lineHeight:1.1 },
  heroStatsRow: { display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:12 },
  heroStat:   { display:'flex', alignItems:'center', gap:6 },
  heroStatVal: { fontSize:16, fontWeight:800, color:C.charcoal },
  heroStatLabel: { fontSize:12, color:C.muted },
  heroStatDiv: { width:1, height:18, background:C.mistGray },
  heroSince:  { fontSize:13, color:C.muted, margin:0 },

  sectionTitle: { fontSize:22, fontWeight:800, color:C.forest, margin:'0 0 18px' },

  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:18 },
  card:       { background:C.white, borderRadius:14, overflow:'hidden', border:`1px solid ${C.mistGray}`, boxShadow:'0 1px 6px rgba(37,53,40,0.04)', transition:'transform 0.15s, box-shadow 0.15s' },
  cardImgWrap:{ position:'relative', width:'100%', height:170, overflow:'hidden', cursor:'pointer', background:C.cream },
  cardImg:    { width:'100%', height:'100%', objectFit:'cover' },
  outBadge:   { position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:20 },
  cardBody:   { padding:'12px 14px 14px' },
  cardCat:    { fontSize:10, fontWeight:700, color:C.moss, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:1 },
  cardTitle:  { fontSize:15, fontWeight:700, color:C.charcoal, margin:'0 0 6px', lineHeight:1.25 },
  cardRating: { display:'flex', alignItems:'center', marginBottom:10 },
  cardFooter: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  cardPrice:  { fontSize:17, fontWeight:800, color:C.forest },
  cardUnit:   { fontSize:12, color:C.muted, marginLeft:2 },
  cardBtn:    { border:'none', padding:'7px 14px', borderRadius:8, fontWeight:700, fontSize:12, fontFamily:'inherit' },

  reviewsGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 },
  reviewCard: { background:C.white, borderRadius:12, padding:'14px 16px', border:`1px solid ${C.mistGray}`, boxShadow:'0 1px 4px rgba(0,0,0,0.03)' },

  emptyState: { color:C.muted, fontStyle:'italic', textAlign:'center', padding:40, background:C.white, borderRadius:14, border:`1px dashed ${C.mistGray}` },
  skeleton:   { background:`linear-gradient(90deg, ${C.mistGray} 0%, ${C.cream} 50%, ${C.mistGray} 100%)`, backgroundSize:'200% 100%', borderRadius:14, animation:'farmerShimmer 1.2s linear infinite' },
  backBtn:    { display:'inline-block', background:C.forest, color:C.white, padding:'12px 24px', borderRadius:10, textDecoration:'none', fontWeight:700 },
};