// context/WishlistContext.jsx
// Author: CPRO306 Capstone | Date: 2026
//
// Wishlist (favorites) state shared across the app.
// Persists to localStorage so it survives refreshes and across sessions.
// Items are keyed by product_id (the catalog ID) so a single saved item works
// regardless of which farmer is currently selling it.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'farmmarket_wishlist';

export function WishlistProvider({ children }) {
  // Lazy initialiser — read once on mount
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // Sync across browser tabs (storage event fires in OTHER tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setItems(e.newValue ? JSON.parse(e.newValue) : []);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Each item shape:
  // { product_id, name, slug, image_url, default_unit, min_price, category_name, added_at }
  const addToWishlist = useCallback((product) => {
    setItems(prev => {
      if (prev.find(i => i.product_id === product.product_id)) return prev;
      return [
        ...prev,
        {
          product_id:    product.product_id,
          name:          product.name,
          slug:          product.slug,
          image_url:     product.image_url || product.default_image,
          default_unit:  product.default_unit,
          min_price:     product.min_price ?? null,
          category_name: product.category_name,
          added_at:      new Date().toISOString(),
        },
      ];
    });
  }, []);

  const removeFromWishlist = useCallback((product_id) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  }, []);

  const toggleWishlist = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.product_id);
      if (existing) {
        return prev.filter(i => i.product_id !== product.product_id);
      }
      return [
        ...prev,
        {
          product_id:    product.product_id,
          name:          product.name,
          slug:          product.slug,
          image_url:     product.image_url || product.default_image,
          default_unit:  product.default_unit,
          min_price:     product.min_price ?? null,
          category_name: product.category_name,
          added_at:      new Date().toISOString(),
        },
      ];
    });
  }, []);

  const isInWishlist = useCallback((product_id) => {
    return items.some(i => i.product_id === product_id);
  }, [items]);

  const clearWishlist = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider value={{
      items,
      count: items.length,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}