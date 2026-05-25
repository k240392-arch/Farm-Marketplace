// App.jsx — Farm Produce Marketplace routing
// Author: CPRO306 Capstone Project | Date: 2026
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar            from './components/Navbar';
import Footer            from './components/Footer';
import ChatBot           from './components/ChatBot';
import Home              from './pages/Home';
import Listings          from './pages/Listings';
import ProductDetail     from './pages/ProductDetail';
import ProductPage       from './pages/ProductPage';
import Farmers           from './pages/Farmers';
import FarmerStorefront  from './pages/FarmerStorefront';
import Seasonal          from './pages/Seasonal';
import About             from './pages/About';
import Help              from './pages/Help';
import Wishlist          from './pages/Wishlist';
import Login             from './pages/Login';
import Register          from './pages/Register';
import AdminLogin        from './pages/AdminLogin';
import Cart              from './pages/Cart';
import Checkout          from './pages/Checkout';
import OrderSuccess      from './pages/OrderSuccess';
import OrderTracking     from './pages/OrderTracking';
import MyOrders          from './pages/MyOrders';
import FarmerDashboard   from './pages/FarmerDashboard';
import AdminDashboard    from './pages/AdminDashboard';
import BuyerDashboard    from './pages/BuyerDashboard';
import OAuthSuccess      from './pages/OAuthSuccess';
import SecurityDashboard from './pages/SecurityDashboard';
import Terms             from './pages/Terms';
import Privacy           from './pages/Privacy';
import CookiePolicy      from './pages/CookiePolicy';
import CookieConsent     from './components/CookieConsent';
import './index.css';
import './responsive.css';
import { ThemeProvider } from './context/ThemeContext';

// ── Routes where the global Navbar is hidden (page has its own full-page layout) ──
// NOTE: '/' and '/home' are NOT in this list — the home page uses the global Navbar.
const FULL_PAGE_ROUTES = [
  '/login',
  '/register',
  '/admin/login',
  '/oauth-success',
  '/dashboard/farmer',
  '/dashboard/buyer',
  '/dashboard/admin',
  '/dashboard/security',
];

// ── Routes where ChatBot is hidden ───────────────────────────
const HIDE_CHATBOT_ROUTES = [
  '/admin/login',
  '/oauth-success',
  '/dashboard/farmer',
  '/dashboard/buyer',
  '/dashboard/admin',
  '/dashboard/security',
];

// ── Private route guard ───────────────────────────────────────
function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ width:40, height:40, border:'4px solid #E5E7EB', borderTopColor:'#059669', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

// ── Public route — redirect logged-in users ───────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'farmer') return <Navigate to="/dashboard/farmer" replace />;
    if (user.role === 'admin')  return <Navigate to="/dashboard/admin"  replace />;
    return <Navigate to="/dashboard/buyer" replace />;
  }
  return children;
}

// ── Navbar — reactive to route changes ───────────────────────
function NavbarConditional() {
  const { pathname } = useLocation();
  const hide = FULL_PAGE_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (hide) return null;
  return <Navbar />;
}

// ── Footer — same hide-logic as Navbar (no footer on dashboards/login) ──
function FooterConditional() {
  const { pathname } = useLocation();
  const hide = FULL_PAGE_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (hide) return null;
  return <Footer />;
}

// ── ChatBot — show on public pages only ──────────────────────
function ChatBotConditional() {
  const { pathname } = useLocation();
  const hide = HIDE_CHATBOT_ROUTES.some(p => pathname.startsWith(p));
  if (hide) return null;
  return <ChatBot />;
}

// ── All routes ────────────────────────────────────────────────
function AppRoutes() {
  return (
    <BrowserRouter>
      <NavbarConditional />
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/home"               element={<Navigate to="/" replace />} />
        <Route path="/listings"           element={<Listings />} />
        <Route path="/listings/:id"       element={<ProductDetail />} />
        <Route path="/products/:slug"     element={<ProductPage />} />
        <Route path="/farmers"            element={<Farmers />} />
        <Route path="/farmers/:id"        element={<FarmerStorefront />} />
        <Route path="/seasonal"           element={<Seasonal />} />
        <Route path="/about"              element={<About />} />
        <Route path="/help"               element={<Help />} />
        <Route path="/wishlist"           element={<Wishlist />} />
        <Route path="/login"              element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"           element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/admin/login"        element={<AdminLogin />} />
        <Route path="/oauth-success"      element={<OAuthSuccess />} />
        <Route path="/cart"               element={<Cart />} />
        <Route path="/checkout"           element={<Checkout />} />
        <Route path="/order-success/:id"  element={<OrderSuccess />} />
        <Route path="/orders/:id/track"   element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
        <Route path="/my-orders"          element={<PrivateRoute><MyOrders /></PrivateRoute>} />
        <Route path="/dashboard/farmer"   element={<PrivateRoute role="farmer"><FarmerDashboard /></PrivateRoute>} />
        <Route path="/dashboard/buyer"    element={<PrivateRoute role="buyer"><BuyerDashboard /></PrivateRoute>} />
        <Route path="/dashboard/admin"    element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/dashboard/security" element={<PrivateRoute role="admin"><SecurityDashboard /></PrivateRoute>} />
        <Route path="/terms"              element={<Terms />} />
        <Route path="/privacy"            element={<Privacy />} />
        <Route path="/cookie-policy"      element={<CookiePolicy />} />
        <Route path="*" element={
          <div style={{ textAlign:'center', padding:80 }}>
            <p style={{ fontSize:48 }}>😕</p>
            <h2 style={{ fontSize:28, marginBottom:16 }}>Page not found</h2>
            <a href="/" style={{ background:'#059669', color:'#fff', padding:'12px 24px', borderRadius:10, textDecoration:'none', fontWeight:700 }}>Go Home</a>
          </div>
        }/>
      </Routes>
      <FooterConditional />
      <ChatBotConditional />
      <CookieConsent />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}