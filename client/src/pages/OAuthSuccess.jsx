// pages/OAuthSuccess.jsx — Handles OAuth redirect, role already chosen upfront
// Author: CPRO306 Capstone Project | Date: 2026
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthSuccess() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // Check for OAuth error
      if (params.get('error')) {
        setError('OAuth sign-in failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      const token = params.get('token');
      const raw   = params.get('user');

      if (!token || !raw) {
        setError('Missing login data. Redirecting...');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      const user = JSON.parse(decodeURIComponent(raw));

      // Save to localStorage FIRST — before React state update
      // This prevents PrivateRoute from redirecting during re-render
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update React context
      login(user, token);

      // Short delay lets AuthContext hydrate before navigation
      setTimeout(() => {
        if      (user.role === 'farmer') navigate('/dashboard/farmer', { replace: true });
        else if (user.role === 'admin')  navigate('/dashboard/admin',  { replace: true });
        else                             navigate('/dashboard/buyer',  { replace: true });
      }, 400);

    } catch (err) {
      console.error('OAuthSuccess error:', err);
      setError('Something went wrong. Redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, []);

  if (error) {
    return (
      <div style={S.shell}>
        <div style={S.card}>
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h2 style={{ color: '#DC2626', fontSize: 18, margin: '16px 0 8px', fontWeight: 700 }}>
            Sign-in Failed
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <div style={S.card}>
        <div style={S.spinner} />
        <h2 style={S.title}>Signing you in...</h2>
        <p style={S.sub}>Taking you to your dashboard</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

const S = {
  shell: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F9FAFB 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: '#fff', borderRadius: 20, padding: '52px 44px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid #F3F4F6',
    textAlign: 'center', minWidth: 300,
  },
  spinner: {
    width: 52, height: 52,
    border: '4px solid #E5E7EB',
    borderTopColor: '#059669',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 4,
  },
  title: { color: '#065F46', fontSize: 20, margin: '20px 0 8px', fontWeight: 800 },
  sub:   { color: '#9CA3AF', fontSize: 14, margin: 0 },
};