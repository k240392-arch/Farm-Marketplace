// components/Navbar.jsx — Editorial top navigation
// Author: CPRO306 Capstone Project | Date: 2026
//
// v2 — Refined leaf+berry logo mark, larger wordmark with proper letter-spacing,
// links to dedicated /farmers and /seasonal pages.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// ── Palette (kept in sync with Home.jsx) ──────────────────────
const C = {
  forest:    '#253528',
  moss:      '#3D5B45',
  sage:      '#A7BFA5',
  cream:     '#F6F3EE',
  boneWhite: '#FBFAF8',
  charcoal:  '#1C1F1D',
  mistGray:  '#E7E5E0',
  white:     '#FFFFFF',
  muted:     '#6B7280',
};

const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, serif";

// ── Inline SVG icons (lucide-style) ───────────────────────────
const I = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const SearchIcon = () => <I size={16}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></I>;
const HeartIcon  = () => <I><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></I>;
const UserIcon   = () => <I><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I>;
const CartIcon   = () => <I><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></I>;

// Refined logo mark — single elegant leaf in a cream circle with accent berry
const LogoMark = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18.5" stroke={C.forest} strokeWidth="1.3" fill={C.cream}/>
    <path d="M20 9 C 13 12, 11 19, 14 27 C 17 25, 21 22, 22 17 C 22 23, 20 27, 17 30 C 22 31, 27 27, 28 21 C 29 15, 25 10, 20 9 Z"
          fill={C.forest}/>
    <path d="M19 12 C 18 17, 17 23, 16 28" stroke={C.cream} strokeWidth="0.9" strokeLinecap="round"/>
    <circle cx="26" cy="14" r="1.6" fill={C.moss}/>
  </svg>
);

// ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate         = useNavigate();

  const [search,   setSearch]   = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { setMenuOpen(false); logout(); navigate('/'); };
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/listings?search=${encodeURIComponent(search.trim())}`);
    else navigate('/listings');
  };

  const dashboardUrl = user?.role === 'farmer' ? '/dashboard/farmer'
                     : user?.role === 'admin'  ? '/dashboard/admin'
                     : '/dashboard/buyer';

  const accountClick = (e) => {
    if (!user) { e.preventDefault(); navigate('/login'); }
  };

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <Link to="/" style={S.logoLink}>
          <LogoMark />
          <span style={S.logoText}>FarmMarket</span>
        </Link>

        <div style={S.centerNav} className="fm-center-nav">
          <NavLink to="/listings"   >Shop</NavLink>
          <NavLink to="/farmers"    >Our Farmers</NavLink>
          <NavLink to="/seasonal"   >Seasonal</NavLink>
          <NavLink to="/about"      >About</NavLink>
        </div>

        <div style={S.right}>
          <form onSubmit={handleSearch} style={S.searchForm} className="fm-search">
            <span style={{ color: C.moss, display: 'flex' }}><SearchIcon/></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fresh produce..."
              style={S.searchInput}
              aria-label="Search produce"
            />
          </form>

          <Link
            to="/wishlist"
            style={{ ...S.iconBtn, position: 'relative' }}
            title="Wishlist"
            aria-label="Wishlist">
            <HeartIcon/>
            {wishlistCount > 0 && (
              <span style={S.badge}>{wishlistCount > 99 ? '99+' : wishlistCount}</span>
            )}
          </Link>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => user && setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}>
            <Link
              to={user ? dashboardUrl : '/login'}
              onClick={accountClick}
              style={S.iconBtn}
              title={user ? 'My account' : 'Sign in'}
              aria-label={user ? 'My account' : 'Sign in'}>
              <UserIcon/>
            </Link>

            {user && menuOpen && (
              <div style={S.menu} role="menu">
                <div style={S.menuHeader}>
                  <div style={S.menuAvatar}>
                    {(user.full_name || user.name || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={S.menuName}>Hi, {(user.full_name || user.name || '').split(' ')[0]}</div>
                    <div style={{ ...S.menuRoleBadge, ...roleBadgeColor(user.role) }}>
                      {user.role}
                    </div>
                  </div>
                </div>
                <div style={S.menuDivider}/>
                <Link to={dashboardUrl}  style={S.menuItem} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                {user.role === 'buyer' && (
                  <Link to="/my-orders" style={S.menuItem} onClick={() => setMenuOpen(false)}>My Orders</Link>
                )}
                <Link to="/listings"     style={S.menuItem} onClick={() => setMenuOpen(false)}>Browse Produce</Link>
                <div style={S.menuDivider}/>
                <button onClick={handleLogout} style={{ ...S.menuItem, ...S.menuLogout }}>Logout</button>
              </div>
            )}
          </div>

          <Link to="/cart" style={S.cartBtn} title="Cart" aria-label={`Cart (${cartCount} items)`}>
            <CartIcon/>
            {cartCount > 0 && <span style={S.badge}>{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>

          {!user && (
            <div style={S.guestBtns} className="fm-guest-btns">
              <Link to="/login"    style={S.ghostBtn}>Sign in</Link>
              <Link to="/register" state={{ from: 'join' }} style={S.primaryBtn}>Join</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .fm-search input { width: 160px !important; }
        }
        @media (max-width: 880px) {
          .fm-center-nav { display: none !important; }
        }
        @media (max-width: 720px) {
          .fm-search { display: none !important; }
          .fm-guest-btns a:first-child { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, hash, children }) {
  const Comp = hash ? 'a' : Link;
  const props = hash ? { href: to } : { to };
  return (
    <Comp
      {...props}
      style={S.centerLink}
      onMouseEnter={(e) => { e.target.style.color = C.forest; }}
      onMouseLeave={(e) => { e.target.style.color = C.charcoal; }}>
      {children}
    </Comp>
  );
}

function roleBadgeColor(role) {
  if (role === 'farmer') return { background: 'rgba(167,191,165,0.25)', color: C.forest };
  if (role === 'admin')  return { background: '#FCE4EC',                color: '#880E4F' };
  return                          { background: '#E3F2FD',              color: '#0D47A1' };
}

const S = {
  nav: {
    position:     'sticky', top: 0, zIndex: 100,
    background:   C.boneWhite,
    borderBottom: `1px solid ${C.mistGray}`,
    fontFamily:   "'Inter', system-ui, sans-serif",
  },
  inner: {
    maxWidth: 1400, margin: '0 auto', padding: '0 32px', height: 76,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
  },
  logoLink: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: C.charcoal, flexShrink: 0 },
  logoText: { fontFamily: SERIF, fontSize: 30, fontWeight: 400, color: C.charcoal, letterSpacing: '-0.015em', lineHeight: 1 },
  centerNav: { display: 'flex', alignItems: 'center', gap: 38 },
  centerLink: { color: C.charcoal, textDecoration: 'none', fontSize: 15, fontWeight: 400, letterSpacing: '0.005em', transition: 'color .2s ease' },
  right: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  searchForm: { display: 'flex', alignItems: 'center', gap: 8, background: C.cream, border: `1px solid ${C.mistGray}`, borderRadius: 999, padding: '8px 16px', marginRight: 4 },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, color: C.charcoal, width: 220, padding: 0 },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', color: C.charcoal, cursor: 'pointer', textDecoration: 'none', transition: 'background .2s ease, color .2s ease' },
  cartBtn: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'transparent', color: C.charcoal, textDecoration: 'none', transition: 'background .2s ease' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, padding: '0 5px', background: C.forest, color: C.boneWhite, fontSize: 10, fontWeight: 700, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', border: `2px solid ${C.boneWhite}` },
  guestBtns: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 },
  ghostBtn: { padding: '8px 16px', background: 'transparent', color: C.charcoal, fontSize: 14, fontWeight: 500, textDecoration: 'none', borderRadius: 999, border: '1px solid transparent' },
  primaryBtn: { padding: '9px 20px', background: C.forest, color: C.boneWhite, fontSize: 14, fontWeight: 500, textDecoration: 'none', borderRadius: 999, border: 'none' },
  menu: { position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 240, background: C.white, borderRadius: 14, border: `1px solid ${C.mistGray}`, boxShadow: '0 12px 32px -8px rgba(37,53,40,0.18)', padding: 8, zIndex: 200 },
  menuHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' },
  menuAvatar: { width: 38, height: 38, borderRadius: '50%', background: C.forest, color: C.boneWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  menuName: { fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  menuRoleBadge: { display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  menuDivider: { height: 1, background: C.mistGray, margin: '6px 0' },
  menuItem: { display: 'block', width: '100%', padding: '10px 12px', fontSize: 14, color: C.charcoal, textDecoration: 'none', borderRadius: 8, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 400 },
  menuLogout: { color: '#C62828', fontWeight: 500 },
};