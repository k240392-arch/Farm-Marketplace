// pages/Login.jsx — Next-level immersive login experience
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_URL } from '../config';

// ── SVG Brand Icons ─────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// ── Animated typing headline ────────────────────────────────
const HEADLINES = [
  "Australia's freshest farm marketplace",
  "Direct from farmers to your door",
  "Seasonal produce, picked fresh today",
  "Support local farms. Eat better.",
];

function TypingHeadline() {
  const [idx,     setIdx]     = useState(0);
  const [display, setDisplay] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [charIdx,  setCharIdx]  = useState(0);

  useEffect(() => {
    const target = HEADLINES[idx];
    const speed  = deleting ? 30 : 60;
    const timer  = setTimeout(() => {
      if (!deleting) {
        if (charIdx < target.length) {
          setDisplay(target.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        } else {
          setTimeout(() => setDeleting(true), 2200);
        }
      } else {
        if (charIdx > 0) {
          setDisplay(target.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        } else {
          setDeleting(false);
          setIdx(i => (i + 1) % HEADLINES.length);
        }
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx]);

  return (
    <h2 style={L.headline}>
      {display}
      <span style={L.cursor}>|</span>
    </h2>
  );
}

// ── Main component ──────────────────────────────────────────
export default function Login() {
  const { login, user } = useAuth();
  const navigate   = useNavigate();

  const [tab,         setTab]         = useState('login');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [focused,     setFocused]     = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm,   setRegForm]   = useState({ full_name:'', email:'', password:'', confirm_password:'', role:'buyer' });

  // Forgot password state
  const [fpView,      setFpView]      = useState('login'); // login|forgot|verify|reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode,   setResetCode]   = useState('');
  const [resetToken,  setResetToken]  = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw2,  setConfirmPw2]  = useState('');
  const [showNewPw,   setShowNewPw]   = useState(false);
  const [fpLoading,   setFpLoading]   = useState(false);

  // OAuth role modal
  const [oauthModal,    setOauthModal]    = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const [oauthRole,     setOauthRole]     = useState('buyer');

  // Redirect already logged-in users to their dashboard
  useEffect(() => {
    if (user) {
      if      (user.role === 'farmer') navigate('/dashboard/farmer', { replace: true });
      else if (user.role === 'admin')  navigate('/dashboard/admin',  { replace: true });
      else                             navigate('/dashboard/buyer',  { replace: true });
    }
  }, [user]);

  // Stats counter animation
  const [stats, setStats] = useState({ farmers: 0, products: 0, orders: 0 });
  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    const targets = { farmers: 248, products: 1840, orders: 12500 };
    const duration = 1800;
    const start    = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setStats({
        farmers:  Math.round(targets.farmers  * ease),
        products: Math.round(targets.products * ease),
        orders:   Math.round(targets.orders   * ease),
      });
      if (progress < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 600);
  }, []);

  // ── Handlers ───────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if      (role === 'farmer') navigate('/dashboard/farmer');
      else if (role === 'buyer')  navigate('/dashboard/buyer');
      else if (role === 'admin')  navigate('/dashboard/admin');
      else                        navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (regForm.password !== regForm.confirm_password) { setError('Passwords do not match.'); return; }
    if (regForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { full_name:regForm.full_name, email:regForm.email, password:regForm.password, role:regForm.role });
      if (res.data.requiresVerification) {
        setSuccess(`✅ Verification email sent to ${regForm.email}. Click the link to activate your account.`);
        setTab('login'); setLoginForm({ email: regForm.email, password: '' });
      } else { setSuccess('Account created! Please login.'); setTab('login'); }
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setFpLoading(true);
    try { await api.post('/auth/forgot-password', { email: forgotEmail }); setFpView('verify'); setSuccess('Reset code sent! Check your email.'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to send reset code.'); }
    finally { setFpLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setFpLoading(true);
    try { const res = await api.post('/auth/verify-reset-code', { email: forgotEmail, code: resetCode }); setResetToken(res.data.resetToken); setFpView('reset'); setSuccess('Code verified! Set your new password.'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid or expired code.'); }
    finally { setFpLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPw2) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6)    { setError('Password must be at least 6 characters.'); return; }
    setError(''); setFpLoading(true);
    try {
      await api.post('/auth/reset-password', { email: forgotEmail, resetToken, newPassword });
      setSuccess('Password reset! You can now log in.');
      setFpView('login'); setLoginForm({ email: forgotEmail, password: '' });
    } catch (err) { setError(err.response?.data?.message || 'Reset failed.'); }
    finally { setFpLoading(false); }
  };

  const handleOAuth = (provider) => { setOauthProvider(provider); setOauthRole('buyer'); setOauthModal(true); };
  const handleOAuthContinue = () => {
    const base = API_URL;
    window.location.href = `${base}/api/auth/${oauthProvider.toLowerCase()}?role=${oauthRole}`;
  };

  const inputStyle = (name) => ({
    ...F.input,
    borderColor: focused === name ? '#059669' : '#E5E7EB',
    boxShadow:   focused === name ? '0 0 0 3px rgba(5,150,105,0.12)' : 'none',
  });

  const isLoginView = fpView === 'login';

  return (
    <div style={S.shell}>
      <style>{`
        @keyframes pulse    { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes cursor   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(5,150,105,0.3)} 50%{box-shadow:0 0 40px rgba(5,150,105,0.6)} }
        input::placeholder  { color:#9CA3AF }
        input:focus         { outline:none }
        button:active       { transform:scale(0.98) }
        .oauth-btn:hover    { filter:brightness(1.08); transform:translateY(-1px) }
        .role-card:hover    { border-color:#059669 !important; transform:translateY(-2px) }
        .tab-btn:hover      { color:#065F46 }
      `}</style>

      {/* ══ RIGHT PANEL ══ */}
      <div style={R.panel}>

        {/* ── TOP NAV BAR ── */}
        <div style={{ padding:'16px 28px', background:'#fff', borderBottom:'1px solid #F0F0F0', flexShrink:0 }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#065F46,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 2px 8px rgba(5,150,105,0.25)' }}>🌿</div>
            <span style={{ fontWeight:800, fontSize:17, color:'#065F46', letterSpacing:'-0.3px' }}>FarmMarket</span>
          </a>
        </div>

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 24px', overflowY:'auto' }}>
        <div style={{
          ...R.wrap,
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(20px)',
          transition:'all 0.7s cubic-bezier(0.22,1,0.36,1)',
        }}>

          {/* ── FORGOT PASSWORD VIEWS ── */}
          {fpView !== 'login' && (
            <div>
              <div style={R.fpHeader}>
                <button onClick={() => { setFpView('login'); setError(''); setSuccess(''); }} style={R.backBtn}>← Back</button>
                <div style={R.fpIconWrap}>
                  <span style={{ fontSize: 28 }}>{fpView === 'forgot' ? '🔑' : fpView === 'verify' ? '📬' : '🔒'}</span>
                </div>
                <h2 style={R.fpTitle}>
                  {fpView === 'forgot' ? 'Reset Password' : fpView === 'verify' ? 'Enter Reset Code' : 'Set New Password'}
                </h2>
                <p style={R.fpSub}>
                  {fpView === 'forgot' ? "Enter your email and we'll send a 6-digit code"
                   : fpView === 'verify' ? 'Check your inbox for the 6-digit reset code'
                   : 'Choose a strong new password for your account'}
                </p>
              </div>

              {error   && <div style={F.errBox}>⚠️ {error}</div>}
              {success && <div style={F.successBox}>✅ {success}</div>}

              {fpView === 'forgot' && (
                <form onSubmit={handleForgot}>
                  <div style={F.fg}>
                    <label style={F.fl}>Email Address</label>
                    <input style={inputStyle('fp-email')} type="email" placeholder="you@example.com"
                      value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      onFocus={() => setFocused('fp-email')} onBlur={() => setFocused('')}
                      required autoFocus/>
                  </div>
                  <button style={{ ...F.submitBtn, opacity: fpLoading ? 0.75 : 1 }} disabled={fpLoading}>
                    {fpLoading ? <><span style={F.spinner}/>Sending...</> : '📧 Send Reset Code →'}
                  </button>
                </form>
              )}

              {fpView === 'verify' && (
                <form onSubmit={handleVerify}>
                  <div style={F.fg}>
                    <p style={{ fontSize:13, color:'#6B7280', marginBottom:14, background:'#F0FDF4', padding:'10px 14px', borderRadius:10, border:'1px solid #A7F3D0' }}>
                      Code sent to <strong style={{ color:'#065F46' }}>{forgotEmail}</strong>
                    </p>
                    <label style={F.fl}>6-Digit Code</label>
                    <input style={{ ...inputStyle('code'), textAlign:'center', letterSpacing:10, fontSize:22, fontWeight:800 }}
                      type="text" placeholder="000000" maxLength={6}
                      value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g,''))}
                      onFocus={() => setFocused('code')} onBlur={() => setFocused('')}
                      required autoFocus/>
                    <p style={{ fontSize:11, color:'#9CA3AF', marginTop:6 }}>⏱️ Expires in 15 minutes</p>
                  </div>
                  <button style={{ ...F.submitBtn, opacity: fpLoading ? 0.75 : 1 }} disabled={fpLoading}>
                    {fpLoading ? <><span style={F.spinner}/>Verifying...</> : '✅ Verify Code →'}
                  </button>
                </form>
              )}

              {fpView === 'reset' && (
                <form onSubmit={handleReset}>
                  <div style={F.fg}>
                    <label style={F.fl}>New Password</label>
                    <div style={{ position:'relative' }}>
                      <input style={{ ...inputStyle('np'), paddingRight:44 }} type={showNewPw?'text':'password'}
                        placeholder="Min. 6 characters" value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        onFocus={() => setFocused('np')} onBlur={() => setFocused('')}
                        required minLength={6} autoFocus/>
                      <button type="button" style={F.eyeBtn} onClick={() => setShowNewPw(p=>!p)}>{showNewPw?'🙈':'👁️'}</button>
                    </div>
                  </div>
                  <div style={F.fg}>
                    <label style={F.fl}>Confirm New Password</label>
                    <input style={inputStyle('cp')} type="password" placeholder="Repeat new password"
                      value={confirmPw2} onChange={e => setConfirmPw2(e.target.value)}
                      onFocus={() => setFocused('cp')} onBlur={() => setFocused('')} required/>
                  </div>
                  <button style={{ ...F.submitBtn, opacity: fpLoading ? 0.75 : 1 }} disabled={fpLoading}>
                    {fpLoading ? <><span style={F.spinner}/>Resetting...</> : '🔓 Reset Password →'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── MAIN LOGIN / REGISTER VIEWS ── */}
          {fpView === 'login' && (
            <div>
              {/* Header */}
              <div style={R.header}>
                <div style={R.badge}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', display:'inline-block', animation:'pulse 2s infinite' }}/>
                  {tab === 'login' ? '🌿 Welcome back' : '🌱 Join FarmMarket'}
                </div>
                <h1 style={R.title}>
                  {tab === 'login' ? 'Sign in to your account' : 'Create your account'}
                </h1>
                <p style={R.sub}>
                  {tab === 'login' ? 'Fresh produce, straight from Australian farms.' : 'Connect with local Australian farmers today.'}
                </p>
              </div>

              {/* Tab switcher */}
              <div style={R.tabRow}>
                {['login','register'].map(t => (
                  <button key={t} className="tab-btn"
                    onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                    style={{ ...R.tab, ...(tab===t ? R.tabOn : {}) }}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                    {tab === t && <div style={R.tabIndicator}/>}
                  </button>
                ))}
              </div>

              {/* Alerts */}
              {error   && <div style={F.errBox}>⚠️ {error}</div>}
              {success && <div style={F.successBox}>✅ {success}</div>}

              {/* OAuth buttons */}
              <div style={R.oauthGrid}>
                <button className="oauth-btn" style={R.oauthGoogle} onClick={() => handleOAuth('Google')}>
                  <GoogleIcon/><span>Sign in with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div style={R.divider}>
                <div style={R.divLine}/>
                <span style={R.divText}>or continue with email</span>
                <div style={R.divLine}/>
              </div>

              {/* ── LOGIN FORM ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin}>
                  <div style={F.fg}>
                    <label style={F.fl}>Email Address</label>
                    <input style={inputStyle('email')} type="email" placeholder="you@example.com"
                      value={loginForm.email} onChange={e => setLoginForm(f=>({...f,email:e.target.value}))}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                      required autoFocus/>
                  </div>
                  <div style={F.fg}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <label style={{ ...F.fl, margin:0 }}>Password</label>
                      <button type="button" onClick={() => { setFpView('forgot'); setForgotEmail(loginForm.email); setError(''); setSuccess(''); }}
                        style={{ background:'none', border:'none', color:'#059669', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', padding:0 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position:'relative' }}>
                      <input style={{ ...inputStyle('pw'), paddingRight:44 }} type={showPw?'text':'password'}
                        placeholder="Enter your password" value={loginForm.password}
                        onChange={e => setLoginForm(f=>({...f,password:e.target.value}))}
                        onFocus={() => setFocused('pw')} onBlur={() => setFocused('')} required/>
                      <button type="button" style={F.eyeBtn} onClick={() => setShowPw(p=>!p)}>{showPw?'🙈':'👁️'}</button>
                    </div>
                  </div>
                  <button style={{ ...F.submitBtn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
                    {loading ? <><span style={F.spinner}/>Signing in...</> : 'Sign In →'}
                  </button>
                </form>
              )}

              {/* ── REGISTER FORM ── */}
              {tab === 'register' && (
                <form onSubmit={handleRegister}>
                  {/* Role selector */}
                  <div style={F.fg}>
                    <label style={F.fl}>I want to...</label>
                    <div style={R.roleRow}>
                      {[['buyer','🛒','Buy Produce','Shop local farms'],['farmer','🚜','Sell Produce','List your products']].map(([r,icon,title,sub]) => (
                        <button key={r} type="button" className="role-card"
                          onClick={() => setRegForm(f=>({...f,role:r}))}
                          style={{ ...R.roleCard, ...(regForm.role===r ? R.roleOn : {}) }}>
                          {regForm.role===r && <div style={R.roleTick}>✓</div>}
                          <span style={{ fontSize:24 }}>{icon}</span>
                          <p style={{ ...R.roleTitle, color: regForm.role===r?'#065F46':'#111827' }}>{title}</p>
                          <p style={R.roleSub}>{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={F.fg}>
                      <label style={F.fl}>Full Name</label>
                      <input style={inputStyle('fn')} type="text" placeholder="John Smith"
                        value={regForm.full_name} onChange={e=>setRegForm(f=>({...f,full_name:e.target.value}))}
                        onFocus={()=>setFocused('fn')} onBlur={()=>setFocused('')} required/>
                    </div>
                    <div style={F.fg}>
                      <label style={F.fl}>Email</label>
                      <input style={inputStyle('re')} type="email" placeholder="you@example.com"
                        value={regForm.email} onChange={e=>setRegForm(f=>({...f,email:e.target.value}))}
                        onFocus={()=>setFocused('re')} onBlur={()=>setFocused('')} required/>
                    </div>
                    <div style={F.fg}>
                      <label style={F.fl}>Password</label>
                      <div style={{ position:'relative' }}>
                        <input style={{ ...inputStyle('rp'), paddingRight:38 }} type={showPw?'text':'password'}
                          placeholder="Min. 6 chars" value={regForm.password}
                          onChange={e=>setRegForm(f=>({...f,password:e.target.value}))}
                          onFocus={()=>setFocused('rp')} onBlur={()=>setFocused('')} required minLength={6}/>
                        <button type="button" style={F.eyeBtn} onClick={()=>setShowPw(p=>!p)}>{showPw?'🙈':'👁️'}</button>
                      </div>
                    </div>
                    <div style={F.fg}>
                      <label style={F.fl}>Confirm</label>
                      <div style={{ position:'relative' }}>
                        <input style={{ ...inputStyle('rc'), paddingRight:38 }} type={showConfirm?'text':'password'}
                          placeholder="Repeat" value={regForm.confirm_password}
                          onChange={e=>setRegForm(f=>({...f,confirm_password:e.target.value}))}
                          onFocus={()=>setFocused('rc')} onBlur={()=>setFocused('')} required/>
                        <button type="button" style={F.eyeBtn} onClick={()=>setShowConfirm(p=>!p)}>{showConfirm?'🙈':'👁️'}</button>
                      </div>
                    </div>
                  </div>
                  <button style={{ ...F.submitBtn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
                    {loading ? <><span style={F.spinner}/>Creating account...</> : `Create ${regForm.role==='buyer'?'Buyer':'Farmer'} Account →`}
                  </button>
                  <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', marginTop:10 }}>
                    By registering you agree to our{' '}
                    <Link to="/terms" style={{ color:'#059669' }}>Terms</Link> &{' '}
                    <Link to="/privacy" style={{ color:'#059669' }}>Privacy Policy</Link>
                  </p>
                </form>
              )}

              {/* Switch link */}
              <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#6B7280' }}>
                {tab==='login'
                  ? <>Don't have an account?{' '}<button style={R.switchLink} onClick={() => { setTab('register'); setError(''); }}>Create one free →</button></>
                  : <>Already have an account?{' '}<button style={R.switchLink} onClick={() => { setTab('login'); setError(''); }}>Sign in →</button></>
                }
              </p>

              {/* Trust badges */}
              <div style={R.trustRow}>
                {['🔒 SSL Secured','✅ Verified Farmers','💳 Stripe Payments','🇦🇺 Australian Platform'].map(b => (
                  <span key={b} style={R.trustBadge}>{b}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

        </div>{/* end formScroll */}

      {/* ── OAUTH ROLE PICKER MODAL ── */}
      {oauthModal && (
        <div style={M.overlay} onClick={() => setOauthModal(false)}>
          <div style={M.box} onClick={e => e.stopPropagation()}>
            <div style={M.header}>
              <div style={M.provIcon}>
                {oauthProvider==='Google'   && <GoogleIcon/>}
                {oauthProvider==='GitHub'   && <GithubIcon/>}
                {oauthProvider==='Facebook' && <FacebookIcon/>}
              </div>
              <div style={{ flex:1 }}>
                <h3 style={M.title}>Continue with {oauthProvider}</h3>
                <p style={M.sub}>Choose your role before signing in</p>
              </div>
              <button style={M.close} onClick={() => setOauthModal(false)}>✕</button>
            </div>
            <div style={M.body}>
              <div style={M.roleRow}>
                {[['buyer','🛒','I want to Buy','Shop fresh produce from local Australian farmers',['Browse listings','Place orders','Leave reviews']],
                  ['farmer','🚜','I want to Sell','List your farm products and earn revenue',['Create listings','Manage stock','Track orders']]
                ].map(([r,icon,title,sub,feats]) => (
                  <button key={r} onClick={() => setOauthRole(r)}
                    style={{ ...M.roleCard, ...(oauthRole===r ? M.roleOn : {}) }}>
                    {oauthRole===r && <div style={M.tick}>✓</div>}
                    <div style={{ ...M.emoji, background: oauthRole===r?'#ECFDF5':'#F9FAFB' }}>{icon}</div>
                    <p style={{ ...M.roleTitle, color: oauthRole===r?'#065F46':'#111827' }}>{title}</p>
                    <p style={M.roleSub}>{sub}</p>
                    <div style={M.feats}>
                      {feats.map(f => <span key={f} style={{ ...M.featPill, background:oauthRole===r?'#ECFDF5':'#F3F4F6', color:oauthRole===r?'#065F46':'#6B7280' }}>✓ {f}</span>)}
                    </div>
                  </button>
                ))}
              </div>
              <button style={M.continueBtn} onClick={handleOAuthContinue}>
                Continue as {oauthRole==='buyer'?'Buyer 🛒':'Farmer 🚜'} with {oauthProvider} →
              </button>
              <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', marginTop:10 }}>
                You'll be redirected to {oauthProvider} to sign in securely
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SHELL STYLE ────────────────────────────────────────────
const S = {
  shell: { display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI', system-ui, -apple-system, sans-serif", background:'#F0FDF4', alignItems:'center', justifyContent:'center', padding:'32px 24px' },
};

// ── LEFT PANEL STYLES ───────────────────────────────────────

// ── RIGHT PANEL STYLES ──────────────────────────────────────
const R = {
  panel:      { width:'100%', maxWidth:490, background:'#fff', borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', overflowY:'auto', position:'relative' },
  wrap:       { width:'100%', maxWidth:480, margin:'0 auto' },
  header:     { marginBottom:24 },
  badge:      { display:'inline-flex', alignItems:'center', gap:8, background:'#ECFDF5', color:'#065F46', fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, border:'1px solid #A7F3D0', marginBottom:14 },
  title:      { fontSize:26, fontWeight:800, color:'#111827', margin:'0 0 6px', letterSpacing:'-0.5px' },
  sub:        { fontSize:14, color:'#6B7280', margin:0 },
  tabRow:     { display:'flex', background:'#F3F4F6', borderRadius:12, padding:4, marginBottom:22, position:'relative' },
  tab:        { flex:1, padding:'10px 0', border:'none', background:'transparent', borderRadius:9, fontSize:14, fontWeight:600, color:'#9CA3AF', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit', position:'relative' },
  tabOn:      { background:'#fff', color:'#065F46', boxShadow:'0 1px 6px rgba(0,0,0,0.1)' },
  tabIndicator:{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:20, height:2, background:'#059669', borderRadius:2 },
  oauthGrid:  { display:'block', marginBottom:16 },
  oauthGoogle:{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'11px 16px', border:'1.5px solid #E5E7EB', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', width:'100%', boxSizing:'border-box', whiteSpace:'nowrap' },
  oauthGithub:{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px', border:'none', borderRadius:10, background:'#1F2937', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
  oauthFb:    { display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px', border:'none', borderRadius:10, background:'#1877F2', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
  divider:    { display:'flex', alignItems:'center', gap:12, margin:'4px 0 20px' },
  divLine:    { flex:1, height:1, background:'#E5E7EB' },
  divText:    { fontSize:12, color:'#9CA3AF', fontWeight:500, whiteSpace:'nowrap' },
  roleRow:    { display:'flex', gap:12, marginBottom:4 },
  roleCard:   { flex:1, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'14px 10px', border:'1.5px solid #E5E7EB', borderRadius:12, background:'#FAFAFA', cursor:'pointer', fontFamily:'inherit', textAlign:'center', transition:'all 0.2s', outline:'none' },
  roleOn:     { border:'2px solid #059669', background:'#fff', boxShadow:'0 0 0 3px rgba(5,150,105,0.1)' },
  roleTick:   { position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:'#059669', color:'#fff', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
  roleTitle:  { fontSize:13, fontWeight:700, margin:0, transition:'color 0.2s' },
  roleSub:    { fontSize:11, color:'#9CA3AF', margin:0 },
  switchLink: { background:'none', border:'none', color:'#059669', fontWeight:700, cursor:'pointer', fontSize:13, padding:0, fontFamily:'inherit', textDecoration:'underline' },
  trustRow:   { display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginTop:20, paddingTop:16, borderTop:'1px solid #F3F4F6' },
  trustBadge: { fontSize:11, color:'#6B7280', background:'#F9FAFB', padding:'4px 10px', borderRadius:20, border:'1px solid #F3F4F6', fontWeight:500 },
  fpHeader:   { textAlign:'center', marginBottom:24 },
  fpIconWrap: { width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', border:'1px solid #A7F3D0' },
  fpTitle:    { fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 6px' },
  fpSub:      { fontSize:14, color:'#6B7280', margin:0 },
  backBtn:    { background:'none', border:'none', color:'#059669', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', padding:'0 0 16px', display:'block' },
};

// ── FORM STYLES ─────────────────────────────────────────────
const F = {
  fg:        { marginBottom:16 },
  fl:        { display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  input:     { width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, boxSizing:'border-box', fontFamily:'inherit', color:'#111827', background:'#fff', transition:'all 0.2s' },
  eyeBtn:    { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, padding:0 },
  submitBtn: { width:'100%', padding:'13px', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit', boxShadow:'0 2px 12px rgba(5,150,105,0.35)', transition:'all 0.2s', marginTop:4 },
  errBox:    { background:'#FEF2F2', color:'#DC2626', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:16 },
  successBox:{ background:'#ECFDF5', color:'#065F46', border:'1px solid #A7F3D0', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:16 },
  spinner:   { width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' },
};

// ── MODAL STYLES ────────────────────────────────────────────
const M = {
  overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' },
  box:      { background:'#fff', borderRadius:24, width:'100%', maxWidth:520, boxShadow:'0 24px 60px rgba(0,0,0,0.2)', overflow:'hidden', animation:'fadeUp 0.3s ease' },
  header:   { display:'flex', alignItems:'center', gap:14, padding:'22px 24px', borderBottom:'1px solid #F3F4F6', background:'#FAFAFA' },
  provIcon: { width:42, height:42, borderRadius:12, background:'#fff', border:'1.5px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' },
  title:    { fontSize:16, fontWeight:800, color:'#111827', margin:0 },
  sub:      { fontSize:13, color:'#6B7280', margin:'3px 0 0' },
  close:    { marginLeft:'auto', background:'#F3F4F6', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:14, fontWeight:700, color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  body:     { padding:'24px' },
  roleRow:  { display:'flex', gap:14, marginBottom:20 },
  roleCard: { flex:1, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'20px 14px', border:'2px solid #E5E7EB', borderRadius:16, background:'#FAFAFA', cursor:'pointer', fontFamily:'inherit', textAlign:'center', transition:'all 0.2s', outline:'none' },
  roleOn:   { border:'2px solid #059669', background:'#fff', boxShadow:'0 0 0 4px rgba(5,150,105,0.1)' },
  tick:     { position:'absolute', top:10, right:10, width:22, height:22, borderRadius:'50%', background:'#059669', color:'#fff', fontSize:12, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
  emoji:    { width:56, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, transition:'background 0.2s' },
  roleTitle:{ fontSize:15, fontWeight:800, margin:0, transition:'color 0.2s' },
  roleSub:  { fontSize:12, color:'#9CA3AF', margin:0, lineHeight:1.4 },
  feats:    { display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' },
  featPill: { fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, transition:'all 0.2s' },
  continueBtn:{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 12px rgba(5,150,105,0.3)', transition:'opacity 0.2s' },
};