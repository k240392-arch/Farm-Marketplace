// pages/Cart.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const GST_RATE = 0.10; // 10% Australian GST

export default function Cart() {
  const { cart, updateQty, removeFromCart, cartTotal, clearCart } = useCart();

  const subtotal    = cartTotal;
  const gstAmount   = subtotal * GST_RATE;
  const totalWithGST = subtotal + gstAmount;

  if (cart.length === 0) return (
    <div style={S.emptyPage}>
      <div style={S.emptyCard}>
        <p style={{ fontSize:64, margin:'0 0 16px' }}>🛒</p>
        <h2 style={{ color:'#065F46', fontSize:24, fontWeight:800, margin:'0 0 8px' }}>Your cart is empty</h2>
        <p style={{ color:'#6B7280', marginBottom:28, fontSize:15 }}>Browse fresh produce from local Australian farmers.</p>
        <Link to="/listings" style={S.browseBtn}>Browse Produce →</Link>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* Header */}
        <div style={S.pageHeader}>
          <h1 style={S.pageTitle}>🛒 Your Cart</h1>
          <span style={S.itemCount}>{cart.reduce((a,i)=>a+i.qty,0)} items</span>
        </div>

        <div style={S.layout}>

          {/* ── Cart Items ── */}
          <div style={{ flex:1, minWidth:0 }}>
            {cart.map(item => (
              <div key={item.listing_id} style={S.itemCard}>
                <img
                  src={
                    item.image_url && item.image_url.startsWith('http')
                      ? item.image_url
                      : item.image_url && item.image_url.startsWith('/')
                      ? `http://localhost:5001${item.image_url}`
                      : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200'
                  }
                  alt={item.title}
                  style={S.itemImg}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200'; }}
                />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={S.itemTitle}>{item.title}</p>
                  <p style={S.itemFarmer}>by {item.farmer_name}</p>
                  <p style={S.itemPrice}>${Number(item.price).toFixed(2)} / {item.unit || 'kg'}</p>
                  <p style={S.itemGST}>incl. GST ${(item.price * item.qty * GST_RATE).toFixed(2)}</p>
                </div>
                <div style={S.qtyControl}>
                  <button style={S.qtyBtn} onClick={() => updateQty(item.listing_id, item.qty - 1)}>−</button>
                  <span style={S.qtyNum}>{item.qty}</span>
                  <button style={S.qtyBtn} onClick={() => updateQty(item.listing_id, item.qty + 1)}>+</button>
                </div>
                <div style={{ textAlign:'right', minWidth:90 }}>
                  <p style={S.lineTotal}>${(item.price * item.qty).toFixed(2)}</p>
                  <p style={S.lineSub}>ex. GST</p>
                  <button style={S.removeBtn} onClick={() => removeFromCart(item.listing_id)}>✕ Remove</button>
                </div>
              </div>
            ))}

            <button onClick={clearCart} style={S.clearBtn}>🗑 Clear Cart</button>
          </div>

          {/* ── Order Summary ── */}
          <div style={S.summaryCard}>
            <h3 style={S.summaryTitle}>Order Summary</h3>

            {/* Item breakdown */}
            <div style={S.summarySection}>
              {cart.map(item => (
                <div key={item.listing_id} style={S.summaryRow}>
                  <span style={S.summaryLabel}>{item.title} × {item.qty}</span>
                  <span style={S.summaryValue}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={S.divider}/>

            {/* Tax breakdown */}
            <div style={S.taxSection}>
              <div style={S.summaryRow}>
                <span style={S.summaryLabel}>Subtotal (ex. GST)</span>
                <span style={S.summaryValue}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={S.summaryRow}>
                <span style={{ ...S.summaryLabel, color:'#6B7280' }}>GST (10%)</span>
                <span style={{ ...S.summaryValue, color:'#6B7280' }}>+${gstAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={S.divider}/>

            {/* Total */}
            <div style={S.totalRow}>
              <span style={S.totalLabel}>Total (inc. GST)</span>
              <span style={S.totalAmount}>${totalWithGST.toFixed(2)} AUD</span>
            </div>

            <p style={S.gstNote}>🇦🇺 All prices include Australian GST (10%)</p>

            <Link to="/checkout" style={S.checkoutBtn}>
              Proceed to Checkout →
            </Link>
            <Link to="/listings" style={S.continueLink}>← Continue Shopping</Link>

            {/* Trust badges */}
            <div style={S.trustRow}>
              {['🔒 Secure','💳 Stripe','✅ Verified'].map(b => (
                <span key={b} style={S.trustBadge}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:         { minHeight:'100vh', background:'linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 50%,#F0FDF4 100%)', padding:'40px 20px', fontFamily:"'Segoe UI',system-ui,sans-serif" },
  container:    { maxWidth:1100, margin:'0 auto' },
  pageHeader:   { display:'flex', alignItems:'center', gap:14, marginBottom:28 },
  pageTitle:    { fontSize:28, fontWeight:800, color:'#065F46', margin:0 },
  itemCount:    { background:'#ECFDF5', color:'#059669', fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20, border:'1px solid #A7F3D0' },
  layout:       { display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' },

  // Item card
  itemCard:     { display:'flex', alignItems:'center', gap:16, padding:'18px 20px', marginBottom:12, background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(6,95,70,0.08)', border:'1px solid #E7F9EE' },
  itemImg:      { width:88, height:88, objectFit:'cover', borderRadius:12, flexShrink:0 },
  itemTitle:    { fontWeight:700, fontSize:15, color:'#111827', margin:'0 0 3px' },
  itemFarmer:   { fontSize:12, color:'#9CA3AF', margin:'0 0 4px' },
  itemPrice:    { fontSize:13, color:'#059669', fontWeight:700, margin:'0 0 2px' },
  itemGST:      { fontSize:11, color:'#9CA3AF', margin:0 },
  qtyControl:   { display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  qtyBtn:       { width:34, height:34, border:'1.5px solid #D1FAE5', borderRadius:8, background:'#F0FDF4', cursor:'pointer', fontSize:18, fontWeight:700, color:'#059669', display:'flex', alignItems:'center', justifyContent:'center' },
  qtyNum:       { fontWeight:800, fontSize:16, minWidth:28, textAlign:'center', color:'#111827' },
  lineTotal:    { fontWeight:800, fontSize:16, color:'#065F46', margin:'0 0 2px' },
  lineSub:      { fontSize:10, color:'#9CA3AF', margin:'0 0 6px' },
  removeBtn:    { fontSize:11, color:'#DC2626', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:0 },
  clearBtn:     { marginTop:8, background:'none', border:'1.5px solid #E5E7EB', color:'#6B7280', padding:'8px 18px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 },

  // Summary card
  summaryCard:  { width:320, flexShrink:0, background:'#fff', borderRadius:20, boxShadow:'0 4px 24px rgba(6,95,70,0.12)', border:'1px solid #D1FAE5', padding:24, position:'sticky', top:20 },
  summaryTitle: { fontWeight:800, fontSize:18, color:'#065F46', margin:'0 0 18px' },
  summarySection:{ display:'flex', flexDirection:'column', gap:8 },
  summaryRow:   { display:'flex', justifyContent:'space-between', alignItems:'center' },
  summaryLabel: { fontSize:13, color:'#374151' },
  summaryValue: { fontSize:13, fontWeight:600, color:'#111827' },
  taxSection:   { display:'flex', flexDirection:'column', gap:8 },
  divider:      { borderTop:'1px dashed #E5E7EB', margin:'14px 0' },
  totalRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', margin:'4px 0 8px' },
  totalLabel:   { fontSize:16, fontWeight:700, color:'#111827' },
  totalAmount:  { fontSize:20, fontWeight:900, color:'#065F46' },
  gstNote:      { fontSize:11, color:'#9CA3AF', textAlign:'center', margin:'0 0 16px' },
  checkoutBtn:  { display:'block', width:'100%', textAlign:'center', padding:'14px', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', borderRadius:12, fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:'0 4px 14px rgba(5,150,105,0.35)', boxSizing:'border-box', marginBottom:10 },
  continueLink: { display:'block', textAlign:'center', color:'#6B7280', fontSize:13, textDecoration:'none', marginBottom:16 },
  trustRow:     { display:'flex', gap:6, justifyContent:'center', paddingTop:14, borderTop:'1px solid #F3F4F6' },
  trustBadge:   { fontSize:11, color:'#6B7280', background:'#F9FAFB', padding:'3px 9px', borderRadius:20, border:'1px solid #F3F4F6' },

  // Empty state
  emptyPage:    { minHeight:'100vh', background:'linear-gradient(135deg,#F0FDF4,#DCFCE7,#F0FDF4)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  emptyCard:    { background:'#fff', borderRadius:24, padding:'56px 48px', textAlign:'center', boxShadow:'0 8px 32px rgba(6,95,70,0.12)', border:'1px solid #D1FAE5' },
  browseBtn:    { display:'inline-block', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', padding:'13px 28px', borderRadius:12, fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:'0 4px 14px rgba(5,150,105,0.3)' },
};