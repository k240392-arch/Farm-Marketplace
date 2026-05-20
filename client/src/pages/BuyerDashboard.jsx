// pages/BuyerDashboard.jsx 
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_URL } from '../config';
// Single shared Stripe promise (reused by checkout and add-card)
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51TE94nBl1cukRgBPWYVFB2h0mz8ht4bGk3HcaOqZ00ACnFlVKZZk2aNcZBojsPAMF6rWQMmqF2VPAam4ruXPY3fT00cqbPMV4C'
);

// ─────────────────────────────────────────────────────
// ── ADD CARD MODAL (Stripe SetupIntent flow) ─────────
// ─────────────────────────────────────────────────────
// Real card-on-file capture: we call /payments/setup-intent to get a client
// secret from Stripe, confirm the card on the client (so raw card data never
// touches our server — PCI compliance), then POST the resulting payment_method_id
// back so the backend saves brand/last4/exp metadata in the payment_methods table.
function AddCardForm({ onClose, onSaved }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError('');

    try {
      // 1) Ask backend for a SetupIntent client_secret
      const { data: si } = await api.post('/payments/setup-intent');
      if (!si.client_secret) throw new Error('Could not create setup intent.');

      // 2) Confirm the card with Stripe on the client (PCI-safe path)
      const { error: stripeErr, setupIntent } = await stripe.confirmCardSetup(
        si.client_secret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );
      if (stripeErr) throw new Error(stripeErr.message);
      if (!setupIntent || setupIntent.status !== 'succeeded') {
        throw new Error('Card could not be confirmed. Please try a different card.');
      }

      // 3) Tell our backend to persist brand/last4/exp metadata
      await api.post('/payments/payment-methods', {
        payment_method_id: setupIntent.payment_method,
      });

      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Card Details</label>
        <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', background: '#FAFAFA' }}>
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: { fontSize: '15px', color: '#333', fontFamily: 'inherit', '::placeholder': { color: '#aaa' } },
                invalid: { color: '#E53935' },
              },
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', marginTop: 8 }}>🧪 Test card: 4242 4242 4242 4242 — any future expiry — any 3-digit CVC</p>
      </div>

      {error && <p style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>⚠️ {error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} disabled={loading}
          style={{ padding: '10px 18px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button type="submit" disabled={!stripe || loading}
          style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#065F46,#10B981)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Saving…' : '💳 Save Card'}
        </button>
      </div>
    </form>
  );
}

function AddCardModal({ open, onClose, onSaved }) {
  if (!open) return null;
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>💳 Add a new card</h3>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, width: 30, height: 30, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#6B7280' }}>
          We use Stripe to securely process your card. Your card number is never sent to our servers.
        </p>
        <Elements stripe={stripePromise}>
          <AddCardForm onClose={onClose} onSaved={onSaved} />
        </Elements>
      </div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────
function Toggle({ on, onClick }) {
  return (
    <button style={{ ...SS.toggle, background: on ? '#059669' : '#D1D5DB' }} onClick={onClick}>
      <span style={{ ...SS.thumb, transform: on ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  );
}

// ── Star rating ───────────────────────────────────
function Stars({ n, interactive = false, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => interactive && onChange && onChange(i)}
          style={{ fontSize: interactive ? 32 : 18, color: i <= n ? '#F59E0B' : '#E5E7EB',
                   cursor: interactive ? 'pointer' : 'default', lineHeight: 1, transition: 'color 0.15s' }}>
          ★
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  SETTINGS PAGE (buyer-specific)
// ═══════════════════════════════════════════════════
function BuyerSettings({
  user, orders, onLogout,
  settings, setSettings, pwForm, setPwForm,
  saveSettings, changePassword, savingSettings, savingPw,
  notifs, setNotifs, saveNotifs, savingNotifs,
  privacy, setPrivacy, savePrivacy, savingPrivacy,
  securityStatus,
  sessions, sessionsLoading, revokeSession,
  exportMyData, openDelete,
}) {
  const [sec, setSec]     = useState('profile');
  const [saved, setSaved] = useState('');
  const flash = (m = 'Changes saved!') => { setSaved(m); setTimeout(() => setSaved(''), 3000); };

  // (notifs/privacy state lifted to parent so they can be saved to backend)
  // (appearance settings removed)

  // ── Payment cards: real data from /api/payments/payment-methods ──
  const [cards,        setCards]        = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [addCardOpen,  setAddCardOpen]  = useState(false);

  const loadCards = async () => {
    setCardsLoading(true);
    try {
      const r = await api.get('/payments/payment-methods');
      setCards(r.data.payment_methods || []);
    } catch { /* silent — empty list is fine */ }
    finally { setCardsLoading(false); }
  };

  useEffect(() => { if (sec === 'billing') loadCards(); }, [sec]);

  const deleteCard = async (id) => {
    if (!window.confirm('Remove this card?')) return;
    try { await api.delete(`/payments/payment-methods/${id}`); flash('Card removed'); loadCards(); }
    catch (err) { flash(err.response?.data?.message || 'Could not remove card'); }
  };

  const makeDefault = async (id) => {
    try { await api.patch(`/payments/payment-methods/${id}/default`); flash('Default card updated'); loadCards(); }
    catch (err) { flash(err.response?.data?.message || 'Could not set default'); }
  };

  const sections = [
    { k: 'profile',    icon: '👤', label: 'Profile' },
    { k: 'notifs',     icon: '🔔', label: 'Notifications' },
    { k: 'privacy',    icon: '🔒', label: 'Privacy & Data' },
    { k: 'security',   icon: '🛡️', label: 'Security' },
    { k: 'billing',    icon: '💳', label: 'Billing' },
  ];

  const delivered = orders.filter(o => o.status === 'delivered');
  const totalSpent = delivered.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  return (
    <div style={SS.wrap} className="dash-settings-layout">
      {/* Settings nav */}
      <div style={SS.snav} className="dash-snav">
        <p style={SS.snavTitle}>Settings</p>
        {sections.map(({ k, icon, label }) => (
          <button key={k} onClick={() => setSec(k)} style={{ ...SS.snavBtn, ...(sec === k ? SS.snavAct : {}) }}>
            <span style={{ fontSize: 15 }}>{icon}</span>{label}
            {sec === k && <span style={{ marginLeft: 'auto', color: '#059669', fontWeight: 800 }}>›</span>}
          </button>
        ))}
      </div>

      <div style={SS.scontent}>
        {saved && <div style={SS.toast}>✅ {saved}</div>}

        {/* PROFILE */}
        {sec === 'profile' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Profile Information</h2><p style={SS.ssub}>Update how you appear on FarmMarket</p></div>
            <div style={SS.avatarRow}>
              <div style={SS.bigAvatar}>{(user?.full_name || user?.name || 'U')[0].toUpperCase()}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{user?.full_name || user?.name}</p>
                <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 10px' }}>{user?.email}</p>
                <span style={SS.rolePill}>🛒 Buyer Account</span>
              </div>
            </div>
            {/* Quick stats inside profile */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '🛒', label: 'Orders Placed', val: orders.length,         color: '#2563EB', bg: '#EFF6FF' },
                { icon: '✅', label: 'Delivered',      val: delivered.length,       color: '#059669', bg: '#ECFDF5' },
                { icon: '💰', label: 'Total Spent',    val: `$${totalSpent.toFixed(2)}`, color: '#7C3AED', bg: '#F5F3FF' },
              ].map(({ icon, label, val, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center', border: `1px solid ${color}22` }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <p style={{ fontSize: 18, fontWeight: 800, color, margin: '4px 0 2px' }}>{val}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontWeight: 500 }}>{label}</p>
                </div>
              ))}
            </div>
            <div style={SS.grid2}>
              <div style={SS.fg}><label style={SS.fl}>Full Name</label><input placeholder="Your full name" value={settings.full_name} onChange={e => setSettings(p => ({ ...p, full_name: e.target.value }))} style={SS.fi} /></div>
              <div style={SS.fg}><label style={SS.fl}>Phone Number</label><input placeholder="04XX XXX XXX" value={settings.phone} onChange={e => setSettings(p => ({ ...p, phone: e.target.value }))} style={SS.fi} /></div>
              <div style={{ ...SS.fg, gridColumn: '1/-1' }}><label style={SS.fl}>Email Address</label><input value={user?.email || ''} disabled style={{ ...SS.fi, background: '#F3F4F6', color: '#9CA3AF' }} /><p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>Email cannot be changed.</p></div>
            </div>
            <button style={SS.saveBtn} onClick={async () => { await saveSettings(); flash('Profile updated!'); }}>{savingSettings ? '⏳ Saving...' : 'Save Profile'}</button>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {sec === 'notifs' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Notification Preferences</h2><p style={SS.ssub}>Choose how and when FarmMarket contacts you</p></div>
            {[
              { k: 'order_updates_buyer', icon: '📦', label: 'Order Updates',         sub: 'Confirmations, shipping and delivery alerts' },
              { k: 'new_arrivals',  icon: '🌱', label: 'New Arrivals',          sub: 'Fresh produce added by your saved farmers' },
              { k: 'promotions',    icon: '🏷️', label: 'Promotions',            sub: 'Deals, discounts and seasonal offers' },
              { k: 'weekly_digest', icon: '📊', label: 'Weekly Digest',         sub: 'A summary of activity and recommendations' },
              { k: 'sms_alerts',   icon: '💬', label: 'SMS Alerts',            sub: 'Text messages for urgent order updates' },
              { k: 'push_browser', icon: '🔔', label: 'Browser Notifications', sub: 'Real-time alerts in your browser' },
            ].map(({ k, icon, label, sub }) => (
              <div key={k} style={SS.tRow}>
                <div style={SS.tLeft}><span style={SS.tIcon}>{icon}</span><div><p style={SS.tLabel}>{label}</p><p style={SS.tSub}>{sub}</p></div></div>
                <Toggle on={!!notifs[k]} onClick={() => setNotifs(n => ({ ...n, [k]: !n[k] }))} />
              </div>
            ))}
            <br /><button style={SS.saveBtn} disabled={savingNotifs} onClick={saveNotifs}>{savingNotifs ? '⏳ Saving...' : 'Save Preferences'}</button>
          </div>
        )}

        {/* PRIVACY */}
        {sec === 'privacy' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Privacy & Data</h2><p style={SS.ssub}>Control how your data is used and who can see your activity</p></div>
            {[
              { k: 'profile_public', icon: '👁️', label: 'Public Profile',         sub: 'Allow farmers to see your name and buyer history' },
              { k: 'show_reviews',   icon: '⭐', label: 'Show My Reviews',        sub: 'Display your reviews publicly on product pages' },
              { k: 'data_analytics', icon: '📈', label: 'Usage Analytics',         sub: 'Help us improve by sharing anonymous usage data' },
              { k: 'marketing',      icon: '🎯', label: 'Personalised Marketing',  sub: 'Receive tailored product recommendations' },
            ].map(({ k, icon, label, sub }) => (
              <div key={k} style={SS.tRow}>
                <div style={SS.tLeft}><span style={SS.tIcon}>{icon}</span><div><p style={SS.tLabel}>{label}</p><p style={SS.tSub}>{sub}</p></div></div>
                <Toggle on={!!privacy[k]} onClick={() => setPrivacy(p => ({ ...p, [k]: !p[k] }))} />
              </div>
            ))}
            <div style={SS.danger}>
              <h3 style={SS.dTitle}>⚠️ Danger Zone</h3><p style={SS.dSub}>These actions are permanent and cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button style={SS.dOutline} onClick={exportMyData}>📥 Export My Data</button>
                <button style={SS.dBtn} onClick={openDelete}>🗑️ Delete Account</button>
              </div>
            </div>
            <button style={SS.saveBtn} disabled={savingPrivacy} onClick={savePrivacy}>{savingPrivacy ? '⏳ Saving...' : 'Save Settings'}</button>
          </div>
        )}

        {/* APPEARANCE — removed */}

        {/* SECURITY */}
        {sec === 'security' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Security</h2><p style={SS.ssub}>Keep your buyer account safe and secure</p></div>
            <div style={SS.secGrid}>
              {(() => {
                const s = securityStatus;
                const days = s?.password_age_days;
                const cards = [
                  {
                    label: 'Email Verified',
                    sub:   s?.email_verified ? 'Your email address is confirmed' : 'Please verify your email address',
                    ok:    !!s?.email_verified,
                  },
                  {
                    label: days != null && days < 90 ? 'Strong Password' : 'Password',
                    sub:   days == null ? 'Loading…'
                           : days === 0 ? 'Changed today'
                           : days === 1 ? 'Changed yesterday'
                           : days < 30  ? `Last changed ${days} days ago`
                           : days < 365 ? `Last changed ${Math.floor(days/30)} month${Math.floor(days/30) === 1 ? '' : 's'} ago`
                           : `Last changed ${Math.floor(days/365)} year${Math.floor(days/365) === 1 ? '' : 's'} ago — consider updating`,
                    ok:    days != null && days < 180,
                  },
                  {
                    label: '2-Factor Auth',
                    sub:   s?.two_factor_enabled ? 'Enabled' : 'Not enabled — highly recommended',
                    ok:    !!s?.two_factor_enabled,
                  },
                  {
                    label: 'Login Alerts',
                    sub:   s?.login_alerts_enabled ? 'Enabled for new devices' : 'No login history yet',
                    ok:    !!s?.login_alerts_enabled,
                  },
                ];
                return cards.map(({ label, sub, ok }) => (
                  <div key={label} style={{ ...SS.secCard, borderColor: ok ? '#A7F3D0' : '#FCD34D', background: ok ? '#F0FDF4' : '#FFFBEB' }}>
                    <span style={{ fontSize: 22 }}>{ok ? '✅' : '⚠️'}</span>
                    <div><p style={{ fontWeight: 700, fontSize: 13, color: ok ? '#065F46' : '#92400E', margin: 0 }}>{label}</p><p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{sub}</p></div>
                  </div>
                ));
              })()}
            </div>
            {/* Change password — uses real API */}
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Change Password</h3>
              <div style={SS.grid2}>
                <div style={SS.fg}><label style={SS.fl}>Current Password</label><input type="password" placeholder="••••••••" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} style={SS.fi} /></div>
                <div style={SS.fg}><label style={SS.fl}>New Password</label><input type="password" placeholder="Min 6 characters" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} style={SS.fi} /></div>
                <div style={{ ...SS.fg, gridColumn: '1/-1' }}><label style={SS.fl}>Confirm New Password</label><input type="password" placeholder="Repeat new password" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} style={SS.fi} /></div>
              </div>
              <button style={SS.saveBtn} onClick={changePassword}>{savingPw ? '⏳ Changing...' : '🔒 Change Password'}</button>
            </div>
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Active Sessions</h3>
              {sessionsLoading ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '8px 0' }}>Loading sessions…</p>
              ) : sessions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '8px 0' }}>No recent sessions found.</p>
              ) : sessions.map((s) => {
                const last = s.last_seen ? new Date(s.last_seen) : null;
                const now  = Date.now();
                const diffMin = last ? Math.floor((now - last.getTime()) / 60000) : 0;
                const timeLabel = s.is_current
                  ? 'Now — Current session'
                  : diffMin < 60     ? `${diffMin} min${diffMin === 1 ? '' : 's'} ago`
                  : diffMin < 1440   ? `${Math.floor(diffMin/60)} hour${Math.floor(diffMin/60) === 1 ? '' : 's'} ago`
                  : `${Math.floor(diffMin/1440)} day${Math.floor(diffMin/1440) === 1 ? '' : 's'} ago`;
                return (
                  <div key={s.id} style={SS.sessRow}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>{s.device}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{s.ip_address || 'Unknown IP'} · {timeLabel}</p>
                    </div>
                    {s.is_current
                      ? <span style={{ fontSize: 12, background: '#ECFDF5', color: '#065F46', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>This device</span>
                      : <button style={SS.revokeBtn} onClick={() => revokeSession(s.key)}>Revoke</button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BILLING */}
        {sec === 'billing' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Billing & Payments</h2><p style={SS.ssub}>Your payment methods and full transaction history</p></div>
            <div style={SS.pwCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={SS.pwTitle}>Payment Methods</h3>
                <button onClick={() => setAddCardOpen(true)}
                  style={{ padding: '6px 14px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Add Card
                </button>
              </div>

              {cardsLoading && <p style={{ color: '#9CA3AF', fontSize: 13, padding: '10px 4px' }}>Loading your saved cards…</p>}

              {!cardsLoading && cards.length === 0 && (
                <div style={{ padding: '20px 14px', background: '#FAFAFA', borderRadius: 10, border: '1.5px dashed #E5E7EB', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>No saved cards yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>Click <strong>+ Add Card</strong> to save one for faster checkout.</p>
                </div>
              )}

              {!cardsLoading && cards.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cards.map(c => {
                    const brandColors = {
                      visa:       'linear-gradient(135deg,#1D4ED8,#3B82F6)',
                      mastercard: 'linear-gradient(135deg,#DC2626,#F59E0B)',
                      amex:       'linear-gradient(135deg,#0891B2,#06B6D4)',
                      discover:   'linear-gradient(135deg,#EA580C,#FB923C)',
                    };
                    const isDefault = c.is_default === 1 || c.is_default === true;
                    return (
                      <div key={c.payment_method_id}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#fff', borderRadius: 10, border: `1.5px solid ${isDefault ? '#A7F3D0' : '#E5E7EB'}` }}>
                        <div style={{ width: 44, height: 44, background: brandColors[c.card_brand] || 'linear-gradient(135deg,#6B7280,#9CA3AF)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#fff', fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>
                          {c.card_brand?.slice(0, 4) || '💳'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0, textTransform: 'capitalize' }}>
                            {c.card_brand} ending in {c.card_last4}
                          </p>
                          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                            Expires {String(c.card_exp_month).padStart(2, '0')}/{String(c.card_exp_year).slice(-2)}
                            {isDefault && ' · Default card'}
                          </p>
                        </div>
                        {isDefault
                          ? <span style={{ fontSize: 12, background: '#ECFDF5', color: '#065F46', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Default</span>
                          : <button onClick={() => makeDefault(c.payment_method_id)}
                              style={{ fontSize: 12, background: '#F3F4F6', color: '#374151', padding: '5px 10px', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                              Make default
                            </button>}
                        <button onClick={() => deleteCard(c.payment_method_id)} title="Remove card"
                          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                          🗑
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal for adding a new card */}
            <AddCardModal open={addCardOpen} onClose={() => setAddCardOpen(false)} onSaved={() => { flash('💳 Card added successfully'); loadCards(); }} />

            {/* Real order transaction history */}
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Transaction History</h3>
              {orders.length === 0 ? <p style={{ color: '#9CA3AF', fontSize: 14 }}>No transactions yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, padding: '8px 0 10px', borderBottom: '1px solid #E5E7EB', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <span>Order</span><span>Date</span><span>Items</span><span>Amount</span><span>Status</span>
                  </div>
                  {orders.map(o => {
                    const STATUS_COLORS = { pending:'#B45309',confirmed:'#1D4ED8',shipped:'#6D28D9',delivered:'#065F46',cancelled:'#991B1B' };
                    const STATUS_BG = { pending:'#FFFBEB',confirmed:'#EFF6FF',shipped:'#F5F3FF',delivered:'#ECFDF5',cancelled:'#FEF2F2' };
                    return (
                      <div key={o.order_id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, padding: '11px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>#{o.order_id}</span>
                        <span style={{ color: '#6B7280', fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}</span>
                        <span style={{ color: '#6B7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items_summary || '—'}</span>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>${parseFloat(o.total_amount||0).toFixed(2)}</span>
                        <span style={{ fontSize: 11, background: STATUS_BG[o.status]||'#F3F4F6', color: STATUS_COLORS[o.status]||'#374151', padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-block' }}>{o.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MAIN BUYER DASHBOARD
// ═══════════════════════════════════════════════════
export default function BuyerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [tab,         setTab]         = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [summary,     setSummary]     = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  // Review modal
  const [reviewModal,   setReviewModal]   = useState({ open: false, listingId: null, title: '' });
  const [reviewRating,  setReviewRating]  = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting,    setSubmitting]    = useState(false);

  // Settings state (lifted so Settings component can use real handlers)
  const [settings,       setSettings]       = useState({ full_name: '', phone: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [pwForm,         setPwForm]         = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPw,       setSavingPw]       = useState(false);

  // Notifications + Privacy — loaded from /api/settings, saved per section
  const [notifs,  setNotifs]  = useState({ order_updates_buyer: true, new_arrivals: true, promotions: false, weekly_digest: true, sms_alerts: false, push_browser: true });
  const [privacy, setPrivacy] = useState({ profile_public: true, show_reviews: true, data_analytics: false, marketing: false });
  const [savingNotifs,  setSavingNotifs]  = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Security status + Active Sessions — loaded from /api/auth/security-status and /api/auth/sessions
  const [securityStatus, setSecurityStatus] = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Delete-account modal state
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deletePw,      setDeletePw]      = useState('');
  const [deleteReason,  setDeleteReason]  = useState('');
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadOrders();
    setSettings({ full_name: user.full_name || user.name || '', phone: user.phone || '' });
    loadServerSettings();
  }, [user]);

  useEffect(() => {
    if (tab === 'reviews') loadReviews();
    if (tab === 'account') buildSummary();
    if (tab === 'settings') { loadSecurityStatus(); loadSessions(); }
  }, [tab]);

  // ── LOADERS ──────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const loadOrders = async () => {
    setLoading(true); setRefreshing(true);
    try { const r = await api.get('/orders/my'); setOrders(Array.isArray(r.data) ? r.data : []); }
    catch { setOrders([]); } finally { setLoading(false); setRefreshing(false); }
  };

  const loadReviews = async () => {
    try { const r = await api.get('/reviews/my'); setReviews(Array.isArray(r.data) ? r.data : []); }
    catch { setReviews([]); }
  };

  const buildSummary = async () => {
    try {
      const r   = await api.get('/orders/my');
      const all = Array.isArray(r.data) ? r.data : [];
      const delivered  = all.filter(x => x.status === 'delivered');
      const pending    = all.filter(x => x.status === 'pending');
      const cancelled  = all.filter(x => x.status === 'cancelled');
      const totalSpent = delivered.reduce((s, x) => s + parseFloat(x.total_amount || 0), 0);
      const gstPaid    = totalSpent - totalSpent / 1.1;
      const monthMap   = {};
      all.forEach(x => {
        const m = new Date(x.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
        monthMap[m] = (monthMap[m] || 0) + parseFloat(x.total_amount || 0);
      });
      setSummary({ totalOrders: all.length, deliveredOrders: delivered.length, pendingOrders: pending.length, cancelledOrders: cancelled.length, totalSpent, gstPaid, latestOrder: all[0] || null, monthlySpend: Object.entries(monthMap).slice(-6) });
    } catch {
      setSummary({ totalOrders: 0, deliveredOrders: 0, pendingOrders: 0, cancelledOrders: 0, totalSpent: 0, gstPaid: 0, latestOrder: null, monthlySpend: [] });
    }
  };

  // ── ACTIONS ──────────────────────────────────────
  const downloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/invoices/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { showToast('Invoice not available yet.', 'error'); return; }
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `Invoice-${String(orderId).padStart(6,'0')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('✅ Invoice downloaded!');
    } catch { showToast('Could not download invoice.', 'error'); }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancellingId(orderId);
    try { await api.patch(`/orders/${orderId}/cancel`, { reason: 'Buyer request' }); loadOrders(); showToast('Order cancelled.'); }
    catch (err) { showToast(err.response?.data?.message || 'Cannot cancel — order may already be shipped.', 'error'); }
    finally { setCancellingId(null); }
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) { showToast('Please write a comment.', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post('/reviews', { listing_id: reviewModal.listingId, rating: reviewRating, comment: reviewComment });
      setReviewModal({ open: false, listingId: null, title: '' }); setReviewRating(5); setReviewComment('');
      showToast('✅ Review submitted! Thank you.'); loadOrders();
    } catch (err) { showToast(err.response?.data?.message || 'Could not submit review.', 'error'); }
    finally { setSubmitting(false); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.patch('/auth/profile', settings);
      // Update AuthContext (and localStorage) so the sidebar/avatar/name
      // refresh immediately. Use the server's user response if returned,
      // otherwise merge the form fields locally.
      updateUser(res?.data?.user ? res.data.user : settings);
      showToast('✅ Profile updated!');
    }
    catch (err) { showToast('❌ ' + (err.response?.data?.message || 'Update failed'), 'error'); }
    finally { setSavingSettings(false); }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { showToast('Passwords do not match', 'error'); return; }
    if (pwForm.new_password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setSavingPw(true);
    try { await api.patch('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password }); showToast('✅ Password changed!'); setPwForm({ current_password: '', new_password: '', confirm_password: '' }); loadSecurityStatus(); }
    catch (err) { showToast('❌ ' + (err.response?.data?.message || 'Failed'), 'error'); }
    finally { setSavingPw(false); }
  };

  // ── Server-backed settings (notifications + privacy) ────────────
  const loadServerSettings = async () => {
    try {
      const r = await api.get('/settings');
      if (r.data?.notifications) setNotifs(n => ({ ...n, ...r.data.notifications }));
      if (r.data?.privacy)       setPrivacy(p => ({ ...p, ...r.data.privacy }));
    } catch { /* silent — defaults are fine */ }
  };

  const saveNotifs = async () => {
    setSavingNotifs(true);
    try { await api.patch('/settings', { section: 'notifications', value: notifs }); showToast('✅ Notification preferences saved!'); }
    catch (err) { showToast('❌ ' + (err.response?.data?.message || 'Save failed'), 'error'); }
    finally { setSavingNotifs(false); }
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try { await api.patch('/settings', { section: 'privacy', value: privacy }); showToast('✅ Privacy settings saved!'); }
    catch (err) { showToast('❌ ' + (err.response?.data?.message || 'Save failed'), 'error'); }
    finally { setSavingPrivacy(false); }
  };

  // ── Security status + active sessions ──────────────────────────
  const loadSecurityStatus = async () => {
    try { const r = await api.get('/auth/security-status'); setSecurityStatus(r.data); }
    catch { setSecurityStatus(null); }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try { const r = await api.get('/auth/sessions'); setSessions(r.data.sessions || []); }
    catch { setSessions([]); }
    finally { setSessionsLoading(false); }
  };

  const revokeSession = async (key) => {
    if (!window.confirm('Revoke this session? The device will need to log in again.')) return;
    try { await api.post('/auth/sessions/revoke', { key }); showToast('Session revoked.'); loadSessions(); }
    catch (err) { showToast('❌ ' + (err.response?.data?.message || 'Could not revoke'), 'error'); }
  };

  // ── Data export ────────────────────────────────────────────────
  const exportMyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/me/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { showToast('Could not export data.', 'error'); return; }
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `my-farmmarket-data-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('✅ Your data has been downloaded.');
    } catch { showToast('Could not export data.', 'error'); }
  };

  // ── Delete account ─────────────────────────────────────────────
  const closeAccount = async () => {
    if (!deletePw) { showToast('Please enter your password to confirm.', 'error'); return; }
    setDeleting(true);
    try {
      await api.post('/users/me/close-account', { confirm_password: deletePw, reason: deleteReason || null });
      showToast('Account closed. Logging out…');
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Could not close account'), 'error');
    } finally { setDeleting(false); }
  };

  // ── COMPUTED ─────────────────────────────────────
  const totalSpent     = orders.filter(o => o.status === 'delivered').reduce((s,o) => s + parseFloat(o.total_amount||0), 0);
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const pendingCount   = orders.filter(o => o.status === 'pending').length;
  const avgOrder       = orders.length ? (orders.reduce((s,o) => s + parseFloat(o.total_amount||0), 0) / orders.length) : 0;

  const STATUS_CFG = {
    pending:   { bg: '#FFFBEB', color: '#B45309', border: '#FCD34D', dot: '#F59E0B' },
    confirmed: { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD', dot: '#3B82F6' },
    shipped:   { bg: '#F5F3FF', color: '#6D28D9', border: '#C4B5FD', dot: '#8B5CF6' },
    delivered: { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#10B981' },
    cancelled: { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5', dot: '#EF4444' },
  };
  const STEPS = ['pending','confirmed','shipped','delivered'];

  const navItems = [
    { key: 'overview',  icon: '📊', label: 'Overview' },
    { key: 'orders',    icon: '📦', label: 'My Orders',      badge: orders.length },
    { key: 'account',   icon: '📈', label: 'Account Summary', badge: null },
    { key: 'reviews',   icon: '⭐', label: 'My Reviews',      badge: reviews.length || null },
    { key: 'settings',  icon: '⚙️', label: 'Settings' },
  ];

  if (loading && orders.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F3F4F6' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={S.spinner} />
        <p style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={S.shell} className={`dash-shell${mobileNavOpen ? ' dash-mobile-open' : ''}`}>

      {/* Mobile drawer backdrop */}
      <div className="dash-mobile-backdrop" onClick={() => setMobileNavOpen(false)} />

      {/* ══ SIDEBAR ══ */}
      <aside className="dash-sidebar" style={{ ...S.sidebar, width: sidebarOpen ? 240 : 68 }}>

        {/* Profile + collapse */}
        <div style={S.sideTop}>
          {sidebarOpen && (
            <div style={S.profile}>
              <div style={S.avatar}>{(user?.full_name || user?.name || 'U')[0].toUpperCase()}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={S.profileName}>{user?.full_name || user?.name}</p>
                <p style={S.profileRole}>🛒 Buyer</p>
              </div>
            </div>
          )}
          {!sidebarOpen && <div style={{ ...S.avatar, margin: '0 auto' }}>{(user?.full_name || user?.name || 'U')[0].toUpperCase()}</div>}
          <button style={S.collapseBtn} onClick={() => setSidebarOpen(o => !o)}>{sidebarOpen ? '‹' : '›'}</button>
        </div>

        {/* Quick stats strip */}
        {sidebarOpen && (
          <div style={S.quickStats}>
            {[
              { label: 'Orders',    value: orders.length,              color: '#93C5FD' },
              { label: 'Delivered', value: deliveredCount,             color: '#6EE7B7' },
              { label: 'Spent',     value: `$${totalSpent.toFixed(0)}`, color: '#FCD34D' },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{ ...S.quickStat, borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span style={{ ...S.qStatVal, color }}>{value}</span>
                <span style={S.qStatLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nav */}
        <nav style={S.nav}>
          {sidebarOpen && <p style={S.navSec}>NAVIGATION</p>}
          {navItems.map(({ key, icon, label, badge }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...S.navItem, ...(tab === key ? S.navActive : {}), justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
              title={!sidebarOpen ? label : undefined}>
              <span style={S.navIcon}>{icon}</span>
              {sidebarOpen && <>
                <span style={S.navLabel}>{label}</span>
                {badge > 0 && <span style={{ ...S.navBadge, background: tab === key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}>{badge}</span>}
              </>}
            </button>
          ))}
        </nav>

        {/* Alerts + logout */}
        <div style={S.sideBottom}>
          {sidebarOpen && pendingCount > 0 && (
            <div style={S.alertCard}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <div><p style={S.alertTitle}>{pendingCount} Pending Order{pendingCount > 1 ? 's' : ''}</p><p style={S.alertSub}>Awaiting farmer confirmation</p></div>
            </div>
          )}
          {sidebarOpen && pendingCount === 0 && orders.length > 0 && (
            <div style={{ ...S.alertCard, background: 'rgba(110,231,183,0.1)', borderColor: 'rgba(110,231,183,0.25)' }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div><p style={{ ...S.alertTitle, color: '#6EE7B7' }}>All caught up</p><p style={S.alertSub}>No pending orders</p></div>
            </div>
          )}
          <button style={S.logoutBtn} onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <span style={{ fontSize: 16 }}>⏻</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={S.main} className="dash-main">

        {/* Top bar */}
        <div style={S.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <button
              className="dash-hamburger"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu">☰</button>
            <div style={{ minWidth: 0 }}>
            <h1 style={S.pageTitle}>
              {tab === 'overview' && '📊 Overview'}
              {tab === 'orders'   && '📦 My Orders'}
              {tab === 'account'  && '📈 Account Summary'}
              {tab === 'reviews'  && '⭐ My Reviews'}
              {tab === 'settings' && '⚙️ Settings'}
            </h1>
            <p style={S.pageSub}>
              {tab === 'overview' && `Welcome back, ${user?.full_name || user?.name}`}
              {tab === 'orders'   && `${orders.length} order${orders.length !== 1 ? 's' : ''} placed`}
              {tab === 'account'  && 'Your spending and order history at a glance'}
              {tab === 'reviews'  && `${reviews.length} review${reviews.length !== 1 ? 's' : ''} submitted`}
              {tab === 'settings' && 'Manage your account and preferences'}
            </p>
          </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {tab === 'orders' && (
              <button style={S.refreshBtn} onClick={loadOrders} disabled={refreshing}>{refreshing ? '⏳' : '↻'} Refresh</button>
            )}
            <Link to="/listings" style={S.primaryBtn}>🛒 Continue Shopping</Link>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? '#DC2626' : '#059669', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: 360 }}>
            {toast.msg}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <div style={S.statGrid}>
              {[
                { icon: '🛒', label: 'Total Orders',    value: orders.length,                   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { icon: '✅', label: 'Delivered',         value: deliveredCount,                  color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                { icon: '⏳', label: 'Pending',           value: pendingCount,                    color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
                { icon: '💰', label: 'Total Spent',       value: `$${totalSpent.toFixed(2)}`,    color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD' },
                { icon: '📈', label: 'Avg Order Value',   value: orders.length ? `$${avgOrder.toFixed(2)}` : '—', color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
                { icon: '⭐', label: 'Reviews Eligible',  value: deliveredCount,                 color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
              ].map(({ icon, label, value, color, bg, border }) => (
                <div key={label} style={{ ...S.statCard, background: bg, borderColor: border }}>
                  <span style={{ fontSize: 26 }}>{icon}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Recent orders preview */}
            {orders.length > 0 && (
              <div style={S.card}>
                <div style={S.cardHead}>
                  <h3 style={S.cardTitle}>Recent Orders</h3>
                  <button style={S.cardLink} onClick={() => setTab('orders')}>View all →</button>
                </div>
                {orders.slice(0, 5).map((o, i) => {
                  const sc = STATUS_CFG[o.status] || STATUS_CFG.pending;
                  return (
                    <div key={o.order_id} style={{ ...S.listRow, borderTop: i === 0 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>#</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{o.order_id}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={S.rowName}>{o.items_summary || 'Order items'}</p>
                        <p style={S.rowMeta}>{new Date(o.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>${parseFloat(o.total_amount||0).toFixed(2)}</span>
                        <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color, borderColor: sc.border, fontSize: 11, padding: '2px 10px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick actions grid */}
            <div style={S.card}>
              <div style={S.cardHead}><h3 style={S.cardTitle}>Quick Actions</h3></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                {[
                  { icon: '🛒', label: 'Browse Produce',  sub: 'Shop fresh listings',       to: '/listings',             color: '#059669', bg: '#ECFDF5' },
                  { icon: '📦', label: 'Track Orders',    sub: 'See delivery status',        action: () => setTab('orders'), color: '#2563EB', bg: '#EFF6FF' },
                  { icon: '📈', label: 'View Summary',    sub: 'Spending overview',          action: () => setTab('account'),color: '#7C3AED', bg: '#F5F3FF' },
                  { icon: '⚙️', label: 'Settings',        sub: 'Update preferences',        action: () => setTab('settings'),color: '#D97706', bg: '#FFFBEB' },
                ].map(({ icon, label, sub, to, action, color, bg }) =>
                  to ? (
                    <Link key={label} to={to} style={{ ...S.quickAction, background: bg, borderColor: color + '33', textDecoration: 'none' }}>
                      <span style={{ fontSize: 28 }}>{icon}</span>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{sub}</p>
                    </Link>
                  ) : (
                    <button key={label} onClick={action} style={{ ...S.quickAction, background: bg, border: `1.5px solid ${color}33`, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                      <span style={{ fontSize: 28 }}>{icon}</span>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{sub}</p>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          orders.length === 0 ? (
            <div style={S.empty}>
              <p style={{ fontSize: 52 }}>📦</p>
              <h2 style={{ color: '#111827', fontSize: 20, marginBottom: 8 }}>No orders yet</h2>
              <p style={{ color: '#9CA3AF', marginBottom: 24 }}>Browse fresh produce from local farmers!</p>
              <Link to="/listings" style={S.primaryBtn}>Browse Listings</Link>
            </div>
          ) : (
            <div style={S.ordersList}>
              {orders.map(ord => {
                const sc = STATUS_CFG[ord.status] || STATUS_CFG.pending;
                const curStep = STEPS.indexOf(ord.status);
                const subtotal = parseFloat(ord.total_amount || 0) / 1.1;
                const gst      = parseFloat(ord.total_amount || 0) - subtotal;
                return (
                  <div key={ord.order_id} style={S.orderCard}>
                    {/* Header */}
                    <div style={S.cardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 700 }}>#</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{ord.order_id}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#9CA3AF' }}>{new Date(ord.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color, borderColor: sc.border }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {ord.status.charAt(0).toUpperCase() + ord.status.slice(1)}
                        </span>
                        <span style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>${parseFloat(ord.total_amount||0).toFixed(2)} AUD</span>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div style={S.infoGrid}>
                      {[
                        { icon: '🗓️', label: 'Order Date',   val: new Date(ord.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) },
                        { icon: '📍', label: 'Address',       val: ord.delivery_address || '—' },
                        { icon: '🕐', label: 'Time Window',   val: ord.delivery_time ? ord.delivery_time.charAt(0).toUpperCase() + ord.delivery_time.slice(1) : 'Flexible' },
                        { icon: '💳', label: 'Payment',       val: ord.stripe_payment_id ? '✅ Paid via Stripe' : 'Pending payment' },
                      ].map(({ icon, label, val }) => (
                        <div key={label} style={S.infoCell}>
                          <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>{icon}</span>
                          <div>
                            <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, marginBottom: 3 }}>{label}</p>
                            <p style={{ fontSize: 13, color: '#111827', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* GST breakdown bar */}
                    <div style={S.subtotalBar}>
                      {ord.items_summary && <span style={{ fontSize: 13, color: '#6B7280' }}>🛍️ {ord.items_summary}</span>}
                      <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 'auto' }}>
                        Subtotal: <strong>${subtotal.toFixed(2)}</strong>
                        {' '}· GST (10%): <strong>${gst.toFixed(2)}</strong>
                        {' '}· <strong style={{ color: '#059669' }}>Total: ${parseFloat(ord.total_amount||0).toFixed(2)}</strong>
                      </span>
                    </div>

                    {/* Progress tracker */}
                    {ord.status !== 'cancelled' ? (
                      <div style={S.progressRow}>
                        {STEPS.map((s, i) => {
                          const done = i < curStep, current = i === curStep, cfg = STATUS_CFG[s];
                          return (
                            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#10B981' : current ? cfg.dot : '#E5E7EB', color: '#fff', fontSize: 11, fontWeight: 800, boxShadow: current ? `0 0 0 4px ${cfg.dot}33` : 'none', zIndex: 1, position: 'relative' }}>{done ? '✓' : i + 1}</div>
                                <span style={{ fontSize: 11, fontWeight: current ? 700 : 500, color: done ? '#10B981' : current ? cfg.color : '#9CA3AF', whiteSpace: 'nowrap' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                              </div>
                              {i < STEPS.length - 1 && <div style={{ height: 2, flex: 1, background: done || current ? '#10B981' : '#E5E7EB', borderRadius: 2, marginBottom: 22, flexShrink: 0, minWidth: 20 }} />}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, margin: '0', fontSize: 13, color: '#991B1B', fontWeight: 600 }}>⚠️ This order was cancelled</div>
                    )}

                    {/* Action buttons */}
                    <div style={S.cardFooter}>
                      <Link to={`/orders/${ord.order_id}/track`} style={S.trackBtn}>📍 Track Order</Link>
                      <button style={S.invoiceBtn} onClick={() => downloadInvoice(ord.order_id)}>📄 Invoice</button>
                      {ord.status === 'pending' && (
                        <button disabled={cancellingId === ord.order_id} onClick={() => cancelOrder(ord.order_id)} style={S.cancelBtn}>
                          {cancellingId === ord.order_id ? '⏳ Cancelling...' : '✕ Cancel Order'}
                        </button>
                      )}
                      {ord.status === 'delivered' && (
                        <button onClick={() => setReviewModal({ open: true, listingId: ord.listing_id || null, title: ord.listing_title || ord.items_summary || 'Product' })} style={S.reviewBtn}>
                          ⭐ Leave Review
                        </button>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>Updated {new Date(ord.updated_at).toLocaleDateString('en-AU')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── ACCOUNT SUMMARY ── */}
        {tab === 'account' && (
          <div>
            {!summary && <p style={{ color: '#9CA3AF' }}>Loading summary...</p>}
            {summary && (
              <>
                {/* Stat cards */}
                <div style={S.statGrid}>
                  {[
                    { icon: '📦', label: 'Total Orders',    value: summary.totalOrders,                         color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                    { icon: '✅', label: 'Delivered',         value: summary.deliveredOrders,                     color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                    { icon: '💰', label: 'Total Spent',       value: `$${summary.totalSpent.toFixed(2)}`,        color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD' },
                    { icon: '🧾', label: 'GST Paid',          value: `$${summary.gstPaid.toFixed(2)}`,           color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
                    { icon: '⏳', label: 'Pending Orders',    value: summary.pendingOrders,                       color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
                    { icon: '✕',  label: 'Cancelled',          value: summary.cancelledOrders,                    color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
                  ].map(({ icon, label, value, color, bg, border }) => (
                    <div key={label} style={{ ...S.statCard, background: bg, borderColor: border }}>
                      <span style={{ fontSize: 26 }}>{icon}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Most recent order */}
                {summary.latestOrder && (
                  <div style={S.card}>
                    <div style={S.cardHead}><h3 style={S.cardTitle}>🕐 Most Recent Order</h3></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16, margin: 0, color: '#111827' }}>Order #{summary.latestOrder.order_id}</p>
                        <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>
                          {new Date(summary.latestOrder.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {summary.latestOrder.delivery_address && ` · ${summary.latestOrder.delivery_address}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {(() => { const sc = STATUS_CFG[summary.latestOrder.status]||STATUS_CFG.pending; return <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color, borderColor: sc.border }}><span style={{ width:7,height:7,borderRadius:'50%',background:sc.dot,display:'inline-block'}}/>{summary.latestOrder.status.charAt(0).toUpperCase()+summary.latestOrder.status.slice(1)}</span>; })()}
                        <strong style={{ color: '#059669', fontSize: 16 }}>${parseFloat(summary.latestOrder.total_amount||0).toFixed(2)}</strong>
                        <button onClick={() => downloadInvoice(summary.latestOrder.order_id)} style={S.invoiceBtn}>📄 Invoice</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly spending chart */}
                {summary.monthlySpend.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardHead}><h3 style={S.cardTitle}>📊 Monthly Spending</h3></div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', minHeight: 100 }}>
                      {summary.monthlySpend.map(([month, amt]) => {
                        const maxAmt = Math.max(...summary.monthlySpend.map(([,v]) => v));
                        const pct    = Math.round((amt / maxAmt) * 100);
                        return (
                          <div key={month} style={{ textAlign: 'center', flex: 1, minWidth: 50 }}>
                            <p style={{ fontSize: 11, color: '#059669', fontWeight: 700, margin: '0 0 4px' }}>${amt.toFixed(0)}</p>
                            <div style={{ height: Math.max(pct * 0.9, 6), background: 'linear-gradient(180deg,#059669,#064E3B)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} />
                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>{month}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All orders table */}
                <div style={S.card}>
                  <div style={S.cardHead}><h3 style={S.cardTitle}>📋 All Orders</h3><button style={S.cardLink} onClick={() => setTab('orders')}>Go to Orders →</button></div>
                  {orders.length === 0 ? <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>No orders yet.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: '#F9FAFB' }}>
                          {['Order #','Date','Items','Time Window','Amount','Status','Invoice'].map(h => (
                            <th key={h} style={{ padding: '11px 12px', color: '#6B7280', fontSize: 11, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {orders.map((row, i) => {
                            const sc = STATUS_CFG[row.status] || STATUS_CFG.pending;
                            return (
                              <tr key={row.order_id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#111827' }}>#{row.order_id}</td>
                                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6B7280' }}>{new Date(row.created_at).toLocaleDateString('en-AU')}</td>
                                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6B7280', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.items_summary || '—'}</td>
                                <td style={{ padding: '10px 12px', fontSize: 12, color: '#6B7280' }}>{row.delivery_time || 'Flexible'}</td>
                                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#059669' }}>${parseFloat(row.total_amount||0).toFixed(2)}</td>
                                <td style={{ padding: '10px 12px' }}><span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${sc.border}` }}>{row.status}</span></td>
                                <td style={{ padding: '10px 12px' }}><button onClick={() => downloadInvoice(row.order_id)} style={S.invoiceBtn}>📄 PDF</button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab === 'reviews' && (
          reviews.length === 0 ? (
            <div style={S.empty}>
              <p style={{ fontSize: 52 }}>⭐</p>
              <h2 style={{ color: '#111827', fontSize: 20, marginBottom: 8 }}>No reviews yet</h2>
              <p style={{ color: '#9CA3AF', marginBottom: 24 }}>Leave a review on any delivered order.</p>
              <button style={S.primaryBtn} onClick={() => setTab('orders')}>Go to Orders</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews.map(rev => (
                <div key={rev.review_id} style={{ ...S.card, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: 15 }}>{rev.listing_title || `Product #${rev.listing_id}`}</p>
                      <Stars n={rev.rating} />
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, flexShrink: 0 }}>{new Date(rev.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                  <p style={{ color: '#374151', fontSize: 14, margin: 0, lineHeight: 1.6, background: '#F9FAFB', padding: '10px 14px', borderRadius: 10, border: '1px solid #F3F4F6' }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <BuyerSettings
            user={user} orders={orders} onLogout={() => { logout(); navigate('/login'); }}
            settings={settings} setSettings={setSettings}
            pwForm={pwForm} setPwForm={setPwForm}
            saveSettings={saveSettings} changePassword={changePassword}
            savingSettings={savingSettings} savingPw={savingPw}
            notifs={notifs} setNotifs={setNotifs} saveNotifs={saveNotifs} savingNotifs={savingNotifs}
            privacy={privacy} setPrivacy={setPrivacy} savePrivacy={savePrivacy} savingPrivacy={savingPrivacy}
            securityStatus={securityStatus}
            sessions={sessions} sessionsLoading={sessionsLoading} revokeSession={revokeSession}
            exportMyData={exportMyData}
            openDelete={() => setDeleteOpen(true)}
          />
        )}
      </div>

      {/* ══ REVIEW MODAL ══ */}
      {reviewModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ color: '#111827', margin: 0, fontSize: 18, fontWeight: 800 }}>⭐ Leave a Review</h3>
              <button onClick={() => { setReviewModal({ open: false, listingId: null, title: '' }); setReviewRating(5); setReviewComment(''); }} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>
            </div>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ color: '#065F46', fontSize: 14, fontWeight: 700, margin: 0 }}>{reviewModal.title}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Your Rating</label>
              <Stars n={reviewRating} interactive onChange={setReviewRating} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Your Review</label>
              <textarea style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, minHeight: 110, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', lineHeight: 1.6 }}
                placeholder="Share your experience — freshness, quality, delivery speed..."
                value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={submitReview} disabled={submitting} style={{ flex: 2, padding: '12px 0', background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}>{submitting ? '⏳ Submitting...' : '✅ Submit Review'}</button>
              <button onClick={() => { setReviewModal({ open: false, listingId: null, title: '' }); setReviewRating(5); setReviewComment(''); }} style={{ flex: 1, padding: '12px 0', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE ACCOUNT MODAL ══ */}
      {deleteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ color: '#991B1B', margin: 0, fontSize: 18, fontWeight: 800 }}>🗑️ Delete Account</h3>
              <button onClick={() => { setDeleteOpen(false); setDeletePw(''); setDeleteReason(''); }} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>
            </div>
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ color: '#991B1B', fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                Closing your account disables login permanently. Your historical orders and reviews will be preserved for compliance. You can email privacy@farmmarket.com.au within 30 days to reopen it.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Reason (optional)</label>
              <textarea style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, minHeight: 70, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
                placeholder="Help us improve — why are you leaving?"
                value={deleteReason} onChange={e => setDeleteReason(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Confirm Password</label>
              <input type="password" autoComplete="current-password" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                placeholder="Enter your password to confirm"
                value={deletePw} onChange={e => setDeletePw(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeAccount} disabled={deleting || !deletePw} style={{ flex: 2, padding: '12px 0', background: deletePw ? '#DC2626' : '#FCA5A5', color: '#fff', border: 'none', borderRadius: 10, cursor: deletePw ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}>{deleting ? '⏳ Closing...' : '🗑️ Permanently Close Account'}</button>
              <button onClick={() => { setDeleteOpen(false); setDeletePw(''); setDeleteReason(''); }} style={{ flex: 1, padding: '12px 0', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════
const S = {
  shell:       { display: 'flex', minHeight: '100vh', background: '#F3F4F6' },
  spinner:     { width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  sidebar:     { background: '#064E3B', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.25s ease', overflow: 'hidden', position: 'sticky', top: 0, height: '100vh' },
  sideTop:     { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  profile:     { display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' },
  avatar:      { width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileName: { color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 },
  profileRole: { color: '#6EE7B7', fontSize: 11, fontWeight: 600, margin: 0 },
  collapseBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quickStats:  { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  quickStat:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '11px 4px', gap: 2 },
  qStatVal:    { fontSize: 14, fontWeight: 800 },
  qStatLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 },
  nav:         { display: 'flex', flexDirection: 'column', padding: '10px', gap: 2, flex: 1 },
  navSec:      { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '8px 8px 4px', margin: 0 },
  navItem:     { display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, width: '100%', transition: 'all 0.15s', fontFamily: 'inherit' },
  navActive:   { background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 },
  navIcon:     { fontSize: 17, flexShrink: 0, width: 22, textAlign: 'center' },
  navLabel:    { flex: 1, textAlign: 'left', whiteSpace: 'nowrap' },
  navBadge:    { borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 },
  sideBottom:  { padding: '10px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  alertCard:   { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 },
  alertTitle:  { color: '#FCA5A5', fontSize: 13, fontWeight: 700, margin: 0 },
  alertSub:    { color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 },
  logoutBtn:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  main:        { flex: 1, padding: '28px 32px', minWidth: 0 },
  topBar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  pageTitle:   { fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 3px' },
  pageSub:     { fontSize: 13, color: '#6B7280', margin: 0 },
  primaryBtn:  { display: 'inline-flex', alignItems: 'center', padding: '10px 22px', background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(5,150,105,0.3)', cursor: 'pointer', textDecoration: 'none' },
  refreshBtn:  { padding: '9px 16px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' },
  statGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 14, marginBottom: 24 },
  statCard:    { borderRadius: 14, padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: '1.5px solid', textAlign: 'center' },
  card:        { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6', marginBottom: 20 },
  cardHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:   { fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 },
  cardLink:    { background: 'none', border: 'none', color: '#059669', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  listRow:     { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F3F4F6' },
  rowName:     { fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta:     { fontSize: 12, color: '#9CA3AF', margin: 0 },
  quickAction: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 14px', borderRadius: 14, textAlign: 'center' },
  ordersList:  { display: 'flex', flexDirection: 'column', gap: 16 },
  orderCard:   { background: '#fff', borderRadius: 16, border: '1.5px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap', gap: 10 },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1.5px solid' },
  infoGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 1, borderBottom: '1px solid #F3F4F6' },
  infoCell:    { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: '#FAFAFA' },
  subtotalBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', flexWrap: 'wrap' },
  progressRow: { display: 'flex', alignItems: 'center', padding: '18px 20px', gap: 0 },
  cardFooter:  { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap', background: '#FAFAFA' },
  trackBtn:    { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#064E3B', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  invoiceBtn:  { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #BFDBFE', cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #FCA5A5', cursor: 'pointer', fontFamily: 'inherit' },
  reviewBtn:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#FFFBEB', color: '#D97706', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #FCD34D', cursor: 'pointer', fontFamily: 'inherit' },
  empty:       { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6' },
};

const SS = {
  wrap:     { display: 'flex', gap: 20, alignItems: 'flex-start' },
  snav:     { width: 185, background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #F3F4F6', flexShrink: 0, position: 'sticky', top: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  snavTitle:{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px 10px', margin: 0 },
  snavBtn:  { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#6B7280', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s' },
  snavAct:  { background: '#ECFDF5', color: '#065F46', fontWeight: 700 },
  scontent: { flex: 1, background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0 },
  toast:    { background: '#ECFDF5', border: '1.5px solid #6EE7B7', color: '#065F46', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: 20 },
  head:     { marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' },
  stitle:   { fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' },
  ssub:     { fontSize: 13, color: '#6B7280', margin: 0 },
  avatarRow:{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#F9FAFB', borderRadius: 14, marginBottom: 24, border: '1px solid #F3F4F6' },
  bigAvatar:{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#064E3B,#059669)', color: '#fff', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rolePill: { background: '#ECFDF5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #A7F3D0' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  fg:       { display: 'flex', flexDirection: 'column', gap: 6 },
  fl:       { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  fi:       { padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#111827', background: '#FAFAFA', width: '100%', boxSizing: 'border-box' },
  saveBtn:  { padding: '11px 28px', background: 'linear-gradient(135deg,#065F46,#059669)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' },
  tRow:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid #F9FAFB' },
  tLeft:    { display: 'flex', alignItems: 'center', gap: 14 },
  tIcon:    { width: 36, height: 36, background: '#F3F4F6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 },
  tLabel:   { fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 },
  tSub:     { fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' },
  toggle:   { width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  thumb:    { position: 'absolute', top: 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  danger:   { marginTop: 28, padding: 20, background: '#FEF2F2', borderRadius: 14, border: '1px solid #FCA5A5', marginBottom: 24 },
  dTitle:   { fontSize: 15, fontWeight: 700, color: '#991B1B', margin: '0 0 6px' },
  dSub:     { fontSize: 13, color: '#9CA3AF', margin: '0 0 16px' },
  dBtn:     { padding: '9px 18px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  dOutline: { padding: '9px 18px', background: '#fff', color: '#DC2626', border: '1.5px solid #FCA5A5', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  secGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
  secCard:  { display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, border: '1.5px solid' },
  pwCard:   { background: '#F9FAFB', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #F3F4F6' },
  pwTitle:  { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16, marginTop: 0 },
  sessRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' },
  revokeBtn:{ padding: '4px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};