// pages/OrderTracking.jsx — Full order tracking page for buyers
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OrderTracking() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(r => { setOrder(r.data); setLoading(false); })
      .catch(() => { setError('Order not found.'); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div className="spinner" />
      <p style={{ color: '#888', marginTop: 12 }}>Loading your order...</p>
    </div>
  );

  if (error || !order) return (
    <div style={styles.errorPage}>
      <p style={{ fontSize: 48 }}>😕</p>
      <h2 style={{ color: '#1B5E20', margin: '12px 0' }}>Order not found</h2>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );

  const statusColors = {
    pending:   { bg: '#FFF9C4', color: '#E65100', border: '#FFE082' },
    confirmed: { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
    shipped:   { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
    delivered: { bg: '#E8F5E9', color: '#1B5E20', border: '#66BB6A' },
    cancelled: { bg: '#FFEBEE', color: '#C62828', border: '#EF9A9A' },
  };

  const sc = statusColors[order.status] || statusColors.pending;

  return (
    <div style={{ background: '#f8faf5', minHeight: '100vh', paddingBottom: 60 }}>

      {/* Header */}
      <div style={styles.header}>
        <div className="container">
          <Link to="/" style={styles.backLink}>← Back to Home</Link>
          <div style={styles.headerInner}>
            <div>
              <h1 style={styles.title}>📦 Order Tracking</h1>
              <p style={styles.orderNum}>Order #{order.order_id}</p>
            </div>
            <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color, border: `2px solid ${sc.border}` }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px' }}>
        <div style={styles.layout}>

          {/* LEFT — Tracking + Items */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* ── TRACKING TIMELINE ── */}
            <div className="card" style={styles.card}>
              <h2 style={styles.cardTitle}>🚚 Delivery Progress</h2>

              <div style={styles.timeline}>
                {order.timeline?.map((step, i) => (
                  <div key={step.status} style={styles.timelineStep}>

                    {/* Connector line */}
                    {i < order.timeline.length - 1 && (
                      <div style={{
                        ...styles.connector,
                        background: step.done ? '#4CAF50' : '#E0E0E0'
                      }} />
                    )}

                    {/* Circle */}
                    <div style={{
                      ...styles.circle,
                      background:  step.done    ? '#2E7D32' : '#fff',
                      border:      step.current ? '3px solid #2E7D32' : step.done ? '3px solid #2E7D32' : '3px solid #E0E0E0',
                      boxShadow:   step.current ? '0 0 0 6px #E8F5E9' : 'none',
                    }}>
                      {step.done
                        ? <span style={{ fontSize: 16, color: '#fff' }}>✓</span>
                        : <span style={{ fontSize: 16, color: '#bbb' }}>{i + 1}</span>
                      }
                    </div>

                    {/* Content */}
                    <div style={styles.stepContent}>
                      <div style={styles.stepHeader}>
                        <span style={{ fontSize: 20 }}>{step.icon}</span>
                        <p style={{
                          ...styles.stepLabel,
                          color: step.done ? '#1B5E20' : '#aaa',
                          fontWeight: step.current ? 800 : 600
                        }}>
                          {step.label}
                          {step.current && (
                            <span style={styles.currentTag}>Current</span>
                          )}
                        </p>
                      </div>
                      <p style={{ ...styles.stepDesc, color: step.done ? '#555' : '#bbb' }}>
                        {step.description}
                      </p>
                      {step.current && step.status !== 'delivered' && (
                        <p style={styles.estimateTag}>
                          ⏱️ Estimated: 1–3 business days
                        </p>
                      )}
                      {step.status === 'delivered' && step.done && (
                        <p style={{ ...styles.estimateTag, color: '#2E7D32', background: '#E8F5E9' }}>
                          🎉 Your order has arrived!
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cancelled state */}
              {order.status === 'cancelled' && (
                <div style={styles.cancelledBox}>
                  ❌ This order has been cancelled.
                </div>
              )}
            </div>

            {/* ── ORDER ITEMS ── */}
            <div className="card" style={{ ...styles.card, marginTop: 20 }}>
              <h2 style={styles.cardTitle}>🛍️ Items in Your Order</h2>
              {order.items?.map((item, i) => (
                <div key={i} style={{
                  ...styles.itemRow,
                  borderBottom: i < order.items.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <img
                    src={item.image_url
                      ? (item.image_url.startsWith('http') ? item.image_url : `http://localhost:5001${item.image_url}`)
                      : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'}
                    alt={item.title}
                    style={styles.itemImg}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={styles.itemTitle}>{item.title}</p>
                    <p style={styles.itemFarmer}>🌾 by {item.farmer_name}</p>
                    <p style={styles.itemQty}>Qty: {item.quantity} {item.unit}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</p>
                    <p style={styles.itemUnit}>${Number(item.unit_price).toFixed(2)} / {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Summary */}
          <div style={styles.sidebar}>

            {/* Order Summary */}
            <div className="card" style={styles.card}>
              <h2 style={styles.cardTitle}>📋 Order Summary</h2>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Order ID</span>
                <span style={styles.summaryValue}>#{order.order_id}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Placed on</span>
                <span style={styles.summaryValue}>
                  {new Date(order.created_at).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Last updated</span>
                <span style={styles.summaryValue}>
                  {new Date(order.updated_at).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              <div style={styles.divider} />
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Items</span>
                <span style={styles.summaryValue}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Delivery</span>
                <span style={{ ...styles.summaryValue, color: '#2E7D32', fontWeight: 700 }}>FREE</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Subtotal (ex. GST)</span>
                <span style={styles.summaryValue}>${(Number(order.total_amount) / 1.10).toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={{ ...styles.summaryLabel, color:'#6B7280' }}>GST (10%)</span>
                <span style={{ ...styles.summaryValue, color:'#6B7280' }}>+${(Number(order.total_amount) - Number(order.total_amount) / 1.10).toFixed(2)}</span>
              </div>
              <div style={styles.divider} />
              <div style={{ ...styles.summaryRow, marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#1B5E20' }}>Total (inc. GST)</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: '#1B5E20' }}>
                  ${Number(order.total_amount).toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize:11, color:'#9CA3AF', textAlign:'right', margin:'4px 0 0' }}>🇦🇺 Includes Australian GST (10%)</p>
            </div>

            {/* Delivery Address */}
            <div className="card" style={{ ...styles.card, marginTop: 16 }}>
              <h2 style={styles.cardTitle}>📍 Delivery Address</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
                {order.delivery_address}
              </p>
            </div>

            {/* Help */}
            <div style={styles.helpBox}>
              <p style={styles.helpTitle}>Need help with your order?</p>
              <p style={styles.helpText}>
                Contact our support team at{' '}
                <strong>ALS_MELB@kent.edu.au</strong>
              </p>
              <Link to="/listings" className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%', textAlign: 'center' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header:       { background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '28px 0', color: '#fff', marginBottom: 0 },
  backLink:     { color: '#A5D6A7', fontSize: 13, textDecoration: 'none', fontWeight: 600, display: 'block', marginBottom: 12 },
  headerInner:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  title:        { fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 },
  orderNum:     { color: '#C8E6C9', fontSize: 15, fontWeight: 500 },
  statusBadge:  { padding: '8px 20px', borderRadius: 24, fontSize: 15, fontWeight: 800 },
  layout:       { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' },
  card:         { padding: 24, borderRadius: 16, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  cardTitle:    { fontSize: 17, fontWeight: 800, color: '#1B5E20', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #E8F5E9' },
  timeline:     { position: 'relative', paddingLeft: 24 },
  timelineStep: { display: 'flex', gap: 16, marginBottom: 32, position: 'relative', alignItems: 'flex-start' },
  connector:    { position: 'absolute', left: -10, top: 40, width: 3, height: 'calc(100% + 8px)', borderRadius: 2 },
  circle:       { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s', zIndex: 1 },
  stepContent:  { flex: 1, paddingTop: 4 },
  stepHeader:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  stepLabel:    { fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  currentTag:   { background: '#2E7D32', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700 },
  stepDesc:     { fontSize: 13, lineHeight: 1.6, marginBottom: 6 },
  estimateTag:  { fontSize: 12, color: '#E65100', background: '#FFF9C4', padding: '4px 10px', borderRadius: 8, display: 'inline-block', fontWeight: 600 },
  cancelledBox: { background: '#FFEBEE', color: '#C62828', padding: '14px 18px', borderRadius: 10, fontWeight: 700, fontSize: 15, marginTop: 8 },
  itemRow:      { display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0' },
  itemImg:      { width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#f0f0f0' },
  itemTitle:    { fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 3 },
  itemFarmer:   { fontSize: 13, color: '#888', marginBottom: 2 },
  itemQty:      { fontSize: 13, color: '#2E7D32', fontWeight: 600 },
  itemPrice:    { fontWeight: 800, fontSize: 16, color: '#1B5E20' },
  itemUnit:     { fontSize: 12, color: '#aaa' },
  sidebar:      { width: 300, flexShrink: 0 },
  summaryRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, fontWeight: 600, color: '#333', textAlign: 'right', maxWidth: 160 },
  divider:      { borderTop: '1px solid #f0f0f0', margin: '12px 0' },
  helpBox:      { background: '#E8F5E9', borderRadius: 14, padding: 18, marginTop: 16 },
  helpTitle:    { fontWeight: 700, fontSize: 14, color: '#1B5E20', marginBottom: 6 },
  helpText:     { fontSize: 13, color: '#555', lineHeight: 1.6 },
  errorPage:    { textAlign: 'center', padding: 80 },
};