// pages/ForgotPassword.jsx — Complete Forgot Password Flow
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const STEPS = { EMAIL: 'email', CODE: 'code', RESET: 'reset', DONE: 'done' };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(STEPS.EMAIL);
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [resetToken, setResetToken] = useState('');

  // ── STEP 1: Request reset code ─────────────────────────
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage(`✅ A 6-digit reset code has been sent to ${email}`);
      setStep(STEPS.CODE);
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with that email address.');
    } finally { setLoading(false); }
  };

  // ── STEP 2: Verify code ────────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-code', { email, code });
      setResetToken(res.data.resetToken);
      setStep(STEPS.RESET);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally { setLoading(false); }
  };

  // ── STEP 3: Set new password ───────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, resetToken, newPassword });
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Please try again.');
    } finally { setLoading(false); }
  };

  const stepIndex = { email:0, code:1, reset:2, done:3 };

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <Link to="/" style={s.logo}>🌿 FarmMarket</Link>
        <Link to="/login" style={s.navLink}>← Back to Login</Link>
      </nav>

      <div style={s.center}>
        <div style={s.card}>

          {/* Progress stepper */}
          {step !== STEPS.DONE && (
            <div style={s.stepper}>
              {['Email', 'Verify Code', 'New Password'].map((label, i) => {
                const current = stepIndex[step];
                const done    = i < current;
                const active  = i === current;
                return (
                  <div key={label} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 'none' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center',
                        fontWeight: 700, fontSize: 13,
                        background: done ? '#1B5E20' : active ? '#2E7D32' : '#E0E0E0',
                        color: done || active ? '#fff' : '#999',
                        border: active ? '2px solid #A5D6A7' : '2px solid transparent',
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <p style={{ fontSize: 10, color: active ? '#1B5E20' : '#aaa', margin: '4px 0 0', fontWeight: active ? 700 : 400, whiteSpace:'nowrap' }}>{label}</p>
                    </div>
                    {i < 2 && <div style={{ flex:1, height:2, background: done ? '#1B5E20' : '#E0E0E0', margin:'0 8px', marginBottom:20 }}/>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STEP 1: Enter email ── */}
          {step === STEPS.EMAIL && (
            <>
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={s.iconCircle}>📧</div>
                <h1 style={s.cardTitle}>Forgot your password?</h1>
                <p style={s.cardSub}>Enter your email and we'll send you a 6-digit reset code.</p>
              </div>
              {error   && <div style={s.errBox}>⛔ {error}</div>}
              {message && <div style={s.msgBox}>{message}</div>}
              <form onSubmit={handleRequestCode}>
                <div style={s.fg}>
                  <label style={s.fl}>Email Address</label>
                  <input style={s.input} type="email" placeholder="you@example.com"
                    value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
                </div>
                <button style={s.submitBtn} type="submit" disabled={loading}>
                  {loading ? '⏳ Sending...' : '📧 Send Reset Code'}
                </button>
              </form>
              <p style={s.bottomText}>
                Remember your password? <Link to="/login" style={s.link}>Login here</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Enter 6-digit code ── */}
          {step === STEPS.CODE && (
            <>
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={s.iconCircle}>🔢</div>
                <h1 style={s.cardTitle}>Enter Reset Code</h1>
                <p style={s.cardSub}>We sent a 6-digit code to <strong>{email}</strong>.<br/>Check your inbox and spam folder.</p>
              </div>
              {error   && <div style={s.errBox}>⛔ {error}</div>}
              {message && <div style={s.msgBox}>{message}</div>}
              <form onSubmit={handleVerifyCode}>
                <div style={s.fg}>
                  <label style={s.fl}>6-Digit Reset Code</label>
                  <input
                    style={{ ...s.input, textAlign:'center', fontSize:28, fontWeight:800, letterSpacing:12, fontFamily:'monospace' }}
                    type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                    value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    required autoFocus/>
                  <p style={{ fontSize:11, color:'#aaa', margin:'6px 0 0', textAlign:'center' }}>
                    Code expires in 15 minutes
                  </p>
                </div>
                <button style={s.submitBtn} type="submit" disabled={loading || code.length !== 6}>
                  {loading ? '⏳ Verifying...' : '✅ Verify Code'}
                </button>
              </form>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
                <button onClick={()=>{ setStep(STEPS.EMAIL); setError(''); setCode(''); }} style={s.ghostBtn}>← Change Email</button>
                <button onClick={()=>{ setLoading(true); api.post('/auth/forgot-password',{email}).then(()=>{ setMessage('New code sent!'); setLoading(false); }).catch(()=>setLoading(false)); }} style={s.ghostBtn} disabled={loading}>
                  Resend Code →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: New password ── */}
          {step === STEPS.RESET && (
            <>
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={s.iconCircle}>🔒</div>
                <h1 style={s.cardTitle}>Create New Password</h1>
                <p style={s.cardSub}>Choose a strong password for your account.</p>
              </div>
              {error && <div style={s.errBox}>⛔ {error}</div>}
              <form onSubmit={handleResetPassword}>
                <div style={s.fg}>
                  <label style={s.fl}>New Password</label>
                  <div style={{ position:'relative' }}>
                    <input style={{ ...s.input, paddingRight:44 }} type={showPw?'text':'password'}
                      placeholder="At least 6 characters" value={newPassword}
                      onChange={e=>setNewPassword(e.target.value)} required autoFocus/>
                    <button type="button" style={s.eyeBtn} onClick={()=>setShowPw(p=>!p)}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Password strength */}
                  {newPassword.length > 0 && (
                    <div style={{ marginTop:6 }}>
                      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                        {[1,2,3,4].map(i=>(
                          <div key={i} style={{ flex:1, height:4, borderRadius:2, background: newPassword.length >= i*3 ? (newPassword.length>=10?'#1B5E20':newPassword.length>=7?'#F9A825':'#C62828') : '#E0E0E0'}}/>
                        ))}
                      </div>
                      <p style={{ fontSize:11, color: newPassword.length>=10?'#1B5E20':newPassword.length>=7?'#F57F17':'#C62828', margin:0 }}>
                        {newPassword.length>=10?'Strong ✓':newPassword.length>=7?'Medium':'Weak — add more characters'}
                      </p>
                    </div>
                  )}
                </div>
                <div style={s.fg}>
                  <label style={s.fl}>Confirm New Password</label>
                  <input style={{ ...s.input, borderColor: confirmPassword && confirmPassword!==newPassword?'#C62828':'#E0E0E0' }}
                    type={showPw?'text':'password'} placeholder="Repeat your password"
                    value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/>
                  {confirmPassword && confirmPassword!==newPassword && (
                    <p style={{ fontSize:11, color:'#C62828', margin:'4px 0 0' }}>Passwords do not match</p>
                  )}
                </div>
                <button style={s.submitBtn} type="submit" disabled={loading || newPassword!==confirmPassword || newPassword.length<6}>
                  {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step === STEPS.DONE && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
              <h1 style={{ ...s.cardTitle, color:'#1B5E20' }}>Password Reset!</h1>
              <p style={{ fontSize:14, color:'#666', marginBottom:28, lineHeight:1.6 }}>
                Your password has been successfully updated.<br/>
                You can now log in with your new password.
              </p>
              <div style={{ background:'#D4EDDA', borderRadius:10, padding:'14px 20px', marginBottom:24, fontSize:13, color:'#155724', fontWeight:600 }}>
                ✅ Your account is secure. All other sessions have been logged out.
              </div>
              <button onClick={()=>navigate('/login')} style={{ ...s.submitBtn, width:'auto', padding:'12px 40px' }}>
                🚀 Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { background:'#F4F6F0', minHeight:'100vh' },
  nav:        { background:'#1B5E20', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  logo:       { color:'#fff', fontWeight:800, fontSize:20, textDecoration:'none' },
  navLink:    { color:'#A5D6A7', fontSize:13, textDecoration:'none' },
  center:     { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 16px', minHeight:'calc(100vh - 56px)' },
  card:       { background:'#fff', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:460, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' },
  iconCircle: { fontSize:44, marginBottom:10 },
  cardTitle:  { fontSize:22, fontWeight:800, color:'#1B5E20', margin:0 },
  cardSub:    { fontSize:13, color:'#888', marginTop:8, lineHeight:1.6 },
  stepper:    { display:'flex', alignItems:'flex-start', justifyContent:'center', marginBottom:28 },
  errBox:     { background:'#FFEBEE', color:'#C62828', border:'1px solid #FFCDD2', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 },
  msgBox:     { background:'#D4EDDA', color:'#155724', border:'1px solid #C3E6CB', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 },
  fg:         { marginBottom:16 },
  fl:         { display:'block', fontSize:13, fontWeight:700, color:'#333', marginBottom:6 },
  input:      { width:'100%', padding:'11px 14px', borderRadius:8, border:'1.5px solid #E0E0E0', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color .2s' },
  eyeBtn:     { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, padding:0 },
  submitBtn:  { width:'100%', padding:'13px', background:'linear-gradient(135deg,#1B5E20,#2E7D32)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', marginTop:4 },
  ghostBtn:   { background:'none', border:'none', color:'#2E7D32', fontSize:12, cursor:'pointer', fontWeight:600, textDecoration:'underline', padding:0 },
  bottomText: { textAlign:'center', fontSize:13, color:'#666', marginTop:16 },
  link:       { color:'#1B5E20', fontWeight:700, textDecoration:'none' },
};