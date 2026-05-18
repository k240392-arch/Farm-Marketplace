// components/FeedbackWidget.jsx — Floating feedback button + mini form
// Author: CPRO306 Capstone Project | Date: 2026
import { useState } from 'react';
import api from '../services/api';

export default function FeedbackWidget() {
  const [open,      setOpen]      = useState(false);
  const [step,      setStep]      = useState('rate');   // 'rate' | 'comment' | 'done'
  const [rating,    setRating]    = useState(0);
  const [hover,     setHover]     = useState(0);
  const [comment,   setComment]   = useState('');
  const [category,  setCategory]  = useState('general');
  const [loading,   setLoading]   = useState(false);

  const handleRate = (r) => { setRating(r); setStep('comment'); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Try to send to backend — gracefully ignore if endpoint not set up
      await api.post('/feedback', { rating, comment, category }).catch(() => {});
    } finally {
      setLoading(false);
      setStep('done');
    }
  };

  const reset = () => { setOpen(false); setStep('rate'); setRating(0); setComment(''); setCategory('general'); };

  const LABELS = ['','Terrible 😤','Poor 😕','Okay 😐','Good 😊','Excellent 🤩'];

  return (
    <>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes bounce  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        .fb-btn:hover { transform:scale(1.1) !important; }
      `}</style>

      {/* Floating trigger button */}
      <button className="fb-btn" onClick={() => setOpen(o => !o)} style={S.trigger}
        title="Share your feedback">
        {open ? '✕' : '💬'}
      </button>

      {/* Widget panel */}
      {open && (
        <div style={S.panel}>

          {/* ── RATING STEP ── */}
          {step === 'rate' && (
            <div>
              <div style={S.header}>
                <span style={{ fontSize:22 }}>🌿</span>
                <div>
                  <h3 style={S.title}>How's your experience?</h3>
                  <p style={S.sub}>We'd love to know what you think</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'20px 0 8px' }}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                    onClick={() => handleRate(i)}
                    style={{ fontSize:32, background:'none', border:'none', cursor:'pointer', transition:'transform 0.15s',
                             transform: hover >= i || rating >= i ? 'scale(1.2)' : 'scale(1)',
                             filter: hover >= i || rating >= i ? 'none' : 'grayscale(100%) opacity(0.4)' }}>
                    ★
                  </button>
                ))}
              </div>
              <p style={{ textAlign:'center', fontSize:13, color:'#4CAF50', fontWeight:600, minHeight:20 }}>
                {hover ? LABELS[hover] : ''}
              </p>
            </div>
          )}

          {/* ── COMMENT STEP ── */}
          {step === 'comment' && (
            <div>
              <div style={S.header}>
                <span style={{ fontSize:22 }}>{'★'.repeat(rating)}</span>
                <div>
                  <h3 style={S.title}>Tell us more</h3>
                  <p style={S.sub}>What could we improve?</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                {['general','ui','products','delivery','support'].map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    style={{ padding:'4px 12px', borderRadius:20, border:`1.5px solid ${category===c?'#2E7D32':'#E0E0E0'}`,
                             background:category===c?'#E8F5E9':'#fff', color:category===c?'#1B5E20':'#666',
                             fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>
                    {c}
                  </button>
                ))}
              </div>
              <textarea placeholder="What's on your mind? (optional)"
                value={comment} onChange={e => setComment(e.target.value)}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E0E0E0', borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'none', height:80, outline:'none', boxSizing:'border-box', color:'#333' }}/>
              <div style={{ display:'flex', gap:10, marginTop:12 }}>
                <button onClick={() => setStep('rate')} style={S.backBtn}>← Back</button>
                <button onClick={handleSubmit} disabled={loading} style={S.submitBtn}>
                  {loading ? '⏳' : '✅ Send Feedback'}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE STEP ── */}
          {step === 'done' && (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
              <h3 style={{ ...S.title, fontSize:18, marginBottom:8 }}>Thank you!</h3>
              <p style={{ ...S.sub, marginBottom:20 }}>Your feedback helps us improve FarmMarket for all Australians.</p>
              <button onClick={reset} style={S.submitBtn}>Close</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const S = {
  trigger: { position:'fixed', bottom:24, left:24, width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#1B5E20,#2E7D32)', color:'#fff', border:'none', fontSize:22, cursor:'pointer', boxShadow:'0 4px 20px rgba(27,94,32,0.4)', zIndex:8000, display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.2s', fontFamily:'inherit' },
  panel:   { position:'fixed', bottom:88, left:24, width:300, background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 16px 48px rgba(0,0,0,0.15)', zIndex:8000, animation:'slideUp 0.3s ease', border:'1px solid #E8F5E9' },
  header:  { display:'flex', alignItems:'center', gap:12, marginBottom:4 },
  title:   { fontSize:15, fontWeight:800, color:'#1B5E20', margin:0 },
  sub:     { fontSize:12, color:'#888', margin:0 },
  backBtn: { flex:1, padding:'10px', background:'#F5F5F5', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#555', fontFamily:'inherit' },
  submitBtn:{ flex:2, padding:'10px', background:'linear-gradient(135deg,#1B5E20,#2E7D32)', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', color:'#fff', fontFamily:'inherit' },
};