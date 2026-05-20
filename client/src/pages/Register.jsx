// pages/Register.jsx — Professional register with email verification flow
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { API_URL } from '../config';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink:0 }}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink:0 }}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function Register() {
  // Wording switches based on which navbar button the user clicked:
  // "Join" → warm welcome, "Sign in" → just-business signup.
  const location = useLocation();
  const fromJoin = location.state?.from === 'join';

  const [form,      setForm]      = useState({ full_name:'', email:'', password:'', role:'buyer' });
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [regEmail,  setRegEmail]  = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [mounted,   setMounted]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      if (res.data.requiresVerification) { setRegEmail(form.email); setVerifying(true); }
      else navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: regEmail });
      setResendMsg('✅ Verification email resent! Check your inbox.');
    } catch (err) { setResendMsg(err.response?.data?.message || 'Error resending.'); }
    setResending(false);
  };

  const [oauthModal,    setOauthModal]    = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const [oauthRole,     setOauthRole]     = useState(form.role || 'buyer');

  const handleOAuth = (provider) => {
    setOauthProvider(provider);
    setOauthRole(form.role || 'buyer'); // pre-select whatever role they already chose
    setOauthModal(true);
  };

  const handleOAuthContinue = () => {
    const base = API_URL;
    window.location.href = `${base}/api/auth/${oauthProvider.toLowerCase()}?role=${oauthRole}`;
  };

  if (verifying) {
    return (
      <div style={S.shell}>
        <div style={S.rightPanel}>
          <div style={{ width:'100%', maxWidth:440, textAlign:'center' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>📧</div>
            <h2 style={{ fontSize:24, fontWeight:800, color:'#065F46', marginBottom:8 }}>Check Your Email!</h2>
            <p style={{ color:'#6B7280', fontSize:14, marginBottom:12 }}>We sent a verification link to:</p>
            <div style={{ background:'#ECFDF5', color:'#065F46', fontWeight:700, padding:'10px 16px', borderRadius:10, fontSize:15, marginBottom:20, border:'1px solid #A7F3D0' }}>{regEmail}</div>
            <p style={{ color:'#6B7280', fontSize:14, lineHeight:1.7, marginBottom:24 }}>Click the link in the email to activate your account. The link expires in <strong>24 hours</strong>.</p>
            <div style={{ background:'#F9FAFB', borderRadius:12, padding:'14px 18px', marginBottom:24, textAlign:'left', border:'1px solid #F3F4F6' }}>
              {['Check your inbox','Click the verification link','Come back and login'].map((step,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:i<2?12:0 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontSize:14, color:'#374151', fontWeight:500 }}>{step}</span>
                </div>
              ))}
            </div>
            {resendMsg && <div style={{ background:resendMsg.startsWith('✅')?'#ECFDF5':'#FEF2F2', color:resendMsg.startsWith('✅')?'#065F46':'#DC2626', padding:'10px 14px', borderRadius:10, fontSize:13, fontWeight:600, marginBottom:16, border:`1px solid ${resendMsg.startsWith('✅')?'#A7F3D0':'#FCA5A5'}` }}>{resendMsg}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Link to="/login" style={{ ...S.submitBtn, textAlign:'center', textDecoration:'none', padding:'13px 0', display:'block' }}>Go to Login →</Link>
              <button onClick={handleResend} disabled={resending} style={{ padding:'12px', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:'#374151' }}>{resending?'⏳ Resending...':'↻ Resend Verification Email'}</button>
            </div>
            <p style={{ fontSize:12, color:'#9CA3AF', marginTop:16 }}>Can't find the email? Check your spam folder.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <div style={S.rightPanel}>
        <div style={{ width:'100%', maxWidth:440, opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:'all 0.6s cubic-bezier(0.22,1,0.36,1)' }}>

          <div style={{ marginBottom:24 }}>
            <div style={S.formBadge}>{fromJoin ? '🌱 Welcome to FarmMarket' : '🌱 Join FarmMarket'}</div>
            <h1 style={S.formTitle}>{fromJoin ? 'Join FarmMarket' : 'Create your account'}</h1>
            <p style={S.formSub}>
              {fromJoin
                ? 'Pick how you\u2019d like to use FarmMarket and you\u2019re in.'
                : 'Connect with local Australian farmers today.'}
            </p>
          </div>

          {/* Role selector */}
          <div style={{ marginBottom:20 }}>
            <label style={S.fl}>I want to...</label>
            <div style={S.roleRow}>
              {[['buyer','🛒','Buy fresh produce','Shop local farmers'],['farmer','🚜','Sell my produce','List your farm products']].map(([role,icon,title,sub]) => (
                <button key={role} type="button" onClick={() => setForm(f=>({...f,role}))}
                  style={{ ...S.roleBtn, ...(form.role===role ? S.roleBtnOn : {}) }}>
                  <span style={{ fontSize:26 }}>{icon}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:form.role===role?'#065F46':'#111827' }}>{title}</span>
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OAuth */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            <button style={S.oauthBtn} onClick={() => handleOAuth('Google')}><GoogleIcon/><span>Sign up with Google</span></button>
            <div style={{ display:'flex', gap:10 }}>
            </div>
          </div>

          <div style={S.divider}><div style={S.dividerLine}/><span style={S.dividerText}>or register with email</span><div style={S.dividerLine}/></div>

          {error && <div style={S.errBox}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={S.fg}><label style={S.fl}>Full Name</label><input style={S.input} type="text" placeholder="John Smith" required value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} autoFocus/></div>
            <div style={S.fg}>
              <label style={S.fl}>Email Address</label>
              <input style={S.input} type="email" placeholder="you@example.com" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              <p style={{ fontSize:11, color:'#9CA3AF', margin:'5px 0 0' }}>📧 A verification link will be sent to this email.</p>
            </div>
            <div style={S.fg}>
              <label style={S.fl}>Password <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(min. 6 characters)</span></label>
              <div style={{ position:'relative' }}>
                <input style={{ ...S.input, paddingRight:44 }} type={showPw?'text':'password'} placeholder="Create a strong password" required minLength={6} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                <button type="button" style={S.eyeBtn} onClick={()=>setShowPw(p=>!p)}>{showPw?'🙈':'👁️'}</button>
              </div>
            </div>
            <button style={S.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Creating account...' : `Register as ${form.role==='buyer'?'Buyer':'Farmer'} →`}
            </button>
            <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', marginTop:12 }}>
              By registering you agree to our <Link to="/terms" style={{ color:'#059669' }}>Terms</Link> and <Link to="/privacy" style={{ color:'#059669' }}>Privacy Policy</Link>.
            </p>
          </form>

          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#6B7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#059669', fontWeight:700, textDecoration:'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>

      {/* ── OAUTH ROLE PICKER MODAL ── */}
      {oauthModal && (
        <div style={SM.overlay} onClick={() => setOauthModal(false)}>
          <div style={SM.box} onClick={e => e.stopPropagation()}>
            <div style={SM.header}>
              <div style={SM.providerIcon}>
                {oauthProvider === 'Google'   && <GoogleIcon />}
                {oauthProvider === 'GitHub'   && <GithubIcon />}
                {oauthProvider === 'Facebook' && <FacebookIcon />}
              </div>
              <div>
                <h2 style={SM.title}>Continue with {oauthProvider}</h2>
                <p style={SM.sub}>Choose how you want to use FarmMarket</p>
              </div>
              <button style={SM.close} onClick={() => setOauthModal(false)}>✕</button>
            </div>
            <div style={SM.body}>
              <p style={SM.question}>I want to...</p>
              <div style={SM.roleRow}>
                {[
                  ['buyer',  '🛒', 'Buy Produce',  'Shop fresh food from local Australian farmers', ['Browse listings','Place orders','Track delivery']],
                  ['farmer', '🚜', 'Sell Produce', 'List your farm products and sell across Australia', ['Create listings','Manage stock','Earn revenue']],
                ].map(([r, icon, title, sub, feats]) => (
                  <button key={r} onClick={() => setOauthRole(r)}
                    style={{ ...SM.roleCard, ...(oauthRole === r ? SM.roleOn : {}) }}>
                    {oauthRole === r && <div style={SM.tick}>✓</div>}
                    <div style={{ ...SM.emoji, background: oauthRole===r ? '#ECFDF5' : '#F9FAFB' }}>{icon}</div>
                    <p style={{ ...SM.roleTitle, color: oauthRole===r ? '#065F46' : '#111827' }}>{title}</p>
                    <p style={SM.roleSub}>{sub}</p>
                    <div style={SM.feats}>
                      {feats.map(f => (
                        <span key={f} style={{ ...SM.featPill, background: oauthRole===r?'#ECFDF5':'#F3F4F6', color: oauthRole===r?'#065F46':'#6B7280' }}>✓ {f}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <button style={SM.continueBtn} onClick={handleOAuthContinue}>
                Continue as {oauthRole === 'buyer' ? 'Buyer 🛒' : 'Farmer 🚜'} with {oauthProvider} →
              </button>
              <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', marginTop:10 }}>
                You'll be redirected to {oauthProvider} to sign in securely.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeftPanel() {
  return (
    <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%', padding:'40px', justifyContent:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
        <span style={{ fontSize:28 }}>🌿</span>
        <span style={{ color:'#fff', fontSize:22, fontWeight:800 }}>FarmMarket</span>
      </div>
      <h2 style={{ color:'#fff', fontSize:28, fontWeight:800, lineHeight:1.2, margin:'0 0 14px', letterSpacing:'-0.5px' }}>Join thousands of Aussie farmers & buyers</h2>
      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:15, lineHeight:1.65, margin:'0 0 36px' }}>Whether you're growing or shopping — FarmMarket connects you directly.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[['✅','Free to join','No setup fees for farmers or buyers'],['🚀','Live in minutes','Your store or account is ready instantly'],['🛡️','Secure payments','Stripe-powered, encrypted transactions'],['📊','Track everything','Orders, revenue and stock in one place']].map(([icon,t,s]) => (
          <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, border:'1px solid rgba(255,255,255,0.15)' }}>{icon}</div>
            <div><p style={{ color:'#fff', fontSize:14, fontWeight:700, margin:'0 0 2px' }}>{t}</p><p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, margin:0 }}>{s}</p></div>
          </div>
        ))}
      </div>
      <div style={{ position:'absolute', top:'-15%', right:'-20%', width:400, height:400, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-10%', left:'-15%', width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
    </div>
  );
}

const SM = {
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' },
  box:         { background:'#fff', borderRadius:24, width:'100%', maxWidth:520, boxShadow:'0 24px 60px rgba(0,0,0,0.2)', overflow:'hidden' },
  header:      { display:'flex', alignItems:'center', gap:14, padding:'22px 24px', borderBottom:'1px solid #F3F4F6', background:'#FAFAFA' },
  providerIcon:{ width:42, height:42, borderRadius:12, background:'#fff', border:'1.5px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' },
  title:       { fontSize:17, fontWeight:800, color:'#111827', margin:0 },
  sub:         { fontSize:13, color:'#6B7280', margin:'3px 0 0' },
  close:       { marginLeft:'auto', background:'#F3F4F6', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:14, fontWeight:700, color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  body:        { padding:'24px' },
  question:    { fontSize:14, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 16px' },
  roleRow:     { display:'flex', gap:14, marginBottom:20 },
  roleCard:    { flex:1, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'20px 14px', border:'2px solid #E5E7EB', borderRadius:16, background:'#FAFAFA', cursor:'pointer', fontFamily:'inherit', textAlign:'center', transition:'all 0.2s', outline:'none' },
  roleOn:      { border:'2px solid #059669', background:'#fff', boxShadow:'0 0 0 4px rgba(5,150,105,0.1)' },
  tick:        { position:'absolute', top:10, right:10, width:22, height:22, borderRadius:'50%', background:'#059669', color:'#fff', fontSize:12, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' },
  emoji:       { width:56, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, transition:'background 0.2s' },
  roleTitle:   { fontSize:15, fontWeight:800, margin:0, transition:'color 0.2s' },
  roleSub:     { fontSize:12, color:'#9CA3AF', margin:0, lineHeight:1.4 },
  feats:       { display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' },
  featPill:    { fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, transition:'all 0.2s' },
  continueBtn: { width:'100%', padding:'14px', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 12px rgba(5,150,105,0.3)' },
};

const S = {
  shell:        { display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI', system-ui, sans-serif", background:'#F0FDF4', alignItems:'center', justifyContent:'center', padding:'32px 24px' },
  leftPanel:    { width:'42%', background:'linear-gradient(160deg,#064E3B 0%,#065F46 40%,#047857 70%,#059669 100%)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', flexShrink:0 },
  rightPanel:   { width:'100%', maxWidth:520, background:'#fff', borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', padding:'32px', overflowY:'auto' },
  formBadge:    { display:'inline-flex', alignItems:'center', gap:6, background:'#ECFDF5', color:'#065F46', fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, border:'1px solid #A7F3D0', marginBottom:12 },
  formTitle:    { fontSize:24, fontWeight:800, color:'#111827', margin:'0 0 6px', letterSpacing:'-0.5px' },
  formSub:      { fontSize:14, color:'#6B7280', margin:0 },
  fl:           { display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  fg:           { marginBottom:16 },
  input:        { width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', color:'#111827', transition:'border-color 0.2s' },
  eyeBtn:       { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, padding:0 },
  submitBtn:    { width:'100%', padding:'13px', background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 2px 8px rgba(5,150,105,0.3)' },
  errBox:       { background:'#FEF2F2', color:'#DC2626', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:16 },
  oauthBtn:     { display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'11px 16px', border:'1.5px solid #E5E7EB', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', width:'100%', boxSizing:'border-box' },
  divider:      { display:'flex', alignItems:'center', gap:12, margin:'4px 0 20px' },
  dividerLine:  { flex:1, height:1, background:'#E5E7EB' },
  dividerText:  { fontSize:12, color:'#9CA3AF', fontWeight:500, whiteSpace:'nowrap' },
  roleRow:      { display:'flex', gap:12, marginTop:6 },
  roleBtn:      { flex:1, padding:'14px 10px', border:'1.5px solid #E5E7EB', borderRadius:12, background:'#FAFAFA', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, fontFamily:'inherit', transition:'all 0.2s' },
  roleBtnOn:    { border:'2px solid #059669', background:'#ECFDF5', boxShadow:'0 0 0 3px rgba(5,150,105,0.1)' },
};