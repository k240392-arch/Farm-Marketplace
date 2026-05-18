// components/ChatBot.jsx 
import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const QUICK_PROMPTS = [
  "What's in season now? 🌿",
  "Cheapest veggies today? 🥦",
  "Recipe ideas for this week 🍳",
  "Find organic farms near me 🚜",
];

export default function ChatBot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm **FarmBot** 🌿\nAsk me anything — seasonal produce, recipes, farm prices, or what's fresh today!" }
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
      const res = await api.post('/ai/chat', {
        message: msg,
        history: messages.slice(-8)
      });
      setTyping(false);
      // Simulate typing effect
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble right now. Try again in a moment! 🙏" }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatMsg = (text) => {
    // Bold **text**
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  };

  const clearChat = () => setMessages([
    { role: 'assistant', content: "Chat cleared! I'm **FarmBot** 🌿 — ask me anything about fresh produce, farms, or recipes!" }
  ]);

  return (
    <>
      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes dotBounce{ 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes fabGlow  { 0%,100%{box-shadow:0 4px 20px rgba(5,150,105,0.5)} 50%{box-shadow:0 4px 32px rgba(5,150,105,0.8)} }
        .cb-msg::-webkit-scrollbar { width:4px }
        .cb-msg::-webkit-scrollbar-track { background:transparent }
        .cb-msg::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:4px }
        .cb-input:focus { outline:none; border-color:#059669 !important; box-shadow:0 0 0 3px rgba(5,150,105,0.15) !important; }
        .cb-send:hover:not(:disabled) { background:#047857 !important; transform:scale(1.05); }
        .cb-quick:hover { background:rgba(110,231,183,0.2) !important; border-color:#6EE7B7 !important; }
        .cb-fab:hover { transform:scale(1.08) !important; }
        .cb-clear:hover { color:#6EE7B7 !important; }
      `}</style>

      {/* ── FAB Button ── */}
      <button className="cb-fab" onClick={() => setOpen(o => !o)} style={S.fab}>
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
              <div style={S.avatar}>🌿</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#fff' }}>FarmBot</div>
                <div style={{ fontSize:11, color:'#86EFAC', display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse 2s infinite' }}/>
                  Online · Groq AI
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="cb-clear" onClick={clearChat} title="Clear chat"
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:14, padding:'4px 8px', borderRadius:6, fontFamily:'inherit' }}>
                🗑
              </button>
              <button onClick={() => setOpen(false)}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="cb-msg" style={S.messages}>

            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.role==='user' ? 'flex-end' : 'flex-start', marginBottom:12, animation:'slideUp 0.2s ease' }}>
                {m.role === 'assistant' && (
                  <div style={{ display:'flex', alignItems:'flex-end', gap:7 }}>
                    <div style={S.botAvatar}>🌿</div>
                    <div style={S.botBubble} dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }}/>
                  </div>
                )}
                {m.role === 'user' && (
                  <div style={S.userBubble}>{m.content}</div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display:'flex', alignItems:'flex-end', gap:7, marginBottom:12 }}>
                <div style={S.botAvatar}>🌿</div>
                <div style={{ ...S.botBubble, padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(d => (
                      <span key={d} style={{ width:7, height:7, borderRadius:'50%', background:'#6EE7B7', display:'inline-block', animation:`dotBounce 1.2s ${d*0.2}s infinite ease-in-out` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts — only show if no user messages yet */}
          {messages.length <= 1 && (
            <div style={S.quickRow}>
              {QUICK_PROMPTS.map(q => (
                <button key={q} className="cb-quick" onClick={() => send(q)} style={S.quickBtn}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={S.inputArea}>
            <div style={S.inputRow}>
              <textarea
                ref={inputRef}
                className="cb-input"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask FarmBot anything..."
                disabled={loading}
                style={S.input}
              />
              <button className="cb-send" onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn}>
                {loading
                  ? <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }}/>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textAlign:'center', margin:'6px 0 0', fontFamily:'inherit' }}>
              Powered by Groq AI · Press Enter to send
            </p>
          </div>

        </div>
      )}
    </>
  );
}

const S = {
  fab: {
    position:'fixed', bottom:28, right:28, width:58, height:58, borderRadius:'50%',
    background:'linear-gradient(135deg,#065F46,#059669)', color:'#fff', border:'none',
    cursor:'pointer', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 20px rgba(5,150,105,0.5)', transition:'transform 0.2s',
    animation:'fabGlow 3s ease-in-out infinite',
  },
  badge: {
    position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%',
    background:'#EF4444', color:'#fff', fontSize:11, fontWeight:800,
    display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff',
  },
  window: {
    position:'fixed', bottom:100, right:28, width:370, height:520,
    background:'linear-gradient(160deg,#022c22 0%,#064E3B 60%,#065F46 100%)',
    borderRadius:20, boxShadow:'0 16px 48px rgba(0,0,0,0.35)', display:'flex',
    flexDirection:'column', zIndex:99998, overflow:'hidden',
    animation:'slideUp 0.25s ease', border:'1px solid rgba(110,231,183,0.15)',
  },
  header: {
    padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center',
    borderBottom:'1px solid rgba(255,255,255,0.08)',
    background:'rgba(0,0,0,0.15)', backdropFilter:'blur(8px)',
  },
  avatar: {
    width:38, height:38, borderRadius:12, background:'rgba(110,231,183,0.15)',
    border:'1.5px solid rgba(110,231,183,0.3)', display:'flex',
    alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0,
  },
  messages: {
    flex:1, overflowY:'auto', padding:'16px 14px',
    display:'flex', flexDirection:'column',
  },
  botAvatar: {
    width:28, height:28, borderRadius:8, background:'rgba(110,231,183,0.15)',
    border:'1px solid rgba(110,231,183,0.2)', display:'flex',
    alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0,
  },
  botBubble: {
    background:'rgba(255,255,255,0.08)', color:'#E2FFF4',
    padding:'10px 14px', borderRadius:'14px 14px 14px 2px',
    fontSize:13.5, maxWidth:'82%', lineHeight:1.6,
    border:'1px solid rgba(110,231,183,0.12)', backdropFilter:'blur(4px)',
  },
  userBubble: {
    background:'linear-gradient(135deg,#059669,#065F46)', color:'#fff',
    padding:'10px 14px', borderRadius:'14px 14px 2px 14px',
    fontSize:13.5, maxWidth:'82%', lineHeight:1.6,
    boxShadow:'0 2px 8px rgba(5,150,105,0.3)',
  },
  quickRow: {
    padding:'0 12px 10px', display:'flex', flexWrap:'wrap', gap:6,
  },
  quickBtn: {
    fontSize:11.5, padding:'5px 10px', borderRadius:20, cursor:'pointer',
    background:'rgba(110,231,183,0.08)', color:'#86EFAC', fontFamily:'inherit',
    border:'1px solid rgba(110,231,183,0.2)', transition:'all 0.18s', lineHeight:1.4,
  },
  inputArea: {
    padding:'12px 12px 10px',
    borderTop:'1px solid rgba(255,255,255,0.08)',
    background:'rgba(0,0,0,0.15)',
  },
  inputRow: {
    display:'flex', gap:8, alignItems:'flex-end',
  },
  input: {
    flex:1, padding:'10px 14px', borderRadius:12,
    border:'1.5px solid rgba(110,231,183,0.2)',
    fontSize:13.5, background:'rgba(255,255,255,0.07)',
    color:'#fff', fontFamily:'inherit', resize:'none',
    lineHeight:1.5, transition:'all 0.2s',
    maxHeight:100,
  },
  sendBtn: {
    width:40, height:40, borderRadius:12, flexShrink:0,
    background:'linear-gradient(135deg,#059669,#047857)',
    color:'#fff', border:'none', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 2px 8px rgba(5,150,105,0.4)', transition:'all 0.18s',
  },
};