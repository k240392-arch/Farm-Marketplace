// components/ThemePanel.jsx
import { useState } from 'react';
import { useTheme, THEMES, FONTS } from '../context/ThemeContext';

export default function ThemePanel() {
  const { theme, themeKey, fontKey, radius, fontSize, changeTheme, changeFont, changeRadius, changeFontSize } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState('themes');

  const dark  = theme.dark;
  const bg    = dark ? '#1a2e1f' : '#ffffff';
  const bdr   = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const clr   = dark ? '#ffffff' : '#111827';
  const muted = dark ? 'rgba(255,255,255,0.4)' : '#6B7280';
  const itemBg = dark ? 'rgba(255,255,255,0.04)' : '#F9FAFB';
  const itemBdr = dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';

  return (
    <>
      {/* FAB — sits between feedback(left) and chatbot(right) — top of right side */}
      <button onClick={() => setOpen(o => !o)} title="Change Theme"
        style={{ position:'fixed', bottom:24, right:136, zIndex:9000, width:46, height:46, borderRadius:'50%',
          background: open ? theme.accent : (dark ? 'rgba(255,255,255,0.12)' : '#fff'),
          border:`1.5px solid ${bdr}`, backdropFilter:'blur(12px)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
          boxShadow:'0 4px 16px rgba(0,0,0,0.3)', transition:'all 0.2s' }}>
        🎨
      </button>

      {/* Panel */}
      {open && (
        <div style={{ position:'fixed', bottom:82, right:136, zIndex:9000, width:300,
          background:bg, borderRadius:20, border:`1px solid ${bdr}`,
          boxShadow:'0 24px 60px rgba(0,0,0,0.4)', overflow:'hidden',
          animation:'panelUp 0.2s ease' }}>
          <style>{`@keyframes panelUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>

          {/* Header */}
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${bdr}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:dark?'rgba(255,255,255,0.03)':'#F9FAFB' }}>
            <span style={{ fontWeight:800, fontSize:14, color:clr }}>🎨 Theme Studio</span>
            <button onClick={() => setOpen(false)} style={{ width:26, height:26, borderRadius:'50%', background:itemBg, border:`1px solid ${itemBdr}`, cursor:'pointer', color:muted, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', padding:'8px 10px', gap:4, borderBottom:`1px solid ${bdr}` }}>
            {[['themes','🎨'],['fonts','✏️'],['style','⚙️']].map(([k,ico])=>(
              <button key={k} onClick={()=>setTab(k)}
                style={{ flex:1, padding:'6px 4px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:11, transition:'all 0.2s',
                  background: tab===k ? theme.accent : 'transparent',
                  color: tab===k ? '#fff' : muted }}>
                {ico} {k.charAt(0).toUpperCase()+k.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ padding:12, maxHeight:360, overflowY:'auto' }}>

            {/* THEMES */}
            {tab==='themes' && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {Object.entries(THEMES).map(([key, t]) => (
                  <button key={key} onClick={() => changeTheme(key)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12,
                      border:`2px solid ${themeKey===key ? theme.accent : itemBdr}`,
                      background: themeKey===key ? (dark?'rgba(255,255,255,0.07)':'#ECFDF5') : itemBg,
                      cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', transition:'all 0.15s' }}>
                    {/* Swatch */}
                    <div style={{ width:34, height:34, borderRadius:9, background:t.bg, border:`2px solid ${t.accent}`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{t.emoji}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:700, fontSize:13, color:clr, margin:0 }}>{t.name}</p>
                      <div style={{ display:'flex', gap:4, marginTop:3, alignItems:'center' }}>
                        {[t.bg, t.accent, t.accentLight].map((c,i)=>(
                          <div key={i} style={{ width:12, height:12, borderRadius:'50%', background:c, border:`1px solid ${bdr}` }}/>
                        ))}
                        <span style={{ fontSize:10, color:muted }}>{t.dark?'Dark':'Light'}</span>
                      </div>
                    </div>
                    {themeKey===key && <span style={{ color:theme.accent, fontSize:14 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* FONTS */}
            {tab==='fonts' && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {Object.entries(FONTS).map(([key, f]) => (
                  <button key={key} onClick={() => changeFont(key)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', borderRadius:12,
                      border:`2px solid ${fontKey===key ? theme.accent : itemBdr}`,
                      background: fontKey===key ? (dark?'rgba(255,255,255,0.07)':'#ECFDF5') : itemBg,
                      cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', transition:'all 0.15s' }}>
                    <div>
                      <p style={{ fontWeight:700, fontSize:14, color:clr, margin:'0 0 4px', fontFamily:f.heading }}>{f.name}</p>
                      <p style={{ fontSize:12, color:muted, margin:0, fontFamily:f.heading, fontStyle:'italic' }}>Fresh from the farm</p>
                    </div>
                    {fontKey===key && <span style={{ color:theme.accent }}>✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* STYLE */}
            {tab==='style' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Radius */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:clr }}>Border Radius</span>
                    <span style={{ fontSize:12, color:theme.accent, fontWeight:700 }}>{radius}px</span>
                  </div>
                  <input type="range" min={0} max={32} value={radius} onChange={e=>changeRadius(Number(e.target.value))}
                    style={{ width:'100%', accentColor:theme.accent, cursor:'pointer' }}/>
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    {[4,12,24].map(r=>(
                      <div key={r} style={{ flex:1, height:32, background:theme.accent+'20', borderRadius:r, border:`1px solid ${theme.accent}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:9, color:theme.accent, fontWeight:700 }}>{r}px</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:clr }}>Font Size</span>
                    <span style={{ fontSize:12, color:theme.accent, fontWeight:700 }}>{fontSize}px</span>
                  </div>
                  <input type="range" min={12} max={20} value={fontSize} onChange={e=>changeFontSize(Number(e.target.value))}
                    style={{ width:'100%', accentColor:theme.accent, cursor:'pointer' }}/>
                </div>

                {/* Quick presets */}
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:clr, margin:'0 0 8px' }}>Quick Presets</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    {[
                      {label:'🌲 Default', theme:'forest-dark', font:'fraunces', radius:16, size:16},
                      {label:'🌊 Modern',  theme:'ocean-dark',  font:'modern',   radius:8,  size:15},
                      {label:'🔮 Elegant', theme:'purple-night',font:'playfair', radius:20, size:16},
                      {label:'🌅 Bold',    theme:'sunset',      font:'mono',     radius:4,  size:17},
                    ].map(p=>(
                      <button key={p.label} onClick={()=>{changeTheme(p.theme);changeFont(p.font);changeRadius(p.radius);changeFontSize(p.size);}}
                        style={{ padding:'8px', borderRadius:10, border:`1px solid ${itemBdr}`, background:itemBg, color:clr, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 12px', borderTop:`1px solid ${bdr}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:dark?'rgba(255,255,255,0.02)':'#F9FAFB' }}>
            <span style={{ fontSize:10, color:muted }}>Saved automatically ✓</span>
            <button onClick={()=>{changeTheme('forest-dark');changeFont('fraunces');changeRadius(16);changeFontSize(16);}}
              style={{ fontSize:11, color:theme.accent, background:'none', border:'none', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </>
  );
}
