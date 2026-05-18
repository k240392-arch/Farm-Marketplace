// components/UserHistoryModal.jsx
// Admin-side "Full User History" modal — shows ONE user's complete timeline,
// with filters by event type, plus PDF/JSON download buttons.
//
// Usage:
//   const [historyForUser, setHistoryForUser] = useState(null);
//   <UserHistoryModal userId={historyForUser} onClose={() => setHistoryForUser(null)} />
//
//   ... then somewhere in your user table:
//   <button onClick={() => setHistoryForUser(u.user_id)}>📜 Full History</button>
import { useEffect, useState } from 'react';
import api from '../services/api';

const KIND_META = {
  account:  { icon:'🆕', color:'#1D4ED8', label:'Account' },
  order:    { icon:'🛒', color:'#7C3AED', label:'Order placed' },
  listing:  { icon:'🌾', color:'#065F46', label:'Listing created' },
  sale:     { icon:'💰', color:'#0891B2', label:'Sale received' },
  review:   { icon:'⭐', color:'#D97706', label:'Review written' },
  feedback: { icon:'💬', color:'#D97706', label:'Review received' },
  payout:   { icon:'💳', color:'#059669', label:'Payout' },
  audit:    { icon:'📝', color:'#6B7280', label:'Audit log' },
  closure:  { icon:'🚪', color:'#991B1B', label:'Account closed' },
};

export default function UserHistoryModal({ userId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true); setError(''); setData(null);
    (async () => {
      try {
        const res = await api.get(`/admin/users/${userId}/history`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load user history.');
      } finally { setLoading(false); }
    })();
  }, [userId]);

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const res = await api.get(`/admin/users/${userId}/history.pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href  = URL.createObjectURL(blob);
      link.download = `user-${userId}-history-${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(link.href); }, 1000);
    } catch { /* silent */ }
    setDownloadingPDF(false);
  };

  const downloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = `user-${userId}-history-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link); link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(link.href); }, 1000);
  };

  if (!userId) return null;

  const kinds = data ? Array.from(new Set(data.timeline.map(t => t.kind))) : [];
  const filtered = !data
    ? []
    : filter === 'all' ? data.timeline : data.timeline.filter(t => t.kind === filter);

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <button style={S.closeBtn} onClick={onClose} title="Close">✕</button>

        {loading && <div style={{ padding:40, textAlign:'center', color:'#6B7280' }}>Loading user history…</div>}
        {error   && <div style={{ padding:40, textAlign:'center', color:'#991B1B' }}>{error}</div>}

        {data && (
          <>
            {/* ── Header ── */}
            <div style={S.header}>
              <div style={S.avatar}>{(data.user.full_name || '?')[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <h2 style={S.name}>{data.user.full_name}</h2>
                <p style={S.email}>{data.user.email} · {data.user.role} · #{data.user.user_id}</p>
                <p style={S.member}>
                  Member since {new Date(data.user.created_at).toLocaleDateString('en-AU')} ·{' '}
                  <span style={{ ...S.statusPill, ...S.statusFor(data.user.account_status) }}>
                    {data.user.account_status || (data.user.is_active ? 'active' : 'inactive')}
                  </span>
                  {data.user.closed_at && <> · closed {new Date(data.user.closed_at).toLocaleDateString('en-AU')}</>}
                </p>
              </div>
              <div style={S.actions}>
                <button style={S.dlBtn}    onClick={downloadPDF} disabled={downloadingPDF}>
                  {downloadingPDF ? '⏳ PDF…' : '📄 PDF'}
                </button>
                <button style={S.dlBtnAlt} onClick={downloadJSON}>🧾 JSON</button>
              </div>
            </div>

            {/* ── Stats strip ── */}
            <div style={S.statRow}>
              {[
                { v:data.stats.total_orders_placed,    l:'Orders' },
                { v:data.stats.total_listings,         l:'Listings' },
                { v:data.stats.total_sales,            l:'Sales' },
                { v:`$${data.stats.gross_earnings}`,   l:'Gross' },
                { v:`$${data.stats.net_earnings}`,     l:'Net' },
                { v:data.stats.total_reviews_received, l:'Reviews' },
                { v:data.timeline.length,              l:'Total events' },
              ].map((s,i) => (
                <div key={i} style={S.statCard}>
                  <div style={S.statVal}>{s.v}</div>
                  <div style={S.statLabel}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* ── Closure detail (if closed) ── */}
            {data.user.closed_at && (
              <div style={S.closureBox}>
                <strong>🚪 This account was closed on {new Date(data.user.closed_at).toLocaleDateString('en-AU')}.</strong>
                {data.user.closure_reason && <p style={{ margin:'4px 0 0' }}>Reason given: <em>{data.user.closure_reason}</em></p>}
              </div>
            )}

            {/* ── Filter bar ── */}
            <div style={S.filterBar}>
              <span style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>Filter:</span>
              <button onClick={() => setFilter('all')} style={S.chip(filter === 'all')}>All ({data.timeline.length})</button>
              {kinds.map(k => (
                <button key={k} onClick={() => setFilter(k)} style={S.chip(filter === k)}>
                  {KIND_META[k]?.icon} {KIND_META[k]?.label || k} ({data.timeline.filter(t => t.kind === k).length})
                </button>
              ))}
            </div>

            {/* ── Timeline ── */}
            <div style={S.timeline}>
              {filtered.length === 0 && (
                <p style={{ textAlign:'center', color:'#9CA3AF', padding:30 }}>No events of this type.</p>
              )}
              {filtered.map((e, i) => {
                const meta = KIND_META[e.kind] || { icon:'•', color:'#6B7280', label:e.kind };
                return (
                  <div key={i} style={S.tlRow}>
                    <div style={{ ...S.dot, background: meta.color }}>{meta.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={S.tlText}>{e.text}</p>
                      <p style={S.tlWhen}>{new Date(e.when).toLocaleString('en-AU')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  backdrop: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 },
  modal:    { background:'#fff', borderRadius:16, maxWidth:880, width:'100%', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', position:'relative', overflow:'hidden', fontFamily:'inherit' },
  closeBtn: { position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.06)', border:'none', borderRadius:8, width:32, height:32, fontSize:14, fontWeight:800, cursor:'pointer', zIndex:1, fontFamily:'inherit' },

  header:   { display:'flex', gap:14, alignItems:'center', padding:'22px 24px 14px', borderBottom:'1px solid #F3F4F6', flexWrap:'wrap' },
  avatar:   { width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#065F46,#10B981)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, flexShrink:0 },
  name:     { margin:0, fontSize:20, fontWeight:800, color:'#111827' },
  email:    { margin:'3px 0 4px', fontSize:13, color:'#6B7280' },
  member:   { margin:0, fontSize:12, color:'#6B7280' },
  actions:  { display:'flex', gap:8 },
  dlBtn:    { background:'#065F46', color:'#fff', border:'none', padding:'9px 14px', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  dlBtnAlt: { background:'#fff', color:'#065F46', border:'1.5px solid #065F46', padding:'9px 14px', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' },

  statusPill: { padding:'1px 8px', borderRadius:10, fontSize:10, fontWeight:700, marginLeft:4 },
  statusFor: (s) => ({
    active:     { background:'#ECFDF5', color:'#065F46' },
    suspended:  { background:'#FEF3C7', color:'#92400E' },
    closed:     { background:'#FEE2E2', color:'#991B1B' },
    anonymised: { background:'#E5E7EB', color:'#374151' },
  }[s] || { background:'#F3F4F6', color:'#374151' }),

  statRow:  { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(96px, 1fr))', gap:8, padding:'14px 24px 8px' },
  statCard: { background:'#F9FAFB', borderRadius:10, padding:'10px 8px', textAlign:'center', border:'1px solid #F3F4F6' },
  statVal:  { fontSize:18, fontWeight:800, color:'#111827' },
  statLabel:{ fontSize:10, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 },

  closureBox: { margin:'8px 24px 0', padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, fontSize:12, color:'#991B1B' },

  filterBar:{ display:'flex', gap:6, flexWrap:'wrap', padding:'14px 24px 10px', alignItems:'center', borderTop:'1px solid #F3F4F6', marginTop:8 },
  chip: (active) => ({
    background: active ? '#065F46' : '#F3F4F6',
    color:      active ? '#fff'    : '#374151',
    border:'none', padding:'5px 11px', borderRadius:14, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
  }),

  timeline:{ flex:1, overflowY:'auto', padding:'4px 24px 24px' },
  tlRow:   { display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #F3F4F6' },
  dot:     { width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13 },
  tlText:  { margin:'2px 0 2px', fontSize:13, color:'#111827', lineHeight:1.4 },
  tlWhen:  { margin:0, fontSize:11, color:'#9CA3AF' },
};