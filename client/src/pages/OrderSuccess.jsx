// pages/OrderSuccess.jsx
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function OrderSuccess() {
  const { id }  = useParams();
  const { user } = useAuth();
  const [order,  setOrder]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const GST_RATE   = 0.10;
  const total      = parseFloat(order?.total_amount || 0);
  const subtotal   = total / (1 + GST_RATE);
  const gst        = total - subtotal;

  const downloadReceipt = () => {
    const date = order?.created_at
      ? new Date(order.created_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })
      : new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>FarmMarket Receipt #${id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',sans-serif; color:#111; background:#fff; padding:40px; max-width:620px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #065F46; }
    .logo { font-size:22px; font-weight:800; color:#065F46; }
    .logo span { font-size:13px; font-weight:400; color:#6B7280; display:block; margin-top:4px; }
    .receipt-title { text-align:right; }
    .receipt-title h2 { font-size:18px; font-weight:700; color:#065F46; }
    .receipt-title p { font-size:12px; color:#6B7280; margin-top:4px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }
    .info-box h4 { font-size:11px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
    .info-box p { font-size:14px; color:#111; }
    .section-title { font-size:13px; font-weight:700; color:#065F46; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    th { text-align:left; font-size:11px; font-weight:700; color:#9CA3AF; text-transform:uppercase; padding:8px 0; border-bottom:1px solid #E5E7EB; }
    td { padding:10px 0; font-size:13px; border-bottom:1px solid #F3F4F6; }
    .totals { margin-left:auto; width:260px; }
    .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
    .total-row.final { font-size:16px; font-weight:800; color:#065F46; border-top:2px solid #065F46; margin-top:8px; padding-top:10px; }
    .gst-note { font-size:11px; color:#9CA3AF; text-align:right; margin-top:4px; }
    .footer { margin-top:36px; padding-top:20px; border-top:1px solid #E5E7EB; text-align:center; font-size:12px; color:#9CA3AF; line-height:1.8; }
    .badge { display:inline-block; background:#ECFDF5; color:#065F46; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🌿 FarmMarket<span>Australia's #1 Farm Marketplace</span></div>
    <div class="receipt-title">
      <h2>Tax Invoice / Receipt</h2>
      <p>Receipt #${id}</p>
      <p>${date}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h4>Bill To</h4>
      <p>${user?.full_name || 'Customer'}</p>
      <p>${user?.email || ''}</p>
      ${order?.delivery_address ? `<p>${order.delivery_address}</p>` : ''}
    </div>
    <div class="info-box">
      <h4>Order Details</h4>
      <p>Order #${id}</p>
      <p>Date: ${date}</p>
      <p>Status: ${order?.status || 'Confirmed'}</p>
      <p>Payment: Stripe (Secured)</p>
    </div>
  </div>

  <p class="section-title">Items Ordered</p>
  <table>
    <thead>
      <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
    </thead>
    <tbody>
      ${(order?.items || []).map(item => `
        <tr>
          <td>${item.title || item.product_name || 'Product'}</td>
          <td>${item.quantity} ${item.unit || 'kg'}</td>
          <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
          <td>$${(parseFloat(item.price || 0) * parseFloat(item.quantity || 1)).toFixed(2)}</td>
        </tr>
      `).join('') || `<tr><td colspan="4" style="color:#9CA3AF; padding:16px 0">Order #${id} — See order tracking for details</td></tr>`}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal (ex. GST)</span><span>$${subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span style="color:#6B7280">GST (10%)</span><span style="color:#6B7280">$${gst.toFixed(2)}</span></div>
    <div class="total-row"><span>Delivery</span><span style="color:#059669; font-weight:700">FREE</span></div>
    <div class="total-row final"><span>Total (inc. GST)</span><span>$${total.toFixed(2)} AUD</span></div>
    <p class="gst-note">🇦🇺 ABN: Includes 10% Australian GST</p>
  </div>

  <div class="footer">
    <div class="badge">✅ Payment Confirmed via Stripe</div><br/>
    FarmMarket — CPRO306 Capstone Project — Kent Institute Australia<br/>
    Support: ALS_MELB@kent.edu.au<br/>
    This is an official tax invoice. Please retain for your records.
  </div>
</body>
</html>`;

    const blob   = new Blob([html], { type: 'text/html' });
    const url    = URL.createObjectURL(blob);
    const link   = document.createElement('a');
    link.href    = url;
    link.download = `FarmMarket-Receipt-${id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Success icon */}
        <div style={S.iconWrap}>✅</div>
        <h1 style={S.title}>Order Placed Successfully!</h1>
        <p style={S.sub}>Thank you for shopping with FarmMarket 🌿</p>

        {/* Order number */}
        <div style={S.orderBox}>
          <p style={S.orderLabel}>Order Number</p>
          <p style={S.orderNum}>#{id}</p>
          {order && (
            <p style={{ fontSize:12, color:'#059669', marginTop:4 }}>
              {new Date(order.created_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          )}
        </div>

        {/* Progress steps */}
        <div style={S.steps}>
          {[
            { icon:'✅', label:'Order Confirmed' },
            { icon:'📦', label:'Being Packed' },
            { icon:'🚚', label:'Out for Delivery' },
            { icon:'🏠', label:'Delivered' },
          ].map((s, i) => (
            <div key={i} style={S.step}>
              <div style={{ ...S.stepCircle, ...(i === 0 ? S.stepActive : {}) }}>{s.icon}</div>
              <p style={{ fontSize:11, color: i===0?'#065F46':'#aaa', fontWeight: i===0?700:400 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* GST Summary */}
        {!loading && (
          <div style={S.receiptBox}>
            <p style={S.receiptTitle}>🧾 Payment Summary</p>
            <div style={S.receiptRow}>
              <span style={S.receiptLabel}>Subtotal (ex. GST)</span>
              <span style={S.receiptVal}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={{ ...S.receiptLabel, color:'#9CA3AF' }}>GST (10%)</span>
              <span style={{ ...S.receiptVal, color:'#9CA3AF' }}>+${gst.toFixed(2)}</span>
            </div>
            <div style={S.receiptRow}>
              <span style={S.receiptLabel}>Delivery</span>
              <span style={{ ...S.receiptVal, color:'#059669', fontWeight:700 }}>FREE</span>
            </div>
            <div style={{ ...S.receiptRow, borderTop:'1.5px solid #D1FAE5', marginTop:8, paddingTop:10 }}>
              <span style={{ fontWeight:800, fontSize:15, color:'#065F46' }}>Total (inc. GST)</span>
              <span style={{ fontWeight:900, fontSize:17, color:'#065F46' }}>${total.toFixed(2)} AUD</span>
            </div>
            <p style={{ fontSize:11, color:'#9CA3AF', textAlign:'right', marginTop:4 }}>🇦🇺 Includes Australian GST (10%)</p>
          </div>
        )}

        <p style={S.note}>
          Your fresh produce is being prepared by the farmer. You'll receive updates as your order progresses. 🌱
        </p>

        {/* Action buttons */}
        <div style={S.btnRow}>
          <Link to="/" style={S.primaryBtn}>🏠 Back to Home</Link>
          <Link to={`/orders/${id}/track`} style={S.outlineBtn}>📍 Track Order</Link>
        </div>

        {/* Download Receipt */}
        <button onClick={downloadReceipt} style={S.downloadBtn}>
          🧾 Download Tax Invoice / Receipt
        </button>
        <p style={{ fontSize:11, color:'#9CA3AF', marginTop:6 }}>
          HTML receipt · Opens in browser · Print as PDF
        </p>

      </div>
    </div>
  );
}

const S = {
  page:        { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'linear-gradient(135deg,#F0FDF4,#DCFCE7,#F0FDF4)' },
  card:        { maxWidth:540, width:'100%', padding:40, textAlign:'center', background:'#fff', borderRadius:20, boxShadow:'0 8px 32px rgba(6,95,70,0.12)', border:'1px solid #D1FAE5' },
  iconWrap:    { fontSize:64, marginBottom:16 },
  title:       { fontSize:26, fontWeight:800, color:'#065F46', marginBottom:8 },
  sub:         { color:'#6B7280', fontSize:15, marginBottom:24 },
  orderBox:    { background:'#ECFDF5', borderRadius:12, padding:'14px 20px', marginBottom:24, border:'1px solid #A7F3D0' },
  orderLabel:  { fontSize:12, color:'#9CA3AF', marginBottom:4 },
  orderNum:    { fontSize:24, fontWeight:900, color:'#065F46' },
  steps:       { display:'flex', justifyContent:'space-between', marginBottom:24, position:'relative' },
  step:        { display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 },
  stepCircle:  { width:44, height:44, borderRadius:'50%', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 },
  stepActive:  { background:'#ECFDF5', border:'2px solid #065F46' },
  receiptBox:  { background:'#F9FAFB', borderRadius:12, padding:'16px 20px', marginBottom:20, border:'1px solid #E5E7EB', textAlign:'left' },
  receiptTitle:{ fontWeight:700, fontSize:14, color:'#065F46', marginBottom:10 },
  receiptRow:  { display:'flex', justifyContent:'space-between', padding:'5px 0' },
  receiptLabel:{ fontSize:13, color:'#374151' },
  receiptVal:  { fontSize:13, fontWeight:600, color:'#111827' },
  note:        { background:'#F0FDF4', borderRadius:10, padding:14, fontSize:13, color:'#374151', lineHeight:1.6, marginBottom:20 },
  btnRow:      { display:'flex', gap:12, marginBottom:12 },
  primaryBtn:  { flex:1, textAlign:'center', padding:'13px', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', borderRadius:12, fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 4px 14px rgba(5,150,105,0.3)' },
  outlineBtn:  { flex:1, textAlign:'center', padding:'13px', border:'1.5px solid #A7F3D0', color:'#065F46', borderRadius:12, fontWeight:700, fontSize:14, textDecoration:'none' },
  downloadBtn: { width:'100%', padding:'13px', background:'#fff', border:'1.5px solid #065F46', color:'#065F46', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
};