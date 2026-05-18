// pages/AdminLogin.jsx 

// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminLogin() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [form,      setForm]      = useState({ email: '', password: '' });
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [view,      setView]      = useState('login'); // 'login' | 'forgot' | 'verify' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode,   setResetCode]   = useState('');
  const [resetToken,  setResetToken]  = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showNewPw,   setShowNewPw]   = useState(false);
  const [fLoading,    setFLoading]    = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
    // If already logged in as admin, redirect
    if (user?.role === 'admin') navigate('/dashboard/admin');
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.user.role !== 'admin') {
        setError(`⛔ Access denied. This account is registered as a "${res.data.user.role}", not an administrator. Use the regular login at /login.`);
        setLoading(false); return;
      }
      login(res.data.user, res.data.token);
      navigate('/dashboard/admin');
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      let msg;
      if (status === 401)      msg = '❌ Wrong email or password. (Default seeded admin: admin@test.com / test123)';
      else if (status === 404) msg = '❌ No account found with that email. The seeded admin is admin@test.com / test123.';
      else if (status === 403) msg = `⛔ ${serverMsg || 'Account is locked or suspended.'}`;
      else                     msg = serverMsg || 'Login failed — check the backend is running and the DB is seeded.';
      setError(msg);
    } finally { setLoading(false); }
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setFLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess('Reset code sent! Check your email inbox.');
      setView('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally { setFLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setFLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/verify-reset-code', { email: forgotEmail, code: resetCode });
      setResetToken(res.data.resetToken);
      setSuccess('Code verified! Set your new password below.');
      setView('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally { setFLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPw) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6)    { setError('Password must be at least 6 characters.'); return; }
    setFLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/reset-password', { email: forgotEmail, resetToken, newPassword });
      setSuccess('Password reset successfully! You can now log in.');
      setView('login');
      setForm({ email: forgotEmail, password: '' });
      setForgotEmail(''); setResetCode(''); setResetToken(''); setNewPassword(''); setConfirmPw('');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally { setFLoading(false); }
  };

  return (
    <div style={S.shell}>

      {/* Animated background grid */}
      <div style={S.bgGrid} />
      <div style={S.bgGlow1} />
      <div style={S.bgGlow2} />

      {/* Main card */}
      <div style={{
        ...S.card,
        opacity:    mounted ? 1 : 0,
        transform:  mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
        transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Top strip */}
        <div style={S.topStrip}>
          <div style={S.stripDot} />
          <span style={S.stripText}>SECURE ADMIN ACCESS</span>
          <div style={S.stripDot} />
        </div>

        {/* Logo + title */}
        <div style={{ textAlign:'center', padding:'28px 32px 20px' }}>
          <div style={S.adminLogoWrap}>
            <div style={S.adminLogo}>🌿</div>
            <div style={S.shieldBadge}>⚡</div>
          </div>
          <h1 style={S.title}>Admin Portal</h1>
          <p style={S.subtitle}>FarmMarket Command Centre</p>
          <div style={S.accessBadge}>🔒 Restricted Access — Authorised Personnel Only</div>
        </div>

        {/* Form area */}
        <div style={S.formArea}>

          {/* Alerts */}
          {error   && <div style={S.errBox}><span style={{ fontSize:16 }}>⛔</span><span>{error.replace('⛔ ','')}</span></div>}
          {success && <div style={S.successBox}><span style={{ fontSize:16 }}>✅</span><span>{success}</span></div>}

          {/* ── LOGIN VIEW ── */}
          {view === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={S.fg}>
                <label style={S.fl}>Administrator Email</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>✉️</span>
                  <input style={S.input} type="email" placeholder="admin@test.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required autoFocus autoComplete="username"/>
                </div>
              </div>
              <div style={S.fg}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <label style={{ ...S.fl, margin:0 }}>Administrator Password</label>
                  <button type="button" onClick={() => { setView('forgot'); setForgotEmail(form.email); setError(''); setSuccess(''); }}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#FCA5A5', fontWeight:600, fontFamily:'inherit', padding:0 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>🔐</span>
                  <input style={{ ...S.input, paddingRight:44 }} type={showPw ? 'text' : 'password'}
                    placeholder="Enter admin password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required autoComplete="current-password"/>
                  <button type="button" style={S.eyeBtn} onClick={() => setShowPw(p=>!p)}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <button style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1 }} type="submit" disabled={loading}>
                {loading ? <><span style={S.spinner}/>Authenticating...</> : <>🔓 Access Admin Portal</>}
              </button>
            </form>
          )}

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === 'forgot' && (
            <form onSubmit={handleForgot}>
              <div style={S.viewHeader}>
                <span style={{ fontSize:28 }}>🔑</span>
                <div>
                  <p style={S.viewTitle}>Reset Admin Password</p>
                  <p style={S.viewSub}>Enter your admin email to receive a reset code</p>
                </div>
              </div>
              <div style={S.fg}>
                <label style={S.fl}>Administrator Email</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>✉️</span>
                  <input style={S.input} type="email" placeholder="admin@farmmarket.com.au"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus/>
                </div>
              </div>
              <button style={{ ...S.submitBtn, opacity: fLoading ? 0.75 : 1 }} type="submit" disabled={fLoading}>
                {fLoading ? <><span style={S.spinner}/>Sending...</> : <>📧 Send Reset Code</>}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                style={S.backBtn}>← Back to Login</button>
            </form>
          )}

          {/* ── VERIFY CODE VIEW ── */}
          {view === 'verify' && (
            <form onSubmit={handleVerify}>
              <div style={S.viewHeader}>
                <span style={{ fontSize:28 }}>📬</span>
                <div>
                  <p style={S.viewTitle}>Enter Reset Code</p>
                  <p style={S.viewSub}>Check your email for the 6-digit code</p>
                </div>
              </div>
              <div style={S.emailConfirmBadge}>{forgotEmail}</div>
              <div style={S.fg}>
                <label style={S.fl}>6-Digit Reset Code</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>🔢</span>
                  <input style={{ ...S.input, letterSpacing:6, fontSize:18, textAlign:'center' }}
                    type="text" placeholder="000000" maxLength={6}
                    value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g,''))} required autoFocus/>
                </div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:'6px 0 0' }}>Code expires in 15 minutes</p>
              </div>
              <button style={{ ...S.submitBtn, opacity: fLoading ? 0.75 : 1 }} type="submit" disabled={fLoading}>
                {fLoading ? <><span style={S.spinner}/>Verifying...</> : <>✅ Verify Code</>}
              </button>
              <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                style={S.backBtn}>← Resend Code</button>
            </form>
          )}

          {/* ── RESET PASSWORD VIEW ── */}
          {view === 'reset' && (
            <form onSubmit={handleReset}>
              <div style={S.viewHeader}>
                <span style={{ fontSize:28 }}>🔒</span>
                <div>
                  <p style={S.viewTitle}>Set New Password</p>
                  <p style={S.viewSub}>Choose a strong password for your admin account</p>
                </div>
              </div>
              <div style={S.fg}>
                <label style={S.fl}>New Password</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>🔐</span>
                  <input style={{ ...S.input, paddingRight:44 }} type={showNewPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} required autoFocus minLength={6}/>
                  <button type="button" style={S.eyeBtn} onClick={() => setShowNewPw(p=>!p)}>{showNewPw?'🙈':'👁️'}</button>
                </div>
              </div>
              <div style={S.fg}>
                <label style={S.fl}>Confirm New Password</label>
                <div style={{ position:'relative' }}>
                  <span style={S.inputIcon}>🔐</span>
                  <input style={S.input} type="password" placeholder="Repeat new password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required/>
                </div>
              </div>
              <button style={{ ...S.submitBtn, opacity: fLoading ? 0.75 : 1 }} type="submit" disabled={fLoading}>
                {fLoading ? <><span style={S.spinner}/>Resetting...</> : <>🔓 Reset Password & Login</>}
              </button>
            </form>
          )}

          {/* Security notice — only on login view */}
          {view === 'login' && (
            <div style={S.securityNote}>
              <div style={S.securityNoteInner}>
                {[
                  '🔒 All admin actions are logged in the audit trail',
                  '📍 Your IP address is recorded for each login attempt',
                  '⏱️ Sessions expire after 24 hours of inactivity',
                ].map(note => (
                  <p key={note} style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:'0 0 4px', display:'flex', alignItems:'center', gap:6 }}>{note}</p>
                ))}
              </div>
            </div>
          )}

          <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#6B7280' }}>
            Not an admin?{' '}
            <a href="/login" style={{ color:'#9CA3AF', textDecoration:'none', fontWeight:500 }}>
              Return to main login
            </a>
          </p>
        </div>
      </div>

      {/* Version tag */}
      <p style={{ position:'fixed', bottom:16, right:20, fontSize:11, color:'rgba(255,255,255,0.2)', margin:0 }}>
        FarmMarket Admin v2.0 · CPRO306
      </p>
    </div>
  );
}

const S = {
  shell:   { minHeight:'100vh', background:'#0F1923', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden', fontFamily:"'Segoe UI', system-ui, sans-serif" },

  // Background effects
  bgGrid:  { position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none', zIndex:0 },
  bgGlow1: { position:'fixed', top:'-20%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 },
  bgGlow2: { position:'fixed', bottom:'-20%', right:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 },

  // Card
  card:     { position:'relative', zIndex:1, width:'100%', maxWidth:420, background:'#161F2E', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)', overflow:'hidden' },
  topStrip: { background:'linear-gradient(90deg, #DC2626, #991B1B)', padding:'8px 20px', display:'flex', alignItems:'center', justifyContent:'center', gap:10 },
  stripDot: { width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.5)' },
  stripText:{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:2, textTransform:'uppercase' },

  // Logo
  adminLogoWrap:{ position:'relative', display:'inline-block', marginBottom:12 },
  adminLogo:    { width:60, height:60, borderRadius:16, background:'linear-gradient(135deg,#1B2838,#243447)', border:'2px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto' },
  shieldBadge:  { position:'absolute', bottom:-4, right:-4, width:22, height:22, borderRadius:'50%', background:'#DC2626', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, border:'2px solid #161F2E' },
  title:        { fontSize:22, fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.5px' },
  subtitle:     { fontSize:13, color:'rgba(255,255,255,0.45)', margin:'0 0 14px' },
  accessBadge:  { display:'inline-block', background:'rgba(220,38,38,0.12)', color:'#FCA5A5', fontSize:11, fontWeight:600, padding:'5px 14px', borderRadius:20, border:'1px solid rgba(220,38,38,0.2)' },

  // Form
  formArea:   { padding:'0 28px 28px' },
  fg:         { marginBottom:16 },
  fl:         { display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', marginBottom:7, textTransform:'uppercase', letterSpacing:0.8 },
  inputIcon:  { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, pointerEvents:'none', zIndex:1 },
  input:      { width:'100%', padding:'12px 14px 12px 38px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.2s' },
  eyeBtn:     { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, padding:0, color:'rgba(255,255,255,0.4)' },
  errBox:     { display:'flex', alignItems:'center', gap:10, background:'rgba(220,38,38,0.12)', color:'#FCA5A5', border:'1px solid rgba(220,38,38,0.25)', borderRadius:10, padding:'11px 14px', fontSize:13, fontWeight:600, marginBottom:16 },
  submitBtn:  { width:'100%', padding:'13px', background:'linear-gradient(135deg,#DC2626,#991B1B)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', boxShadow:'0 2px 12px rgba(220,38,38,0.35)', transition:'opacity 0.2s' },
  spinner:    { width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' },

  // Security note
  securityNote:      { marginTop:20, borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' },
  securityNoteInner: { background:'rgba(0,0,0,0.2)', padding:'12px 14px' },

  // Forgot / reset flow
  successBox:       { display:'flex', alignItems:'center', gap:10, background:'rgba(5,150,105,0.12)', color:'#6EE7B7', border:'1px solid rgba(5,150,105,0.25)', borderRadius:10, padding:'11px 14px', fontSize:13, fontWeight:600, marginBottom:16 },
  viewHeader:       { display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', marginBottom:18 },
  viewTitle:        { fontSize:14, fontWeight:700, color:'#fff', margin:0 },
  viewSub:          { fontSize:12, color:'rgba(255,255,255,0.4)', margin:'3px 0 0' },
  emailConfirmBadge:{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, padding:'8px 14px', fontSize:13, color:'#FCA5A5', fontWeight:600, textAlign:'center', marginBottom:16 },
  backBtn:          { width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.4)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
};