// pages/FarmerOrders.jsx — Professional redesign
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function FarmerOrders() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating,   setUpdating]   = useState(null); // order_id being updated

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = () => {
    setLoading(true);
    api.get('/orders/farmer/received')
      .then(r => { setOrders(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const updateStatus = async (orderId, newStatus, buyerName) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setMsg(`Order #${orderId} moved to "${newStatus}"`);
      loadOrders();
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Error updating order.'));
    }
    setUpdating(null);
  };

  const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B', step: 0 },
    confirmed: { label: 'Confirmed', color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD', dot: '#3B82F6', step: 1 },
    shipped:   { label: 'Shipped',   color: '#6D28D9', bg: '#F5F3FF', border: '#C4B5FD', dot: '#8B5CF6', step: 2 },
    delivered: { label: 'Delivered', color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981', step: 3 },
    cancelled: { label: 'Cancelled', color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444', step: -1 },
  };

  const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

  const nextStatus = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
  const nextLabel  = { pending: 'Confirm Order', confirmed: 'Mark as Shipped', shipped: 'Mark as Delivered' };
  const nextIcon   = { pending: '✓', confirmed: '🚚', shipped: '🏠' };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  // Summary counts
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={styles.spinner} />
    </div>
  );

  return (
    <div>

      {/* ── TOAST MESSAGE ── */}
      {msg && (
        <div style={{
          ...styles.toast,
          background: msg.startsWith('❌') ? '#FEF2F2' : '#ECFDF5',
          borderColor: msg.startsWith('❌') ? '#FCA5A5' : '#6EE7B7',
          color:       msg.startsWith('❌') ? '#991B1B' : '#065F46',
        }}>
          <span style={{ fontSize: 15 }}>{msg.startsWith('❌') ? '❌' : '✅'}</span>
          <span>{msg.replace('❌ ', '')}</span>
        </div>
      )}

      {/* ── SUMMARY STRIP ── */}
      <div style={styles.summaryStrip}>
        {[
          { key: 'all',       label: 'All Orders',  count: orders.length,       color: '#374151' },
          { key: 'pending',   label: 'Pending',     count: counts.pending  || 0, color: '#B45309' },
          { key: 'confirmed', label: 'Confirmed',   count: counts.confirmed|| 0, color: '#1D4ED8' },
          { key: 'shipped',   label: 'Shipped',     count: counts.shipped  || 0, color: '#6D28D9' },
          { key: 'delivered', label: 'Delivered',   count: counts.delivered|| 0, color: '#065F46' },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            style={{
              ...styles.summaryBtn,
              borderColor:   filterStatus === key ? color : 'transparent',
              background:    filterStatus === key ? '#fff' : 'transparent',
              boxShadow:     filterStatus === key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, color }}>{count}</span>
            <span style={{ fontSize: 12, color: filterStatus === key ? color : '#9CA3AF', fontWeight: 600 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── EMPTY STATE ── */}
      {orders.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No orders yet</h3>
          <p style={styles.emptySub}>Once buyers purchase your listings, orders will appear here.</p>
          <Link to="/listings" style={styles.emptyBtn}>Browse My Listings</Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔍</div>
          <h3 style={styles.emptyTitle}>No {filterStatus} orders</h3>
          <p style={styles.emptySub}>Try selecting a different filter above.</p>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {filteredOrders.map(order => {
            const sc      = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const next    = nextStatus[order.status];
            const isUpdating = updating === order.order_id;
            const curStep = sc.step;

            return (
              <div key={order.order_id} style={styles.orderCard}>

                {/* ── CARD HEADER ── */}
                <div style={styles.cardHeader}>
                  <div style={styles.headerLeft}>
                    <div style={styles.orderIdWrap}>
                      <span style={styles.orderHash}>#</span>
                      <span style={styles.orderId}>{order.order_id}</span>
                    </div>
                    <span style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div style={{ ...styles.statusBadge, background: sc.bg, color: sc.color, borderColor: sc.border }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />
                    {sc.label}
                  </div>
                </div>

                {/* ── INFO ROW ── */}
                <div style={styles.infoRow}>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>BUYER</span>
                    <div style={styles.infoMain}>
                      <span style={styles.buyerAvatar}>{(order.buyer_name || 'B')[0].toUpperCase()}</span>
                      <span style={styles.infoValue}>{order.buyer_name}</span>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <span style={styles.infoLabel}>ORDER TOTAL</span>
                    <div style={styles.infoMain}>
                      <span style={styles.totalAmount}>${Number(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ ...styles.infoCard, flex: 2 }}>
                    <span style={styles.infoLabel}>ITEMS</span>
                    <div style={styles.infoMain}>
                      <span style={styles.itemsText}>{order.items_summary}</span>
                    </div>
                  </div>
                </div>

                {/* ── PROGRESS TRACKER ── */}
                {order.status !== 'cancelled' ? (
                  <div style={styles.progressSection}>
                    {STEPS.map((s, i) => {
                      const done    = i < curStep;
                      const current = i === curStep;
                      const future  = i > curStep;
                      const cfg     = STATUS_CONFIG[s];
                      return (
                        <div key={s} style={styles.stepWrap}>
                          {/* connector line before */}
                          {i > 0 && (
                            <div style={{
                              ...styles.connector,
                              background: done || current ? '#10B981' : '#E5E7EB'
                            }} />
                          )}
                          <div style={styles.stepItem}>
                            <div style={{
                              ...styles.stepDot,
                              background:   done ? '#10B981' : current ? cfg.dot : '#E5E7EB',
                              borderColor:  done ? '#10B981' : current ? cfg.dot : '#D1D5DB',
                              boxShadow:    current ? `0 0 0 4px ${cfg.dot}22` : 'none',
                              transform:    current ? 'scale(1.15)' : 'scale(1)',
                            }}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span style={{
                              ...styles.stepLabel,
                              color:      done ? '#10B981' : current ? cfg.color : '#9CA3AF',
                              fontWeight: current ? 700 : 500,
                            }}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.cancelledBar}>
                    <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                      ⚠️ This order was cancelled
                    </span>
                  </div>
                )}

                {/* ── ACTIONS ── */}
                <div style={styles.cardFooter}>
                  {next && order.status !== 'cancelled' && (
                    <button
                      style={{
                        ...styles.primaryBtn,
                        opacity:  isUpdating ? 0.7 : 1,
                        cursor:   isUpdating ? 'wait' : 'pointer',
                      }}
                      onClick={() => updateStatus(order.order_id, next, order.buyer_name)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <span style={styles.btnSpinner} />
                      ) : (
                        <span>{nextIcon[order.status]}</span>
                      )}
                      {isUpdating ? 'Updating...' : nextLabel[order.status]}
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <div style={styles.completedBadge}>
                      🎉 Order Complete
                    </div>
                  )}

                  <div style={styles.dropdownWrap}>
                    <label style={styles.dropLabel}>Move to:</label>
                    <select
                      style={styles.dropdown}
                      value={order.status}
                      onChange={e => updateStatus(order.order_id, e.target.value, order.buyer_name)}
                      disabled={isUpdating}
                    >
                      <option value="pending">📋 Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="shipped">🚚 Shipped</option>
                      <option value="delivered">🏠 Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  // Spinner
  spinner: { width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  btnSpinner: { display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Toast
  toast: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: '1.5px solid', marginBottom: 20, fontSize: 14, fontWeight: 600 },

  // Summary strip
  summaryStrip: { display: 'flex', gap: 8, marginBottom: 24, background: '#F9FAFB', borderRadius: 14, padding: 8, flexWrap: 'wrap' },
  summaryBtn:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 18px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s', minWidth: 80, fontFamily: 'inherit' },

  // Empty state
  empty:      { textAlign: 'center', padding: '56px 20px', background: '#fff', borderRadius: 16, border: '1.5px solid #F3F4F6' },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  emptyBtn:   { display: 'inline-block', padding: '10px 24px', background: '#059669', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' },

  // Order list
  ordersList: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Order card
  orderCard: {
    background: '#fff',
    borderRadius: 16,
    border: '1.5px solid #F3F4F6',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },

  // Card header
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 12 },
  orderIdWrap: { display: 'flex', alignItems: 'baseline', gap: 2 },
  orderHash:   { fontSize: 14, color: '#9CA3AF', fontWeight: 700 },
  orderId:     { fontSize: 18, fontWeight: 800, color: '#111827' },
  orderDate:   { fontSize: 13, color: '#9CA3AF', fontWeight: 500 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1.5px solid' },

  // Info row
  infoRow:   { display: 'flex', gap: 12, padding: '16px 20px', flexWrap: 'wrap' },
  infoCard:  { flex: 1, minWidth: 120, background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', border: '1px solid #F3F4F6' },
  infoLabel: { display: 'block', fontSize: 10, color: '#9CA3AF', fontWeight: 700, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  infoMain:  { display: 'flex', alignItems: 'center', gap: 8 },
  buyerAvatar: { width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoValue:   { fontSize: 14, color: '#111827', fontWeight: 600 },
  totalAmount: { fontSize: 18, fontWeight: 800, color: '#059669' },
  itemsText:   { fontSize: 14, color: '#374151', fontWeight: 500, lineHeight: 1.4 },

  // Progress tracker
  progressSection: { display: 'flex', alignItems: 'flex-start', padding: '20px 24px', gap: 0, position: 'relative' },
  stepWrap:  { display: 'flex', flex: 1, alignItems: 'flex-start', position: 'relative' },
  connector: { flex: 1, height: 2, marginTop: 13, borderRadius: 2, transition: 'background 0.4s' },
  stepItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 },
  stepDot:   { width: 28, height: 28, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', transition: 'all 0.3s', cursor: 'default' },
  stepLabel: { fontSize: 11, textAlign: 'center', transition: 'color 0.3s', whiteSpace: 'nowrap' },

  // Cancelled bar
  cancelledBar: { margin: '0 20px 16px', padding: '10px 16px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5' },

  // Card footer
  cardFooter: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap', background: '#FAFAFA' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all 0.2s' },
  completedBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#ECFDF5', color: '#065F46', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1.5px solid #6EE7B7' },
  dropdownWrap: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  dropLabel:    { fontSize: 12, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' },
  dropdown:     { padding: '8px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#374151', background: '#fff', cursor: 'pointer', fontWeight: 500 },
};