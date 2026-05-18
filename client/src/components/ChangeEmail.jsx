// components/ChangeEmail.jsx
// Reusable "change my email address" panel. Works for any logged-in user
// (farmer / buyer / admin). Mount it inside any settings page.
//
// Features:
//   • Shows the current email
//   • Validates format client-side before hitting the server
//   • Requires password confirmation (server-enforced too)
//   • Updates the AuthContext on success so the UI immediately reflects the new email
//   • Shows clear success / error states
//
// Usage:
//   import ChangeEmail from '../components/ChangeEmail';
//   <ChangeEmail />

import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmail() {
  const { user, updateUser } = useAuth();
  const [open,     setOpen]     = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const resetForm = () => {
    setNewEmail(''); setPassword(''); setError(''); setSuccess(''); setOpen(false);
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    setError(''); setSuccess('');
    const cleaned = newEmail.trim().toLowerCase();
    if (!EMAIL_RX.test(cleaned)) {
      setError('Please enter a valid email address (e.g. you@example.com).');
      return;
    }
    if (cleaned === (user?.email || '').toLowerCase()) {
      setError('That is already your current email.');
      return;
    }
    if (!password) {
      setError('Please confirm your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch('/users/me/email', {
        new_email: cleaned,
        confirm_password: password,
      });
      // Update local user state so UI reflects the new email immediately
      updateUser({ email: res.data.new_email });
      setSuccess(`✅ Email updated to "${res.data.new_email}"`);
      setNewEmail(''); setPassword('');
      // Auto-collapse after a short delay
      setTimeout(() => { setOpen(false); setSuccess(''); }, 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.card}>
      <div style={S.head}>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={S.title}>📧 Email Address</h3>
          <p style={S.current}>
            <span style={S.label}>Current:</span> <strong style={S.email}>{user?.email || '—'}</strong>
          </p>
        </div>
        {!open && (
          <button style={S.editBtn} onClick={() => setOpen(true)}>Change email</button>
        )}
      </div>

      {open && (
        <form style={S.form} onSubmit={submit}>
          <div style={S.fg}>
            <label style={S.fl}>New email address</label>
            <input
              type="email" value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              style={S.fi} autoFocus required autoComplete="email"
            />
          </div>
          <div style={S.fg}>
            <label style={S.fl}>Confirm your current password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your current password"
              style={S.fi} required autoComplete="current-password"
            />
            <p style={S.helper}>For security, we ask you to re-confirm your password before changing your email.</p>
          </div>

          {error   && <div style={S.errBox}>⚠️ {error}</div>}
          {success && <div style={S.okBox}>{success}</div>}

          <div style={S.row}>
            <button type="button" style={S.cancelBtn} onClick={resetForm}>Cancel</button>
            <button type="submit" style={S.saveBtn} disabled={loading}>
              {loading ? '⏳ Updating…' : '✓ Save new email'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const S = {
  card:   { background:'#fff', borderRadius:12, padding:'18px 20px', border:'1px solid #E5E7EB' },
  head:   { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  title:  { margin:0, fontSize:15, fontWeight:800, color:'#065F46' },
  current:{ margin:'6px 0 0', fontSize:13, color:'#4B5563' },
  label:  { color:'#6B7280', fontWeight:600 },
  email:  { color:'#111827', wordBreak:'break-all' },
  editBtn:{ background:'#065F46', color:'#fff', border:'none', padding:'9px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', flexShrink:0 },

  form:   { marginTop:16, paddingTop:16, borderTop:'1px solid #F3F4F6' },
  fg:     { marginBottom:12 },
  fl:     { display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 },
  fi:     { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  helper: { fontSize:11, color:'#6B7280', margin:'5px 0 0' },

  errBox: { background:'#FEF2F2', color:'#991B1B', padding:'10px 14px', borderRadius:8, border:'1px solid #FECACA', fontSize:13, marginBottom:10 },
  okBox:  { background:'#ECFDF5', color:'#065F46', padding:'10px 14px', borderRadius:8, border:'1px solid #A7F3D0', fontSize:13, fontWeight:600, marginBottom:10 },

  row:       { display:'flex', gap:10, marginTop:8 },
  cancelBtn: { flex:1, background:'#F3F4F6', color:'#374151', border:'none', padding:'10px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  saveBtn:   { flex:1, background:'#065F46', color:'#fff', border:'none', padding:'10px 16px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
};