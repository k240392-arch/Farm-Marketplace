// context/CartContext.jsx
// Global shopping cart state with localStorage persistence.
//
// Self-healing: on mount, every cart item is checked against the live database.
// Items whose listing no longer exists (or has been deactivated) are silently
// dropped. This prevents the classic "Listing not found" checkout error that
// happens when the database is reset but the browser cart still has old IDs.

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [staleNotice, setStaleNotice] = useState(null);   // text shown briefly when items are auto-removed
  const validationRan = useRef(false);

  // ── Persist cart to localStorage whenever it changes ──
  useEffect(() => {
    try { localStorage.setItem('cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  // ── On mount: validate cart against live database ──────────────
  // Drop anything whose listing_id is missing or no longer active.
  useEffect(() => {
    if (validationRan.current) return;
    validationRan.current = true;
    if (!cart.length) return;

    (async () => {
      try {
        // Bulk-check every cart item's listing in one request per item.
        // (Could be optimised to a single endpoint, but this is fine for typical
        // cart sizes of <10 items.)
        const checks = await Promise.allSettled(
          cart.map(item => api.get(`/listings/${item.listing_id}`))
        );

        const kept = [];
        const droppedTitles = [];
        cart.forEach((item, i) => {
          const c = checks[i];
          const stillValid =
            c.status === 'fulfilled' &&
            c.value?.data?.listing_id &&
            c.value.data.is_active !== 0;
          if (stillValid) {
            kept.push(item);
          } else {
            droppedTitles.push(item.title || `Item #${item.listing_id}`);
          }
        });

        if (droppedTitles.length) {
          setCart(kept);
          setStaleNotice(
            `Removed ${droppedTitles.length} item${droppedTitles.length > 1 ? 's' : ''} from your cart that ${droppedTitles.length > 1 ? 'are' : 'is'} no longer available: ${droppedTitles.join(', ')}`
          );
          setTimeout(() => setStaleNotice(null), 8000);
        }
      } catch {
        // network blip — don't damage the cart, user can retry
      }
    })();
  }, []);

  const addToCart = (listing) => {
    setCart(prev => {
      const existing = prev.find(i => i.listing_id === listing.listing_id);
      if (existing) {
        return prev.map(i =>
          i.listing_id === listing.listing_id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...listing, qty: 1 }];
    });
  };

  const removeFromCart = (listing_id) => {
    setCart(prev => prev.filter(i => i.listing_id !== listing_id));
  };

  const updateQty = (listing_id, qty) => {
    if (qty < 1) return removeFromCart(listing_id);
    setCart(prev => prev.map(i =>
      i.listing_id === listing_id ? { ...i, qty } : i
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.price) * Number(i.qty || 0), 0);
  const cartCount = cart.reduce((sum, i) => sum + Number(i.qty || 0), 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount, staleNotice }}
    >
      {children}
      {staleNotice && (
        <div style={S.notice}>
          <span style={{ fontSize:18 }}>🧹</span>
          <span style={{ flex:1 }}>{staleNotice}</span>
          <button onClick={() => setStaleNotice(null)} style={S.noticeClose}>✕</button>
        </div>
      )}
    </CartContext.Provider>
  );
}

const S = {
  notice: {
    position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)',
    background:'#FEF3C7', border:'1.5px solid #FCD34D', color:'#92400E',
    padding:'12px 18px', borderRadius:12, boxShadow:'0 6px 24px rgba(0,0,0,0.15)',
    display:'flex', alignItems:'center', gap:10, fontSize:13, fontWeight:600,
    maxWidth:560, zIndex:9999, fontFamily:'inherit',
  },
  noticeClose: {
    background:'none', border:'none', color:'#92400E', cursor:'pointer',
    fontSize:14, fontWeight:800, padding:'2px 8px', fontFamily:'inherit',
  },
};

export const useCart = () => useContext(CartContext);