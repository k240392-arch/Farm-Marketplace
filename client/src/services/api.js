// services/api.js
// Axios instance with JWT auto-attach

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 (expired token) - only redirect if on a protected page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect to login if user was on a protected page
      // NOT on public pages like home, listings, etc.
      const publicPaths = ['/', '/listings', '/login', '/register', '/terms', '/privacy'];
      const isPublic = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith('/listings/'));
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;