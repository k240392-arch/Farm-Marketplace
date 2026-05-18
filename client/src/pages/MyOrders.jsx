// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Toggle switch ────────────────────────────────
function Toggle({ on, onClick }) {
  return (
    <button style={{ ...SS.toggle, background: on ? '#059669' : '#D1D5DB' }} onClick={onClick}>
      <span style={{ ...SS.thumb, transform: on ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  );
}

// ═══════════════════════════════════════════════════
//  BUYER SETTINGS PAGE
// ═══════════════════════════════════════════════════
function BuyerSettings({ user }) {
  const [sec, setSec]     = useState('profile');
  const [saved, setSaved] = useState('');
  const flash = (m = 'Changes saved!') => { setSaved(m); setTimeout(() => setSaved(''), 3000); };

  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '', phone: '', location: '', bio: '' });
  const [notifs,  setNotifs]  = useState({ order_updates: true, new_arrivals: true, promotions: false, weekly_digest: true, sms_alerts: false, push_browser: true });
  const [privacy, setPrivacy] = useState({ profile_public: true, show_reviews: true, data_analytics: false, marketing: false });
  const [appear,  setAppear]  = useState({ theme: 'light', language: 'en-AU', currency: 'AUD', density: 'comfortable' });

  const sections = [
    { k: 'profile',    icon: '👤', label: 'Profile' },
    { k: 'notifs',     icon: '🔔', label: 'Notifications' },
    { k: 'privacy',    icon: '🔒', label: 'Privacy & Data' },
    { k: 'appearance', icon: '🎨', label: 'Appearance' },
    { k: 'security',   icon: '🛡️', label: 'Security' },
    { k: 'billing',    icon: '💳', label: 'Billing' },
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
        {saved && <div style={SS.toast}>✅ {saved}</div>}

        {/* ── PROFILE ── */}
        {sec === 'profile' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Profile Information</h2><p style={SS.ssub}>Update how you appear on FarmMarket</p></div>
            <div style={SS.avatarRow}>
              <div style={SS.bigAvatar}>{(user?.full_name || 'U')[0].toUpperCase()}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{user?.full_name}</p>
                <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 10px' }}>{user?.email}</p>
                <span style={SS.rolePill}>🛒 Buyer Account</span>
              </div>
            </div>
            <div style={SS.grid2}>
              {[['Full Name','full_name','text','Your full name'],['Email','email','email','you@example.com'],['Phone','phone','tel','+61 4xx xxx xxx'],['Location','location','text','e.g. Melbourne, VIC']].map(([lbl,k,t,ph]) => (
                <div key={k} style={SS.fg}><label style={SS.fl}>{lbl}</label><input type={t} placeholder={ph} value={profile[k]} onChange={e => setProfile(p => ({...p,[k]:e.target.value}))} style={SS.fi}/></div>
              ))}
              <div style={{...SS.fg, gridColumn:'1/-1'}}><label style={SS.fl}>Bio</label><textarea placeholder="Tell farmers a bit about yourself..." value={profile.bio} onChange={e => setProfile(p => ({...p,bio:e.target.value}))} style={{...SS.fi,height:88,resize:'vertical'}}/></div>
            </div>
            <button style={SS.saveBtn} onClick={() => flash('Profile updated!')}>Save Profile</button>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {sec === 'notifs' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Notification Preferences</h2><p style={SS.ssub}>Choose how and when FarmMarket contacts you</p></div>
            {[
              {k:'order_updates', icon:'📦', label:'Order Updates',          sub:'Confirmations, shipping and delivery alerts'},
              {k:'new_arrivals',  icon:'🌱', label:'New Arrivals',           sub:'Fresh produce added by your saved farmers'},
              {k:'promotions',    icon:'🏷️', label:'Promotions',             sub:'Deals, discounts and seasonal offers'},
              {k:'weekly_digest', icon:'📊', label:'Weekly Digest',          sub:'A summary of activity and recommendations'},
              {k:'sms_alerts',    icon:'💬', label:'SMS Alerts',             sub:'Text messages for urgent order updates'},
              {k:'push_browser',  icon:'🔔', label:'Browser Notifications',  sub:'Real-time alerts in your browser'},
            ].map(({k,icon,label,sub}) => (
              <div key={k} style={SS.tRow}>
                <div style={SS.tLeft}><span style={SS.tIcon}>{icon}</span><div><p style={SS.tLabel}>{label}</p><p style={SS.tSub}>{sub}</p></div></div>
                <Toggle on={notifs[k]} onClick={() => setNotifs(n => ({...n,[k]:!n[k]}))}/>
              </div>
            ))}
            <br/><button style={SS.saveBtn} onClick={() => flash('Notification preferences saved!')}>Save Preferences</button>
          </div>
        )}

        {/* ── PRIVACY ── */}
        {sec === 'privacy' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Privacy & Data</h2><p style={SS.ssub}>Control how your data is used and who can see your activity</p></div>
            {[
              {k:'profile_public', icon:'👁️', label:'Public Profile',          sub:'Allow farmers to see your name and buyer history'},
              {k:'show_reviews',   icon:'⭐', label:'Show My Reviews',         sub:'Display your reviews publicly on product pages'},
              {k:'data_analytics', icon:'📈', label:'Usage Analytics',          sub:'Help us improve by sharing anonymous usage data'},
              {k:'marketing',      icon:'🎯', label:'Personalised Marketing',   sub:'Receive tailored product recommendations'},
            ].map(({k,icon,label,sub}) => (
              <div key={k} style={SS.tRow}>
                <div style={SS.tLeft}><span style={SS.tIcon}>{icon}</span><div><p style={SS.tLabel}>{label}</p><p style={SS.tSub}>{sub}</p></div></div>
                <Toggle on={privacy[k]} onClick={() => setPrivacy(p => ({...p,[k]:!p[k]}))}/>
              </div>
            ))}
            <div style={SS.danger}>
              <h3 style={SS.dTitle}>⚠️ Danger Zone</h3><p style={SS.dSub}>These actions are permanent and cannot be undone.</p>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <button style={SS.dOutline} onClick={() => alert('Data export requested. Email within 24 hours.')}>📥 Export My Data</button>
                <button style={SS.dBtn} onClick={() => { if(window.confirm('Delete your account permanently?')) alert('Deletion requested.'); }}>🗑️ Delete Account</button>
              </div>
            </div>
            <button style={SS.saveBtn} onClick={() => flash('Privacy settings saved!')}>Save Settings</button>
          </div>
        )}

        {/* ── APPEARANCE ── */}
        {sec === 'appearance' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Appearance & Preferences</h2><p style={SS.ssub}>Customise your FarmMarket experience</p></div>
            <div style={{marginBottom:28}}>
              <label style={SS.fl}>Theme</label>
              <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
                {[['light','☀️ Light','#fff','#E5E7EB','#111827'],['dark','🌙 Dark','#1F2937','#374151','#fff'],['forest','🌿 Forest','#064E3B','#065F46','#fff']].map(([v,lbl,bg,brd,clr]) => (
                  <button key={v} onClick={() => setAppear(a => ({...a,theme:v}))} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 18px',borderRadius:12,border:`2px solid ${appear.theme===v?'#059669':brd}`,background:bg,color:clr,cursor:'pointer',fontWeight:600,fontSize:14,fontFamily:'inherit',boxShadow:appear.theme===v?'0 0 0 3px rgba(5,150,105,0.2)':'none'}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:'#059669',border:`2px solid ${appear.theme===v?'#059669':'#9CA3AF'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>{appear.theme===v&&<span style={{color:'#fff',fontSize:11}}>✓</span>}</div>{lbl}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:28}}>
              <label style={SS.fl}>Display Density</label>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                {['compact','comfortable','spacious'].map(d => (
                  <button key={d} onClick={() => setAppear(a => ({...a,density:d}))} style={{padding:'8px 18px',borderRadius:8,border:`2px solid ${appear.density===d?'#059669':'#E5E7EB'}`,background:appear.density===d?'#ECFDF5':'#fff',color:appear.density===d?'#065F46':'#374151',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize'}}>{d}</button>
                ))}
              </div>
            </div>
            <div style={SS.grid2}>
              <div style={SS.fg}><label style={SS.fl}>Language</label><select value={appear.language} onChange={e=>setAppear(a=>({...a,language:e.target.value}))} style={SS.fi}><option value="en-AU">🇦🇺 English (Australia)</option><option value="en-US">🇺🇸 English (US)</option><option value="en-GB">🇬🇧 English (UK)</option></select></div>
              <div style={SS.fg}><label style={SS.fl}>Currency</label><select value={appear.currency} onChange={e=>setAppear(a=>({...a,currency:e.target.value}))} style={SS.fi}><option value="AUD">🇦🇺 AUD</option><option value="USD">🇺🇸 USD</option><option value="NZD">🇳🇿 NZD</option></select></div>
            </div>
            <button style={SS.saveBtn} onClick={() => flash('Appearance updated!')}>Save Appearance</button>
          </div>
        )}

        {/* ── SECURITY ── */}
        {sec === 'security' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Security</h2><p style={SS.ssub}>Keep your buyer account safe and secure</p></div>
            <div style={SS.secGrid}>
              {[{icon:'✅',label:'Email Verified',sub:'Your email is confirmed',ok:true},{icon:'✅',label:'Strong Password',sub:'Last changed 30 days ago',ok:true},{icon:'⚠️',label:'2-Factor Auth',sub:'Not enabled — recommended',ok:false},{icon:'✅',label:'Login Alerts',sub:'Enabled for new devices',ok:true}].map(({icon,label,sub,ok}) => (
                <div key={label} style={{...SS.secCard,borderColor:ok?'#A7F3D0':'#FCD34D',background:ok?'#F0FDF4':'#FFFBEB'}}>
                  <span style={{fontSize:22}}>{icon}</span>
                  <div><p style={{fontWeight:700,fontSize:13,color:ok?'#065F46':'#92400E',margin:0}}>{label}</p><p style={{fontSize:12,color:'#6B7280',margin:0}}>{sub}</p></div>
                </div>
              ))}
            </div>
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Change Password</h3>
              <div style={SS.grid2}>
                <div style={SS.fg}><label style={SS.fl}>Current Password</label><input type="password" placeholder="••••••••" style={SS.fi}/></div>
                <div style={SS.fg}><label style={SS.fl}>New Password</label><input type="password" placeholder="••••••••" style={SS.fi}/></div>
                <div style={{...SS.fg,gridColumn:'1/-1'}}><label style={SS.fl}>Confirm New Password</label><input type="password" placeholder="••••••••" style={SS.fi}/></div>
              </div>
              <button style={SS.saveBtn} onClick={() => flash('Password changed!')}>Update Password</button>
            </div>
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Active Sessions</h3>
              {[{device:'💻 MacBook Pro',loc:'Melbourne, AU',time:'Now — Current session',cur:true},{device:'📱 iPhone 15',loc:'Melbourne, AU',time:'2 hours ago',cur:false}].map(({device,loc,time,cur}) => (
                <div key={device} style={SS.sessRow}>
                  <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:'#111827',margin:0}}>{device}</p><p style={{fontSize:12,color:'#9CA3AF',margin:'2px 0 0'}}>{loc} · {time}</p></div>
                  {cur?<span style={{fontSize:12,background:'#ECFDF5',color:'#065F46',padding:'3px 10px',borderRadius:20,fontWeight:600}}>This device</span>:<button style={SS.revokeBtn} onClick={()=>flash('Session revoked.')}>Revoke</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BILLING ── */}
        {sec === 'billing' && (
          <div>
            <div style={SS.head}><h2 style={SS.stitle}>Billing & Payments</h2><p style={SS.ssub}>Manage your payment methods and view transaction history</p></div>
            <div style={SS.pwCard}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={SS.pwTitle}>Payment Methods</h3>
                <button style={SS.addCardBtn}>+ Add Card</button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:14,background:'#fff',borderRadius:10,border:'1.5px solid #E5E7EB'}}>
                <div style={{width:44,height:44,background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>💳</div>
                <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14,color:'#111827',margin:0}}>Visa ending in 4242</p><p style={{fontSize:12,color:'#9CA3AF',margin:0}}>Expires 12/27 · Default card</p></div>
                <span style={{fontSize:12,background:'#ECFDF5',color:'#065F46',padding:'3px 10px',borderRadius:20,fontWeight:600}}>Default</span>
              </div>
            </div>
            <div style={SS.pwCard}>
              <h3 style={SS.pwTitle}>Payment History</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,padding:'8px 0 10px',borderBottom:'1px solid #E5E7EB',fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:0.5}}>
                <span>Date</span><span>Description</span><span>Amount</span><span>Status</span>
              </div>
              {[{date:'20 Apr 2026',desc:'Order #11',amount:'$479.20'},{date:'09 Apr 2026',desc:'Order #7',amount:'$607.58'},{date:'07 Apr 2026',desc:'Order #6',amount:'$515.41'}].map(({date,desc,amount}) => (
                <div key={desc} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,padding:'12px 0',borderBottom:'1px solid #F3F4F6',alignItems:'center'}}>
                  <span style={{color:'#6B7280',fontSize:13}}>{date}</span>
                  <span style={{fontWeight:600,fontSize:13}}>{desc}</span>
                  <span style={{fontWeight:700,color:'#059669',fontSize:13}}>{amount}</span>
                  <span style={{fontSize:12,background:'#ECFDF5',color:'#065F46',padding:'2px 10px',borderRadius:20,fontWeight:600}}>Paid</span>
                </div>
              ))}
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
export default function MyOrders() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadOrders = () => {
    setRefreshing(true);
    api.get('/orders/my')
      .then(r => { setOrders(r.data); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadOrders(); }, []);
  const handleLogout = () => { logout(); navigate('/'); };

  const STATUS = {
    pending:   { bg:'#FFFBEB', color:'#B45309', border:'#FCD34D', dot:'#F59E0B' },
    confirmed: { bg:'#EFF6FF', color:'#1D4ED8', border:'#93C5FD', dot:'#3B82F6' },
    shipped:   { bg:'#F5F3FF', color:'#6D28D9', border:'#C4B5FD', dot:'#8B5CF6' },
    delivered: { bg:'#ECFDF5', color:'#065F46', border:'#6EE7B7', dot:'#10B981' },
    cancelled: { bg:'#FEF2F2', color:'#991B1B', border:'#FCA5A5', dot:'#EF4444' },
  };
  const STEPS = ['pending','confirmed','shipped','delivered'];

  const totalSpent     = orders.reduce((s,o) => s + Number(o.total_amount||0), 0);
  const deliveredCount = orders.filter(o => o.status==='delivered').length;
  const pendingCount   = orders.filter(o => o.status==='pending').length;
  const avgOrder       = orders.length ? totalSpent / orders.length : 0;
  const hasPending     = pendingCount > 0;

  const navItems = [
    { key:'overview',  icon:'📊', label:'Overview' },
    { key:'orders',    icon:'📦', label:'My Orders',      badge:orders.length },
    { key:'account',   icon:'👤', label:'Account Summary', badge:null },
    { key:'reviews',   icon:'⭐', label:'My Reviews',      badge:null },
    { key:'settings',  icon:'⚙️', label:'Settings' },
  ];

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{textAlign:'center'}}><div style={S.spinner}/><p style={{color:'#6B7280',marginTop:12,fontSize:14}}>Loading your dashboard...</p></div>
    </div>
  );

  return (
    <div style={S.shell}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{...S.sidebar, width: sidebarOpen ? 240 : 68}}>

        {/* Profile + collapse */}
        <div style={S.sideTop}>
          {sidebarOpen && (
            <div style={S.profile}>
              <div style={S.avatar}>{(user?.full_name||'U')[0].toUpperCase()}</div>
              <div style={{overflow:'hidden',flex:1}}>
                <p style={S.profileName}>{user?.full_name}</p>
                <p style={S.profileRole}>🛒 Buyer</p>
              </div>
            </div>
          )}
          {!sidebarOpen && <div style={{...S.avatar, margin:'0 auto'}}>{(user?.full_name||'U')[0].toUpperCase()}</div>}
          <button style={S.collapseBtn} onClick={() => setSidebarOpen(o => !o)}>{sidebarOpen?'‹':'›'}</button>
        </div>

        {/* Quick stats strip */}
        {sidebarOpen && (
          <div style={S.quickStats}>
            {[
              {label:'Orders',    value: orders.length,             color:'#93C5FD'},
              {label:'Delivered', value: deliveredCount,            color:'#6EE7B7'},
              {label:'Spent',     value:`$${totalSpent.toFixed(0)}`, color:'#FCD34D'},
            ].map(({label,value,color},i,arr) => (
              <div key={label} style={{...S.quickStat, borderRight: i<arr.length-1 ? '1px solid rgba(255,255,255,0.1)':'none'}}>
                <span style={{...S.qStatVal, color}}>{value}</span>
                <span style={S.qStatLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nav */}
        <nav style={S.nav}>
          {sidebarOpen && <p style={S.navSec}>NAVIGATION</p>}
          {navItems.map(({key,icon,label,badge}) => (
            <button key={key} onClick={() => setTab(key)}
              style={{...S.navItem,...(tab===key?S.navActive:{}), justifyContent:sidebarOpen?'flex-start':'center'}}
              title={!sidebarOpen?label:undefined}>
              <span style={S.navIcon}>{icon}</span>
              {sidebarOpen && <>
                <span style={S.navLabel}>{label}</span>
                {badge>0 && <span style={{...S.navBadge, background: tab===key?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.15)'}}>{badge}</span>}
              </>}
            </button>
          ))}
        </nav>

        {/* Alerts */}
        <div style={S.sideBottom}>
          {sidebarOpen && hasPending && (
            <div style={S.alertCard}>
              <span style={{fontSize:18}}>⏳</span>
              <div>
                <p style={S.alertTitle}>{pendingCount} Pending Order{pendingCount>1?'s':''}</p>
                <p style={S.alertSub}>Awaiting farmer confirmation</p>
              </div>
            </div>
          )}
          {sidebarOpen && !hasPending && orders.length>0 && (
            <div style={{...S.alertCard, background:'rgba(110,231,183,0.1)', borderColor:'rgba(110,231,183,0.25)'}}>
              <span style={{fontSize:18}}>✅</span>
              <div>
                <p style={{...S.alertTitle, color:'#6EE7B7'}}>All caught up</p>
                <p style={S.alertSub}>No pending orders</p>
              </div>
            </div>
          )}
          <button style={S.logoutBtn} onClick={handleLogout} title="Logout">
            <span style={{fontSize:16}}>⏻</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={S.main}>

        {/* Top bar */}
        <div style={S.topBar}>
          <div>
            <h1 style={S.pageTitle}>
              {tab==='overview' && '📊 Overview'}
              {tab==='orders'   && '📦 My Orders'}
              {tab==='account'  && '👤 Account Summary'}
              {tab==='reviews'  && '⭐ My Reviews'}
              {tab==='settings' && '⚙️ Settings'}
            </h1>
            <p style={S.pageSub}>
              {tab==='overview' && `Welcome back, ${user?.full_name}`}
              {tab==='orders'   && `${orders.length} order${orders.length!==1?'s':''} placed`}
              {tab==='account'  && 'Your account at a glance'}
              {tab==='reviews'  && 'Your product reviews'}
              {tab==='settings' && 'Manage your account and preferences'}
            </p>
          </div>
          {tab==='orders' && (
            <div style={{display:'flex',gap:10}}>
              <button style={S.refreshBtn} onClick={loadOrders} disabled={refreshing}>{refreshing?'⏳':'↻'} Refresh</button>
              <Link to="/listings" style={S.primaryBtn}>+ Continue Shopping</Link>
            </div>
          )}
          {tab==='overview' && <Link to="/listings" style={S.primaryBtn}>🛒 Shop Now</Link>}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab==='overview' && (
          <div>
            {/* Stat cards */}
            <div style={S.statGrid}>
              {[
                {icon:'🛒',label:'Total Orders',    value:orders.length,                   color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE'},
                {icon:'✅',label:'Delivered',         value:deliveredCount,                  color:'#059669', bg:'#ECFDF5', border:'#A7F3D0'},
                {icon:'⏳',label:'Pending',           value:pendingCount,                    color:'#D97706', bg:'#FFFBEB', border:'#FCD34D'},
                {icon:'💰',label:'Total Spent',       value:`$${totalSpent.toFixed(2)}`,    color:'#7C3AED', bg:'#F5F3FF', border:'#C4B5FD'},
                {icon:'📈',label:'Avg Order Value',   value:orders.length?`$${avgOrder.toFixed(2)}`:'—', color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC'},
                {icon:'⭐',label:'Reviews Left',       value:deliveredCount,                 color:'#D97706', bg:'#FFFBEB', border:'#FCD34D'},
              ].map(({icon,label,value,color,bg,border}) => (
                <div key={label} style={{...S.statCard, background:bg, borderColor:border}}>
                  <span style={{fontSize:26}}>{icon}</span>
                  <span style={{fontSize:22,fontWeight:800,color}}>{value}</span>
                  <span style={{fontSize:12,color:'#6B7280',fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>

            {/* Recent orders preview */}
            {orders.length>0 && (
              <div style={S.card}>
                <div style={S.cardHead}>
                  <h3 style={S.cardTitle}>Recent Orders</h3>
                  <button style={S.cardLink} onClick={() => setTab('orders')}>View all →</button>
                </div>
                {orders.slice(0,5).map((o,i) => {
                  const sc = STATUS[o.status]||STATUS.pending;
                  return (
                    <div key={o.order_id} style={{...S.listRow, borderTop: i===0?'1px solid #F3F4F6':'none'}}>
                      <div style={S.orderNumWrap}>
                        <span style={{fontSize:11,color:'#9CA3AF',fontWeight:700}}>#</span>
                        <span style={{fontSize:16,fontWeight:800,color:'#111827'}}>{o.order_id}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={S.rowName}>{o.items_summary||'Order items'}</p>
                        <p style={S.rowMeta}>{new Date(o.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}</p>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <span style={{fontSize:15,fontWeight:800,color:'#111827'}}>${Number(o.total_amount).toFixed(2)}</span>
                        <span style={{...S.statusBadge, background:sc.bg, color:sc.color, borderColor:sc.border, fontSize:11, padding:'2px 10px'}}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:sc.dot,display:'inline-block'}}/>
                          {o.status.charAt(0).toUpperCase()+o.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick actions */}
            <div style={S.card}>
              <div style={S.cardHead}><h3 style={S.cardTitle}>Quick Actions</h3></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
                {[
                  {icon:'🛒',label:'Browse Produce',  sub:'Shop fresh listings',      to:'/listings',         color:'#059669',bg:'#ECFDF5'},
                  {icon:'📦',label:'Track Orders',    sub:'See delivery status',       action:()=>setTab('orders'),  color:'#2563EB',bg:'#EFF6FF'},
                  {icon:'⚙️',label:'Settings',        sub:'Update your preferences',  action:()=>setTab('settings'),color:'#7C3AED',bg:'#F5F3FF'},
                  {icon:'🛒',label:'My Cart',         sub:'View saved items',          to:'/cart',             color:'#D97706',bg:'#FFFBEB'},
                ].map(({icon,label,sub,to,action,color,bg}) => (
                  to
                    ? <Link key={label} to={to} style={{...S.quickAction,background:bg,borderColor:color+'33',textDecoration:'none'}}>
                        <span style={{fontSize:28}}>{icon}</span>
                        <p style={{fontWeight:700,fontSize:14,color:'#111827',margin:0}}>{label}</p>
                        <p style={{fontSize:12,color:'#9CA3AF',margin:0}}>{sub}</p>
                      </Link>
                    : <button key={label} onClick={action} style={{...S.quickAction,background:bg,borderColor:color+'33',cursor:'pointer',fontFamily:'inherit',textAlign:'center',border:`1.5px solid ${color}33`}}>
                        <span style={{fontSize:28}}>{icon}</span>
                        <p style={{fontWeight:700,fontSize:14,color:'#111827',margin:0}}>{label}</p>
                        <p style={{fontSize:12,color:'#9CA3AF',margin:0}}>{sub}</p>
                      </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab==='orders' && (
          orders.length===0 ? (
            <div style={S.empty}>
              <p style={{fontSize:56}}>📦</p>
              <h2 style={{color:'#111827',fontSize:20,marginBottom:8}}>No orders yet</h2>
              <p style={{color:'#9CA3AF',marginBottom:24}}>Start shopping to see your orders here!</p>
              <Link to="/listings" style={S.primaryBtn}>Browse Fresh Produce</Link>
            </div>
          ) : (
            <div style={S.ordersList}>
              {orders.map(order => {
                const sc = STATUS[order.status]||STATUS.pending;
                const curStep = STEPS.indexOf(order.status);
                return (
                  <div key={order.order_id} style={S.orderCard}>
                    {/* Header */}
                    <div style={S.cardHeader}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={S.orderNumWrap}>
                          <span style={{fontSize:13,color:'#9CA3AF',fontWeight:700}}>#</span>
                          <span style={{fontSize:18,fontWeight:800,color:'#111827'}}>{order.order_id}</span>
                        </div>
                        <span style={{fontSize:13,color:'#9CA3AF'}}>{new Date(order.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{...S.statusBadge,background:sc.bg,color:sc.color,borderColor:sc.border}}>
                          <span style={{width:7,height:7,borderRadius:'50%',background:sc.dot,display:'inline-block'}}/>
                          {order.status.charAt(0).toUpperCase()+order.status.slice(1)}
                        </span>
                        <span style={{fontSize:17,fontWeight:800,color:'#111827'}}>${Number(order.total_amount).toFixed(2)} AUD</span>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div style={S.infoGrid}>
                      {[{icon:'🗓️',label:'Order Date',val:new Date(order.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})},{icon:'📍',label:'Address',val:order.delivery_address||'—'},{icon:'🕐',label:'Time Window',val:order.delivery_window||'Flexible'},{icon:'💳',label:'Payment',val:'✅ Paid via Stripe'}].map(({icon,label,val}) => (
                        <div key={label} style={S.infoCell}>
                          <span style={{fontSize:16,marginTop:1,flexShrink:0}}>{icon}</span>
                          <div><p style={{fontSize:10,color:'#9CA3AF',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,margin:0,marginBottom:3}}>{label}</p><p style={{fontSize:13,color:'#111827',fontWeight:600,margin:0}}>{val}</p></div>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal bar */}
                    <div style={S.subtotalBar}>
                      {order.items_summary&&<span style={{fontSize:13,color:'#6B7280'}}>🛍️ {order.items_summary}</span>}
                      <span style={{fontSize:13,color:'#6B7280',marginLeft:'auto'}}>
                        Subtotal: <strong>${(Number(order.total_amount)/1.1).toFixed(2)}</strong>
                        {' '}· GST (10%): <strong>${(Number(order.total_amount)-Number(order.total_amount)/1.1).toFixed(2)}</strong>
                        {' '}· <strong style={{color:'#059669'}}>Total: ${Number(order.total_amount).toFixed(2)}</strong>
                      </span>
                    </div>

                    {/* Progress tracker */}
                    {order.status!=='cancelled' ? (
                      <div style={S.progressRow}>
                        {STEPS.map((s,i) => {
                          const done=i<curStep, current=i===curStep, cfg=STATUS[s];
                          return (
                            <div key={s} style={{flex:1,display:'flex',alignItems:'center'}}>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,flex:1}}>
                                <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:done?'#10B981':current?cfg.dot:'#E5E7EB',color:'#fff',fontSize:11,fontWeight:800,boxShadow:current?`0 0 0 4px ${cfg.dot}33`:'none',zIndex:1,position:'relative'}}>{done?'✓':i+1}</div>
                                <span style={{fontSize:11,fontWeight:current?700:500,color:done?'#10B981':current?cfg.color:'#9CA3AF',whiteSpace:'nowrap'}}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>
                              </div>
                              {i<STEPS.length-1&&<div style={{height:2,flex:1,background:done||current?'#10B981':'#E5E7EB',borderRadius:2,marginBottom:22,flexShrink:0,minWidth:20}}/>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{padding:'10px 14px',background:'#FEF2F2',borderRadius:8,margin:'0 0 0',fontSize:13,color:'#991B1B',fontWeight:600}}>⚠️ This order was cancelled</div>
                    )}

                    {/* Actions */}
                    <div style={S.cardFooter}>
                      <Link to={`/orders/${order.order_id}/track`} style={S.trackBtn}>📍 Track Order</Link>
                      <button style={S.invoiceBtn} onClick={()=>window.print()}>📄 Invoice</button>
                      {order.status==='pending'&&<button style={S.cancelBtn} onClick={()=>alert('Cancel request submitted.')}>✕ Cancel Order</button>}
                      {order.status==='delivered'&&<Link to="/listings" style={S.reviewBtn}>⭐ Leave Review</Link>}
                      <span style={{marginLeft:'auto',fontSize:12,color:'#9CA3AF'}}>Updated {new Date(order.updated_at).toLocaleDateString('en-AU')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── ACCOUNT SUMMARY ── */}
        {tab==='account' && (
          <div>
            <div style={S.statGrid}>
              {[{icon:'🛒',label:'Total Orders',val:orders.length,color:'#2563EB',bg:'#EFF6FF',border:'#BFDBFE'},{icon:'✅',label:'Delivered',val:deliveredCount,color:'#059669',bg:'#ECFDF5',border:'#A7F3D0'},{icon:'⏳',label:'Pending',val:pendingCount,color:'#D97706',bg:'#FFFBEB',border:'#FCD34D'},{icon:'💰',label:'Total Spent',val:`$${totalSpent.toFixed(2)}`,color:'#7C3AED',bg:'#F5F3FF',border:'#C4B5FD'}].map(({icon,label,val,color,bg,border}) => (
                <div key={label} style={{...S.statCard,background:bg,borderColor:border}}>
                  <span style={{fontSize:28}}>{icon}</span>
                  <span style={{fontSize:22,fontWeight:800,color}}>{val}</span>
                  <span style={{fontSize:12,color:'#6B7280',fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.cardHead}><h3 style={S.cardTitle}>Account Details</h3><button style={S.cardLink} onClick={()=>setTab('settings')}>Edit in Settings →</button></div>
              {[{label:'Full Name',val:user?.full_name},{label:'Email',val:user?.email},{label:'Role',val:'Buyer'},{label:'Member Since',val:'April 2026'}].map(({label,val}) => (
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'13px 0',borderBottom:'1px solid #F3F4F6'}}>
                  <span style={{fontSize:14,color:'#6B7280',fontWeight:500}}>{label}</span>
                  <span style={{fontSize:14,color:'#111827',fontWeight:600}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab==='reviews' && (
          <div style={S.empty}>
            <p style={{fontSize:52}}>⭐</p>
            <h2 style={{color:'#111827',fontSize:20,marginBottom:8}}>No reviews yet</h2>
            <p style={{color:'#9CA3AF',marginBottom:24}}>After your orders are delivered, leave reviews for the farmers.</p>
            <Link to="/listings" style={S.primaryBtn}>Browse Produce</Link>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==='settings' && <BuyerSettings user={user}/>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════
const S = {
  shell:       {display:'flex',minHeight:'100vh',background:'#F3F4F6'},
  spinner:     {width:36,height:36,border:'3px solid #E5E7EB',borderTopColor:'#059669',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'},
  sidebar:     {background:'#064E3B',display:'flex',flexDirection:'column',flexShrink:0,transition:'width 0.25s ease',overflow:'hidden',position:'sticky',top:0,height:'100vh'},
  sideTop:     {display:'flex',alignItems:'center',gap:10,padding:'20px 14px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)'},
  profile:     {display:'flex',alignItems:'center',gap:10,flex:1,overflow:'hidden'},
  avatar:      {width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.25)',color:'#fff',fontSize:16,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  profileName: {color:'#fff',fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',margin:0},
  profileRole: {color:'#6EE7B7',fontSize:11,fontWeight:600,margin:0},
  collapseBtn: {background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:26,height:26,borderRadius:6,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  quickStats:  {display:'flex',borderBottom:'1px solid rgba(255,255,255,0.08)'},
  quickStat:   {flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'11px 4px',gap:2},
  qStatVal:    {fontSize:14,fontWeight:800},
  qStatLabel:  {fontSize:10,color:'rgba(255,255,255,0.45)',fontWeight:500},
  nav:         {display:'flex',flexDirection:'column',padding:'10px',gap:2,flex:1},
  navSec:      {color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,letterSpacing:1,padding:'8px 8px 4px',margin:0},
  navItem:     {display:'flex',alignItems:'center',gap:10,padding:'10px',borderRadius:10,border:'none',background:'none',cursor:'pointer',color:'rgba(255,255,255,0.6)',fontSize:14,fontWeight:500,width:'100%',transition:'all 0.15s',fontFamily:'inherit'},
  navActive:   {background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:700},
  navIcon:     {fontSize:17,flexShrink:0,width:22,textAlign:'center'},
  navLabel:    {flex:1,textAlign:'left',whiteSpace:'nowrap'},
  navBadge:    {borderRadius:10,padding:'1px 8px',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0},
  sideBottom:  {padding:'10px 12px 16px',display:'flex',flexDirection:'column',gap:8},
  alertCard:   {background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,padding:'10px 12px',display:'flex',alignItems:'center',gap:10},
  alertTitle:  {color:'#FCA5A5',fontSize:13,fontWeight:700,margin:0},
  alertSub:    {color:'rgba(255,255,255,0.4)',fontSize:11,margin:0},
  logoutBtn:   {display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 0',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#FCA5A5',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
  main:        {flex:1,padding:'28px 32px',minWidth:0},
  topBar:      {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:12},
  pageTitle:   {fontSize:22,fontWeight:800,color:'#111827',margin:'0 0 3px'},
  pageSub:     {fontSize:13,color:'#6B7280',margin:0},
  primaryBtn:  {display:'inline-flex',alignItems:'center',padding:'10px 22px',background:'linear-gradient(135deg,#065F46,#059669)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14,fontFamily:'inherit',boxShadow:'0 2px 8px rgba(5,150,105,0.3)',cursor:'pointer',textDecoration:'none'},
  refreshBtn:  {padding:'9px 16px',background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:10,fontSize:13,fontWeight:600,color:'#374151',cursor:'pointer',fontFamily:'inherit'},
  statGrid:    {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:14,marginBottom:24},
  statCard:    {borderRadius:14,padding:'18px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,border:'1.5px solid',textAlign:'center'},
  card:        {background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.05)',border:'1px solid #F3F4F6',marginBottom:20},
  cardHead:    {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  cardTitle:   {fontSize:16,fontWeight:700,color:'#111827',margin:0},
  cardLink:    {background:'none',border:'none',color:'#059669',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  listRow:     {display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid #F3F4F6'},
  orderNumWrap:{display:'flex',alignItems:'baseline',gap:2,flexShrink:0},
  rowName:     {fontSize:14,fontWeight:600,color:'#111827',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  rowMeta:     {fontSize:12,color:'#9CA3AF',margin:0},
  quickAction: {display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'20px 14px',borderRadius:14,border:'1.5px solid',textAlign:'center'},
  ordersList:  {display:'flex',flexDirection:'column',gap:16},
  orderCard:   {background:'#fff',borderRadius:16,border:'1.5px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',overflow:'hidden'},
  cardHeader:  {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',background:'#FAFAFA',borderBottom:'1px solid #F3F4F6',flexWrap:'wrap',gap:10},
  statusBadge: {display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700,border:'1.5px solid'},
  infoGrid:    {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:1,borderBottom:'1px solid #F3F4F6'},
  infoCell:    {display:'flex',alignItems:'flex-start',gap:10,padding:'12px 16px',background:'#FAFAFA'},
  subtotalBar: {display:'flex',alignItems:'center',gap:8,padding:'10px 20px',background:'#F0FDF4',borderBottom:'1px solid #D1FAE5',flexWrap:'wrap'},
  progressRow: {display:'flex',alignItems:'center',padding:'18px 20px',gap:0},
  cardFooter:  {display:'flex',alignItems:'center',gap:8,padding:'12px 20px',borderTop:'1px solid #F3F4F6',flexWrap:'wrap',background:'#FAFAFA'},
  trackBtn:    {display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',background:'#064E3B',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none'},
  invoiceBtn:  {display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',background:'#EFF6FF',color:'#1D4ED8',borderRadius:8,fontSize:13,fontWeight:600,border:'1px solid #BFDBFE',cursor:'pointer',fontFamily:'inherit'},
  cancelBtn:   {display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',background:'#FEF2F2',color:'#DC2626',borderRadius:8,fontSize:13,fontWeight:600,border:'1px solid #FCA5A5',cursor:'pointer',fontFamily:'inherit'},
  reviewBtn:   {display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',background:'#FFFBEB',color:'#D97706',borderRadius:8,fontSize:13,fontWeight:600,border:'1px solid #FCD34D',textDecoration:'none'},
  empty:       {textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:16,border:'1px solid #F3F4F6'},
};

const SS = {
  wrap:     {display:'flex',gap:20,alignItems:'flex-start'},
  snav:     {width:185,background:'#fff',borderRadius:14,padding:12,border:'1px solid #F3F4F6',flexShrink:0,position:'sticky',top:20,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'},
  snavTitle:{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:1,padding:'4px 8px 10px',margin:0},
  snavBtn:  {display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 10px',border:'none',background:'none',cursor:'pointer',borderRadius:8,fontSize:13,fontWeight:500,color:'#6B7280',fontFamily:'inherit',textAlign:'left',transition:'all 0.15s'},
  snavAct:  {background:'#ECFDF5',color:'#065F46',fontWeight:700},
  scontent: {flex:1,background:'#fff',borderRadius:16,padding:28,border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',minWidth:0},
  toast:    {background:'#ECFDF5',border:'1.5px solid #6EE7B7',color:'#065F46',padding:'10px 16px',borderRadius:10,fontSize:14,fontWeight:600,marginBottom:20},
  head:     {marginBottom:24,paddingBottom:16,borderBottom:'1px solid #F3F4F6'},
  stitle:   {fontSize:18,fontWeight:800,color:'#111827',margin:'0 0 4px'},
  ssub:     {fontSize:13,color:'#6B7280',margin:0},
  avatarRow:{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'#F9FAFB',borderRadius:14,marginBottom:24,border:'1px solid #F3F4F6'},
  bigAvatar:{width:58,height:58,borderRadius:'50%',background:'linear-gradient(135deg,#064E3B,#059669)',color:'#fff',fontSize:24,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  rolePill: {background:'#ECFDF5',color:'#065F46',fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20,border:'1px solid #A7F3D0'},
  grid2:    {display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24},
  fg:       {display:'flex',flexDirection:'column',gap:6},
  fl:       {fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:0.5},
  fi:       {padding:'10px 12px',border:'1.5px solid #E5E7EB',borderRadius:8,fontSize:14,fontFamily:'inherit',outline:'none',color:'#111827',background:'#FAFAFA',width:'100%',boxSizing:'border-box'},
  saveBtn:  {padding:'11px 28px',background:'linear-gradient(135deg,#065F46,#059669)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(5,150,105,0.25)'},
  tRow:     {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 0',borderBottom:'1px solid #F9FAFB'},
  tLeft:    {display:'flex',alignItems:'center',gap:14},
  tIcon:    {width:36,height:36,background:'#F3F4F6',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0},
  tLabel:   {fontSize:14,fontWeight:600,color:'#111827',margin:0},
  tSub:     {fontSize:12,color:'#9CA3AF',margin:'2px 0 0'},
  toggle:   {width:48,height:26,borderRadius:13,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0},
  thumb:    {position:'absolute',top:3,width:20,height:20,background:'#fff',borderRadius:'50%',transition:'transform 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'},
  danger:   {marginTop:28,padding:20,background:'#FEF2F2',borderRadius:14,border:'1px solid #FCA5A5',marginBottom:24},
  dTitle:   {fontSize:15,fontWeight:700,color:'#991B1B',margin:'0 0 6px'},
  dSub:     {fontSize:13,color:'#9CA3AF',margin:'0 0 16px'},
  dBtn:     {padding:'9px 18px',background:'#DC2626',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'},
  dOutline: {padding:'9px 18px',background:'#fff',color:'#DC2626',border:'1.5px solid #FCA5A5',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'},
  secGrid:  {display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24},
  secCard:  {display:'flex',alignItems:'center',gap:12,padding:14,borderRadius:12,border:'1.5px solid'},
  pwCard:   {background:'#F9FAFB',borderRadius:14,padding:20,marginBottom:20,border:'1px solid #F3F4F6'},
  pwTitle:  {fontSize:15,fontWeight:700,color:'#111827',marginBottom:16,marginTop:0},
  sessRow:  {display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #F3F4F6'},
  revokeBtn:{padding:'4px 12px',background:'#FEF2F2',color:'#DC2626',border:'1px solid #FCA5A5',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  addCardBtn:{padding:'6px 14px',background:'#ECFDF5',color:'#065F46',border:'1px solid #A7F3D0',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
};
