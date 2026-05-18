// components/FarmerEarnings.jsx — Earnings + payouts view for farmers
// Shown as a tab inside FarmerDashboard.
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function FarmerEarnings() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/farmers/me/earnings');
      setData(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load earnings.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={S.card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#9CA3AF' }}>
          <div style={S.spinner}/> <span style={{ marginLeft:12 }}>Loading earnings…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return <div style={{ ...S.card, color:'#991B1B', background:'#FEF2F2', border:'1px solid #FCA5A5' }}>⚠️ {error}</div>;
  }

  const { totals, payouts } = data || { totals:{}, payouts:[] };
  const filteredPayouts = filter === 'all' ? payouts : payouts.filter(p => p.status === filter);

  return (
    <div>
      {/* ── Stat strip ── */}
      <div style={S.statGrid}>
        {[
          { icon:'💰', label:'Net Earnings',    value:`$${Number(totals.net_total||0).toFixed(2)}`,    sub:'After platform commission', color:'#065F46', bg:'#ECFDF5', border:'#A7F3D0' },
          { icon:'⏳', label:'Pending Payout',   value:`$${Number(totals.pending_amount||0).toFixed(2)}`, sub:'Awaiting platform payout',  color:'#B45309', bg:'#FFFBEB', border:'#FDE68A' },
          { icon:'✅', label:'Paid Out',         value:`$${Number(totals.paid_amount||0).toFixed(2)}`,    sub:'Received from platform',    color:'#1D4ED8', bg:'#EFF6FF', border:'#BFDBFE' },
          { icon:'📊', label:'Gross Sales',      value:`$${Number(totals.gross_total||0).toFixed(2)}`,   sub:`${totals.payout_count||0} orders`, color:'#7C3AED', bg:'#F5F3FF', border:'#C4B5FD' },
        ].map((s,i) => (
          <div key={i} style={{ ...S.statCard, background:s.bg, borderColor:s.border }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <p style={{ fontSize:22, fontWeight:800, color:s.color, margin:'0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize:12, color:'#374151', fontWeight:600, margin:'0 0 2px' }}>{s.label}</p>
            <p style={{ fontSize:11, color:'#6B7280', margin:0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Info banner — platform commission visible to farmer */}
      <div style={{ background:'#F0FDF4', borderRadius:12, padding:'12px 16px', border:'1px solid #A7F3D0', marginBottom:18 }}>
        <p style={{ margin:0, fontSize:13, color:'#065F46' }}>
          💡 Platform commission is automatically deducted from each order. Your <strong>Net</strong> figures show what you actually receive after the platform fee.
        </p>
      </div>

      {/* Filter + list */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#111827' }}>Payout History</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding:'9px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:13, background:'#fff', fontFamily:'inherit', outline:'none' }}>
            <option value="all">All</option>
            <option value="pending">⏳ Pending</option>
            <option value="paid">✅ Paid</option>
            <option value="cancelled">🚫 Cancelled</option>
          </select>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={S.table}>
            <thead><tr style={S.thead}>
              {['Order', 'Date', 'Gross', 'Commission', 'Net', 'Status', 'Paid On'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredPayouts.map((p, i) => (
                <tr key={p.payout_id} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={S.td}><span style={{ fontWeight:700, color:'#111827' }}>#{p.order_id}</span></td>
                  <td style={S.td}><span style={{ fontSize:12, color:'#6B7280' }}>{new Date(p.created_at).toLocaleDateString('en-AU')}</span></td>
                  <td style={S.td}><span style={{ fontWeight:600, color:'#111827' }}>${Number(p.gross_amount).toFixed(2)}</span></td>
                  <td style={S.td}>
                    <span style={{ color:'#9CA3AF' }}>−${Number(p.commission_amount).toFixed(2)}</span>
                    <span style={{ marginLeft:6, fontSize:10, color:'#9CA3AF' }}>({(Number(p.commission_rate)*100).toFixed(1)}%)</span>
                  </td>
                  <td style={S.td}><span style={{ fontWeight:800, color:'#065F46' }}>${Number(p.net_amount).toFixed(2)}</span></td>
                  <td style={S.td}>
                    <span style={{
                      background: p.status==='pending'?'#FFFBEB':p.status==='paid'?'#ECFDF5':'#FEF2F2',
                      color:      p.status==='pending'?'#B45309':p.status==='paid'?'#065F46':'#991B1B',
                      padding:'3px 11px', borderRadius:20, fontSize:11, fontWeight:700,
                    }}>{p.status}</span>
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize:12, color:'#6B7280' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-AU') : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayouts.length === 0 && (
            <p style={{ textAlign:'center', color:'#9CA3AF', padding:40 }}>
              {filter === 'all' ? 'No earnings yet — your first sale will appear here.' : `No ${filter} payouts.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  card:     { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', border:'1px solid #F3F4F6', marginBottom:20 },
  statGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:18 },
  statCard: { borderRadius:14, padding:'16px 16px', border:'1.5px solid', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  table:    { width:'100%', borderCollapse:'collapse' },
  thead:    { background:'#1F2937' },
  th:       { padding:'11px 14px', color:'#fff', fontSize:11, fontWeight:700, textAlign:'left', textTransform:'uppercase', letterSpacing:0.5 },
  td:       { padding:'11px 14px', fontSize:13, borderTop:'1px solid #F3F4F6', verticalAlign:'middle' },
  spinner:  { width:24, height:24, border:'3px solid #E5E7EB', borderTopColor:'#059669', borderRadius:'50%', animation:'farmerEarningsSpin 0.8s linear infinite' },
};

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('farmer-earnings-styles')) {
  const style = document.createElement('style');
  style.id = 'farmer-earnings-styles';
  style.textContent = '@keyframes farmerEarningsSpin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}