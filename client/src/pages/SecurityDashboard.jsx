// pages/SecurityDashboard.jsx — Admin security monitoring
// Author: CPRO306 Capstone Project | Date: 2026
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function SecurityDashboard() {
  const [tab,     setTab]     = useState('overview');
  const [stats,   setStats]   = useState({});
  const [logs,    setLogs]    = useState([]);
  const [events,  setEvents]  = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === 'logs')    loadLogs();
    if (tab === 'events')  loadEvents();
    if (tab === 'blocked') loadBlocked();
  }, [tab]);

  const loadStats   = () => api.get('/security/stats').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  const loadLogs    = () => api.get('/security/logs?limit=50').then(r => setLogs(r.data)).catch(() => {});
  const loadEvents  = () => api.get('/security/events').then(r => setEvents(r.data)).catch(() => {});
  const loadBlocked = () => api.get('/security/blocked').then(r => setBlocked(r.data)).catch(() => {});

  const unblockIP = async (ip) => {
    try {
      await api.delete(`/security/blocked/${encodeURIComponent(ip)}`);
      setMsg(`✅ IP ${ip} unblocked successfully!`);
      loadBlocked();
      loadStats();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Error unblocking IP.'); }
  };

  const severityColor = { low: '#2E7D32', medium: '#E65100', high: '#C62828', critical: '#6A1B9A' };
  const severityBg    = { low: '#E8F5E9', medium: '#FFF9C4', high: '#FFEBEE', critical: '#F3E5F5' };
  const statusColor   = { success: '#2E7D32', failed: '#C62828', blocked: '#E65100' };
  const statusBg      = { success: '#E8F5E9', failed: '#FFEBEE', blocked: '#FFF9C4' };

  return (
    <div style={{ background: '#f8faf5', minHeight: '100vh' }}>

      {/* Header */}
      <div style={styles.header}>
        <div className="container">
          <div style={styles.headerInner}>
            <div>
              <p style={styles.eyebrow}>ADMIN — SECURITY CENTRE</p>
              <h1 style={styles.title}>🔒 Security Dashboard</h1>
              <p style={styles.sub}>Real-time activity monitoring and threat detection</p>
            </div>
            <Link to="/dashboard/admin" style={styles.backBtn}>← Back to Admin</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 20px' }}>

        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        {/* Stats Cards */}
        {!loading && (
          <div style={styles.statsGrid}>
            {[
              { icon: '✅', label: 'Total Logins',          value: stats.total_logins || 0,           color: '#2E7D32', bg: '#E8F5E9' },
              { icon: '❌', label: 'Failed Logins (24h)',   value: stats.failed_logins_24h || 0,       color: stats.failed_logins_24h > 5 ? '#C62828' : '#E65100', bg: stats.failed_logins_24h > 5 ? '#FFEBEE' : '#FFF9C4' },
              { icon: '🚫', label: 'Blocked IPs',           value: stats.blocked_ips || 0,             color: '#C62828', bg: '#FFEBEE' },
              { icon: '💉', label: 'SQL Injection Attempts',value: stats.sql_attempts || 0,             color: '#6A1B9A', bg: '#F3E5F5' },
              { icon: '⚡', label: 'XSS Attempts',          value: stats.xss_attempts || 0,            color: '#1565C0', bg: '#E3F2FD' },
              { icon: '⚠️', label: 'Critical Events (24h)', value: stats.critical_events_24h || 0,     color: '#C62828', bg: '#FFEBEE' },
            ].map((s, i) => (
              <div key={i} style={{ ...styles.statCard, background: s.bg, border: `1.5px solid ${s.color}30` }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <p style={{ ...styles.statNum, color: s.color }}>{s.value}</p>
                <p style={styles.statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Login Activity */}
        {stats.recent_logins?.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={styles.sectionTitle}>🕐 Recent Login Activity</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_logins.map((l, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={styles.td}>{l.full_name || 'Unknown'}<br/><span style={{ fontSize: 11, color: '#888' }}>{l.email}</span></td>
                    <td style={styles.td}>{l.role && <span className={`badge badge-${l.role}`}>{l.role}</span>}</td>
                    <td style={styles.td}><code style={{ fontSize: 12, background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>{l.ip_address}</code></td>
                    <td style={styles.td}><span style={{ background: statusBg[l.status], color: statusColor[l.status], padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{l.status}</span></td>
                    <td style={styles.td}><span style={{ fontSize: 12, color: '#888' }}>{new Date(l.created_at).toLocaleString('en-AU')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          {[['logs','📋 Activity Logs'],['events','⚠️ Security Events'],['blocked','🚫 Blocked IPs']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}>
              {label}
            </button>
          ))}
        </div>

        {/* Activity Logs */}
        {tab === 'logs' && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={styles.sectionTitle}>All User Activity</h3>
              <button className="btn btn-outline btn-sm" onClick={loadLogs}>🔄 Refresh</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l.log_id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={styles.td}>{l.full_name || <span style={{ color: '#aaa' }}>Guest</span>}</td>
                      <td style={styles.td}><code style={{ fontSize: 11, background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>{l.action}</code></td>
                      <td style={{ ...styles.td, maxWidth: 220 }}><span style={{ fontSize: 12, color: '#555' }}>{l.description}</span></td>
                      <td style={styles.td}><code style={{ fontSize: 11 }}>{l.ip_address}</code></td>
                      <td style={styles.td}><span style={{ background: statusBg[l.status] || '#f5f5f5', color: statusColor[l.status] || '#888', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{l.status}</span></td>
                      <td style={styles.td}><span style={{ fontSize: 11, color: '#888' }}>{new Date(l.created_at).toLocaleString('en-AU')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <p style={styles.empty}>No activity logs yet.</p>}
            </div>
          </div>
        )}

        {/* Security Events */}
        {tab === 'events' && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={styles.sectionTitle}>Security Threat Events</h3>
              <button className="btn btn-outline btn-sm" onClick={loadEvents}>🔄 Refresh</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Event Type</th>
                    <th style={styles.th}>Severity</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Blocked</th>
                    <th style={styles.th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={e.event_id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={styles.td}><code style={{ fontSize: 11, background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>{e.event_type}</code></td>
                      <td style={styles.td}><span style={{ background: severityBg[e.severity], color: severityColor[e.severity], padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{e.severity}</span></td>
                      <td style={styles.td}><code style={{ fontSize: 11 }}>{e.ip_address}</code></td>
                      <td style={{ ...styles.td, maxWidth: 240 }}><span style={{ fontSize: 12, color: '#555' }}>{e.description}</span></td>
                      <td style={styles.td}>{e.is_blocked ? <span style={{ color: '#C62828', fontWeight: 700 }}>🚫 Yes</span> : <span style={{ color: '#888' }}>No</span>}</td>
                      <td style={styles.td}><span style={{ fontSize: 11, color: '#888' }}>{new Date(e.created_at).toLocaleString('en-AU')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <p style={styles.empty}>No security events — system is clean! ✅</p>}
            </div>
          </div>
        )}

        {/* Blocked IPs */}
        {tab === 'blocked' && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={styles.sectionTitle}>Blocked IP Addresses</h3>
              <button className="btn btn-outline btn-sm" onClick={loadBlocked}>🔄 Refresh</button>
            </div>
            {blocked.length === 0 ? (
              <p style={styles.empty}>No IPs currently blocked. ✅</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Blocked At</th>
                    <th style={styles.th}>Expires</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blocked.map((b, i) => (
                    <tr key={b.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={styles.td}><code style={{ fontSize: 13, color: '#C62828' }}>{b.ip_address}</code></td>
                      <td style={styles.td}><span style={{ fontSize: 13, color: '#555' }}>{b.reason}</span></td>
                      <td style={styles.td}><span style={{ fontSize: 12, color: '#888' }}>{new Date(b.blocked_at).toLocaleString('en-AU')}</span></td>
                      <td style={styles.td}><span style={{ fontSize: 12, color: '#888' }}>{b.expires_at ? new Date(b.expires_at).toLocaleString('en-AU') : 'Permanent'}</span></td>
                      <td style={styles.td}>
                        <button className="btn btn-outline btn-sm" onClick={() => unblockIP(b.ip_address)}>
                          ✅ Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header:      { background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', padding: '28px 0', color: '#fff' },
  headerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  eyebrow:     { fontSize: 11, fontWeight: 800, color: '#69F0AE', letterSpacing: 2, marginBottom: 6 },
  title:       { fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 },
  sub:         { color: '#C8E6C9', fontSize: 14 },
  backBtn:     { color: '#A5D6A7', fontSize: 14, textDecoration: 'none', fontWeight: 600, marginTop: 4 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 },
  statCard:    { borderRadius: 14, padding: '16px 14px', textAlign: 'center' },
  statNum:     { fontSize: 28, fontWeight: 900, margin: '6px 0 3px' },
  statLabel:   { fontSize: 12, color: '#666', fontWeight: 600 },
  sectionTitle:{ fontSize: 16, fontWeight: 800, color: '#1B5E20', margin: '0 0 0' },
  tabs:        { display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #E8F5E9' },
  tab:         { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#888', borderBottom: '3px solid transparent', marginBottom: -2, transition: 'all 0.2s', borderRadius: '8px 8px 0 0' },
  tabActive:   { color: '#2E7D32', borderBottomColor: '#2E7D32', background: '#f8faf5' },
  table:       { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden' },
  thead:       { background: '#E8F5E9' },
  th:          { padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#1B5E20', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 },
  td:          { padding: '11px 14px', fontSize: 13, borderTop: '1px solid #f0f0f0', verticalAlign: 'middle' },
  empty:       { textAlign: 'center', color: '#888', padding: '32px 0', fontSize: 15 },
};