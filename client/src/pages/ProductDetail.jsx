// pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function ProductDetail() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [listing, setListing]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [qty,     setQty]       = useState(1);
  const [added,   setAdded]     = useState(false);
  const [review,  setReview]    = useState({ rating: 5, comment: '' });
  const [revMsg,  setRevMsg]    = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/listings/${id}`)
      .then(r => { setListing(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
    api.get(`/listings/${id}/reviews`)
      .then(r => setReviews(r.data))
      .catch(() => {});
  }, [id]);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(listing);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/listings/${id}/reviews`, review);
      setRevMsg('✅ Review submitted!');
      const r = await api.get(`/listings/${id}/reviews`);
      setReviews(r.data);
    } catch (err) {
      setRevMsg(err.response?.data?.message || 'Error submitting review.');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ fontSize: 40 }}>😕</p>
      <h2>Product not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/listings')} style={{ marginTop: 16 }}>
        Back to Browse
      </button>
    </div>
  );

  const stars     = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));
  const imgSrc = listing.image_url
    ? (listing.image_url.startsWith('http')
        ? listing.image_url
        : `${API_URL}${listing.image_url}`)
    : `https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600`;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 50%,#F0FDF4 100%)', padding:'32px 20px' }}>
    <div className="container">

      {/* Back */}
      <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>

      {/* Main layout */}
      <div style={styles.layout}>

        {/* LEFT — Image */}
        <div style={styles.imageSection}>
          <img
            src={imgSrc}
            alt={listing.title}
            style={styles.image}
            onError={e => { e.target.src = `https://via.placeholder.com/600x400?text=Fresh+Produce`; }}
          />
          <span style={styles.catBadge}>{listing.category_name}</span>
        </div>

        {/* RIGHT — Details */}
        <div style={styles.infoSection}>
          <h1 style={styles.title}>{listing.title}</h1>

          {/* Farmer info */}
          <div style={styles.farmerRow}>
            <span style={styles.farmerAvatar}>🌾</span>
            <div>
              <p style={styles.farmerName}>{listing.farmer_name}</p>
              {listing.location && <p style={styles.location}>📍 {listing.location}</p>}
            </div>
          </div>

          {/* Rating */}
          <div style={styles.ratingRow}>
            <span className="stars" style={{ fontSize: 20 }}>{stars(listing.avg_rating)}</span>
            <span style={{ color: '#888', fontSize: 14 }}>
              {Number(listing.avg_rating || 0).toFixed(1)} ({reviews.length} reviews)
            </span>
          </div>

          {/* Price */}
          <div style={styles.priceBox}>
            <span style={styles.price}>${Number(listing.price).toFixed(2)}</span>
            <span style={styles.unit}> per {listing.unit || 'kg'}</span>
          </div>

          {/* Stock */}
          <p style={{ fontSize: 14, color: listing.quantity > 0 ? '#2E7D32' : '#c62828', marginBottom: 16 }}>
            {listing.quantity > 0 ? `✅ ${listing.quantity} ${listing.unit} available` : '❌ Out of stock'}
          </p>

          {/* Description */}
          {listing.description && (
            <div style={styles.descBox}>
              <h3 style={styles.descTitle}>About this product</h3>
              <p style={styles.desc}>{listing.description}</p>
            </div>
          )}

          {/* Quantity selector */}
          {listing.quantity > 0 && (
            <>
              <div style={styles.qtyRow}>
                <label style={{ fontWeight: 600, fontSize: 15, color: '#065F46' }}>Quantity:</label>
                <div style={styles.qtyControls}>
                  <button style={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span style={styles.qtyNum}>{qty}</span>
                  <button style={styles.qtyBtn} onClick={() => setQty(q => Math.min(listing.quantity, q + 1))}>+</button>
                </div>
                <span style={{ color: '#374151', fontSize: 13, fontWeight:600 }}>
                  Total: <strong style={{ color: '#065F46' }}>${(listing.price * qty).toFixed(2)}</strong>
                </span>
              </div>

              {/* Action buttons */}
              <div style={styles.btnRow}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: 14, fontSize: 16 }}
                  onClick={handleAddToCart}
                >
                  {added ? '✅ Added to Cart!' : '🛒 Add to Cart'}
                </button>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, padding: 14, fontSize: 16 }}
                  onClick={handleBuyNow}
                >
                  ⚡ Buy Now
                </button>
              </div>
            </>
          )}

          {/* Info tags */}
          <div style={styles.tags}>
            <span style={styles.tag}>🌱 Locally Grown</span>
            <span style={styles.tag}>🚜 Direct from Farm</span>
            <span style={styles.tag}>✅ Quality Assured</span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={styles.reviewSection}>
        <h2 style={styles.reviewTitle}>Customer Reviews ({reviews.length})</h2>

        {/* Review list */}
        {reviews.length === 0 ? (
          <p style={{ color: '#6B7280', marginBottom: 24 }}>No reviews yet — be the first!</p>
        ) : (
          <div style={styles.reviewGrid}>
            {reviews.map(r => (
              <div key={r.review_id} className="card" style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewAvatar}>{r.buyer_name?.[0] || 'B'}</div>
                  <div>
                    <p style={styles.reviewName}>
                      {r.buyer_name?.split(' ')[0]} {r.buyer_name?.split(' ')[1]?.[0]}.
                    </p>
                    <span className="stars" style={{ fontSize: 13 }}>{stars(r.rating)}</span>
                  </div>
                  <span style={styles.reviewDate}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p style={styles.reviewComment}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Write a review */}
        {user && user.role === 'buyer' && (
          <div style={styles.writeReview}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: '#1B5E20' }}>
              Write a Review
            </h3>
            {revMsg && (
              <div className={`alert ${revMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                {revMsg}
              </div>
            )}
            <form onSubmit={submitReview}>
              <div className="form-group">
                <label>Your Rating</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button"
                      style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
                               color: n <= review.rating ? '#FFA000' : '#ddd' }}
                      onClick={() => setReview(r => ({ ...r, rating: n }))}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Your Comment</label>
                <textarea
                  placeholder="Share your experience with this product..."
                  value={review.comment}
                  onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary">Submit Review</button>
            </form>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

const styles = {
  back:          { background: 'none', border: 'none', color: '#2E7D32', fontSize: 15, cursor: 'pointer', fontWeight: 600, marginBottom: 20, padding: 0 },
  layout:        { display: 'flex', gap: 40, marginBottom: 48, flexWrap: 'wrap' },
  imageSection:  { flex: '0 0 480px', position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', background: '#f0f0f0', maxWidth: '100%' },
  image:         { width: '100%', height: 400, objectFit: 'cover', display: 'block' },
  catBadge:      { position: 'absolute', top: 16, left: 16, background: 'rgba(46,125,50,0.9)', color: '#fff', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  infoSection:   { flex: 1, minWidth: 280 },
  title:         { fontSize: 30, fontWeight: 700, color: '#1B5E20', marginBottom: 16, lineHeight: 1.2 },
  farmerRow:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, background: '#fff', padding: '10px 14px', borderRadius: 12, border: '1px solid #D1FAE5', boxShadow: '0 1px 4px rgba(6,95,70,0.06)' },
  farmerAvatar:  { fontSize: 28 },
  farmerName:    { fontWeight: 600, fontSize: 15, color: '#111827' },
  location:      { fontSize: 13, color: '#6B7280', marginTop: 2 },
  ratingRow:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  priceBox:      { background: '#fff', padding: '14px 20px', borderRadius: 12, marginBottom: 12, display: 'inline-block', border: '1px solid #A7F3D0', boxShadow: '0 2px 8px rgba(6,95,70,0.08)' },
  price:         { fontSize: 34, fontWeight: 800, color: '#1B5E20' },
  unit:          { fontSize: 16, color: '#4CAF50' },
  descBox:       { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #D1FAE5', boxShadow: '0 1px 4px rgba(6,95,70,0.06)' },
  descTitle:     { fontWeight: 700, fontSize: 15, color: '#1B5E20', marginBottom: 8 },
  desc:          { fontSize: 15, color: '#1F2937', lineHeight: 1.7 },
  qtyRow:        { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  qtyControls:   { display: 'flex', alignItems: 'center', gap: 10 },
  qtyBtn:        { width: 36, height: 36, border: '2px solid #2E7D32', borderRadius: 8, background: '#fff', color: '#2E7D32', fontSize: 20, fontWeight: 700, cursor: 'pointer' },
  qtyNum:        { fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'center', color: '#111827' },
  btnRow:        { display: 'flex', gap: 12, marginBottom: 20 },
  tags:          { display: 'flex', gap: 10, flexWrap: 'wrap' },
  tag:           { background: '#E8F5E9', color: '#2E7D32', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 },
  reviewSection: { borderTop: '2px solid #E8F5E9', paddingTop: 32 },
  reviewTitle:   { fontSize: 22, fontWeight: 700, color: '#1B5E20', marginBottom: 20 },
  reviewGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 },
  reviewCard:    { padding: 16 },
  reviewHeader:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  reviewAvatar:  { width: 40, height: 40, borderRadius: '50%', background: '#2E7D32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  reviewName:    { fontWeight: 600, fontSize: 14 },
  reviewDate:    { marginLeft: 'auto', fontSize: 12, color: '#aaa' },
  reviewComment: { fontSize: 14, color: '#555', lineHeight: 1.6 },
  writeReview:   { background: '#fff', borderRadius: 14, padding: 24, maxWidth: 560, border: '1px solid #D1FAE5', boxShadow: '0 1px 4px rgba(6,95,70,0.06)' },
};