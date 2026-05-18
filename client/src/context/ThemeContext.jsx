// context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  'forest-dark':  { name:'Forest Dark',   emoji:'🌲', bg:'#0B1F12', accent:'#10B981', accentLight:'#6EE7B7', nav:'rgba(8,22,13,0.92)',  card:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', text:'#ffffff', textMuted:'rgba(255,255,255,0.5)', textFaint:'rgba(255,255,255,0.25)', btn:'linear-gradient(135deg,#065F46,#059669)', dark:true  },
  'ocean-dark':   { name:'Ocean Dark',    emoji:'🌊', bg:'#0A1628', accent:'#3B82F6', accentLight:'#93C5FD', nav:'rgba(10,22,40,0.92)', card:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', text:'#ffffff', textMuted:'rgba(255,255,255,0.5)', textFaint:'rgba(255,255,255,0.25)', btn:'linear-gradient(135deg,#1D4ED8,#3B82F6)', dark:true  },
  'sunset':       { name:'Sunset',        emoji:'🌅', bg:'#1A0A00', accent:'#F97316', accentLight:'#FED7AA', nav:'rgba(26,10,0,0.92)',  card:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', text:'#ffffff', textMuted:'rgba(255,255,255,0.5)', textFaint:'rgba(255,255,255,0.25)', btn:'linear-gradient(135deg,#C2410C,#F97316)', dark:true  },
  'purple-night': { name:'Purple Night',  emoji:'🔮', bg:'#0F0A1E', accent:'#8B5CF6', accentLight:'#C4B5FD', nav:'rgba(15,10,30,0.92)', card:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', text:'#ffffff', textMuted:'rgba(255,255,255,0.5)', textFaint:'rgba(255,255,255,0.25)', btn:'linear-gradient(135deg,#6D28D9,#8B5CF6)', dark:true  },
  'clean-light':  { name:'Clean Light',   emoji:'☀️', bg:'#F8FAF5', accent:'#059669', accentLight:'#065F46', nav:'rgba(255,255,255,0.95)', card:'rgba(255,255,255,0.9)', border:'rgba(0,0,0,0.08)', text:'#111827', textMuted:'#4B5563', textFaint:'#9CA3AF', btn:'linear-gradient(135deg,#065F46,#059669)', dark:false },
  'rose-gold':    { name:'Rose Gold',     emoji:'🌸', bg:'#FFF5F5', accent:'#E11D48', accentLight:'#FB7185', nav:'rgba(255,255,255,0.95)', card:'rgba(255,255,255,0.9)', border:'rgba(0,0,0,0.08)', text:'#111827', textMuted:'#4B5563', textFaint:'#9CA3AF', btn:'linear-gradient(135deg,#BE123C,#E11D48)', dark:false },
};

export const FONTS = {
  'fraunces': { name:"Fraunces",         heading:"'Fraunces',serif",           body:"'Inter',sans-serif" },
  'playfair': { name:"Playfair Display", heading:"'Playfair Display',serif",   body:"'Inter',sans-serif" },
  'modern':   { name:"DM Sans",          heading:"'DM Sans',sans-serif",       body:"'DM Sans',sans-serif" },
  'mono':     { name:"Space Mono",       heading:"'Space Mono',monospace",     body:"'Inter',sans-serif" },
};

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('fm_theme') || 'forest-dark');
  const [fontKey,  setFontKey]  = useState(() => localStorage.getItem('fm_font')  || 'fraunces');
  const [radius,   setRadius]   = useState(() => parseInt(localStorage.getItem('fm_radius') || '16'));
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fm_fontsize') || '16'));

  const theme = THEMES[themeKey] || THEMES['forest-dark'];
  const font  = FONTS[fontKey]   || FONTS['fraunces'];

  useEffect(() => {
    // Apply to ENTIRE document — changes every page
    document.body.style.background = theme.bg;
    document.body.style.color      = theme.text;
    document.body.style.fontFamily = font.body;
    document.body.style.fontSize   = fontSize + 'px';
    document.documentElement.style.setProperty('--accent',       theme.accent);
    document.documentElement.style.setProperty('--accent-light', theme.accentLight);
    document.documentElement.style.setProperty('--bg',           theme.bg);
    document.documentElement.style.setProperty('--text',         theme.text);
    document.documentElement.style.setProperty('--btn',          theme.btn);
    document.documentElement.style.setProperty('--radius',       radius + 'px');
    document.documentElement.style.setProperty('--font-heading', font.heading);
  }, [themeKey, fontKey, radius, fontSize]);

  const changeTheme    = k => { setThemeKey(k);  localStorage.setItem('fm_theme',   k); };
  const changeFont     = k => { setFontKey(k);   localStorage.setItem('fm_font',    k); };
  const changeRadius   = v => { setRadius(v);    localStorage.setItem('fm_radius',  v); };
  const changeFontSize = v => { setFontSize(v);  localStorage.setItem('fm_fontsize',v); };

  return (
    <ThemeContext.Provider value={{ theme, themeKey, font, fontKey, radius, fontSize, changeTheme, changeFont, changeRadius, changeFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
