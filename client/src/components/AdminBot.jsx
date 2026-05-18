// components/AdminBot.jsx — AI Assistant for the Admin Dashboard
// Mirrors the public FarmBot UX but with admin-themed colours and admin-only endpoint.
import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const QUICK_PROMPTS = [
  "How many users are on the platform? 👥",
  "Show me pending orders 📦",
  "Any security alerts I should know about? 🔒",
  "How do I delete a farmer permanently? 🗑️",
];

export default function AdminBot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm **AdminBot** 🤖\nI can answer questions about your platform — users, orders, listings, security and more. How can I help?" }
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [typing,   setTyping]   = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    setTyping(true);
    try {
      const res = await api.post('/ai/admin-chat', {
        message: msg,
        history: messages.slice(-8)
      });
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (!open) setUnread(u => u + 1);
    } catch (err) {
      setTyping(false);
      const errMsg = err.response?.data?.message || "Sorry, I'm having trouble right now. Try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatMsg = (text) => {
    // Bold **text** + line breaks. Escape HTML first to avoid XSS from model output.
    const escaped = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const clearChat = () => setMessages([
    { role: 'assistant', content: "Chat cleared. I'm **AdminBot** 🤖 — ask me anything about your platform." }
  ]);

  return (
    <>
      <style>{`
        @keyframes ab-slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes ab-pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ab-dotBounce{ 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes ab-spin     { to { transform: rotate(360deg); } }
        .ab-msg::-webkit-scrollbar { width:4px }
        .ab-msg::-webkit-scrollbar-track { background:transparent }
        .ab-msg::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:4px }
        .ab-input:focus { outline:none; border-color:#DC2626 !important; box-shadow:0 0 0 3px rgba(220,38,38,0.18) !important; }
        .ab-send:hover:not(:disabled) { background:#991B1B !important; transform:scale(1.05); }
        .ab-quick:hover { background:rgba(252,165,165,0.22) !important; border-color:#FCA5A5 !important; }
        .ab-fab:hover { transform:scale(1.08) !important; }
        .ab-clear:hover { color:#FCA5A5 !important; }
      `}</style>

      {/* ── FAB Button ── */}
      <button className="ab-fab" onClick={() => setOpen(o => !o)} style={S.fab} aria-label="Open AdminBot">
        {open
          ? <span style={{ fontSize:18, fontWeight:700 }}>✕</span>
          : <span style={{ fontSize:24 }}>🤖</span>
        }
        {!open && unread > 0 && (
          <span style={S.badge}>{unread}</span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div style={S.window}>

          {/* Header */}
          <div style={S.header}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={S.avatar}>🤖</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#fff' }}>AdminBot</div>
                <div style={{ fontSize:11, color:'#FCA5A5', display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#F87171', display:'inline-block', animation:'ab-pulse 2s infinite' }}/>
                  Admin Mode · Groq AI
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="ab-clear" onClick={clearChat} title="Clear chat"
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:14, padding:'4px 8px', borderRadius:6, fontFamily:'inherit' }}>
                🗑
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close"
                style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ab-msg" style={S.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.role==='user' ? 'flex-end' : 'flex-start', marginBottom:12, animation:'ab-slideUp 0.2s ease' }}>
                {m.role === 'assistant' && (
                  <div style={{ display:'flex', alignItems:'flex-end', gap:7, maxWidth:'100%' }}>
                    <div style={S.botAvatar}>🤖</div>
                    <div style={S.botBubble} dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }}/>
                  </div>
                )}
                {m.role === 'user' && (
                  <div style={S.userBubble}>{m.content}</div>
                )}
              </div>
            ))}

            {typing && (
              <div style={{ display:'flex', alignItems:'flex-end', gap:7, marginBottom:12 }}>
                <div style={S.botAvatar}>🤖</div>
                <div style={{ ...S.botBubble, padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(d => (
                      <span key={d} style={{ width:7, height:7, borderRadius:'50%', background:'#FCA5A5', display:'inline-block', animation:`ab-dotBounce 1.2s ${d*0.2}s infinite ease-in-out` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div style={S.quickRow}>
              {QUICK_PROMPTS.map(q => (
                <button key={q} className="ab-quick" onClick={() => send(q)} style={S.quickBtn}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={S.inputArea}>
            <div style={S.inputRow}>
              <textarea
                ref={inputRef}
                className="ab-input"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask AdminBot anything..."
                disabled={loading}
                style={S.input}
              />
              <button className="ab-send" onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn} aria-label="Send">
                {loading
                  ? <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'ab-spin 0.8s linear infinite' }}/>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textAlign:'center', margin:'6px 0 0', fontFamily:'inherit' }}>
              Powered by Groq AI · Admin-only · Enter to send
            </p>
          </div>

        </div>
      )}
    </>
  );
}

const S = {
  fab: {
    position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%',
    background:'linear-gradient(135deg,#DC2626,#991B1B)', color:'#fff', border:'none',
    cursor:'pointer', boxShadow:'0 4px 20px rgba(220,38,38,0.5)', zIndex:9999,
    display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.2s',
    fontFamily:'inherit',
  },
  badge: {
    position:'absolute', top:-4, right:-4, background:'#fff', color:'#DC2626',
    fontSize:11, fontWeight:800, minWidth:20, height:20, borderRadius:10,
    display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6px',
    boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
  },
  window: {
    position:'fixed', bottom:90, right:24, width:380, maxWidth:'calc(100vw - 32px)',
    height:560, maxHeight:'calc(100vh - 120px)',
    background:'#0F1923', borderRadius:18, boxShadow:'0 18px 50px rgba(0,0,0,0.45)',
    display:'flex', flexDirection:'column', overflow:'hidden', zIndex:9999,
    fontFamily:'inherit', animation:'ab-slideUp 0.25s ease',
    border:'1px solid rgba(220,38,38,0.25)',
  },
  header: {
    background:'linear-gradient(135deg,#991B1B,#DC2626)', padding:'14px 16px',
    display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0,
  },
  avatar: {
    width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.15)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
  },
  messages: {
    flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column',
    background:'#0F1923',
  },
  botAvatar: {
    width:26, height:26, borderRadius:8, background:'rgba(220,38,38,0.2)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0,
  },
  botBubble: {
    background:'rgba(255,255,255,0.07)', color:'#F3F4F6', padding:'10px 14px',
    borderRadius:'14px 14px 14px 4px', fontSize:13, lineHeight:1.5, maxWidth:265,
    wordBreak:'break-word',
  },
  userBubble: {
    background:'linear-gradient(135deg,#DC2626,#991B1B)', color:'#fff',
    padding:'10px 14px', borderRadius:'14px 14px 4px 14px', fontSize:13, lineHeight:1.5,
    maxWidth:265, wordBreak:'break-word', boxShadow:'0 2px 8px rgba(220,38,38,0.35)',
  },
  quickRow: {
    display:'flex', gap:6, padding:'8px 14px 0', flexWrap:'wrap', flexShrink:0,
  },
  quickBtn: {
    background:'rgba(252,165,165,0.1)', border:'1px solid rgba(220,38,38,0.3)',
    color:'#FCA5A5', padding:'7px 11px', borderRadius:16, fontSize:11, fontWeight:600,
    cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
  },
  inputArea: {
    padding:'12px 14px 14px', background:'#0F1923', borderTop:'1px solid rgba(255,255,255,0.06)',
    flexShrink:0,
  },
  inputRow: { display:'flex', gap:8, alignItems:'flex-end' },
  input: {
    flex:1, background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.1)',
    color:'#fff', padding:'10px 12px', borderRadius:10, fontSize:13, resize:'none',
    fontFamily:'inherit', maxHeight:80,
  },
  sendBtn: {
    background:'#DC2626', color:'#fff', border:'none', width:38, height:38,
    borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center',
    justifyContent:'center', transition:'all 0.15s', flexShrink:0,
  },
};