// pages/Checkout.jsx
// Full 2-step checkout: Step 1 = Delivery Details + Time Window, Step 2 = Stripe Payment
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51TE94nBl1cukRgBPWYVFB2h0mz8ht4bGk3HcaOqZ00ACnFlVKZZk2aNcZBojsPAMF6rWQMmqF2VPAam4ruXPY3fT00cqbPMV4C');

const TIME_SLOTS = [
  { id: 'morning',   icon: '🌅', label: 'Morning',   sub: '7am – 12pm',  desc: 'Early delivery before midday' },
  { id: 'afternoon', icon: '☀️', label: 'Afternoon', sub: '12pm – 5pm', desc: 'Midday to late afternoon' },
  { id: 'evening',   icon: '🌆', label: 'Evening',   sub: '5pm – 8pm',  desc: 'After work delivery' },
  { id: 'flexible',  icon: '🕐', label: 'Flexible',  sub: 'Anytime',    desc: 'Any time works for me' },
];

function StepIndicator({ step }) {
  return (
    <div style={s.steps}>
      {[{num:1,label:'Delivery Details'},{num:2,label:'Payment'},{num:3,label:'Confirmation'}].map((st,i) => (
        <div key={st.num} style={s.stepWrap}>
          <div style={{...s.stepCircle,background:step>=st.num?'#2E7D32':'#E0E0E0',color:step>=st.num?'#fff':'#888'}}>
            {step > st.num ? '✓' : st.num}
          </div>
          <span style={{...s.stepLabel,color:step>=st.num?'#1B5E20':'#888',fontWeight:step===st.num?700:400}}>
            {st.label}
          </span>
          {i < 2 && <div style={{...s.stepLine,background:step>st.num?'#2E7D32':'#E0E0E0'}}/>}
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ cartItems = [] }) {
  // Cart items use `qty` (cart count). `quantity` is the listing's stock level — DO NOT use for cart math.
  const getQty = (item) => Number(item.qty ?? item.quantity ?? 1);
  const subtotal     = cartItems.reduce((sum, item) => sum + item.price * getQty(item), 0);
  const gstAmount    = subtotal * 0.10;
  const totalWithGST = subtotal + gstAmount;
  return (
    <div style={s.summaryBox}>
      <h3 style={s.summaryTitle}>🛒 Order Summary</h3>
      <div style={s.summaryItems}>
        {cartItems.map((item, i) => (
          <div key={i} style={s.summaryItem}>
            <div style={s.summaryImg}>
              {item.image_url
                ? <img src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5001${item.image_url}`}
                    alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}}
                    onError={e=>{e.target.style.display='none';}}/>
                : <span style={{fontSize:20}}>🌿</span>}
            </div>
            <div style={s.summaryItemInfo}>
              <p style={s.summaryItemName}>{item.title}</p>
              <p style={s.summaryItemQty}>Qty: {getQty(item)} {item.unit}</p>
            </div>
            <p style={s.summaryItemPrice}>${(item.price * getQty(item)).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div style={s.summaryDivider}/>
      <div style={s.summaryRow}>
        <span style={s.summaryRowLabel}>Subtotal (ex. GST)</span>
        <span style={s.summaryRowVal}>${subtotal.toFixed(2)}</span>
      </div>
      <div style={s.summaryRow}>
        <span style={{...s.summaryRowLabel, color:'#6B7280'}}>GST (10%)</span>
        <span style={{...s.summaryRowVal, color:'#6B7280'}}>+${gstAmount.toFixed(2)}</span>
      </div>
      <div style={s.summaryRow}>
        <span style={s.summaryRowLabel}>Delivery</span>
        <span style={{...s.summaryRowVal,color:'#2E7D32',fontWeight:700}}>FREE</span>
      </div>
      <div style={s.summaryDivider}/>
      <div style={{...s.summaryRow,marginTop:8}}>
        <span style={{...s.summaryRowLabel,fontWeight:700,fontSize:16,color:'#1B5E20'}}>Total (inc. GST)</span>
        <span style={{...s.summaryRowVal,fontWeight:900,fontSize:18,color:'#1B5E20'}}>${totalWithGST.toFixed(2)}</span>
      </div>
      <p style={{fontSize:11,color:'#9CA3AF',textAlign:'center',margin:'6px 0 8px'}}>🇦🇺 Includes Australian GST (10%)</p>
      <div style={s.stripeBadge}>🔒 Secure Stripe Payment — PCI-DSS Level 1</div>
    </div>
  );
}

function DeliveryStep({ address, setAddress, deliveryTime, setDeliveryTime, onNext }) {
  const [error, setError] = useState('');
  const handleNext = () => {
    if (!address.trim()) { setError('Please enter your delivery address.'); return; }
    if (!deliveryTime)   { setError('Please select a delivery time window.'); return; }
    setError(''); onNext();
  };
  return (
    <div style={s.stepCard}>
      <h2 style={s.stepCardTitle}>📍 Step 1 — Delivery Details</h2>
      <div style={s.formGroup}>
        <label style={s.formLabel}>Delivery Address <span style={{color:'#E53935'}}>*</span></label>
        <textarea style={s.textarea} rows={3}
          placeholder="Enter your full delivery address (street, suburb, state, postcode)..."
          value={address} onChange={e => setAddress(e.target.value)}/>
      </div>
      <div style={s.formGroup}>
        <label style={s.formLabel}>Preferred Delivery Time Window <span style={{color:'#E53935'}}>*</span></label>
        <p style={s.formHelper}>Choose when you'd like your fresh produce delivered</p>
        <div style={s.timeGrid}>
          {TIME_SLOTS.map(slot => {
            const active = deliveryTime === slot.id;
            return (
              <button key={slot.id} type="button" onClick={() => setDeliveryTime(slot.id)} style={{
                ...s.timeCard,
                background: active ? '#E8F5E9' : '#FAFAFA',
                border:     active ? '2px solid #2E7D32' : '2px solid #E0E0E0',
                boxShadow:  active ? '0 0 0 3px rgba(46,125,50,0.12)' : 'none',
                transform:  active ? 'translateY(-2px)' : 'none',
              }}>
                <span style={s.timeIcon}>{slot.icon}</span>
                <span style={{...s.timeLabel,color:active?'#1B5E20':'#333'}}>{slot.label}</span>
                <span style={s.timeSub}>{slot.sub}</span>
                <span style={{...s.timeDesc,color:active?'#4CAF50':'#999'}}>{slot.desc}</span>
                {active && <span style={s.timeCheck}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p style={s.errorMsg}>⚠️ {error}</p>}
      <button style={s.nextBtn} onClick={handleNext}>Continue to Payment →</button>
    </div>
  );
}

function PaymentForm({ address, deliveryTime, onBack, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const cartCtx  = useCart();
  const cartItems = cartCtx.cartItems || cartCtx.cart || cartCtx.items || [];
  const clearCart = cartCtx.clearCart || cartCtx.clear || (()=>{});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const selectedSlot = TIME_SLOTS.find(sl => sl.id === deliveryTime);
  // Cart items use `qty` (cart count). `quantity` is the listing's stock — DO NOT use for cart math.
  const getQty       = (item) => Number(item.qty ?? item.quantity ?? 1);
  const subtotal     = cartItems.reduce((sum, item) => sum + item.price * getQty(item), 0);
  const gstAmount    = subtotal * 0.10;
  const totalWithGST = subtotal + gstAmount;

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/payments/create-intent', {
        amount: Math.round(totalWithGST * 100),
      });
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );
      if (stripeErr) { setError(stripeErr.message); setLoading(false); return; }
      const { data: order } = await api.post('/orders', {
        items:             cartItems.map(item => ({ listing_id: item.listing_id, quantity: getQty(item), unit_price: item.price })),
        total_amount:      subtotal,
        delivery_address:  address,
        delivery_time:     deliveryTime,
        stripe_payment_id: paymentIntent.id,
      });
      clearCart();
      onSuccess(order.order_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={s.stepCard}>
      <h2 style={s.stepCardTitle}>💳 Step 2 — Secure Payment</h2>
      <div style={s.recapBox}>
        <p style={s.recapRow}><strong>📍 Delivering to:</strong> {address}</p>
        <p style={s.recapRow}><strong>🕐 Time window:</strong>&nbsp;{selectedSlot?.icon} {selectedSlot?.label} ({selectedSlot?.sub})</p>
        <button style={s.changeBtn} onClick={onBack}>✏️ Change details</button>
      </div>
      <form onSubmit={handlePay}>
        <div style={s.formGroup}>
          <label style={s.formLabel}>Card Details</label>
          <div style={s.cardBox}>
            <CardElement options={{
              hidePostalCode: true,
              style: {
                base: { fontSize:'15px', color:'#333', fontFamily:'Arial,sans-serif', '::placeholder':{ color:'#aaa' } },
                invalid: { color:'#E53935' },
              },
            }}/>
          </div>
          <p style={s.testCard}>🧪 Test card: 4242 4242 4242 4242 — Exp: 12/29 — CVV: 123</p>
        </div>
        {error && <p style={s.errorMsg}>⚠️ {error}</p>}
        <div style={s.payRow}>
          <button type="button" style={s.backBtn} onClick={onBack}>← Back</button>
          <button type="submit" disabled={loading || !stripe}
            style={{...s.payBtn, opacity:loading?0.7:1, cursor:loading?'not-allowed':'pointer'}}>
            {loading ? '⏳ Processing...' : `🔒 Pay $${subtotal.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Checkout() {
  const cartCtx   = useCart();
  const cartItems = cartCtx.cartItems || cartCtx.cart || cartCtx.items || [];
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [step,         setStep]         = useState(1);
  const [address,      setAddress]      = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  useEffect(() => {
    if (!user)                       navigate('/login');
    else if (cartItems.length === 0) navigate('/cart');
  }, [user, cartItems]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div className="container">
          <h1 style={s.headerTitle}>Secure Checkout</h1>
          <p style={s.headerSub}>Your order is protected by Stripe PCI-DSS Level 1 encryption</p>
        </div>
      </div>
      <div className="container">
        <StepIndicator step={step} />
        <div style={s.layout}>
          <div style={s.left}>
            {step === 1 && (
              <DeliveryStep
                address={address} setAddress={setAddress}
                deliveryTime={deliveryTime} setDeliveryTime={setDeliveryTime}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  address={address} deliveryTime={deliveryTime}
                  onBack={() => setStep(1)}
                  onSuccess={(id) => navigate(`/order-success/${id}`)}
                />
              </Elements>
            )}
          </div>
          <div style={s.right}>
            <OrderSummary cartItems={cartItems} />
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:           { background: '#f8faf5', minHeight: '100vh', paddingBottom: 60 },
  header:         { background: '#1B5E20', padding: '32px 0 24px' },
  headerTitle:    { fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 },
  headerSub:      { color: '#A5D6A7', fontSize: 14, marginTop: 6 },
  steps:          { display: 'flex', alignItems: 'center', padding: '28px 0 8px', gap: 0 },
  stepWrap:       { display: 'flex', alignItems: 'center', gap: 8 },
  stepCircle:     { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  stepLabel:      { fontSize: 13, whiteSpace: 'nowrap' },
  stepLine:       { width: 80, height: 2, margin: '0 8px', flexShrink: 0 },
  layout:         { display: 'flex', gap: 28, alignItems: 'flex-start', marginTop: 16 },
  left:           { flex: 1, minWidth: 0 },
  right:          { width: 360, flexShrink: 0 },
  stepCard:       { background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20 },
  stepCardTitle:  { fontSize: 20, fontWeight: 800, color: '#1B5E20', marginBottom: 24 },
  formGroup:      { marginBottom: 24 },
  formLabel:      { display: 'block', fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 8 },
  formHelper:     { fontSize: 12, color: '#888', marginBottom: 12, marginTop: -4 },
  textarea:       { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 },
  timeGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  timeCard:       { padding: '16px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', transition: 'all 0.18s ease' },
  timeIcon:       { fontSize: 26, marginBottom: 2 },
  timeLabel:      { fontSize: 15, fontWeight: 700 },
  timeSub:        { fontSize: 12, color: '#666', fontWeight: 600 },
  timeDesc:       { fontSize: 11, marginTop: 2 },
  timeCheck:      { position: 'absolute', top: 10, right: 12, width: 22, height: 22, borderRadius: '50%', background: '#2E7D32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 },
  nextBtn:        { width: '100%', padding: '14px', background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  backBtn:        { padding: '12px 20px', background: '#F5F5F5', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#555', cursor: 'pointer' },
  payBtn:         { flex: 1, padding: '14px', background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, marginLeft: 12 },
  payRow:         { display: 'flex', alignItems: 'center', marginTop: 16 },
  changeBtn:      { background: 'none', border: '1px solid #A5D6A7', borderRadius: 6, color: '#2E7D32', fontSize: 12, cursor: 'pointer', padding: '4px 10px', marginTop: 8 },
  errorMsg:       { color: '#C62828', fontSize: 13, background: '#FFEBEE', padding: '10px 14px', borderRadius: 8, marginBottom: 12 },
  recapBox:       { background: '#F1F8E9', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid #C8E6C9' },
  recapRow:       { fontSize: 13, color: '#333', marginBottom: 6, lineHeight: 1.5 },
  cardBox:        { border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '14px 16px', background: '#FAFAFA' },
  testCard:       { fontSize: 11, color: '#888', marginTop: 8, fontStyle: 'italic' },
  summaryBox:     { background: '#fff', borderRadius: 16, padding: '22px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: 20 },
  summaryTitle:   { fontSize: 16, fontWeight: 800, color: '#1B5E20', marginBottom: 16 },
  summaryItems:   { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  summaryItem:    { display: 'flex', alignItems: 'center', gap: 10 },
  summaryImg:     { width: 48, height: 48, borderRadius: 8, background: '#E8F5E9', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryItemInfo:{ flex: 1, minWidth: 0 },
  summaryItemName:{ fontSize: 13, fontWeight: 600, color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  summaryItemQty: { fontSize: 11, color: '#888', margin: 0 },
  summaryItemPrice:{ fontSize: 13, fontWeight: 700, color: '#1B5E20', flexShrink: 0 },
  summaryDivider: { height: 1, background: '#E8F5E9', margin: '12px 0' },
  summaryRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryRowLabel:{ fontSize: 14, color: '#555' },
  summaryRowVal:  { fontSize: 14, color: '#333' },
  stripeBadge:    { background: '#E8F5E9', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#2E7D32', fontWeight: 600, marginTop: 14, textAlign: 'center' },
};