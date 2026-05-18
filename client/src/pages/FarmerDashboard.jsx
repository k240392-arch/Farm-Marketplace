// pages/FarmerDashboard.jsx — Sidebar + Settings + Logout
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FarmerOrders from './FarmerOrders';
import FarmerEarnings from '../components/FarmerEarnings';
import AccountClosure from '../components/AccountClosure';
import ChangeEmail from '../components/ChangeEmail';

// shared settings styles
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
  bigAvatar:{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg, #064E3B, #059669)', color: '#fff', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rolePill: { background: '#ECFDF5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid #A7F3D0' },
  farmCard: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg, #ECFDF5,#F0FDF4)', borderRadius: 14, marginBottom: 24, border: '1px solid #A7F3D0' },
  payBanner:{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderRadius: 14, marginBottom: 24, border: '1px solid #FCD34D' },
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

// ── Toggle helper ──
function Toggle({ on, onClick }) {
  return (
    <button style={{ ...SS.toggle, background: on ? '#059669' : '#D1D5DB' }} onClick={onClick}>
      <span style={{ ...SS.thumb, transform: on ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  );
}

// ═══════════════════════════════════════════
//  FARMER SETTINGS
// ═══════════════════════════════════════════
function FarmerSettings({
  user,
  profile,  setProfile,  saveProfile,  savingProfile,
  farm,     setFarm,     saveFarm,     savingFarm,
  notifs,   setNotifs,   saveNotifs,   savingNotifs,
  privacy,  setPrivacy,  savePrivacy,  savingPrivacy,
  payout,   setPayout,   savePayout,   savingPayout,
  pwForm,   setPwForm,   changePassword, savingPw,
  securityStatus,
  sessions, sessionsLoading, revokeSession,
}) {
  const [sec, setSec] = useState('profile');

  const sections = [
    { k: 'profile', icon: '👤', label: 'Profile' },
    { k: 'farm',    icon: '🌾', label: 'Farm Details' },
    { k: 'notifs',  icon: '🔔', label: 'Notifications' },
    { k: 'privacy', icon: '🔒', label: 'Privacy & Data' },
    { k: 'security',icon: '🛡️', label: 'Security' },
    { k: 'payout',  icon: '💳', label: 'Payouts' },
  ];

  return (
    <div style={SS.wrap}>
      <div style={SS.snav}>
        <p style={SS.snavTitle}>Settings</p>
        {sections.map(({ k, icon, label }) => (
          <button key={k} onClick={() => setSec(k)} style={{ ...SS.snavBtn, ...(sec === k ? SS.snavAct : {}) }}>
            <span style={{ fontSize: 15 }}>{icon}</span>{label}
            {sec === k && <span style={{ marginLeft: 'auto', color: '#059669', fontWeight: 800 }}>›</span>}
          </button>
        ))}
      </div>

      <div style={SS.scontent}>

        {sec === 'profile' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Profile Information</h2><p style={SS.ssub}>How you appear to buyers on FarmMarket</p></div>
            <div style={SS.avatarRow}>
              <div style={SS.bigAvatar}>{(user?.full_name||'F')[0].toUpperCase()}</div>
              <div>
                <p style={{ fontWeight:700,fontSize:15,color:'#111827',margin:0 }}>{user?.full_name}</p>
                <p style={{ color:'#6B7280',fontSize:13,margin:'4px 0 10px' }}>{user?.email}</p>
                <span style={SS.rolePill}>🌾 Farmer Account</span>
              </div>
            </div>
            <div style={SS.grid2}>
              {[['Full Name','full_name','text','Your full name'],['Phone','phone','tel','+61 4xx xxx xxx'],['Location','location','text','e.g. Geelong, VIC']].map(([lbl,k,t,ph]) => (
                <div key={k} style={SS.fg}><label style={SS.fl}>{lbl}</label><input type={t} placeholder={ph} value={profile[k] || ''} onChange={e => setProfile(p=>({...p,[k]:e.target.value}))} style={SS.fi}/></div>
              ))}
              <div style={{...SS.fg,gridColumn:'1/-1'}}><label style={SS.fl}>Bio</label><textarea placeholder="Tell buyers about yourself and your farming story..." value={profile.bio || ''} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} style={{...SS.fi,height:88,resize:'vertical'}}/></div>
            </div>
            <button style={SS.saveBtn} disabled={savingProfile} onClick={saveProfile}>{savingProfile ? '⏳ Saving...' : 'Save Profile'}</button>

            {/* ── Change email (real, saves to DB) ── */}
            <div style={{ marginTop:24 }}><ChangeEmail /></div>
          </div>
        )}

        {sec === 'farm' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Farm Details</h2><p style={SS.ssub}>Shown on all your listings and farm page</p></div>
            <div style={SS.farmCard}><span style={{fontSize:34}}>🚜</span><div><p style={{fontWeight:700,color:'#065F46',fontSize:15,margin:0}}>Farm Profile</p><p style={{color:'#6B7280',fontSize:13,margin:'4px 0 0'}}>Visible to all buyers browsing your listings</p></div></div>
            <div style={SS.grid2}>
              <div style={SS.fg}><label style={SS.fl}>Farm Name</label><input placeholder="e.g. Green Valley Farm" value={farm.farm_name || ''} onChange={e=>setFarm(f=>({...f,farm_name:e.target.value}))} style={SS.fi}/></div>
              <div style={SS.fg}><label style={SS.fl}>ABN</label><input placeholder="xx xxx xxx xxx" value={farm.abn || ''} onChange={e=>setFarm(f=>({...f,abn:e.target.value}))} style={SS.fi}/></div>
              <div style={SS.fg}><label style={SS.fl}>Delivery Radius (km)</label><select value={farm.delivery_radius || '25'} onChange={e=>setFarm(f=>({...f,delivery_radius:e.target.value}))} style={SS.fi}>{['10','25','50','100','Australia-wide'].map(r=><option key={r}>{r}</option>)}</select></div>
              <div style={SS.fg}><label style={SS.fl}>Pickup Available</label><Toggle on={!!farm.pickup} onClick={() => setFarm(f=>({...f,pickup:!f.pickup}))}/></div>
              <div style={{...SS.fg,gridColumn:'1/-1'}}><label style={SS.fl}>Farm Description</label><textarea placeholder="Describe your farm — practices, certifications, what you grow..." value={farm.description || ''} onChange={e=>setFarm(f=>({...f,description:e.target.value}))} style={{...SS.fi,height:100,resize:'vertical'}}/></div>
            </div>
            <button style={SS.saveBtn} disabled={savingFarm} onClick={saveFarm}>{savingFarm ? '⏳ Saving...' : 'Save Farm Details'}</button>
          </div>
        )}

        {sec === 'notifs' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Notification Preferences</h2><p style={SS.ssub}>Choose what alerts you receive as a farmer</p></div>
            {[
              {k:'new_orders',    icon:'🛒',label:'New Orders',           sub:'Instant alert when a buyer places an order'},
              {k:'order_updates', icon:'📦',label:'Order Status Updates',  sub:'When orders are cancelled or changed by buyers'},
              {k:'low_stock',     icon:'⚠️',label:'Low Stock Alerts',      sub:'When any listing drops below 5 units'},
              {k:'weekly_report', icon:'📊',label:'Weekly Sales Report',   sub:'Summary of sales, revenue and performance'},
              {k:'buyer_messages',icon:'💬',label:'Buyer Messages',         sub:'Messages from buyers about your listings'},
              {k:'promotions',    icon:'🏷️',label:'Platform Promotions',   sub:'FarmMarket tips, feature updates and offers'},
            ].map(({k,icon,label,sub}) => (
              <div key={k} style={SS.tRow}>
                <div style={SS.tLeft}><span style={SS.tIcon}>{icon}</span><div><p style={SS.tLabel}>{label}</p><p style={SS.tSub}>{sub}</p></div></div>
                <Toggle on={!!notifs[k]} onClick={() => setNotifs(n=>({...n,[k]:!n[k]}))}/>
              </div>
            ))}
            <br/><button style={SS.saveBtn} disabled={savingNotifs} onClick={saveNotifs}>{savingNotifs ? '⏳ Saving...' : 'Save Preferences'}</button>
          </div>
        )}

        {sec === 'privacy' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Privacy & Data</h2><p style={SS.ssub}>Control your data and farm visibility</p></div>
            {[
              {k:'profile_public',icon:'👁️',label:'Public Farm Profile',     sub:'Allow buyers to browse your farm page'},
              {k:'show_reviews',  icon:'⭐',label:'Display Reviews',          sub:'Show buyer reviews on your listings'},
              {k:'data_analytics',icon:'📈',label:'Usage Analytics',          sub:'Help improve FarmMarket with anonymous data'},
              {k:'marketing',     icon:'🎯',label:'Personalised Marketing',   sub:'Receive tailored platform recommendations'},
            ].map(({k,icon,label,sub}) => (
              <div key={k} style={SS.tRow}>
                <div style={SS.tLeft}><span style={SS.tIcon}>{icon}</span><div><p style={SS.tLabel}>{label}</p><p style={SS.tSub}>{sub}</p></div></div>
                <Toggle on={!!privacy[k]} onClick={() => setPrivacy(p=>({...p,[k]:!p[k]}))}/>
              </div>
            ))}
            <button style={SS.saveBtn} disabled={savingPrivacy} onClick={savePrivacy}>{savingPrivacy ? '⏳ Saving...' : 'Save Settings'}</button>

            {/* ── Real data export + account closure (GDPR / Australian Privacy Act compliance) ── */}
            <div style={{ marginTop:28 }}>
              <AccountClosure />
            </div>
          </div>
        )}

        {/* APPEARANCE — removed */}

        {sec === 'security' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Security</h2><p style={SS.ssub}>Keep your farmer account safe and secure</p></div>
            <div style={SS.secGrid}>
              {(() => {
                const s = securityStatus;
                const days = s?.password_age_days;
                const cards = [
                  {
                    label: 'Email Verified',
                    sub:   s?.email_verified ? 'Your email is confirmed' : 'Please verify your email address',
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
                    sub:   s?.two_factor_enabled ? 'Enabled' : 'Not enabled — recommended',
                    ok:    !!s?.two_factor_enabled,
                  },
                  {
                    label: 'Login Alerts',
                    sub:   s?.login_alerts_enabled ? 'Enabled for new devices' : 'No login history yet',
                    ok:    !!s?.login_alerts_enabled,
                  },
                ];
                return cards.map(({ label, sub, ok }) => (
                  <div key={label} style={{...SS.secCard,borderColor:ok?'#A7F3D0':'#FCD34D',background:ok?'#F0FDF4':'#FFFBEB'}}>
                    <span style={{fontSize:22}}>{ok ? '✅' : '⚠️'}</span>
                    <div><p style={{fontWeight:700,fontSize:13,color:ok?'#065F46':'#92400E',margin:0}}>{label}</p><p style={{fontSize:12,color:'#6B7280',margin:0}}>{sub}</p></div>
                  </div>
                ));
              })()}
            </div>
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Change Password</h3>
              <div style={SS.grid2}>
                <div style={SS.fg}><label style={SS.fl}>Current Password</label><input type="password" placeholder="••••••••" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} style={SS.fi}/></div>
                <div style={SS.fg}><label style={SS.fl}>New Password</label><input type="password" placeholder="Min 6 characters" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} style={SS.fi}/></div>
                <div style={{...SS.fg,gridColumn:'1/-1'}}><label style={SS.fl}>Confirm New Password</label><input type="password" placeholder="Repeat new password" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} style={SS.fi}/></div>
              </div>
              <button style={SS.saveBtn} disabled={savingPw} onClick={changePassword}>{savingPw ? '⏳ Changing...' : '🔒 Update Password'}</button>
            </div>
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Active Sessions</h3>
              {sessionsLoading ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '8px 0' }}>Loading sessions…</p>
              ) : sessions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '8px 0' }}>No recent sessions found.</p>
              ) : sessions.map((s) => {
                const last = s.last_seen ? new Date(s.last_seen) : null;
                const diffMin = last ? Math.floor((Date.now() - last.getTime()) / 60000) : 0;
                const timeLabel = s.is_current
                  ? 'Now — Current session'
                  : diffMin < 60   ? `${diffMin} min${diffMin === 1 ? '' : 's'} ago`
                  : diffMin < 1440 ? `${Math.floor(diffMin/60)} hour${Math.floor(diffMin/60) === 1 ? '' : 's'} ago`
                  : `${Math.floor(diffMin/1440)} day${Math.floor(diffMin/1440) === 1 ? '' : 's'} ago`;
                return (
                  <div key={s.id} style={SS.sessRow}>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:600,fontSize:14,color:'#111827',margin:0}}>{s.device}</p>
                      <p style={{fontSize:12,color:'#9CA3AF',margin:'2px 0 0'}}>{s.ip_address || 'Unknown IP'} · {timeLabel}</p>
                    </div>
                    {s.is_current
                      ? <span style={{fontSize:12,background:'#ECFDF5',color:'#065F46',padding:'3px 10px',borderRadius:20,fontWeight:600}}>This device</span>
                      : <button style={SS.revokeBtn} onClick={() => revokeSession(s.key)}>Revoke</button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sec === 'payout' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Payout Settings</h2><p style={SS.ssub}>Where FarmMarket sends your earnings</p></div>
            <div style={SS.payBanner}><span style={{fontSize:32}}>💰</span><div><p style={{fontWeight:700,fontSize:15,color:'#065F46',margin:0}}>Secure Bank Transfer</p><p style={{fontSize:13,color:'#6B7280',margin:'4px 0 0'}}>Funds transferred directly to your Australian bank account</p></div></div>
            <div style={SS.grid2}>
              <div style={{...SS.fg,gridColumn:'1/-1'}}><label style={SS.fl}>Bank Name</label><input placeholder="e.g. Commonwealth Bank" value={payout.bank_name || ''} onChange={e=>setPayout(p=>({...p,bank_name:e.target.value}))} style={SS.fi}/></div>
              <div style={SS.fg}><label style={SS.fl}>BSB Number</label><input placeholder="xxx-xxx" value={payout.bsb || ''} onChange={e=>setPayout(p=>({...p,bsb:e.target.value}))} style={SS.fi}/></div>
              <div style={SS.fg}><label style={SS.fl}>Account Number</label><input placeholder="xxxxxxxxxx" value={payout.account || ''} onChange={e=>setPayout(p=>({...p,account:e.target.value}))} style={SS.fi}/></div>
              <div style={SS.fg}><label style={SS.fl}>Payout Schedule</label><select value={payout.schedule || 'weekly'} onChange={e=>setPayout(p=>({...p,schedule:e.target.value}))} style={SS.fi}><option value="daily">Daily</option><option value="weekly">Weekly (every Monday)</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option></select></div>
            </div>
            <div style={{background:'#FFFBEB',border:'1px solid #FCD34D',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#92400E'}}>
              🔒 Your banking details are encrypted. FarmMarket never shares this information.
            </div>
            <button style={SS.saveBtn} disabled={savingPayout} onClick={savePayout}>{savingPayout ? '⏳ Saving...' : 'Save Payout Details'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MAIN DASHBOARD
// ═══════════════════════════════════════════
export default function FarmerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab,      setTab]      = useState('overview');
  const [listings, setListings] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');
  const [editId,      setEditId]      = useState(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty,   setRestockQty]  = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [form, setForm] = useState({ product_id:'',title:'',description:'',price:'',quantity:'',unit:'kg',category_id:'',location:'',image:null,is_active:1 });
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogSearch,   setCatalogSearch]   = useState('');

  useEffect(() => {
    loadListings();
    loadOrders();
    api.get('/categories').then(r=>setCategories(r.data)).catch(()=>{});
    // Load full catalog (used by the Add Listing → Pick a product flow)
    api.get('/products?limit=200').then(r=>setCatalogProducts(r.data.products||[])).catch(()=>{});
  }, []);
  const loadListings = () => api.get('/listings/farmer/mine').then(r=>setListings(r.data)).catch(()=>{});
  const loadOrders   = () => api.get('/orders/my').then(r=>setOrders(r.data)).catch(()=>{});
  const handleLogout = () => { logout(); navigate('/'); };

  // ─────────────────────────────────────────────────────────
  //  SETTINGS — fully wired to backend
  // ─────────────────────────────────────────────────────────
  // Profile (saves to /auth/profile + /settings for bio)
  const [profile, setProfile] = useState({ full_name: '', phone: '', location: '', bio: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Per-section settings (saved to /api/settings)
  const [farm,    setFarm]    = useState({ farm_name: '', abn: '', description: '', delivery_radius: '25', pickup: true });
  const [notifs,  setNotifs]  = useState({ new_orders: true, order_updates: true, low_stock: true, weekly_report: true, buyer_messages: false, promotions: false });
  const [privacy, setPrivacy] = useState({ profile_public: true, show_reviews: true, data_analytics: false, marketing: false });
  const [payout,  setPayout]  = useState({ bank_name: '', bsb: '', account: '', schedule: 'weekly' });
  const [savingFarm,    setSavingFarm]    = useState(false);
  const [savingNotifs,  setSavingNotifs]  = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingPayout,  setSavingPayout]  = useState(false);

  // Security: password change + status cards + active sessions
  const [pwForm,         setPwForm]         = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPw,       setSavingPw]       = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [sessionsLoading,setSessionsLoading]= useState(false);

  // Seed profile fields from logged-in user (full_name + phone from /users).
  // Location and bio come from the settings load below.
  useEffect(() => {
    if (!user) return;
    setProfile(p => ({
      ...p,
      full_name: user.full_name || '',
      phone:     user.phone     || '',
      location:  user.address   || p.location,
    }));
  }, [user]);

  // Load all server-backed settings (farm/notifs/privacy/payouts/bio) on mount
  useEffect(() => {
    api.get('/settings').then(r => {
      const d = r.data || {};
      if (d.farm_details)  setFarm(f => ({ ...f, ...d.farm_details }));
      if (d.notifications) setNotifs(n => ({ ...n, ...d.notifications }));
      if (d.privacy)       setPrivacy(p => ({ ...p, ...d.privacy }));
      if (d.payouts)       setPayout(p => ({ ...p, ...d.payouts }));
      if (typeof d.bio === 'string') setProfile(p => ({ ...p, bio: d.bio }));
    }).catch(() => { /* defaults are fine */ });
  }, []);

  // Load security status + sessions when the Settings tab opens
  useEffect(() => {
    if (tab !== 'settings') return;
    api.get('/auth/security-status').then(r => setSecurityStatus(r.data)).catch(() => setSecurityStatus(null));
    setSessionsLoading(true);
    api.get('/auth/sessions')
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [tab]);

  // ── Save handlers ────────────────────────────────────────
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      // 1) profile (users table)
      const res = await api.patch('/auth/profile', {
        full_name: profile.full_name,
        phone:     profile.phone,
        location:  profile.location,
      });
      // 2) bio (user_settings table — separate column)
      await api.patch('/settings', { section: 'bio', value: profile.bio || '' });

      updateUser(res?.data?.user || { full_name: profile.full_name, phone: profile.phone, address: profile.location });
      setMsg('✅ Profile updated!');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Profile update failed.'));
    } finally { setSavingProfile(false); }
  };

  const saveFarm = async () => {
    setSavingFarm(true);
    try { await api.patch('/settings', { section: 'farm_details', value: farm }); setMsg('✅ Farm details saved!'); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Save failed.')); }
    finally { setSavingFarm(false); }
  };

  const saveNotifs = async () => {
    setSavingNotifs(true);
    try { await api.patch('/settings', { section: 'notifications', value: notifs }); setMsg('✅ Notification preferences saved!'); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Save failed.')); }
    finally { setSavingNotifs(false); }
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try { await api.patch('/settings', { section: 'privacy', value: privacy }); setMsg('✅ Privacy settings saved!'); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Save failed.')); }
    finally { setSavingPrivacy(false); }
  };

  const savePayout = async () => {
    setSavingPayout(true);
    try { await api.patch('/settings', { section: 'payouts', value: payout }); setMsg('✅ Payout settings saved!'); }
    catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Save failed.')); }
    finally { setSavingPayout(false); }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { setMsg('❌ Passwords do not match.'); return; }
    if (pwForm.new_password.length < 6) { setMsg('❌ Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      await api.patch('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setMsg('✅ Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      // Refresh security status so "Last changed" updates
      api.get('/auth/security-status').then(r => setSecurityStatus(r.data)).catch(() => {});
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Password change failed.'));
    } finally { setSavingPw(false); }
  };

  const revokeSession = async (key) => {
    if (!window.confirm('Revoke this session? The device will need to log in again.')) return;
    try {
      await api.post('/auth/sessions/revoke', { key });
      setMsg('✅ Session revoked.');
      // Reload list
      setSessionsLoading(true);
      const r = await api.get('/auth/sessions');
      setSessions(r.data.sessions || []);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Could not revoke.'));
    } finally { setSessionsLoading(false); }
  };

  const generateDescription = async () => {
    if (!form.title || !form.category_id) { setMsg('⚠️ Enter a title and category first.'); return; }
    setAiLoading(true);
    try {
      const catName = categories.find(c=>c.category_id==form.category_id)?.name||'';
      const res = await api.post('/ai/describe',{title:form.title,category:catName,price:form.price||5,unit:form.unit});
      setForm(f=>({...f,description:res.data.description})); setMsg('✅ AI description generated!');
    } catch { setMsg('⚠️ AI unavailable.'); }
    setAiLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k,v])=>{ if(k!=='image'&&v!==null&&v!=='') data.append(k,v); });
    if (form.image) data.append('image',form.image);
    try {
      if (editId) { await api.put(`/listings/${editId}`,data,{headers:{'Content-Type':'multipart/form-data'}}); setMsg('✅ Listing updated!'); }
      else        { await api.post('/listings',data,{headers:{'Content-Type':'multipart/form-data'}}); setMsg('✅ Listing created!'); }
      resetForm(); loadListings(); setTab('listings');
    } catch(err) { setMsg('❌ '+(err.response?.data?.message||'Error saving.')); }
    setLoading(false);
  };

  const handleDelete = async (id,title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/listings/${id}`); setMsg(`✅ "${title}" deleted.`); loadListings(); }
    catch(err) { setMsg('❌ '+(err.response?.data?.message||'Error.')); }
  };

  const handleToggleStatus = async (l) => {
    const s = l.is_active?0:1;
    try { const d=new FormData(); d.append('is_active',s); await api.put(`/listings/${l.listing_id}`,d,{headers:{'Content-Type':'multipart/form-data'}}); setMsg(`✅ "${l.title}" ${s?'activated':'deactivated'}.`); loadListings(); }
    catch { setMsg('❌ Error updating.'); }
  };

  const handleRestock = async () => {
    if (!restockQty||isNaN(restockQty)||Number(restockQty)<=0){setMsg('⚠️ Enter a valid quantity.');return;}
    setRestockLoading(true);
    try { await api.patch(`/listings/${restockModal.listing_id}/restock`,{add_quantity:Number(restockQty)}); setMsg(`✅ Restocked "${restockModal.title}".`); setRestockModal(null); setRestockQty(''); loadListings(); }
    catch(err){setMsg('❌ '+(err.response?.data?.message||'Restock failed.'));}
    setRestockLoading(false);
  };

  const handleMarkOut = async (l) => {
    if (!window.confirm(`Mark "${l.title}" as out of stock?`)) return;
    try { await api.patch(`/listings/${l.listing_id}/out-of-stock`); setMsg(`✅ "${l.title}" marked out of stock.`); loadListings(); }
    catch(err){setMsg('❌ '+(err.response?.data?.message||'Error.'));}
  };

  const handleMarkIn = async (l) => {
    try { await api.patch(`/listings/${l.listing_id}/in-stock`); setMsg(`✅ "${l.title}" marked in stock.`); loadListings(); }
    catch(err){setMsg('❌ '+(err.response?.data?.message||'Error.'));}
  };

  const handleEdit = (l) => {
    setForm({product_id:l.product_id||'',title:l.title,description:l.description||'',price:l.price,quantity:l.quantity,unit:l.unit||'kg',category_id:l.category_id,location:l.location||'',image:null,is_active:l.is_active});
    setEditId(l.listing_id); setTab('add'); setMsg(''); window.scrollTo(0,0);
  };

  const resetForm = () => { setForm({product_id:'',title:'',description:'',price:'',quantity:'',unit:'kg',category_id:'',location:'',image:null,is_active:1}); setEditId(null); setCatalogSearch(''); };
  useEffect(() => { if(msg){const t=setTimeout(()=>setMsg(''),4000);return()=>clearTimeout(t);} },[msg]);

  const totalRevenue   = orders.reduce((s,o)=>s+Number(o.total_amount||0),0);
  const activeListings = listings.filter(l=>l.is_active).length;
  const lowStock       = listings.filter(l=>l.quantity<5&&l.is_active).length;
  const pendingOrders  = orders.filter(o=>o.status==='pending').length;

  const navItems = [
    {key:'overview', icon:'📊', label:'Overview'},
    {key:'listings', icon:'📋', label:'My Listings', badge:listings.length},
    {key:'add',      icon:editId?'✏️':'➕', label:editId?'Edit Listing':'Add Listing'},
    {key:'orders',   icon:'📦', label:'Orders', badge:pendingOrders, red:true},
    {key:'earnings', icon:'💰', label:'Earnings'},
    {key:'settings', icon:'⚙️', label:'Settings'},
  ];

  return (
    <div style={S.shell}>

      {/* SIDEBAR */}
      <aside style={{...S.sidebar, width:sidebarOpen?240:68}}>
        <div style={S.sideTop}>
          {sidebarOpen && (
            <div style={S.profile}>
              <div style={S.avatar}>{(user?.full_name||'F')[0].toUpperCase()}</div>
              <div style={{overflow:'hidden',flex:1}}>
                <p style={S.profileName}>{user?.full_name}</p>
                <p style={S.profileRole}>🌾 Farmer</p>
              </div>
            </div>
          )}
          {!sidebarOpen && <div style={{...S.avatar,margin:'0 auto'}}>{(user?.full_name||'F')[0].toUpperCase()}</div>}
          <button style={S.collapseBtn} onClick={()=>setSidebarOpen(o=>!o)}>{sidebarOpen?'‹':'›'}</button>
        </div>

        {sidebarOpen && (
          <div style={S.quickStats}>
            {[{label:'Active',value:activeListings,color:'#6EE7B7'},{label:'Orders',value:orders.length,color:'#93C5FD'},{label:'Revenue',value:`$${totalRevenue.toFixed(0)}`,color:'#FCD34D'}].map(({label,value,color},i,arr)=>(
              <div key={label} style={{...S.quickStat,borderRight:i<arr.length-1?'1px solid rgba(255,255,255,0.1)':'none'}}>
                <span style={{...S.qStatVal,color}}>{value}</span>
                <span style={S.qStatLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <nav style={S.nav}>
          {sidebarOpen && <p style={S.navSec}>NAVIGATION</p>}
          {navItems.map(({key,icon,label,badge,red})=>(
            <button key={key} onClick={()=>{setTab(key);if(key!=='add'){resetForm();setMsg('');}}}
              style={{...S.navItem,...(tab===key?S.navActive:{}),justifyContent:sidebarOpen?'flex-start':'center'}}
              title={!sidebarOpen?label:undefined}>
              <span style={S.navIcon}>{icon}</span>
              {sidebarOpen && <>
                <span style={S.navLabel}>{label}</span>
                {badge>0 && <span style={{...S.navBadge,background:red?'#EF4444':'rgba(255,255,255,0.15)'}}>{badge}</span>}
              </>}
            </button>
          ))}
        </nav>

        <div style={S.sideBottom}>
          {sidebarOpen && lowStock>0 && (
            <div style={S.alertCard}><span style={{fontSize:18}}>⚠️</span><div><p style={S.alertTitle}>{lowStock} Low Stock</p><p style={S.alertSub}>Items need restocking</p></div></div>
          )}
          {sidebarOpen && lowStock===0 && listings.length>0 && (
            <div style={{...S.alertCard,background:'rgba(110,231,183,0.1)',borderColor:'rgba(110,231,183,0.25)'}}>
              <span style={{fontSize:18}}>✅</span><div><p style={{...S.alertTitle,color:'#6EE7B7'}}>All stocked up</p><p style={S.alertSub}>No low stock alerts</p></div>
            </div>
          )}
          <button style={S.logoutBtn} onClick={handleLogout} title="Logout">
            <span style={{fontSize:16}}>⏻</span>{sidebarOpen&&'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topBar}>
          <div>
            <h1 style={S.pageTitle}>
              {tab==='overview'&&'📊 Overview'}{tab==='listings'&&'📋 My Listings'}
              {tab==='add'&&(editId?'✏️ Edit Listing':'➕ Add New Listing')}{tab==='orders'&&'📦 Orders'}{tab==='earnings'&&'💰 Earnings'}{tab==='settings'&&'⚙️ Settings'}
            </h1>
            <p style={S.pageSub}>
              {tab==='overview'&&`Welcome back, ${user?.full_name}`}{tab==='listings'&&`${listings.length} total · ${activeListings} active`}
              {tab==='add'&&(editId?'Update your listing details':'List a new product for buyers')}{tab==='orders'&&`${orders.length} received · ${pendingOrders} pending`}
              {tab==='earnings'&&'Net earnings, pending payouts, and platform commission breakdown'}
              {tab==='settings'&&'Manage your account, farm and preferences'}
            </p>
          </div>
          {tab==='listings' && <button style={S.primaryBtn} onClick={()=>{resetForm();setTab('add');}}>+ Add Listing</button>}
        </div>

        {msg && <div style={{...S.toast,background:msg.startsWith('✅')?'#ECFDF5':msg.startsWith('⚠️')?'#FFFBEB':'#FEF2F2',borderColor:msg.startsWith('✅')?'#6EE7B7':msg.startsWith('⚠️')?'#FCD34D':'#FCA5A5',color:msg.startsWith('✅')?'#065F46':msg.startsWith('⚠️')?'#92400E':'#991B1B'}}>{msg}</div>}

        {tab==='overview' && (
          <div>
            <div style={S.statGrid}>
              {[{icon:'✅',label:'Active Listings',value:activeListings,color:'#059669',bg:'#ECFDF5',border:'#A7F3D0'},{icon:'📦',label:'Total Listings',value:listings.length,color:'#2563EB',bg:'#EFF6FF',border:'#BFDBFE'},{icon:'🛒',label:'Orders Received',value:orders.length,color:'#7C3AED',bg:'#F5F3FF',border:'#C4B5FD'},{icon:'💰',label:'Total Revenue',value:`$${totalRevenue.toFixed(2)}`,color:'#D97706',bg:'#FFFBEB',border:'#FCD34D'},{icon:'⚠️',label:'Low Stock',value:lowStock,color:'#DC2626',bg:'#FEF2F2',border:'#FCA5A5'},{icon:'📈',label:'Avg Order Value',value:orders.length?`$${(totalRevenue/orders.length).toFixed(2)}`:'—',color:'#0891B2',bg:'#ECFEFF',border:'#A5F3FC'}].map(({icon,label,value,color,bg,border})=>(
                <div key={label} style={{...S.statCard,background:bg,borderColor:border}}>
                  <span style={{fontSize:26}}>{icon}</span>
                  <span style={{fontSize:22,fontWeight:800,color}}>{value}</span>
                  <span style={{fontSize:12,color:'#6B7280',fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
            {listings.length>0 && (
              <div style={S.card}>
                <div style={S.cardHead}><h3 style={S.cardTitle}>Recent Listings</h3><button style={S.cardLink} onClick={()=>setTab('listings')}>View all →</button></div>
                {listings.slice(0,5).map((l,i)=>(
                  <div key={l.listing_id} style={{...S.listRow,borderTop:i===0?'1px solid #F3F4F6':'none'}}>
                    {l.image_url?<img src={l.image_url.startsWith('http')?l.image_url:`http://localhost:5001${l.image_url}`} alt={l.title} style={S.rowImg} onError={e=>{e.target.style.display='none';}}/>:<div style={S.rowImgPh}>🥦</div>}
                    <div style={{flex:1,minWidth:0}}><p style={S.rowName}>{l.title}</p><p style={S.rowMeta}>{l.category_name} · ${Number(l.price).toFixed(2)}/{l.unit}</p></div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{fontSize:14,fontWeight:700,color:l.quantity<5?'#DC2626':'#059669',margin:0}}>{l.quantity} {l.unit}</p>
                      <p style={{fontSize:11,color:'#9CA3AF',margin:0}}>{l.is_active?'Active':'Inactive'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==='listings' && (
          listings.length===0 ? (
            <div style={S.empty}><p style={{fontSize:52}}>🌱</p><h3 style={{color:'#111827',fontSize:20,marginBottom:8}}>No listings yet</h3><p style={{color:'#9CA3AF',marginBottom:24}}>Add your first produce to start selling.</p><button style={S.primaryBtn} onClick={()=>setTab('add')}>+ Add First Listing</button></div>
          ) : (
            <div style={S.card}>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>{['Product','Category','Price','Stock','Status','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {listings.map((l,i)=>(
                      <tr key={l.listing_id} style={{background:i%2===0?'#fff':'#FAFAFA'}}>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            {l.image_url?<img src={l.image_url.startsWith('http')?l.image_url:`http://localhost:5001${l.image_url}`} alt={l.title} style={S.tableImg} onError={e=>{e.target.style.display='none';}}/>:<div style={S.tableImgBlank}>🥦</div>}
                            <span style={{fontWeight:600,fontSize:14,color:'#111827'}}>{l.title}</span>
                          </div>
                        </td>
                        <td style={S.td}><span style={S.catTag}>{l.category_name}</span></td>
                        <td style={S.td}><span style={{fontWeight:700,color:'#059669'}}>${Number(l.price).toFixed(2)}</span><span style={{color:'#9CA3AF',fontSize:12}}>/{l.unit}</span></td>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontWeight:700,color:l.quantity<5?'#DC2626':l.quantity<20?'#D97706':'#059669'}}>{l.quantity}</span>
                            {l.quantity<5&&<span style={S.lowBadge}>Low</span>}
                          </div>
                        </td>
                        <td style={S.td}><button onClick={()=>handleToggleStatus(l)} style={{...S.statusToggle,background:l.is_active?'#ECFDF5':'#FEF2F2',color:l.is_active?'#065F46':'#991B1B',borderColor:l.is_active?'#6EE7B7':'#FCA5A5'}}>● {l.is_active?'Active':'Inactive'}</button></td>
                        <td style={S.td}>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            <button style={{...S.iconBtn,background:'#EFF6FF',color:'#1D4ED8',borderColor:'#BFDBFE'}} onClick={()=>{setRestockModal(l);setRestockQty('');}} title="Restock">🔄</button>
                            <button style={{...S.iconBtn,background:'#FFF7ED',color:'#C2410C',borderColor:'#FED7AA'}} onClick={()=>handleMarkOut(l)} title="Out of stock" disabled={l.quantity===0}>⏸</button>
                            <button style={{...S.iconBtn,background:'#ECFDF5',color:'#065F46',borderColor:'#6EE7B7'}} onClick={()=>handleMarkIn(l)} title="In stock" disabled={!!l.is_active&&l.quantity>0}>▶</button>
                            <button style={{...S.iconBtn,background:'#F5F3FF',color:'#6D28D9',borderColor:'#C4B5FD'}} onClick={()=>handleEdit(l)} title="Edit">✏️</button>
                            <button style={{...S.iconBtn,background:'#FEF2F2',color:'#DC2626',borderColor:'#FCA5A5'}} onClick={()=>handleDelete(l.listing_id,l.title)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {tab==='add' && (
          <div style={{maxWidth:760}}>
            <div style={S.card}>

              {/* ── Step 1 — Pick from catalog ─────────────────────── */}
              <div style={{marginBottom:24, paddingBottom:24, borderBottom:'1px solid #F3F4F6'}}>
                <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:6}}>
                  <span style={{background:'#065F46',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,letterSpacing:0.5}}>STEP 1</span>
                  <h3 style={{margin:0,fontSize:16,fontWeight:700,color:'#111827'}}>Pick a product from the catalog</h3>
                </div>
                <p style={{fontSize:13,color:'#6B7280',margin:'0 0 14px'}}>
                  Choose what you're selling from our catalog. The product name, description, and image are all standardised — you only set price, quantity, and location.
                </p>

                {/* Selected product preview OR picker */}
                {form.product_id ? (
                  (() => {
                    const sel = catalogProducts.find(p=>p.product_id==form.product_id);
                    if (!sel) return null;
                    return (
                      <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',background:'#F0FDF4',border:'1.5px solid #A7F3D0',borderRadius:12}}>
                        <img src={sel.image_url} alt={sel.name}
                             onError={e=>{e.currentTarget.src='https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&auto=format&fit=crop&q=70';}}
                             style={{width:56,height:56,borderRadius:10,objectFit:'cover',flexShrink:0,background:'#fff'}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{margin:0,fontSize:14,fontWeight:700,color:'#065F46'}}>{sel.name}</p>
                          <p style={{margin:'2px 0 0',fontSize:12,color:'#059669'}}>
                            {sel.category_name} · {sel.offers_count||0} other {sel.offers_count===1?'farmer':'farmers'} selling this
                          </p>
                        </div>
                        <button type="button"
                                onClick={()=>setForm(f=>({...f,product_id:'',title:'',category_id:'',unit:'kg'}))}
                                style={{background:'#fff',border:'1.5px solid #A7F3D0',color:'#065F46',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
                          Change
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder="🔍 Search catalog... (e.g. tomato, mango, honey)"
                      value={catalogSearch}
                      onChange={e=>setCatalogSearch(e.target.value)}
                      style={{...SS.fi,marginBottom:12}}
                    />

                    {/* Catalog grid */}
                    <div style={{
                      maxHeight:360, overflowY:'auto',
                      border:'1px solid #E5E7EB', borderRadius:12, padding:8,
                      display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8,
                    }}>
                      {catalogProducts
                        .filter(p => !catalogSearch || p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category_name?.toLowerCase().includes(catalogSearch.toLowerCase()))
                        .slice(0,60)
                        .map(p => (
                          <button
                            key={p.product_id}
                            type="button"
                            onClick={()=>setForm(f=>({
                              ...f,
                              product_id:  p.product_id,
                              title:       p.name,
                              category_id: p.category_id,
                              unit:        p.default_unit || 'kg',
                              description: f.description || p.description || '',
                            }))}
                            style={{
                              display:'flex',flexDirection:'column',gap:6,padding:8,
                              background:'#fff',border:'1.5px solid #E5E7EB',
                              borderRadius:10,cursor:'pointer',textAlign:'left',
                              fontFamily:'inherit',transition:'all .15s ease',
                            }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#059669';e.currentTarget.style.background='#F0FDF4';}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.background='#fff';}}
                          >
                            <img src={p.image_url} alt={p.name}
                                 onError={e=>{e.currentTarget.src='https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&auto=format&fit=crop&q=70';}}
                                 style={{width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:6,background:'#F3F4F6'}}/>
                            <div>
                              <p style={{margin:0,fontSize:13,fontWeight:600,color:'#111827',lineHeight:1.3}}>{p.name}</p>
                              <p style={{margin:'2px 0 0',fontSize:11,color:'#9CA3AF'}}>{p.category_name}</p>
                            </div>
                          </button>
                        ))
                      }
                      {catalogProducts.filter(p=>!catalogSearch||p.name.toLowerCase().includes(catalogSearch.toLowerCase())).length===0 && (
                        <p style={{gridColumn:'1/-1',textAlign:'center',color:'#9CA3AF',padding:30,fontSize:13}}>
                          No catalog products match "{catalogSearch}". <br/>
                          Don't see your product? Pick the closest match — admins can add new catalog items.
                        </p>
                      )}
                    </div>
                    <p style={{fontSize:11,color:'#9CA3AF',marginTop:8,textAlign:'right'}}>
                      Showing {Math.min(60, catalogProducts.filter(p=>!catalogSearch||p.name.toLowerCase().includes(catalogSearch.toLowerCase())).length)} of {catalogProducts.length} catalog products
                    </p>
                  </>
                )}
              </div>

              {/* ── Step 2 — Set your offer details ────────────────── */}
              <form onSubmit={handleSubmit} style={{opacity: form.product_id ? 1 : 0.45, pointerEvents: form.product_id ? 'auto' : 'none'}}>
                <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:6}}>
                  <span style={{background:'#065F46',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,letterSpacing:0.5}}>STEP 2</span>
                  <h3 style={{margin:0,fontSize:16,fontWeight:700,color:'#111827'}}>Your offer details</h3>
                </div>
                <p style={{fontSize:13,color:'#6B7280',margin:'0 0 14px'}}>
                  Set your price, quantity, and location. Buyers will compare offers from all farmers selling this product.
                </p>

                <div style={{display:'flex',gap:12}}>
                  <div className="form-group" style={{flex:1}}><label>Your Price (AUD) *</label><input type="number" step="0.01" min="0" required placeholder="5.99" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div>
                  <div className="form-group" style={{flex:1}}><label>Quantity Available *</label><input type="number" min="0" required placeholder="100" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
                  <div className="form-group" style={{flex:1}}><label>Unit</label><select value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>{['kg','g','litre','dozen','bunch','piece','punnet','jar','bag','head'].map(u=><option key={u}>{u}</option>)}</select></div>
                </div>
                <div className="form-group"><label>Farm Location</label><input placeholder="e.g. Dandenong Ranges, VIC" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
                <div className="form-group">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <label style={{margin:0}}>Notes for buyers (optional)</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={generateDescription} disabled={aiLoading} style={{fontSize:12}}>{aiLoading?'⏳ Generating...':'🤖 Generate with AI'}</button>
                  </div>
                  <textarea placeholder="What makes your produce special? Growing methods, certifications, etc." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
                  <p style={{fontSize:11,color:'#9CA3AF',margin:'4px 0 0'}}>The catalog already has a standard description. This is your personal note to buyers.</p>
                </div>
                <div className="form-group"><label>Your Photo (optional — overrides catalog image)</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setForm({...form,image:e.target.files[0]})}/><p style={{fontSize:12,color:'#9CA3AF',marginTop:4}}>JPG, PNG or WebP — max 5MB. If skipped, the catalog image is used.</p></div>
                {editId && <div className="form-group"><label>Listing Status</label><select value={form.is_active} onChange={e=>setForm({...form,is_active:Number(e.target.value)})}><option value={1}>✅ Active — visible to buyers</option><option value={0}>❌ Inactive — hidden from buyers</option></select></div>}
                <div style={{display:'flex',gap:12,marginTop:8}}>
                  <button type="submit" style={{...S.primaryBtn,flex:1,padding:14,fontSize:15,border:'none',cursor:'pointer'}} disabled={loading||!form.product_id}>{loading?'⏳ Saving...':editId?'✅ Update Offer':'✅ Create Offer'}</button>
                  {editId && <button type="button" className="btn btn-outline" style={{padding:14}} onClick={()=>{resetForm();setTab('listings');setMsg('');}}>Cancel</button>}
                </div>
              </form>
            </div>
          </div>
        )}

        {tab==='orders'   && <FarmerOrders />}
        {tab==='earnings' && <FarmerEarnings />}
        {tab==='settings' && (
          <FarmerSettings
            user={user}
            profile={profile} setProfile={setProfile} saveProfile={saveProfile} savingProfile={savingProfile}
            farm={farm}       setFarm={setFarm}       saveFarm={saveFarm}       savingFarm={savingFarm}
            notifs={notifs}   setNotifs={setNotifs}   saveNotifs={saveNotifs}   savingNotifs={savingNotifs}
            privacy={privacy} setPrivacy={setPrivacy} savePrivacy={savePrivacy} savingPrivacy={savingPrivacy}
            payout={payout}   setPayout={setPayout}   savePayout={savePayout}   savingPayout={savingPayout}
            pwForm={pwForm}   setPwForm={setPwForm}   changePassword={changePassword} savingPw={savingPw}
            securityStatus={securityStatus}
            sessions={sessions} sessionsLoading={sessionsLoading} revokeSession={revokeSession}
          />
        )}
      </div>

      {/* RESTOCK MODAL */}
      {restockModal && (
        <div style={S.overlay} onClick={()=>setRestockModal(null)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHead}><h3 style={S.modalTitle}>🔄 Restock Listing</h3><button style={S.modalClose} onClick={()=>setRestockModal(null)}>✕</button></div>
            <div style={S.modalBody}>
              <div style={S.restockInfo}>
                <p style={{fontWeight:700,fontSize:15,color:'#065F46',margin:0}}>{restockModal.title}</p>
                <p style={{color:'#6B7280',fontSize:13,marginTop:4}}>Current stock: <strong style={{color:restockModal.quantity<5?'#DC2626':'#059669'}}>{restockModal.quantity} {restockModal.unit}</strong></p>
              </div>
              <label style={S.inputLabel}>Quantity to Add ({restockModal.unit})</label>
              <input type="number" min="1" placeholder={`e.g. 50 ${restockModal.unit}`} value={restockQty} onChange={e=>setRestockQty(e.target.value)} style={S.restockInput} autoFocus onKeyDown={e=>e.key==='Enter'&&handleRestock()}/>
              {restockQty&&Number(restockQty)>0&&<p style={{fontSize:13,color:'#059669',fontWeight:600,marginTop:8}}>New total: <strong>{restockModal.quantity+Number(restockQty)} {restockModal.unit}</strong></p>}
            </div>
            <div style={S.modalFoot}>
              <button style={S.cancelBtn} onClick={()=>setRestockModal(null)}>Cancel</button>
              <button style={{...S.primaryBtn,flex:2,opacity:restockLoading?0.7:1,border:'none',cursor:'pointer',justifyContent:'center'}} onClick={handleRestock} disabled={restockLoading}>{restockLoading?'⏳ Saving...':'✅ Confirm Restock'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  shell:   {display:'flex',minHeight:'100vh',background:'#F3F4F6'},
  main:    {flex:1,padding:'28px 32px',minWidth:0},
  sidebar: {background:'#064E3B',display:'flex',flexDirection:'column',flexShrink:0,transition:'width 0.25s ease',overflow:'hidden',position:'sticky',top:0,height:'100vh'},
  sideTop: {display:'flex',alignItems:'center',gap:10,padding:'20px 14px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)'},
  profile: {display:'flex',alignItems:'center',gap:10,flex:1,overflow:'hidden'},
  avatar:  {width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.25)',color:'#fff',fontSize:16,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  profileName:{color:'#fff',fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',margin:0},
  profileRole:{color:'#6EE7B7',fontSize:11,fontWeight:600,margin:0},
  collapseBtn:{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:26,height:26,borderRadius:6,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  quickStats:{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.08)'},
  quickStat: {flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'11px 4px',gap:2},
  qStatVal:  {fontSize:14,fontWeight:800},
  qStatLabel:{fontSize:10,color:'rgba(255,255,255,0.45)',fontWeight:500},
  nav:     {display:'flex',flexDirection:'column',padding:'10px',gap:2,flex:1},
  navSec:  {color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,letterSpacing:1,padding:'8px 8px 4px',margin:0},
  navItem: {display:'flex',alignItems:'center',gap:10,padding:'10px',borderRadius:10,border:'none',background:'none',cursor:'pointer',color:'rgba(255,255,255,0.6)',fontSize:14,fontWeight:500,width:'100%',transition:'all 0.15s',fontFamily:'inherit'},
  navActive:{background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:700},
  navIcon: {fontSize:17,flexShrink:0,width:22,textAlign:'center'},
  navLabel:{flex:1,textAlign:'left',whiteSpace:'nowrap'},
  navBadge:{borderRadius:10,padding:'1px 8px',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0},
  sideBottom:{padding:'10px 12px 16px',display:'flex',flexDirection:'column',gap:8},
  alertCard: {background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:10},
  alertTitle:{color:'#FCA5A5',fontSize:13,fontWeight:700,margin:0},
  alertSub:  {color:'rgba(255,255,255,0.4)',fontSize:11,margin:0},
  logoutBtn: {display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 0',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#FCA5A5',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
  topBar:  {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:12},
  pageTitle:{fontSize:22,fontWeight:800,color:'#111827',margin:'0 0 3px'},
  pageSub:  {fontSize:13,color:'#6B7280',margin:0},
  primaryBtn:{display:'inline-flex',alignItems:'center',padding:'10px 22px',background:'linear-gradient(135deg,#065F46,#059669)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14,fontFamily:'inherit',boxShadow:'0 2px 8px rgba(5,150,105,0.3)',cursor:'pointer'},
  toast:   {display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderRadius:10,border:'1.5px solid',marginBottom:20,fontSize:14,fontWeight:600},
  statGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:14,marginBottom:24},
  statCard:{borderRadius:14,padding:'18px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,border:'1.5px solid',textAlign:'center'},
  card:    {background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.05)',border:'1px solid #F3F4F6',marginBottom:20},
  cardHead:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  cardTitle:{fontSize:16,fontWeight:700,color:'#111827',margin:0},
  cardLink: {background:'none',border:'none',color:'#059669',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  listRow:  {display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid #F3F4F6'},
  rowImg:   {width:40,height:40,borderRadius:8,objectFit:'cover',flexShrink:0},
  rowImgPh: {width:40,height:40,borderRadius:8,background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0},
  rowName:  {fontSize:14,fontWeight:600,color:'#111827',margin:0},
  rowMeta:  {fontSize:12,color:'#9CA3AF',margin:0},
  table:    {width:'100%',borderCollapse:'collapse'},
  thead:    {background:'#F9FAFB'},
  th:       {padding:'12px 14px',textAlign:'left',fontWeight:700,fontSize:11,color:'#6B7280',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #E5E7EB'},
  td:       {padding:'12px 14px',fontSize:14,borderTop:'1px solid #F3F4F6',verticalAlign:'middle'},
  tableImg: {width:38,height:38,borderRadius:8,objectFit:'cover'},
  tableImgBlank:{width:38,height:38,borderRadius:8,background:'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18},
  catTag:   {background:'#F0FDF4',color:'#166534',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,border:'1px solid #BBF7D0'},
  lowBadge: {background:'#FEF2F2',color:'#DC2626',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,border:'1px solid #FCA5A5'},
  statusToggle:{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',border:'1.5px solid',fontFamily:'inherit'},
  iconBtn:  {width:32,height:32,borderRadius:8,border:'1.5px solid',fontSize:14,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'},
  empty:    {textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:16,border:'1px solid #F3F4F6'},
  overlay:  {position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20},
  modal:    {background:'#fff',borderRadius:20,width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.2)',overflow:'hidden'},
  modalHead:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 16px',borderBottom:'1px solid #F3F4F6'},
  modalTitle:{fontSize:18,fontWeight:800,color:'#065F46',margin:0},
  modalClose:{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#9CA3AF',padding:4},
  modalBody:{padding:'20px 24px'},
  modalFoot:{display:'flex',gap:10,padding:'14px 24px',borderTop:'1px solid #F3F4F6',background:'#F9FAFB'},
  restockInfo:{background:'#F0FDF4',borderRadius:10,padding:'12px 14px',marginBottom:18,border:'1px solid #BBF7D0'},
  inputLabel:{display:'block',fontWeight:700,fontSize:12,color:'#374151',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5},
  restockInput:{width:'100%',padding:'12px 14px',border:'2px solid #059669',borderRadius:10,fontSize:16,fontFamily:'inherit',outline:'none',boxSizing:'border-box',color:'#065F46',fontWeight:600},
  cancelBtn:{flex:1,padding:'12px 0',borderRadius:10,border:'1.5px solid #E5E7EB',background:'#fff',color:'#6B7280',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
};