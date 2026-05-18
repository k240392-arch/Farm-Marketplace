// components/PromoPopup.jsx — Smart promo popup
// Appears after 30% scroll OR 10 seconds, once per session
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [closed,  setClosed]  = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('promo_shown')) return;

    const showPopup = () => {
      if (!closed) { setVisible(true); sessionStorage.setItem('promo_shown', '1'); }
    };

    // Show on 30% scroll
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.3) { showPopup(); window.removeEventListener('scroll', handleScroll); }
    };

    // Show after 10 seconds as fallback
    const timer = setTimeout(showPopup, 10000);
    window.addEventListener('scroll', handleScroll);

    return () => { clearTimeout(timer); window.removeEventListener('scroll', handleScroll); };
  }, [closed]);

  const handleClose = () => { setVisible(false); setClosed(true); };

  if (!visible) return null;

  return (
    <div style={S.overlay} onClick={handleClose}>
      <div style={S.box} onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button style={S.close} onClick={handleClose}>✕</button>

        {/* Content */}
        <div style={S.badge}>🌿 Limited Time Offer</div>
        <div style={{ fontSize: 52, margin: '12px 0' }}>🥑</div>
        <h2 style={S.title}>Fresh Produce, Direct from the Farm</h2>
        <p style={S.sub}>
          Join <strong>12,500+</strong> happy Australians buying directly from local farmers.
          First order? Use code <strong style={{ color:'#1B5E20' }}>FRESHSTART</strong> for free delivery!
        </p>

        {/* Features */}
        <div style={S.features}>
          {['✅ Verified Australian farmers','✅ Picked fresh daily','✅ Secure Stripe payments'].map(f => (
            <span key={f} style={S.featurePill}>{f}</span>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, marginTop:20 }}>
          <Link to="/listings" style={S.primaryBtn} onClick={handleClose}>
            🛒 Shop Fresh Produce →
          </Link>
          <button style={S.ghostBtn} onClick={handleClose}>Maybe later</button>
        </div>

        <p style={{ fontSize:11, color:'#aaa', marginTop:12 }}>No spam. Unsubscribe anytime.</p>
      </div>

      <style>{`
        @keyframes popIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.9)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
      `}</style>
    </div>
  );
}

const S = {
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9000, backdropFilter:'blur(4px)' },
  box:         { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:24, padding:'36px 32px', width:'100%', maxWidth:460, textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.25)', zIndex:9001, animation:'popIn 0.4s cubic-bezier(0.22,1,0.36,1)', border:'2px solid #E8F5E9' },
  close:       { position:'absolute', top:14, right:14, background:'#F3F4F6', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:14, fontWeight:700, color:'#666', display:'flex', alignItems:'center', justifyContent:'center' },
  badge:       { display:'inline-block', background:'#E8F5E9', color:'#1B5E20', fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20, border:'1px solid #C8E6C9' },
  title:       { fontSize:22, fontWeight:800, color:'#1B5E20', margin:'12px 0 10px', lineHeight:1.2 },
  sub:         { fontSize:15, color:'#555', lineHeight:1.65, margin:0 },
  features:    { display:'flex', flexDirection:'column', gap:6, margin:'18px 0 0', textAlign:'left', background:'#F8FAF5', borderRadius:12, padding:'14px 16px' },
  featurePill: { fontSize:13, color:'#2E7D32', fontWeight:600 },
  primaryBtn:  { flex:1, background:'linear-gradient(135deg,#1B5E20,#2E7D32)', color:'#fff', padding:'13px 20px', borderRadius:12, fontWeight:700, fontSize:14, textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(27,94,32,0.3)' },
  ghostBtn:    { flex:1, background:'transparent', color:'#888', border:'1.5px solid #E0E0E0', padding:'13px 20px', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' },
};
