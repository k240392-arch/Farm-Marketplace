// pages/AdminDashboard.jsx — Command-Centre Admin Dashboard
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AdminBot from '../components/AdminBot';
import UserHistoryModal from '../components/UserHistoryModal';
import ChangeEmail from '../components/ChangeEmail';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// ─── Shared mini-components ────────────────────────
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{ width:44,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',background:on?'#059669':'#D1D5DB',flexShrink:0 }}>
      <span style={{ position:'absolute',top:2,width:20,height:20,background:'#fff',borderRadius:'50%',transition:'transform 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transform:on?'translateX(22px)':'translateX(2px)' }}/>
    </button>
  );
}

function Badge({ text, color='#065F46', bg='#ECFDF5', border }) {
  return <span style={{ background:bg,color,padding:'3px 11px',borderRadius:20,fontSize:11,fontWeight:700,display:'inline-block',border:border?`1px solid ${border}`:'none',whiteSpace:'nowrap' }}>{text}</span>;
}

function StatusBadge({ status }) {
  const cfg = {
    pending:   { color:'#B45309', bg:'#FFFBEB', dot:'#F59E0B' },
    confirmed: { color:'#1D4ED8', bg:'#EFF6FF', dot:'#3B82F6' },
    shipped:   { color:'#6D28D9', bg:'#F5F3FF', dot:'#8B5CF6' },
    delivered: { color:'#065F46', bg:'#ECFDF5', dot:'#10B981' },
    cancelled: { color:'#991B1B', bg:'#FEF2F2', dot:'#EF4444' },
    success:   { color:'#065F46', bg:'#ECFDF5', dot:'#10B981' },
    error:     { color:'#991B1B', bg:'#FEF2F2', dot:'#EF4444' },
    active:    { color:'#065F46', bg:'#ECFDF5', dot:'#10B981' },
    suspended: { color:'#991B1B', bg:'#FEF2F2', dot:'#EF4444' },
    closed:    { color:'#991B1B', bg:'#FEE2E2', dot:'#DC2626' },
    anonymised:{ color:'#374151', bg:'#E5E7EB', dot:'#9CA3AF' },
    inactive:  { color:'#6B7280', bg:'#F3F4F6', dot:'#9CA3AF' },
  };
  const c = cfg[status] || cfg.inactive;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:c.bg,color:c.color,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700 }}>
      <span style={{ width:6,height:6,borderRadius:'50%',background:c.dot,display:'inline-block' }}/>
      {status}
    </span>
  );
}

const NAV = [
  { key:'overview',   icon:'📊', label:'Overview',     badge:null },
  { key:'users',      icon:'👥', label:'Users',         badge:null },
  { key:'listings',   icon:'🌿', label:'Listings',      badge:null },
  { key:'orders',     icon:'📦', label:'Orders',        badge:null },
  { key:'payouts',    icon:'💰', label:'Payouts',       badge:null },
  { key:'ai',         icon:'🤖', label:'AI Logs',       badge:null },
  { key:'audit',      icon:'📋', label:'Audit Trail',   badge:null },
  { key:'security',   icon:'🔒', label:'Security',      badge:null },
  { key:'compliance', icon:'⚖️', label:'Compliance',    badge:null },
  { key:'settings',   icon:'⚙️', label:'Settings',      badge:null },
];

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [tab,        setTab]        = useState('overview');
  const [sidebar,    setSidebar]    = useState(true);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(false);

  // Data
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [listings,   setListings]   = useState([]);
  const [restockId,  setRestockId]  = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [auditRole,    setAuditRole]    = useState('');     // '' | farmer | buyer | admin | system
  const [auditStatus,  setAuditStatus]  = useState('');     // '' | success | failed | blocked
  const [auditSearch,  setAuditSearch]  = useState('');     // free-text against name/email/action/description
  const [aiLogs,     setAiLogs]     = useState([]);
  const [aiStats,    setAiStats]    = useState(null);
  const [security,   setSecurity]   = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [userDetail, setUserDetail] = useState(null);
  const [historyForUser, setHistoryForUser] = useState(null);
  const [systemTime, setSystemTime] = useState(new Date());

  // Payouts
  const [payouts,        setPayouts]        = useState([]);
  const [payoutTotals,   setPayoutTotals]   = useState(null);
  const [payoutFilter,   setPayoutFilter]   = useState('pending');
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [commissionRate, setCommissionRate] = useState(null);
  const [editingRate,    setEditingRate]    = useState(false);
  const [newRatePercent, setNewRatePercent] = useState('10');

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRole,   setUserRole]   = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Settings
  const [settings,       setSettings]       = useState({ full_name:'', phone:'' });
  const [pwForm,         setPwForm]         = useState({ current_password:'', new_password:'', confirm_password:'' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPw,       setSavingPw]       = useState(false);
  const [notifs, setNotifs] = useState({ new_user:true, new_order:true, security_alert:true, system_update:false, ai_errors:true });
  const [appear, setAppear] = useState({ theme:'dark', density:'comfortable', timezone:'Australia/Melbourne' });

  // Live clock
  useEffect(() => { const t = setInterval(() => setSystemTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // Reload payouts when filter changes (only if on payouts tab)
  useEffect(() => { if (tab === 'payouts') loadPayouts(); /* eslint-disable-next-line */ }, [payoutFilter]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    setSettings({ full_name: user.full_name || user.name || '', phone: user.phone || '' });
    loadOverview();
  }, [user]);

  useEffect(() => {
    if (tab === 'overview')   loadOverview();
    if (tab === 'users')      loadUsers();
    if (tab === 'orders')     loadOrders();
    if (tab === 'listings')   loadListings();
    if (tab === 'audit')      loadAudit();
    if (tab === 'ai')         loadAILogs();
    if (tab === 'security')   loadSecurity();
    if (tab === 'payouts')    loadPayouts();
  }, [tab]);

  // ── LOADERS ─────────────────────────────────────
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const load = async (fn) => { setLoading(true); try { await fn(); } finally { setLoading(false); } };

  const loadOverview  = () => load(async () => { const r = await api.get('/admin/dashboard'); setStats(r.data); });
  const loadAudit     = () => load(async () => {
    const p = new URLSearchParams({ limit: 100 });
    if (auditRole)   p.set('role',   auditRole);
    if (auditStatus) p.set('status', auditStatus);
    if (auditSearch.trim()) p.set('search', auditSearch.trim());
    const r = await api.get(`/audit/logs?${p}`);
    setAuditLogs(r.data.logs || r.data || []);
  });
  const loadAILogs    = () => load(async () => { const r = await api.get('/admin/ai-logs'); setAiLogs(r.data.logs||[]); setAiStats(r.data.stats||null); });
  const loadSecurity  = () => load(async () => { const [a,b] = await Promise.all([api.get('/security/logs'),api.get('/security/blocked-ips')]); setSecurity(a.data||[]); setBlockedIPs(b.data||[]); });
  const loadOrders    = () => load(async () => { const r = await api.get('/admin/orders'); setOrders(r.data||[]); });
  const loadListings  = () => load(async () => { const r = await api.get('/admin/listings'); setListings(r.data||[]); });
  const loadUsers     = () => load(async () => { const r = await api.get(`/admin/users?search=${userSearch}&role=${userRole}&show_archived=${showArchived?1:0}`); setUsers(r.data.users||[]); });
  const loadUserDetail = async (uid) => { try { const r = await api.get(`/admin/users/${uid}`); setUserDetail(r.data); } catch {} };

  const loadPayouts = () => load(async () => {
    const [pRes, rRes] = await Promise.all([
      api.get(`/admin/payouts?status=${payoutFilter === 'all' ? '' : payoutFilter}`),
      api.get('/admin/settings/commission-rate'),
    ]);
    setPayouts(pRes.data.payouts || []);
    setPayoutTotals(pRes.data.totals || null);
    setCommissionRate(rRes.data);
    setNewRatePercent(String(rRes.data.rate_percent));
    setSelectedPayouts([]);
  });
  const togglePayoutSelected = (id) => {
    setSelectedPayouts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const markPayoutPaid = async (id) => {
    const ref = window.prompt('Payment reference (e.g. bank transfer ID) — optional:');
    if (ref === null) return; // cancelled
    try {
      await api.patch(`/admin/payouts/${id}/mark-paid`, { payment_reference: ref || null });
      showToast('💰 Payout marked as paid.');
      loadPayouts();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Failed'), 'error');
    }
  };
  const bulkMarkPaid = async () => {
    if (!selectedPayouts.length) return showToast('Select at least one payout.', 'error');
    if (!window.confirm(`Mark ${selectedPayouts.length} payout(s) as paid?`)) return;
    try {
      const r = await api.patch('/admin/payouts/bulk-mark-paid', { payout_ids: selectedPayouts });
      showToast(`💰 ${r.data.paid_count} payouts marked as paid.`);
      loadPayouts();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Failed'), 'error');
    }
  };
  const saveCommissionRate = async () => {
    const pct = Number(newRatePercent);
    if (!isFinite(pct) || pct < 0 || pct > 50) return showToast('Rate must be 0–50%.', 'error');
    try {
      await api.patch('/admin/settings/commission-rate', { rate: pct / 100 });
      showToast(`✅ Commission rate set to ${pct.toFixed(2)}%`);
      setEditingRate(false);
      loadPayouts();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Failed'), 'error');
    }
  };

  // ── ACTIONS ─────────────────────────────────────
  const suspendUser = async (uid) => {
    const reason = window.prompt('Reason for suspension:');
    if (!reason) return;
    try { await api.patch(`/admin/users/${uid}/suspend`,{reason}); loadUsers(); showToast('User suspended.'); } catch { showToast('Failed.','error'); }
  };
  const activateUser = async (uid) => {
    try { await api.patch(`/admin/users/${uid}/activate`); loadUsers(); showToast('User activated.'); } catch { showToast('Failed.','error'); }
  };
  const exportUserData = async (uid) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/compliance/export/${uid}`,{headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href=url; a.download=`user-data-${uid}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`✅ User #${uid} data exported`);
    } catch (err) { showToast('❌ Export failed: '+err.message,'error'); }
  };
  const deleteUserData = async (uid, name) => {
    if (!window.confirm(`Anonymise all data for "${name}"?\n\nThis permanently removes their personal details.`)) return;
    try { await api.delete(`/admin/compliance/delete/${uid}`); loadUsers(); showToast(`✅ User #${uid} anonymised`); }
    catch (err) { showToast('❌ '+(err.response?.data?.message||'Delete failed'),'error'); }
  };
  const permanentDeleteUser = async (uid, name, role) => {
    const warning =
      `⚠️ PERMANENT DELETION\n\n` +
      `Are you sure you want to permanently delete "${name}" (#${uid}, ${role})?\n\n` +
      `This will:\n` +
      `• Remove the user account from the database\n` +
      `• Delete all of their listings\n` +
      `• Delete their cart, wishlist and reviews\n\n` +
      `If buyers have ordered from this user (or this user has placed orders), their record will be ANONYMISED and hidden ` +
      `instead — order/accounting records must be preserved. This action cannot be undone.`;
    if (!window.confirm(warning)) return;
    try {
      const r = await api.delete(`/admin/users/${uid}/permanent`);
      setUserDetail(null);
      const mode = r.data?.mode;
      // For hard_delete, the row is gone. For anonymise paths, we hide it from the
      // current view too — unless the admin is viewing archived users.
      if (mode === 'hard_delete' || !showArchived) {
        setUsers(prev => prev.filter(u => u.user_id !== uid));
      } else {
        loadUsers();
      }
      const toastType = mode === 'hard_delete' ? 'success' : 'warning';
      const toastMsg =
        mode === 'hard_delete'  ? `🗑️ User "${name}" permanently deleted.` :
        mode === 'already_anonymised' ? `⚠️ ${r.data.message}` :
        mode === 'anonymised_fallback' ? `⚠️ ${r.data.message}` :
        (r.data?.message || 'Done.');
      showToast(toastMsg, toastType);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Delete failed'), 'error');
    }
  };
  const toggleListing = async (id) => {
    try { await api.patch(`/admin/listings/${id}/toggle`); loadListings(); showToast('Listing updated.'); } catch { showToast('Failed.','error'); }
  };

  const handleAdminRestock = async (listingId) => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return showToast('Enter a valid quantity.', 'error');
    try {
      await api.patch(`/listings/${listingId}/restock`, { add_quantity: qty });
      showToast(`✅ Restocked ${qty} units successfully!`);
      setRestockId(null); setRestockQty('');
      loadListings();
    } catch { showToast('Failed to restock.', 'error'); }
  };
  const removeListing = async (id, title) => {
    if (!window.confirm(`Remove "${title}"?`)) return;
    try { await api.delete(`/admin/listings/${id}`); setListings(p=>p.filter(x=>x.listing_id!==id)); showToast('Listing removed.'); }
    catch { showToast('Remove failed.','error'); }
  };
  const updateOrderStatus = async (id, status) => {
    try { await api.patch(`/admin/orders/${id}/status`,{status}); loadOrders(); showToast('Order updated.'); } catch { showToast('Failed.','error'); }
  };
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.patch('/auth/profile', settings);
      // Refresh AuthContext + localStorage so the sidebar admin name/avatar
      // update immediately. Use the server's user response if returned,
      // otherwise merge the form fields locally.
      updateUser(res?.data?.user ? res.data.user : settings);
      showToast('✅ Profile saved');
    } catch { showToast('❌ Save failed','error'); }
    finally { setSavingSettings(false); }
  };
  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { showToast('Passwords do not match','error'); return; }
    if (pwForm.new_password.length < 6) { showToast('Password must be at least 6 characters','error'); return; }
    setSavingPw(true);
    try { await api.patch('/auth/change-password',{current_password:pwForm.current_password,new_password:pwForm.new_password}); showToast('✅ Password changed'); setPwForm({current_password:'',new_password:'',confirm_password:''}); }
    catch (err) { showToast('❌ '+(err.response?.data?.message||'Failed'),'error'); }
    finally { setSavingPw(false); }
  };
  const generatePrivacyReport = async (uid) => {
    if (!uid) { showToast('Enter a User ID first','error'); return; }
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/admin/users/${uid}`,{headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) throw new Error('User not found');
      const data  = await res.json();
      const u     = data.user || {};
      const report = {
        report_title:'FarmMarket Privacy Compliance Report', generated_at:new Date().toISOString(), generated_by:'Admin Portal',
        subject_user:{ user_id:u.user_id, full_name:u.full_name, email:u.email, role:u.role, is_active:u.is_active, is_verified:u.is_verified, member_since:u.created_at },
        data_summary:{ total_orders:u.orders||0, total_listings:u.listings||0, reviews_given:u.reviews_given||0, total_spent:u.total_spent||0 },
        recent_activity:(data.activity||[]).slice(0,20), recent_orders:(data.orders||[]).slice(0,10),
        compliance_notes:['Australian Privacy Act 1988','APP 3: Data collected for marketplace transactions only','APP 11: Data secured with bcrypt and JWT','APP 12: Right to access this report','APP 13: Right to correction','7-year ATO retention for orders','90-day purge for activity logs'],
        export_rights:{ right_to_access:true, right_to_correct:true, right_to_erasure:true, erasure_endpoint:`/api/admin/compliance/delete/${uid}` }
      };
      const blob = new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href=url; a.download=`privacy-report-user-${uid}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`✅ Privacy report for User #${uid} downloaded`);
    } catch (err) { showToast('❌ '+(err.message||'Report failed'),'error'); }
  };

  // ── COMPUTED ────────────────────────────────────
  const pendingOrders    = orders.filter(o => o.status==='pending').length;
  const securityAlerts   = (security || []).length;
  const totalRevenue     = parseFloat(stats?.orders?.total_revenue || 0);

  return (
    <div style={S.shell}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ ...S.sidebar, width: sidebar ? 240 : 68 }}>

        {/* Brand */}
        <div style={S.brand}>
          {sidebar ? (
            <div style={S.brandInner}>
              <div style={S.brandLogo}>🌿</div>
              <div>
                <p style={S.brandName}>FarmMarket</p>
                <span style={S.brandTag}>ADMIN PORTAL</span>
              </div>
            </div>
          ) : (
            <div style={{ ...S.brandLogo, margin: '0 auto' }}>🌿</div>
          )}
          <button style={S.collapseBtn} onClick={() => setSidebar(o => !o)}>{sidebar ? '‹' : '›'}</button>
        </div>

        {/* Live system status strip */}
        {sidebar && (
          <div style={S.statusStrip}>
            <div style={S.statusDot} />
            <span style={S.statusText}>System Online</span>
            <span style={{ ...S.statusText, marginLeft: 'auto', opacity: 0.6 }}>
              {systemTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}

        {/* Quick stats */}
        {sidebar && stats && (
          <div style={S.quickStats}>
            {[
              { label:'Users',    value: stats.users?.total || 0,    color:'#93C5FD' },
              { label:'Revenue',  value: `$${totalRevenue.toFixed(0)}`, color:'#FCD34D' },
              { label:'Alerts',   value: securityAlerts,              color: securityAlerts > 0 ? '#FCA5A5' : '#6EE7B7' },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{ ...S.quickStat, borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <span style={{ ...S.qVal, color }}>{value}</span>
                <span style={S.qLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nav */}
        <nav style={S.nav}>
          {sidebar && <p style={S.navSec}>NAVIGATION</p>}
          {NAV.map(({ key, icon, label }) => {
            const bMap = { orders: pendingOrders, security: securityAlerts };
            const badge = bMap[key] || 0;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{ ...S.navItem, ...(tab===key ? S.navActive : {}), justifyContent: sidebar ? 'flex-start' : 'center' }}
                title={!sidebar ? label : undefined}>
                <span style={S.navIcon}>{icon}</span>
                {sidebar && <>
                  <span style={S.navLabel}>{label}</span>
                  {badge > 0 && <span style={{ ...S.navBadge, background: key==='security' ? '#EF4444' : '#F59E0B' }}>{badge}</span>}
                </>}
              </button>
            );
          })}
        </nav>

        {/* Admin profile + logout */}
        <div style={S.sideBottom}>
          {sidebar && (
            <div style={S.adminCard}>
              <div style={S.adminAvatar}>{(user?.full_name||user?.name||'A')[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={S.adminName}>{user?.full_name || user?.name}</p>
                <span style={S.adminBadge}>⚡ Administrator</span>
              </div>
            </div>
          )}
          {!sidebar && <div style={{ ...S.adminAvatar, margin:'0 auto 8px' }}>{(user?.full_name||user?.name||'A')[0].toUpperCase()}</div>}
          <button style={S.logoutBtn} onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <span style={{ fontSize:15 }}>⏻</span>
            {sidebar && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={S.main}>

        {/* Top bar */}
        <div style={S.topBar}>
          <div>
            <h1 style={S.pageTitle}>
              {NAV.find(n => n.key===tab)?.icon}{' '}
              {NAV.find(n => n.key===tab)?.label}
            </h1>
            <p style={S.pageSub}>
              {tab==='overview' && `System-wide dashboard · ${systemTime.toLocaleDateString('en-AU', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}`}
              {tab==='users'    && `${users.length} users loaded`}
              {tab==='orders'   && `${orders.length} orders · ${pendingOrders} pending`}
              {tab==='payouts'  && (payoutTotals ? `$${Number(payoutTotals.pending_total).toFixed(2)} owed to farmers · $${Number(payoutTotals.commission_total).toFixed(2)} commission earned` : 'Farmer payouts & commission ledger')}
              {tab==='listings' && `${listings.length} listings`}
              {tab==='ai'       && 'Groq API usage monitoring'}
              {tab==='audit'    && 'Complete system activity log'}
              {tab==='security' && `${blockedIPs.length} blocked IPs · ${securityAlerts} security events`}
              {tab==='compliance' && 'Australian Privacy Act 1988 — APP compliance'}
              {tab==='settings' && 'Admin account management'}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {tab === 'users'    && <button style={S.actionBtn} onClick={loadUsers}>↻ Refresh</button>}
            {tab === 'orders'   && <button style={S.actionBtn} onClick={loadOrders}>↻ Refresh</button>}
            {tab === 'payouts'  && <button style={S.actionBtn} onClick={loadPayouts}>↻ Refresh</button>}
            {tab === 'listings' && <button style={S.actionBtn} onClick={loadListings}>↻ Refresh</button>}
            {tab === 'audit'    && <button style={S.actionBtn} onClick={loadAudit}>↻ Refresh</button>}
            {tab === 'ai'       && <button style={S.actionBtn} onClick={loadAILogs}>↻ Refresh</button>}
            {tab === 'security' && <button style={S.actionBtn} onClick={loadSecurity}>↻ Refresh</button>}
            <div style={S.adminPortalBadge}>⚡ Admin Portal</div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type==='error'?'#DC2626':'#059669', color:'#fff', padding:'13px 20px', borderRadius:12, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', maxWidth:380, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16 }}>{toast.type==='error'?'❌':'✅'}</span>{toast.msg}
          </div>
        )}

        {/* Loading bar */}
        {loading && <div style={S.loadingBar}><div style={S.loadingInner}/></div>}


        {/* ══ OVERVIEW TAB ══ */}
        {tab === 'overview' && (
          <div>
            {/* Security alert banner */}
            {securityAlerts > 0 && (
              <div style={S.alertBanner}>
                <span style={{ fontSize:20 }}>🚨</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:800, fontSize:14, color:'#991B1B', margin:0 }}>{securityAlerts} Security Event{securityAlerts>1?'s':''} Detected</p>
                  <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>Review the Security tab immediately</p>
                </div>
                <button onClick={() => setTab('security')} style={{ padding:'7px 16px', background:'#DC2626', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>View Now →</button>
              </div>
            )}

            {/* 8-stat grid */}
            <div style={S.statGrid}>
              {[
                { icon:'👥', label:'Total Users',      value:stats?.users?.total||0,           sub:`${stats?.users?.farmers||0} farmers · ${stats?.users?.buyers||0} buyers`, color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE' },
                { icon:'🌿', label:'Active Listings',  value:stats?.listings?.active||0,        sub:`${stats?.listings?.inactive||0} inactive`,       color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
                { icon:'📦', label:'Total Orders',     value:stats?.orders?.total||0,           sub:`${stats?.orders?.pending||0} pending`,            color:'#7C3AED', bg:'#F5F3FF', border:'#C4B5FD' },
                { icon:'💰', label:'Total Revenue',    value:`$${totalRevenue.toFixed(2)}`,     sub:'All delivered orders',                            color:'#D97706', bg:'#FFFBEB', border:'#FCD34D' },
                { icon:'✅', label:'Delivered Orders', value:stats?.orders?.delivered||0,       sub:'Completed successfully',                          color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
                { icon:'🚨', label:'Security Alerts',  value:stats?.security?.total_events||0,  sub:'All time',                                       color:'#DC2626', bg:'#FEF2F2', border:'#FCA5A5' },
                { icon:'🔒', label:'Blocked IPs',      value:stats?.security?.blocked_ips||0,   sub:'Currently active',                               color:'#B45309', bg:'#FFFBEB', border:'#FCD34D' },
                { icon:'🤖', label:'AI Requests',      value:aiStats?.total_calls||0,           sub:'Total API calls',                                 color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
              ].map(({ icon, label, value, sub, color, bg, border }) => (
                <div key={label} style={{ ...S.statCard, background:bg, borderColor:border }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <span style={{ fontSize:24 }}>{icon}</span>
                      <p style={{ fontSize:24, fontWeight:900, color, margin:'6px 0 2px', lineHeight:1 }}>{value}</p>
                      <p style={{ fontSize:13, color:'#111827', fontWeight:700, margin:0 }}>{label}</p>
                      {sub && <p style={{ fontSize:11, color:'#9CA3AF', margin:'3px 0 0' }}>{sub}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              {/* Recent orders */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <h3 style={S.cardTitle}>📦 Recent Orders</h3>
                  <button style={S.cardLink} onClick={() => setTab('orders')}>View all →</button>
                </div>
                {(stats?.recentOrders||[]).length === 0 && <p style={{ color:'#9CA3AF', textAlign:'center', padding:20 }}>No recent orders</p>}
                {(stats?.recentOrders||[]).map((o,i) => (
                  <div key={o.order_id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<(stats.recentOrders.length-1)?'1px solid #F3F4F6':'' }}>
                    <div>
                      <p style={{ fontWeight:700, fontSize:13, margin:0, color:'#111827' }}>#{o.order_id} — {o.buyer_name}</p>
                      <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{new Date(o.created_at).toLocaleDateString('en-AU')}</p>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontWeight:800, color:'#059669', fontSize:14 }}>${parseFloat(o.total_amount).toFixed(2)}</span>
                      <StatusBadge status={o.status}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent users */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <h3 style={S.cardTitle}>👥 Recent Users</h3>
                  <button style={S.cardLink} onClick={() => setTab('users')}>View all →</button>
                </div>
                {(stats?.recentUsers||[]).length === 0 && <p style={{ color:'#9CA3AF', textAlign:'center', padding:20 }}>No recent users</p>}
                {(stats?.recentUsers||[]).map((u,i) => (
                  <div key={u.user_id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<(stats.recentUsers.length-1)?'1px solid #F3F4F6':'' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:`hsl(${(u.user_id*47)%360},60%,50%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                        {(u.full_name||'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight:700, fontSize:13, margin:0 }}>{u.full_name}</p>
                        <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{u.email}</p>
                      </div>
                    </div>
                    <Badge text={u.role} color={u.role==='farmer'?'#065F46':u.role==='admin'?'#991B1B':'#1D4ED8'} bg={u.role==='farmer'?'#ECFDF5':u.role==='admin'?'#FEF2F2':'#EFF6FF'}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform health */}
            <div style={S.card}>
              <div style={S.cardHead}><h3 style={S.cardTitle}>🖥️ Platform Health</h3></div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                {[
                  { label:'API Status',         value:'Operational',                        ok:true },
                  { label:'Database',           value:'Connected',                          ok:true },
                  { label:'Payment Gateway',    value:'Stripe · Active',                    ok:true },
                  { label:'Email Service',      value:'Active',                             ok:true },
                  { label:'AI (Groq)',          value:aiStats?.total_calls>0?'Active':'No calls yet', ok:!!aiStats?.total_calls },
                  { label:'File Storage',       value:'Active',                             ok:true },
                ].map(({ label, value, ok }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background: ok?'#F0FDF4':'#FEF2F2', borderRadius:10, border:`1px solid ${ok?'#A7F3D0':'#FCA5A5'}` }}>
                    <span style={{ fontSize:18 }}>{ok?'✅':'⚠️'}</span>
                    <div>
                      <p style={{ fontSize:12, color:'#6B7280', margin:0, fontWeight:600 }}>{label}</p>
                      <p style={{ fontSize:13, color: ok?'#065F46':'#991B1B', fontWeight:700, margin:0 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ USERS TAB ══ */}
        {tab === 'users' && (
          <div>
            {/* Search bar */}
            <div style={S.card}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <input style={{ flex:2, padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, fontFamily:'inherit', outline:'none', minWidth:200 }}
                  placeholder="🔍 Search by name or email..." value={userSearch}
                  onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && loadUsers()}/>
                <select style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, background:'#fff', fontFamily:'inherit', outline:'none' }}
                  value={userRole} onChange={e => { setUserRole(e.target.value); }}>
                  <option value="">All Roles</option>
                  <option value="farmer">🌾 Farmer</option>
                  <option value="buyer">🛒 Buyer</option>
                  <option value="admin">⚡ Admin</option>
                </select>
                <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:13, fontWeight:600, color:'#374151', background:'#fff', cursor:'pointer', userSelect:'none' }}
                  title="Show users that have been anonymised">
                  <input type="checkbox" checked={showArchived}
                    onChange={e => { setShowArchived(e.target.checked); setTimeout(loadUsers, 0); }}
                    style={{ accentColor:'#DC2626', width:16, height:16, cursor:'pointer' }}/>
                  👻 Show archived
                </label>
                <button style={S.primaryBtn} onClick={loadUsers}>Search</button>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    {['ID','User','Role','Status','Orders','Listings','Actions'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map((u,i) => (
                      <tr key={u.user_id} style={{ background: i%2===0?'#fff':'#FAFAFA', cursor:'pointer', transition:'background 0.1s' }}
                        onClick={() => loadUserDetail(u.user_id)}>
                        <td style={S.td}><span style={{ color:'#9CA3AF', fontSize:11 }}>#{u.user_id}</span></td>
                        <td style={S.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', background:`hsl(${(u.user_id*47)%360},60%,50%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                              {(u.full_name||'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight:700, fontSize:13, color:'#111827', margin:0 }}>{u.full_name}</p>
                              <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={S.td}><Badge text={u.role} color={u.role==='farmer'?'#065F46':u.role==='admin'?'#991B1B':'#1D4ED8'} bg={u.role==='farmer'?'#ECFDF5':u.role==='admin'?'#FEF2F2':'#EFF6FF'}/></td>
                        <td style={S.td}><StatusBadge status={u.account_status || (u.is_active ? 'active' : 'suspended')}/></td>
                        <td style={S.td}><span style={{ fontWeight:600, color:'#111827' }}>{u.order_count||0}</span></td>
                        <td style={S.td}><span style={{ fontWeight:600, color:'#111827' }}>{u.listing_count||0}</span></td>
                        <td style={S.td} onClick={e => e.stopPropagation()}>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {u.is_active
                              ? <button style={S.warnBtn} onClick={() => suspendUser(u.user_id)}>⏸ Suspend</button>
                              : <button style={S.successBtn} onClick={() => activateUser(u.user_id)}>▶ Activate</button>
                            }
                            <button style={S.infoBtn} onClick={() => exportUserData(u.user_id)}>📥 Export</button>
                            <button style={S.actionBtn} onClick={() => setHistoryForUser(u.user_id)}>📜 History</button>
                            {u.role !== 'admin' && (
                              <button style={S.dangerBtn} onClick={() => permanentDeleteUser(u.user_id, u.full_name, u.role)} title="Permanently delete this user">🗑️ Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>No users found. Try searching above.</p>}
              </div>
            </div>

            {/* User detail panel */}
            {userDetail && (
              <div style={{ ...S.card, border:'2px solid #059669', marginTop:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:`hsl(${(userDetail.user?.user_id*47)%360},60%,50%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, flexShrink:0 }}>
                      {(userDetail.user?.full_name||'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ color:'#111827', margin:0, fontSize:17, fontWeight:800 }}>{userDetail.user?.full_name}</h3>
                      <p style={{ color:'#6B7280', fontSize:13, margin:'2px 0 0' }}>{userDetail.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setUserDetail(null)} style={{ background:'#F3F4F6', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontWeight:700 }}>✕</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
                  {[['Role',userDetail.user?.role],['Status',userDetail.user?.is_active?'Active':'Suspended'],['Orders',userDetail.user?.orders||0],['Listings',userDetail.user?.listings||0],['Member Since',userDetail.user?.created_at?new Date(userDetail.user.created_at).toLocaleDateString('en-AU'):'—'],['Email Verified',userDetail.user?.is_verified?'Yes':'No']].map(([k,v]) => (
                    <div key={k} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 14px', border:'1px solid #F3F4F6' }}>
                      <p style={{ fontSize:10, color:'#9CA3AF', margin:0, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{k}</p>
                      <p style={{ fontSize:14, color:'#111827', fontWeight:700, margin:'4px 0 0' }}>{String(v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button style={S.infoBtn} onClick={() => exportUserData(userDetail.user?.user_id)}>📥 Export Data</button>
                  <button style={S.dangerBtn} onClick={() => deleteUserData(userDetail.user?.user_id, userDetail.user?.full_name)}>🫥 Anonymise Data</button>
                  {userDetail.user?.is_active
                    ? <button style={S.warnBtn} onClick={() => suspendUser(userDetail.user?.user_id)}>⏸ Suspend User</button>
                    : <button style={S.successBtn} onClick={() => activateUser(userDetail.user?.user_id)}>▶ Activate User</button>
                  }
                  {userDetail.user?.role !== 'admin' && (
                    <button
                      style={{ ...S.dangerBtn, background:'#DC2626', color:'#fff', border:'1px solid #991B1B' }}
                      onClick={() => permanentDeleteUser(userDetail.user?.user_id, userDetail.user?.full_name, userDetail.user?.role)}>
                      🗑️ Delete Permanently
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ LISTINGS TAB ══ */}
        {tab === 'listings' && (
          <div>
            {/* ── Orphaned/Out-of-stock alert ── */}
            {listings.filter(l => l.quantity <= 0 || !l.farmer_active).length > 0 && (
              <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:22 }}>⚠️</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, color:'#92400E', margin:0, fontSize:14 }}>
                    {listings.filter(l => l.quantity <= 0).length} out-of-stock listing{listings.filter(l=>l.quantity<=0).length!==1?'s':''} — hurting buyer experience
                  </p>
                  <p style={{ color:'#B45309', fontSize:12, margin:'2px 0 0' }}>
                    Restock or deactivate listings from deleted farmers to keep the browse page clean
                  </p>
                </div>
                <button style={S.warnBtn} onClick={() => {
                  const el = document.getElementById('ls-status');
                  if (el) { el.value = 'out_of_stock'; }
                  api.get('/admin/listings?status=out_of_stock').then(r=>setListings(r.data||[])).catch(()=>{});
                }}>View Out of Stock</button>
              </div>
            )}

            <div style={S.card}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <input id="ls-search" style={{ flex:2, padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, fontFamily:'inherit', outline:'none', minWidth:200 }} placeholder="🔍 Search listings..."/>
                <select id="ls-status" style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, background:'#fff', fontFamily:'inherit' }}>
                  <option value="">All Listings</option>
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸ Inactive</option>
                  <option value="out_of_stock">❌ Out of Stock</option>
                  <option value="deleted_farmer">👻 Deleted Farmer</option>
                </select>
                <button style={S.primaryBtn} onClick={() => {
                  const search = document.getElementById('ls-search').value;
                  const status = document.getElementById('ls-status').value;
                  api.get(`/admin/listings?search=${search}&status=${status}`).then(r=>setListings(r.data||[])).catch(()=>{});
                }}>Search</button>

              </div>
            </div>

            <div style={S.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    {['#','Product','Farmer','Stock','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {listings.map((l,i) => (
                      <>
                      <tr key={l.listing_id} style={{ background: l.quantity<=0 ? '#FFF5F5' : i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={S.td}><span style={{ color:'#9CA3AF', fontSize:11 }}>#{l.listing_id}</span></td>
                        <td style={S.td}>
                          <p style={{ fontWeight:700, fontSize:13, color:'#111827', margin:0 }}>{l.title}</p>
                          <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>${parseFloat(l.price).toFixed(2)}/{l.unit} · {l.category_name}</p>
                        </td>
                        <td style={S.td}>
                          <div>
                            <span style={{ fontSize:13, color: l.farmer_active===0?'#DC2626':'#374151', fontWeight: l.farmer_active===0?700:400 }}>
                              {l.farmer_name} {l.farmer_active===0&&<span style={{ fontSize:10, background:'#FEF2F2', color:'#DC2626', padding:'1px 6px', borderRadius:20, border:'1px solid #FECACA' }}>Deleted</span>}
                            </span>
                          </div>
                        </td>
                        <td style={S.td}>
                          {l.quantity<=0
                            ? <span style={{ color:'#DC2626', fontWeight:700, fontSize:12, background:'#FEF2F2', padding:'3px 8px', borderRadius:20 }}>❌ Out of stock</span>
                            : <span style={{ fontWeight:600, color: l.quantity<5?'#D97706':'#059669' }}>{l.quantity} {l.unit}{l.quantity<5&&' ⚠️'}</span>
                          }
                        </td>
                        <td style={S.td}><StatusBadge status={l.is_active?'active':'inactive'}/></td>
                        <td style={S.td}>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            <button style={{ ...S.infoBtn, fontSize:11 }} onClick={() => { setRestockId(restockId===l.listing_id?null:l.listing_id); setRestockQty(''); }} title="Restock">🔄 Restock</button>
                            <button style={{ ...(l.is_active?S.warnBtn:S.successBtn), fontSize:11 }} onClick={() => toggleListing(l.listing_id)}>{l.is_active?'⏸ Hide':'▶ Show'}</button>
                            <button style={{ ...S.dangerBtn, fontSize:11 }} onClick={() => removeListing(l.listing_id,l.title)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline restock row */}
                      {restockId === l.listing_id && (
                        <tr key={`restock-${l.listing_id}`} style={{ background:'#ECFDF5' }}>
                          <td colSpan={6} style={{ padding:'12px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                              <span style={{ fontSize:13, fontWeight:700, color:'#065F46' }}>🔄 Restock "{l.title}" (current: {l.quantity} {l.unit})</span>
                              <input
                                type="number" min="1" placeholder={`Add qty (${l.unit})`}
                                value={restockQty} onChange={e=>setRestockQty(e.target.value)}
                                onKeyDown={e=>e.key==='Enter'&&handleAdminRestock(l.listing_id)}
                                style={{ padding:'7px 12px', border:'1.5px solid #A7F3D0', borderRadius:8, fontSize:13, fontFamily:'inherit', width:160, outline:'none' }}
                              />
                              <button style={{ ...S.successBtn, padding:'7px 16px' }} onClick={()=>handleAdminRestock(l.listing_id)}>✅ Confirm Restock</button>
                              <button style={{ ...S.warnBtn, padding:'7px 16px' }} onClick={()=>{setRestockId(null);setRestockQty('');}}>Cancel</button>
                              <span style={{ fontSize:12, color:'#6B7280' }}>This updates the quantity so the product reappears on the browse page for buyers</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                    ))}
                  </tbody>
                </table>
                {listings.length === 0 && <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>No listings found.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ══ ORDERS TAB ══ */}
        {tab === 'orders' && (
          <div style={S.card}>
            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead><tr style={S.thead}>
                  {['Order #','Buyer','Items','Total','GST','Status','Date','Update Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {orders.map((o,i) => {
                    const gst = (parseFloat(o.total_amount) - parseFloat(o.total_amount)/1.1).toFixed(2);
                    return (
                      <tr key={o.order_id} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={S.td}><span style={{ fontWeight:800, color:'#111827' }}>#{o.order_id}</span></td>
                        <td style={S.td}>
                          <p style={{ fontWeight:700, fontSize:13, margin:0 }}>{o.buyer_name}</p>
                          <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{o.buyer_email}</p>
                        </td>
                        <td style={{ ...S.td, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'#374151' }}>{o.items_summary||'—'}</td>
                        <td style={S.td}><span style={{ fontWeight:800, color:'#059669', fontSize:14 }}>${parseFloat(o.total_amount).toFixed(2)}</span></td>
                        <td style={S.td}><span style={{ color:'#6B7280', fontSize:12 }}>${gst}</span></td>
                        <td style={S.td}><StatusBadge status={o.status}/></td>
                        <td style={S.td}><span style={{ color:'#9CA3AF', fontSize:12 }}>{new Date(o.created_at).toLocaleDateString('en-AU')}</span></td>
                        <td style={S.td}>
                          <select style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:12, cursor:'pointer', fontFamily:'inherit', outline:'none' }}
                            value={o.status} onChange={e => updateOrderStatus(o.order_id,e.target.value)}>
                            {['pending','confirmed','shipped','delivered','cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orders.length === 0 && <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>No orders found.</p>}
            </div>
          </div>
        )}

        {/* ══ PAYOUTS TAB ══ */}
        {tab === 'payouts' && (
          <div>
            {/* Stat strip */}
            <div style={S.statGrid}>
              {[
                { icon:'⏳', label:'Pending Payouts', value:`$${Number(payoutTotals?.pending_total||0).toFixed(2)}`, sub:`${payoutTotals?.pending_count||0} owed`, color:'#B45309', bg:'#FFFBEB', border:'#FDE68A' },
                { icon:'✅', label:'Paid Out',         value:`$${Number(payoutTotals?.paid_total||0).toFixed(2)}`,    sub:`${payoutTotals?.paid_count||0} completed`, color:'#065F46', bg:'#ECFDF5', border:'#A7F3D0' },
                { icon:'💼', label:'Commission Earned', value:`$${Number(payoutTotals?.commission_total||0).toFixed(2)}`, sub:'All-time platform revenue', color:'#1D4ED8', bg:'#EFF6FF', border:'#BFDBFE' },
                { icon:'⚙️', label:'Commission Rate',   value:`${commissionRate?.rate_percent ?? '—'}%`, sub:'Current platform fee', color:'#7C3AED', bg:'#F5F3FF', border:'#C4B5FD' },
              ].map((s,i) => (
                <div key={i} style={{ ...S.statCard, background:s.bg, borderColor:s.border }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                  <p style={{ fontSize:20, fontWeight:800, color:s.color, margin:'0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize:12, color:'#374151', fontWeight:600, margin:'0 0 2px' }}>{s.label}</p>
                  <p style={{ fontSize:11, color:'#6B7280', margin:0 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Commission rate setting */}
            <div style={S.card}>
              <div style={S.cardHead}>
                <h3 style={S.cardTitle}>⚙️ Platform Commission Rate</h3>
                {!editingRate && (
                  <button style={S.infoBtn} onClick={() => { setEditingRate(true); setNewRatePercent(String(commissionRate?.rate_percent || 10)); }}>
                    Edit Rate
                  </button>
                )}
              </div>
              {editingRate ? (
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <input
                    type="number" min="0" max="50" step="0.5"
                    value={newRatePercent}
                    onChange={e => setNewRatePercent(e.target.value)}
                    style={{ width:100, padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:15, fontFamily:'inherit', outline:'none' }}
                    autoFocus
                  />
                  <span style={{ fontSize:15, fontWeight:700, color:'#374151' }}>%</span>
                  <button style={S.primaryBtn} onClick={saveCommissionRate}>Save</button>
                  <button style={S.actionBtn} onClick={() => setEditingRate(false)}>Cancel</button>
                  <span style={{ fontSize:12, color:'#9CA3AF' }}>Applies to new orders only. Existing payouts unchanged.</span>
                </div>
              ) : (
                <p style={{ fontSize:14, color:'#6B7280', margin:0 }}>
                  Currently <strong style={{ color:'#7C3AED' }}>{commissionRate?.rate_percent ?? '—'}%</strong> is deducted from every farmer's gross sales as platform commission.
                  {commissionRate?.updated_at && (
                    <span style={{ marginLeft:8, fontSize:12, color:'#9CA3AF' }}>
                      · Last changed {new Date(commissionRate.updated_at).toLocaleDateString('en-AU')}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Filter + bulk actions */}
            <div style={S.card}>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
                <select
                  value={payoutFilter} onChange={e => setPayoutFilter(e.target.value)}
                  style={{ padding:'9px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, background:'#fff', fontFamily:'inherit', outline:'none' }}>
                  <option value="pending">⏳ Pending</option>
                  <option value="paid">✅ Paid</option>
                  <option value="cancelled">🚫 Cancelled</option>
                  <option value="all">All</option>
                </select>
                {payoutFilter === 'pending' && selectedPayouts.length > 0 && (
                  <button style={{ ...S.primaryBtn, background:'linear-gradient(135deg,#065F46,#10B981)' }}
                          onClick={bulkMarkPaid}>
                    💰 Mark {selectedPayouts.length} as Paid
                  </button>
                )}
                <span style={{ fontSize:13, color:'#6B7280' }}>{payouts.length} payout(s)</span>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    {payoutFilter === 'pending' && <th style={{ ...S.th, width:32 }}></th>}
                    {['Order', 'Farmer', 'Gross', 'Commission', 'Net Owed', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {payouts.map((p, i) => (
                      <tr key={p.payout_id} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                        {payoutFilter === 'pending' && (
                          <td style={S.td}>
                            <input type="checkbox"
                              checked={selectedPayouts.includes(p.payout_id)}
                              onChange={() => togglePayoutSelected(p.payout_id)}
                              style={{ accentColor:'#DC2626', width:16, height:16, cursor:'pointer' }}/>
                          </td>
                        )}
                        <td style={S.td}>
                          <span style={{ fontWeight:700, color:'#111827' }}>#{p.order_id}</span>
                          <p style={{ fontSize:10, color:'#9CA3AF', margin:'2px 0 0' }}>by {p.buyer_name}</p>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontWeight:600, color:'#111827' }}>{p.farmer_name}</span>
                          <p style={{ fontSize:10, color:'#9CA3AF', margin:'2px 0 0' }}>{p.farmer_email}</p>
                        </td>
                        <td style={S.td}><span style={{ fontWeight:700, color:'#111827' }}>${Number(p.gross_amount).toFixed(2)}</span></td>
                        <td style={S.td}>
                          <span style={{ color:'#7C3AED', fontWeight:600 }}>−${Number(p.commission_amount).toFixed(2)}</span>
                          <p style={{ fontSize:10, color:'#9CA3AF', margin:'2px 0 0' }}>{(Number(p.commission_rate)*100).toFixed(1)}%</p>
                        </td>
                        <td style={S.td}><span style={{ fontWeight:800, color:'#065F46' }}>${Number(p.net_amount).toFixed(2)}</span></td>
                        <td style={S.td}>
                          <Badge
                            text={p.status}
                            color={p.status==='pending'?'#B45309':p.status==='paid'?'#065F46':'#991B1B'}
                            bg={p.status==='pending'?'#FFFBEB':p.status==='paid'?'#ECFDF5':'#FEF2F2'}/>
                          {p.status==='paid' && p.paid_at && (
                            <p style={{ fontSize:10, color:'#9CA3AF', margin:'2px 0 0' }}>{new Date(p.paid_at).toLocaleDateString('en-AU')}</p>
                          )}
                        </td>
                        <td style={S.td}><span style={{ fontSize:12, color:'#6B7280' }}>{new Date(p.created_at).toLocaleDateString('en-AU')}</span></td>
                        <td style={S.td}>
                          {p.status === 'pending'
                            ? <button style={{ ...S.successBtn, background:'#065F46', color:'#fff', border:'1px solid #065F46' }}
                                       onClick={() => markPayoutPaid(p.payout_id)}>💰 Mark Paid</button>
                            : p.status === 'paid' && p.payment_reference
                              ? <span style={{ fontSize:11, color:'#6B7280' }} title={p.payment_reference}>📎 ref</span>
                              : <span style={{ fontSize:11, color:'#9CA3AF' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payouts.length === 0 && (
                  <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>
                    No {payoutFilter === 'all' ? '' : payoutFilter} payouts {payoutFilter === 'pending' ? '— all caught up! 🎉' : 'found.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ AI LOGS TAB ══ */}
        {tab === 'ai' && (
          <div>
            <div style={S.statGrid}>
              {[
                { icon:'📡', label:'Total API Calls',   value:aiStats?.total_calls||0,  color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE' },
                { icon:'🔤', label:'Tokens Used',       value:aiStats?.total_tokens||0, color:'#7C3AED', bg:'#F5F3FF', border:'#C4B5FD' },
                { icon:'⚡', label:'Avg Latency',       value:`${Math.round(aiStats?.avg_latency||0)}ms`, color:'#D97706', bg:'#FFFBEB', border:'#FCD34D' },
                { icon:'💬', label:'Chat Calls',        value:aiStats?.chat_calls||0,   color:'#059669', bg:'#ECFDF5', border:'#A7F3D0' },
                { icon:'✍️', label:'Description Calls', value:aiStats?.desc_calls||0,  color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC' },
              ].map(({ icon, label, value, color, bg, border }) => (
                <div key={label} style={{ ...S.statCard, background:bg, borderColor:border }}>
                  <span style={{ fontSize:24 }}>{icon}</span>
                  <p style={{ fontSize:22, fontWeight:800, color, margin:'6px 0 2px' }}>{value}</p>
                  <p style={{ fontSize:12, color:'#6B7280', margin:0, fontWeight:500 }}>{label}</p>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    {['Time','User','Feature','Tokens','Latency','Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {aiLogs.map((l,i) => (
                      <tr key={l.log_id||i} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={S.td}><span style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(l.created_at).toLocaleString()}</span></td>
                        <td style={S.td}><span style={{ fontSize:13, fontWeight:600 }}>{l.full_name||'Guest'}</span></td>
                        <td style={S.td}><Badge text={l.feature} color='#1D4ED8' bg='#EFF6FF'/></td>
                        <td style={S.td}><span style={{ fontWeight:600 }}>{l.total_tokens}</span></td>
                        <td style={S.td}><span style={{ color:'#6B7280', fontSize:12 }}>{l.latency_ms}ms</span></td>
                        <td style={S.td}><StatusBadge status={l.status||'success'}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {aiLogs.length===0 && <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>No AI logs yet. Use the chatbot or description generator.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ══ AUDIT TRAIL TAB ══ */}
        {tab === 'audit' && (
          <div style={S.card}>
            {/* ── Filter bar ── */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:16, padding:'4px 4px 16px', borderBottom:'1px solid #F3F4F6' }}>
              <input
                type="text"
                placeholder="🔍 Search name, email, action, description…"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadAudit(); }}
                style={{ flex:'1 1 260px', minWidth:200, padding:'9px 14px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none' }}
              />
              <select value={auditRole} onChange={e => { setAuditRole(e.target.value); }}
                style={{ padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', cursor:'pointer' }}>
                <option value="">All roles</option>
                <option value="farmer">🌾 Farmers</option>
                <option value="buyer">🛒 Buyers</option>
                <option value="admin">⚡ Admins</option>
                <option value="system">🤖 System (unauth)</option>
              </select>
              <select value={auditStatus} onChange={e => setAuditStatus(e.target.value)}
                style={{ padding:'9px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff', cursor:'pointer' }}>
                <option value="">All statuses</option>
                <option value="success">✅ Success</option>
                <option value="failed">⚠️ Failed</option>
                <option value="blocked">🛡️ Blocked</option>
              </select>
              <button onClick={loadAudit} style={{ ...S.actionBtn, margin:0 }}>Apply</button>
              {(auditRole || auditStatus || auditSearch) && (
                <button onClick={() => { setAuditRole(''); setAuditStatus(''); setAuditSearch(''); setTimeout(loadAudit, 0); }}
                  style={{ background:'#F3F4F6', color:'#374151', border:'none', padding:'9px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ✕ Clear
                </button>
              )}
              <span style={{ marginLeft:'auto', fontSize:12, color:'#6B7280' }}>
                Showing <strong>{auditLogs.length}</strong> {auditLogs.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead><tr style={S.thead}>
                  {['Time','User','Role','Action','Status','IP Address'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {auditLogs.map((l,i) => (
                    <tr key={l.log_id||i} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                      <td style={S.td}><span style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(l.created_at).toLocaleString()}</span></td>
                      <td style={S.td}>
                        {l.full_name || l.email
                          ? <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{l.full_name || l.email}</span>
                          : <span style={{ fontSize:12, color:'#9CA3AF', fontStyle:'italic' }}>— unauthenticated —</span>}
                      </td>
                      <td style={S.td}>
                        {l.role
                          ? <span style={{ ...S.roleBadge, ...S.roleColorFor(l.role) }}>{l.role}</span>
                          : <span style={{ ...S.roleBadge, background:'#F3F4F6', color:'#6B7280' }}>system</span>}
                      </td>
                      <td style={S.td}><span style={{ fontSize:13, color:'#374151' }}>{(l.action||'').replace(/_/g,' ')}</span></td>
                      <td style={S.td}><StatusBadge status={l.status||'success'}/></td>
                      <td style={S.td}><span style={{ fontFamily:'monospace', fontSize:12, color:'#6B7280' }}>{l.ip_address||'—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length===0 && <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>No audit logs match these filters.</p>}
            </div>
          </div>
        )}

        {/* ══ SECURITY TAB ══ */}
        {tab === 'security' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={S.card}>
                <div style={S.cardHead}><h3 style={{ ...S.cardTitle, color:'#DC2626' }}>🚫 Blocked IPs ({blockedIPs.length})</h3></div>
                {blockedIPs.length===0 ? <p style={{ color:'#9CA3AF', textAlign:'center', padding:20 }}>No blocked IPs</p>
                  : blockedIPs.map((ip,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                    <div>
                      <p style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, margin:0, color:'#DC2626' }}>{ip.ip_address}</p>
                      <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{ip.reason} · {ip.failed_attempts} attempts</p>
                    </div>
                    <Badge text={ip.expires_at?'Temporary':'Permanent'} color='#991B1B' bg='#FEF2F2'/>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.cardHead}><h3 style={{ ...S.cardTitle, color:'#D97706' }}>⚠️ Security Events ({security.length})</h3></div>
                {security.length===0 ? <p style={{ color:'#9CA3AF', textAlign:'center', padding:20 }}>No security events</p>
                  : security.slice(0,10).map((e,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, margin:0, color:'#111827' }}>{(e.action||e.event_type||'Event').replace(/_/g,' ')}</p>
                      <p style={{ fontSize:11, color:'#9CA3AF', margin:0, fontFamily:'monospace' }}>{e.ip_address} · {new Date(e.created_at).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={e.status||'error'}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ COMPLIANCE TAB ══ */}
        {tab === 'compliance' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div style={S.card}>
                <div style={S.cardHead}><h3 style={S.cardTitle}>📋 Australian Privacy Principles</h3></div>
                {[['APP 1','Transparent management of personal information'],['APP 3','Solicited collection of personal information'],['APP 5','Notification of collection of personal information'],['APP 6','Use or disclosure of personal information'],['APP 11','Security of personal information'],['APP 12','Access to personal information'],['APP 13','Correction of personal information']].map(([app,desc]) => (
                  <div key={app} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0', borderBottom:'1px solid #F3F4F6' }}>
                    <span style={{ color:'#059669', fontSize:16, flexShrink:0, marginTop:1 }}>✅</span>
                    <div>
                      <p style={{ fontWeight:700, fontSize:13, color:'#065F46', margin:0 }}>{app}</p>
                      <p style={{ fontSize:12, color:'#6B7280', margin:0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={S.card}>
                  <div style={S.cardHead}><h3 style={S.cardTitle}>⏱ Data Retention Policy</h3></div>
                  {[['Activity Logs','90 days'],['Order Records','7 years (ATO)'],['AI Chat Logs','30 days'],['User Profiles','Until deletion request'],['Invoices','7 years (ATO)']].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F3F4F6', fontSize:13 }}>
                      <span style={{ color:'#6B7280' }}>{k}</span>
                      <span style={{ fontWeight:700, color:'#065F46' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.cardHead}><h3 style={S.cardTitle}>⚡ User Data Actions</h3></div>
                  <p style={{ fontSize:12, color:'#9CA3AF', marginBottom:14 }}>Enter a User ID to perform Privacy Act compliant actions.</p>
                  <input id="compliance-uid" style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, boxSizing:'border-box', fontFamily:'inherit', outline:'none', marginBottom:12 }} placeholder="Enter User ID (e.g. 3)"/>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { label:'📥 Export User Data (JSON)', color:'#1D4ED8', bg:'#EFF6FF', fn: () => { const uid=document.getElementById('compliance-uid').value.trim(); if(!uid){showToast('Enter a User ID','error');return;} exportUserData(uid); }},
                      { label:'🗑️ Anonymise User Data (Right to Erasure)', color:'#D97706', bg:'#FFFBEB', border:'#FCD34D', fn: async () => { const uid=document.getElementById('compliance-uid').value.trim(); if(!uid){showToast('Enter a User ID','error');return;} try{const r=await api.get(`/admin/users/${uid}`);deleteUserData(uid,r.data.user?.full_name||`User #${uid}`);}catch{showToast('User not found','error');} }},
                      { label:'📊 Generate Privacy Report (JSON)', color:'#7C3AED', bg:'#F5F3FF', fn: () => { const uid=document.getElementById('compliance-uid').value.trim(); generatePrivacyReport(uid); }},
                    ].map(({ label, color, bg, border, fn }) => (
                      <button key={label} onClick={fn} style={{ padding:'11px 14px', background:bg, color, border: border?`1px solid ${border}`:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13, textAlign:'left', fontFamily:'inherit' }}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {tab === 'settings' && (
          <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
            {/* Settings nav */}
            <div style={{ width:185, background:'#fff', borderRadius:14, padding:12, border:'1px solid #F3F4F6', flexShrink:0, position:'sticky', top:20, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:1, padding:'4px 8px 10px', margin:0 }}>Settings</p>
              {[{k:'profile',icon:'👤',l:'Profile'},{k:'password',icon:'🔒',l:'Password'},{k:'notifs',icon:'🔔',l:'Notifications'},{k:'account',icon:'ℹ️',l:'Account Info'},{k:'danger',icon:'⚠️',l:'Danger Zone'}].map(({k,icon,l}) => (
                <button key={k} onClick={() => setAppear(a => ({...a, _sec:k}))}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 10px', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s', background:(appear._sec||'profile')===k?'#ECFDF5':'none', color:(appear._sec||'profile')===k?'#065F46':'#6B7280' }}>
                  <span style={{ fontSize:15 }}>{icon}</span>{l}
                  {(appear._sec||'profile')===k && <span style={{ marginLeft:'auto', color:'#059669', fontWeight:800 }}>›</span>}
                </button>
              ))}
            </div>
            <div style={{ flex:1, background:'#fff', borderRadius:16, padding:28, border:'1px solid #F3F4F6', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Profile */}
              {(appear._sec||'profile')==='profile' && (
                <div>
                  <div style={{ marginBottom:24, paddingBottom:16, borderBottom:'1px solid #F3F4F6' }}>
                    <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 4px' }}>Profile Information</h2>
                    <p style={{ fontSize:13, color:'#6B7280', margin:0 }}>Update your admin account details</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:'linear-gradient(135deg,#FEF2F2,#FFF5F5)', borderRadius:14, marginBottom:24, border:'1px solid #FCA5A5' }}>
                    <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#991B1B,#DC2626)', color:'#fff', fontSize:24, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{(user?.full_name||user?.name||'A')[0].toUpperCase()}</div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:15, color:'#111827', margin:0 }}>{user?.full_name||user?.name}</p>
                      <p style={{ color:'#6B7280', fontSize:13, margin:'4px 0 8px' }}>{user?.email}</p>
                      <span style={{ background:'#FEF2F2', color:'#991B1B', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, border:'1px solid #FCA5A5' }}>⚡ Administrator</span>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}><label style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>Full Name</label><input value={settings.full_name} onChange={e=>setSettings(p=>({...p,full_name:e.target.value}))} style={{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', color:'#111827', background:'#FAFAFA' }}/></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}><label style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>Phone</label><input value={settings.phone} onChange={e=>setSettings(p=>({...p,phone:e.target.value}))} style={{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', color:'#111827', background:'#FAFAFA' }}/></div>
                  </div>
                  <button style={{ padding:'11px 28px', background:'linear-gradient(135deg,#991B1B,#DC2626)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }} onClick={saveSettings}>{savingSettings?'⏳ Saving...':'Save Profile'}</button>

                  {/* ── Change email (separate form, password-confirmed) ── */}
                  <div style={{ marginTop:28, paddingTop:24, borderTop:'1px solid #F3F4F6' }}>
                    <ChangeEmail />
                  </div>
                </div>
              )}
              {/* Password */}
              {appear._sec==='password' && (
                <div>
                  <div style={{ marginBottom:24, paddingBottom:16, borderBottom:'1px solid #F3F4F6' }}><h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 4px' }}>Change Password</h2><p style={{ fontSize:13, color:'#6B7280', margin:0 }}>Update your admin access credentials</p></div>
                  {[['Current Password','current_password'],['New Password','new_password'],['Confirm New Password','confirm_password']].map(([lbl,k]) => (
                    <div key={k} style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}><label style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5 }}>{lbl}</label><input type="password" placeholder="••••••••" value={pwForm[k]} onChange={e=>setPwForm(p=>({...p,[k]:e.target.value}))} style={{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none', color:'#111827', background:'#FAFAFA' }}/></div>
                  ))}
                  <button style={{ padding:'11px 28px', background:'linear-gradient(135deg,#991B1B,#DC2626)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }} onClick={changePassword}>{savingPw?'⏳ Changing...':'🔒 Change Password'}</button>
                </div>
              )}
              {/* Notifications */}
              {appear._sec==='notifs' && (
                <div>
                  <div style={{ marginBottom:24, paddingBottom:16, borderBottom:'1px solid #F3F4F6' }}><h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 4px' }}>Admin Notifications</h2><p style={{ fontSize:13, color:'#6B7280', margin:0 }}>Control what alerts you receive as an administrator</p></div>
                  {[{k:'new_user',icon:'👤',l:'New User Registrations',s:'Alert when a new buyer or farmer joins'},{k:'new_order',icon:'📦',l:'New Orders',s:'Alert when orders are placed on the platform'},{k:'security_alert',icon:'🚨',l:'Security Alerts',s:'Immediate alerts for suspicious activity or blocked IPs'},{k:'system_update',icon:'🔧',l:'System Updates',s:'Notifications for deployments and maintenance'},{k:'ai_errors',icon:'🤖',l:'AI API Errors',s:'Alert when Groq API calls fail or exceed limits'}].map(({k,icon,l,s}) => (
                    <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 0', borderBottom:'1px solid #F9FAFB' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <span style={{ width:36, height:36, background:'#F3F4F6', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{icon}</span>
                        <div><p style={{ fontSize:14, fontWeight:600, color:'#111827', margin:0 }}>{l}</p><p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>{s}</p></div>
                      </div>
                      <Toggle on={notifs[k]} onClick={() => setNotifs(n => ({...n,[k]:!n[k]}))}/>
                    </div>
                  ))}
                  <br/><button style={{ padding:'11px 28px', background:'linear-gradient(135deg,#991B1B,#DC2626)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }} onClick={() => showToast('✅ Notification preferences saved!')}>Save Preferences</button>
                </div>
              )}
              {/* Account info */}
              {appear._sec==='account' && (
                <div>
                  <div style={{ marginBottom:24, paddingBottom:16, borderBottom:'1px solid #F3F4F6' }}><h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:'0 0 4px' }}>Account Information</h2><p style={{ fontSize:13, color:'#6B7280', margin:0 }}>Your admin account details and permissions</p></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                    {[['Account Type','Administrator'],['Account Status','Active & Verified'],['Email Verified','Yes'],['Member Since','2026'],['Admin Level','Super Admin'],['2FA Status','Not enabled']].map(([k,v]) => (
                      <div key={k} style={{ background:'#F9FAFB', borderRadius:10, padding:'12px 14px', border:'1px solid #F3F4F6' }}>
                        <p style={{ fontSize:10, color:'#9CA3AF', margin:0, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{k}</p>
                        <p style={{ fontSize:14, color:'#111827', fontWeight:700, margin:'4px 0 0' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#F0FDF4', borderRadius:12, padding:'14px 16px', border:'1px solid #A7F3D0' }}>
                    <p style={{ fontWeight:700, fontSize:13, color:'#065F46', margin:'0 0 4px' }}>🔐 Admin Permissions</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {['Manage Users','Manage Listings','Manage Orders','View AI Logs','View Audit Trail','Security Monitor','Compliance Export','System Settings'].map(p => (
                        <span key={p} style={{ background:'#ECFDF5', color:'#065F46', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid #A7F3D0' }}>✓ {p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Danger zone */}
              {appear._sec==='danger' && (
                <div>
                  <div style={{ marginBottom:24, paddingBottom:16, borderBottom:'1px solid #F3F4F6' }}><h2 style={{ fontSize:18, fontWeight:800, color:'#991B1B', margin:'0 0 4px' }}>⚠️ Danger Zone</h2><p style={{ fontSize:13, color:'#6B7280', margin:0 }}>These actions affect your admin session and account</p></div>
                  <div style={{ background:'#FEF2F2', borderRadius:14, padding:20, border:'1px solid #FCA5A5', marginBottom:16 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, color:'#991B1B', margin:'0 0 8px' }}>Logout Admin Session</h3>
                    <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 16px' }}>This will clear your admin session and return you to the login page.</p>
                    <button onClick={() => { if(window.confirm('Log out of admin portal?')) { logout(); navigate('/login'); } }} style={{ padding:'10px 24px', background:'#DC2626', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'inherit' }}>🚪 Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── AI Admin Assistant (floating, bottom-right) ── */}
      <AdminBot />

      {/* ── User History modal (admin can view any user's full timeline) ── */}
      <UserHistoryModal userId={historyForUser} onClose={() => setHistoryForUser(null)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════
const S = {
  shell:       { display:'flex', minHeight:'100vh', background:'#F3F4F6' },
  sidebar:     { background:'#0F1923', display:'flex', flexDirection:'column', flexShrink:0, transition:'width 0.25s ease', overflow:'hidden', position:'sticky', top:0, height:'100vh' },
  brand:       { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 14px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  brandInner:  { display:'flex', alignItems:'center', gap:10, overflow:'hidden' },
  brandLogo:   { width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#DC2626,#991B1B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  brandName:   { color:'#fff', fontWeight:800, fontSize:14, margin:0, whiteSpace:'nowrap' },
  brandTag:    { background:'#DC2626', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:4, letterSpacing:1, display:'inline-block' },
  statusStrip: { display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'rgba(5,150,105,0.1)', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  statusDot:   { width:8, height:8, borderRadius:'50%', background:'#10B981', flexShrink:0, boxShadow:'0 0 6px #10B981' },
  statusText:  { fontSize:11, color:'#6EE7B7', fontWeight:600 },
  quickStats:  { display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  quickStat:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 4px', gap:2 },
  qVal:        { fontSize:14, fontWeight:800 },
  qLabel:      { fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:500 },
  nav:         { display:'flex', flexDirection:'column', padding:'10px', gap:2, flex:1 },
  navSec:      { color:'rgba(255,255,255,0.25)', fontSize:10, fontWeight:700, letterSpacing:1, padding:'8px 8px 4px', margin:0 },
  navItem:     { display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:10, border:'none', background:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:500, width:'100%', transition:'all 0.15s', fontFamily:'inherit' },
  navActive:   { background:'rgba(220,38,38,0.2)', color:'#fff', fontWeight:700, borderLeft:'3px solid #DC2626' },
  navIcon:     { fontSize:16, flexShrink:0, width:22, textAlign:'center' },
  navLabel:    { flex:1, textAlign:'left', whiteSpace:'nowrap' },
  navBadge:    { borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 },
  sideBottom:  { padding:'10px 12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:8 },
  adminCard:   { display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.05)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' },
  adminAvatar: { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#DC2626,#991B1B)', color:'#fff', fontSize:14, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  adminName:   { color:'#fff', fontSize:12, fontWeight:700, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  adminBadge:  { background:'rgba(220,38,38,0.2)', color:'#FCA5A5', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, display:'inline-block' },
  logoutBtn:   { display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'9px 0', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#FCA5A5', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
  collapseBtn: { background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  main:        { flex:1, padding:'28px 32px', minWidth:0 },
  topBar:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 },
  pageTitle:   { fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 3px' },
  pageSub:     { fontSize:13, color:'#6B7280', margin:0 },
  adminPortalBadge: { background:'linear-gradient(135deg,#991B1B,#DC2626)', color:'#fff', padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:700, letterSpacing:0.5 },
  actionBtn:   { padding:'9px 18px', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit' },
  primaryBtn:  { padding:'10px 22px', background:'linear-gradient(135deg,#991B1B,#DC2626)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(220,38,38,0.3)' },
  alertBanner: { display:'flex', alignItems:'center', gap:16, padding:'14px 20px', background:'#FEF2F2', borderRadius:14, border:'2px solid #FCA5A5', marginBottom:20 },
  loadingBar:  { height:3, background:'#F3F4F6', borderRadius:2, marginBottom:20, overflow:'hidden' },
  loadingInner:{ height:'100%', background:'linear-gradient(90deg,#DC2626,#F59E0B,#DC2626)', backgroundSize:'200% 100%', borderRadius:2, animation:'shimmer 1.2s infinite', width:'100%' },
  statGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:24 },
  statCard:    { borderRadius:14, padding:'18px 16px', border:'1.5px solid', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  card:        { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', border:'1px solid #F3F4F6', marginBottom:20 },
  cardHead:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardTitle:   { fontSize:15, fontWeight:700, color:'#111827', margin:0 },
  cardLink:    { background:'none', border:'none', color:'#DC2626', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  table:       { width:'100%', borderCollapse:'collapse' },
  thead:       { background:'#0F1923' },
  th:          { padding:'11px 14px', color:'#fff', fontSize:11, fontWeight:700, textAlign:'left', textTransform:'uppercase', letterSpacing:0.5 },
  td:          { padding:'11px 14px', fontSize:13, borderTop:'1px solid #F3F4F6', verticalAlign:'middle' },
  successBtn:  { padding:'6px 12px', background:'#ECFDF5', color:'#065F46', border:'1px solid #A7F3D0', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap' },
  warnBtn:     { padding:'6px 12px', background:'#FFFBEB', color:'#B45309', border:'1px solid #FCD34D', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap' },
  infoBtn:     { padding:'6px 12px', background:'#EFF6FF', color:'#1D4ED8', border:'1px solid #BFDBFE', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap' },
  dangerBtn:   { padding:'6px 12px', background:'#FEF2F2', color:'#DC2626', border:'1px solid #FCA5A5', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap' },
  roleBadge:   { display:'inline-block', padding:'2px 9px', borderRadius:10, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5 },
  roleColorFor: (r) => ({
    farmer: { background:'#ECFDF5', color:'#065F46' },
    buyer:  { background:'#EFF6FF', color:'#1D4ED8' },
    admin:  { background:'#FEF2F2', color:'#991B1B' },
  }[r] || { background:'#F3F4F6', color:'#6B7280' }),
};