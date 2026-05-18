// components/CookieConsent.jsx — Cookie consent banner
// Author: CPRO306 Capstone | Date: 2026
//
// Behavior:
//   • Shows once on first visit (not seen → display)
//   • Choices stored in localStorage as JSON: { necessary, analytics, marketing, timestamp }
//   • "necessary" is always true (functional cookies — login, cart, etc)
//   • Persists across sessions
//   • Programmatically reopen-able via window.openCookieSettings()
//
// Three modes: collapsed banner, expanded preferences, hidden after choice.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ── Palette ───────────────────────────────────────────────────
const C = {
  forest:    '#253528',
  moss:      '#3D5B45',
  sage:      '#A7BFA5',
  cream:     '#F6F3EE',
  boneWhite: '#FBFAF8',
  charcoal:  '#1C1F1D',
  mistGray:  '#E7E5E0',
  muted:     '#6B7280',
  mutedDark: '#4B5563',
};
const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

const STORAGE_KEY = 'farmmarket_cookie_consent';

// Default consent state
const DEFAULT_CONSENT = {
  necessary: true,    // always on — required for the site to function
  analytics: false,   // anonymous usage stats
  marketing: false,   // newsletters, retargeting, social pixels
};

// ── Inline icons ──────────────────────────────────────────────
const I = ({ children, size = 18, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const CookieIcon = (p) => <I {...p}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></I>;
const XIcon      = (p) => <I {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></I>;
const SettingsIcon = (p) => <I {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></I>;

// ──────────────────────────────────────────────────────────────
export default function CookieConsent() {
  const [visible, setVisible]       = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [prefs, setPrefs]           = useState(DEFAULT_CONSENT);

  // On mount: check storage, show banner if no choice made yet
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setVisible(true);
      } else {
        const parsed = JSON.parse(saved);
        setPrefs({ ...DEFAULT_CONSENT, ...parsed });
      }
    } catch {
      setVisible(true);
    }
  }, []);

  // Expose a global function so other parts of the app can reopen settings
  useEffect(() => {
    window.openCookieSettings = () => {
      setExpanded(true);
      setVisible(true);
    };
    return () => { delete window.openCookieSettings; };
  }, []);

  // ── Save choice & hide ──
  const persist = (choice) => {
    const payload = { ...choice, timestamp: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
    setPrefs(payload);
    setVisible(false);
    setExpanded(false);
    // Dispatch a custom event so other parts of the app can react
    window.dispatchEvent(new CustomEvent('cookieconsent:updated', { detail: payload }));
  };

  const acceptAll = () => persist({ necessary: true, analytics: true, marketing: true });
  const rejectAll = () => persist({ necessary: true, analytics: false, marketing: false });
  const saveSelected = () => persist(prefs);

  if (!visible) return null;

  return (
    <>
      {/* Overlay (only when expanded preferences) */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(28,31,29,0.45)',
            backdropFilter: 'blur(2px)',
            animation: 'cc-fade-in 0.2s ease both',
          }}
        />
      )}

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Cookie consent"
        aria-modal={expanded}
        style={{
          position:    'fixed',
          bottom:      20,
          left:        20,
          right:       20,
          maxWidth:    expanded ? 540 : 920,
          margin:      '0 auto',
          background:  C.boneWhite,
          color:       C.charcoal,
          borderRadius: 18,
          boxShadow:   '0 24px 60px -12px rgba(28,31,29,0.30)',
          border:      `1px solid ${C.mistGray}`,
          fontFamily:  "'Inter', system-ui, sans-serif",
          zIndex:      999,
          padding:     expanded ? 0 : '20px 24px',
          animation:   'cc-slide-up 0.35s cubic-bezier(.22,1,.36,1) both',
          maxHeight:   expanded ? 'calc(100vh - 80px)' : 'auto',
          overflow:    expanded ? 'hidden' : 'visible',
          display:     'flex',
          flexDirection: 'column',
        }}
      >
        {!expanded ? (
          /* ─── Collapsed view ───────────────────────── */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(167,191,165,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.forest, flexShrink: 0,
            }}>
              <CookieIcon size={22}/>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <p style={{
                fontSize: 14, fontWeight: 600,
                color: C.charcoal, margin: '0 0 3px',
                letterSpacing: '-0.005em',
              }}>
                We use cookies
              </p>
              <p style={{
                fontSize: 13, color: C.mutedDark,
                margin: 0, lineHeight: 1.55,
              }}>
                To provide essential features, analyse usage, and improve your experience. {' '}
                <Link to="/cookie-policy" style={{
                  color: C.moss, textDecoration: 'underline', fontWeight: 500,
                }}>
                  Cookie Policy
                </Link>
              </p>
            </div>
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap',
              flexShrink: 0,
            }}>
              <button onClick={() => setExpanded(true)} style={btnGhost}>
                <SettingsIcon size={14}/> Customise
              </button>
              <button onClick={rejectAll} style={btnSecondary}>
                Reject all
              </button>
              <button onClick={acceptAll} style={btnPrimary}>
                Accept all
              </button>
            </div>
          </div>
        ) : (
          /* ─── Expanded preferences ─────────────────── */
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', padding: '24px 28px 18px',
              borderBottom: `1px solid ${C.mistGray}`,
            }}>
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: C.moss,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  margin: '0 0 6px',
                }}>Cookie Preferences</p>
                <h3 style={{
                  fontFamily: SERIF, fontSize: 26, fontWeight: 400,
                  color: C.charcoal, margin: 0,
                  letterSpacing: '-0.015em', lineHeight: 1.2,
                }}>
                  Manage your cookies
                </h3>
              </div>
              <button onClick={() => setExpanded(false)}
                aria-label="Close"
                style={{
                  background: 'none', border: 'none',
                  color: C.muted, cursor: 'pointer', padding: 6,
                  display: 'flex', alignItems: 'center',
                  borderRadius: 8,
                }}>
                <XIcon size={18}/>
              </button>
            </div>

            <div style={{
              padding: '22px 28px',
              overflowY: 'auto', flex: 1,
            }}>
              <p style={{
                fontSize: 13.5, color: C.mutedDark, lineHeight: 1.65,
                margin: '0 0 24px',
              }}>
                We use different categories of cookies. Choose which ones to allow.
                You can change these settings later from the {' '}
                <Link to="/cookie-policy" style={{ color: C.moss, fontWeight: 500 }}>Cookie Policy</Link> page.
              </p>

              <CategoryRow
                title="Necessary"
                summary="Essential for the site to function — login, shopping cart, security."
                detail="Always active. These cookies cannot be disabled because the site won't work without them."
                checked={true}
                disabled={true}
                onChange={() => {}}
              />
              <CategoryRow
                title="Analytics"
                summary="Anonymous usage statistics so we can improve the site."
                detail="Helps us understand which pages are popular and where people get stuck. No personal data is collected."
                checked={prefs.analytics}
                onChange={(v) => setPrefs(p => ({ ...p, analytics: v }))}
              />
              <CategoryRow
                title="Marketing"
                summary="Personalised offers and seasonal recommendations."
                detail="Used to show you produce you might like based on browsing history. Disabled means you'll see generic content."
                checked={prefs.marketing}
                onChange={(v) => setPrefs(p => ({ ...p, marketing: v }))}
                last
              />
            </div>

            <div style={{
              padding: '16px 28px',
              borderTop: `1px solid ${C.mistGray}`,
              display: 'flex', gap: 8, flexWrap: 'wrap',
              justifyContent: 'flex-end',
              background: C.cream,
            }}>
              <button onClick={rejectAll} style={btnSecondary}>Reject all</button>
              <button onClick={saveSelected} style={btnPrimary}>Save preferences</button>
              <button onClick={acceptAll} style={btnPrimary}>Accept all</button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes cc-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes cc-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .cc-toggle:checked + .cc-track     { background: ${C.forest} !important; }
        .cc-toggle:checked + .cc-track > .cc-knob { transform: translateX(18px); }
        .cc-toggle[disabled] + .cc-track   { background: ${C.mistGray} !important; opacity: 0.55; cursor: not-allowed; }
        .cc-cat:hover                      { background: ${C.cream}; }
      `}</style>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Category Row sub-component
// ──────────────────────────────────────────────────────────────
function CategoryRow({ title, summary, detail, checked, disabled, onChange, last }) {
  const id = `cc-${title.toLowerCase()}`;
  return (
    <div className="cc-cat" style={{
      padding: 14, borderRadius: 12,
      marginBottom: last ? 0 : 8,
      transition: 'background .15s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor={id} style={{
            fontSize: 14.5, fontWeight: 600, color: C.charcoal,
            margin: '0 0 4px', display: 'block', cursor: disabled ? 'default' : 'pointer',
            letterSpacing: '-0.005em',
          }}>
            {title}
            {disabled && (
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 600,
                color: C.moss, padding: '2px 8px',
                background: 'rgba(167,191,165,0.22)', borderRadius: 999,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                Always on
              </span>
            )}
          </label>
          <p style={{ fontSize: 13, color: C.mutedDark, margin: '0 0 6px', lineHeight: 1.5 }}>
            {summary}
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>
            {detail}
          </p>
        </div>

        {/* Toggle */}
        <label htmlFor={id} style={{
          flexShrink: 0, marginTop: 4,
          cursor: disabled ? 'default' : 'pointer',
        }}>
          <input
            id={id}
            type="checkbox"
            className="cc-toggle"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />
          <span className="cc-track" style={{
            display: 'inline-block', width: 40, height: 22,
            borderRadius: 999, background: C.mistGray,
            position: 'relative', transition: 'background .2s ease',
            verticalAlign: 'middle',
          }}>
            <span className="cc-knob" style={{
              position: 'absolute', top: 2, left: 2,
              width: 18, height: 18, borderRadius: '50%',
              background: C.boneWhite, boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'transform .2s ease',
            }}/>
          </span>
        </label>
      </div>
    </div>
  );
}

// ── Button styles ─────────────────────────────────────────────
const btnPrimary = {
  padding: '9px 18px',
  background: C.forest, color: C.boneWhite,
  border: 'none', borderRadius: 999,
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
  transition: 'background .15s ease',
};
const btnSecondary = {
  padding: '9px 18px',
  background: C.cream, color: C.charcoal,
  border: `1px solid ${C.mistGray}`, borderRadius: 999,
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
};
const btnGhost = {
  padding: '9px 14px',
  background: 'transparent', color: C.mutedDark,
  border: 'none', borderRadius: 999,
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

// ── Helper: read consent from anywhere in the app ─────────────
export function getCookieConsent() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;  // user hasn't chosen yet
    return JSON.parse(saved);
  } catch {
    return null;
  }
}