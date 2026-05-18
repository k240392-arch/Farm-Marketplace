// components/AccountClosure.jsx
// User-facing "Privacy & Data" panel. Lets a logged-in user download their
// data (JSON + PDF) and close their account (preserves history for compliance).
// Mount inside FarmerDashboard's Settings tab or BuyerDashboard's Settings tab.
import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AccountClosure() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [openClose,    setOpenClose]    = useState(false);
  const [reason,       setReason]       = useState('');
  const [password,     setPassword]     = useState('');
  const [closing,      setClosing]      = useState(false);
  const [downloadJSON, setDownloadJSON] = useState(false);
  const [downloadPDF,  setDownloadPDF]  = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');

  const triggerDownload = async (kind) => {
    const setLoading = kind === 'pdf' ? setDownloadPDF : setDownloadJSON;
    setLoading(true); setError(''); setSuccess('');
    try {
      const url  = kind === 'pdf' ? '/users/me/history.pdf' : '/users/me/history';
      const res  = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: kind === 'pdf' ? 'application/pdf' : 'application/json' });
      const link = document.createElement('a');
      link.href  = URL.createObjectURL(blob);
      link.download = kind === 'pdf'
        ? `my-farmmarket-data-${new Date().toISOString().slice(0,10)}.pdf`
        : `my-farmmarket-data-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(link.href); }, 1000);
      setSuccess(`✅ ${kind.toUpperCase()} downloaded. Your full record is in your Downloads folder.`);
    } catch (err) {
      setError('Could not generate the export. Please try again.');
    } finally { setLoading(false); }
  };

  const submitClosure = async () => {
    if (!password) return setError('Please enter your password to confirm.');
    setClosing(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/users/me/close-account', {
        reason: reason.trim() || null,
        confirm_password: password,
      });
      setSuccess(res.data?.message || 'Account closed.');
      // Wait briefly so the user can read the message, then log them out.
      setTimeout(() => { logout(); navigate('/'); }, 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close account.');
      setClosing(false);
    }
  };

  return (
    <div style={S.wrap}>
      {/* ── Data export ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>📥 Download my data</h3>
        <p style={S.cardSub}>
          Australian Privacy Act 1988 and GDPR Article 15 give you the right to receive a copy of
          all the personal information we hold about you. Choose your preferred format:
        </p>
        <div style={S.btnRow}>
          <button style={S.dlBtn} onClick={() => triggerDownload('pdf')} disabled={downloadPDF}>
            {downloadPDF ? '⏳ Preparing…' : '📄 Download as PDF (human-readable)'}
          </button>
          <button style={S.dlBtnAlt} onClick={() => triggerDownload('json')} disabled={downloadJSON}>
            {downloadJSON ? '⏳ Preparing…' : '🧾 Download as JSON (machine-readable)'}
          </button>
        </div>
        <p style={S.note}>
          Includes: your account info, orders, listings, sales, payouts, reviews, and full activity log.
        </p>
      </div>

      {/* ── Account closure ── */}
      <div style={S.cardDanger}>
        <h3 style={{ ...S.cardTitle, color:'#991B1B' }}>🚪 Close my account</h3>
        <p style={S.cardSub}>
          You can close your account at any time. <strong>What happens:</strong>
        </p>
        <ul style={S.bullets}>
          <li>Your active listings are deactivated immediately</li>
          <li>You can no longer log in</li>
          <li>Your historical orders, reviews and payouts are <strong>preserved</strong> for accounting and audit purposes</li>
          <li>Buyers and farmers you've transacted with will see your name as "Closed Account" instead of your real name</li>
          <li>You can email <code style={S.code}>privacy@farmmarket.com.au</code> within 30 days to reopen the account, or to request full erasure under GDPR</li>
        </ul>

        {!openClose && (
          <button style={S.closeBtn} onClick={() => setOpenClose(true)}>
            I want to close my account
          </button>
        )}

        {openClose && !success && (
          <div style={S.closeForm}>
            <label style={S.label}>Reason for leaving (optional, helps us improve)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Moving overseas, no longer farming, found a better platform..."
              maxLength={500}
              rows={2}
              style={S.textarea}
            />
            <label style={S.label}>Confirm your password to proceed</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your current password"
              style={S.input}
            />
            <div style={S.confirmRow}>
              <button style={S.cancelBtn} onClick={() => { setOpenClose(false); setReason(''); setPassword(''); setError(''); }}>
                Cancel — keep my account
              </button>
              <button style={S.confirmBtn} onClick={submitClosure} disabled={closing}>
                {closing ? '⏳ Closing…' : '✗ Permanently close my account'}
              </button>
            </div>
          </div>
        )}
      </div>

      {error   && <div style={S.errorBox}>⚠️ {error}</div>}
      {success && <div style={S.successBox}>{success}</div>}
    </div>
  );
}

const S = {
  wrap: { display:'flex', flexDirection:'column', gap:18 },
  card: { background:'#fff', borderRadius:14, padding:'22px 24px', border:'1px solid #E5E7EB' },
  cardDanger: { background:'#FEF2F2', borderRadius:14, padding:'22px 24px', border:'1.5px solid #FECACA' },
  cardTitle: { margin:'0 0 8px', fontSize:17, fontWeight:800, color:'#065F46' },
  cardSub:   { margin:'0 0 14px', fontSize:13, color:'#4B5563', lineHeight:1.5 },
  btnRow:    { display:'flex', gap:10, flexWrap:'wrap' },
  dlBtn:     { background:'#065F46', color:'#fff', border:'none', padding:'11px 18px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  dlBtnAlt:  { background:'#fff', color:'#065F46', border:'1.5px solid #065F46', padding:'11px 18px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  note:      { fontSize:11, color:'#6B7280', marginTop:10, marginBottom:0 },
  bullets:   { fontSize:13, color:'#4B5563', lineHeight:1.7, paddingLeft:18, margin:'8px 0 16px' },
  code:      { background:'#FEE2E2', padding:'2px 6px', borderRadius:4, fontSize:12, color:'#991B1B' },
  closeBtn:  { background:'#fff', color:'#991B1B', border:'1.5px solid #DC2626', padding:'11px 18px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  closeForm: { background:'#fff', borderRadius:10, padding:'16px 18px', marginTop:8, border:'1px solid #FECACA' },
  label:     { display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5, marginTop:10 },
  textarea:  { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box' },
  input:     { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  confirmRow:{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' },
  cancelBtn: { background:'#F3F4F6', color:'#374151', border:'none', padding:'10px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', flex:1 },
  confirmBtn:{ background:'#DC2626', color:'#fff', border:'none', padding:'10px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', flex:1 },
  errorBox:  { background:'#FEF2F2', color:'#991B1B', padding:'12px 16px', borderRadius:10, border:'1px solid #FECACA', fontSize:13 },
  successBox:{ background:'#ECFDF5', color:'#065F46', padding:'12px 16px', borderRadius:10, border:'1px solid #A7F3D0', fontSize:13, fontWeight:600 },
};