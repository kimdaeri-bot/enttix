'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  listingId: string;
  eventId: string;
  eventName: string;
  section: string;
  row: string;
  quantity: number;
  pricePerTicket: number;
  currency: string;
  ticketType: string;
  holdId?: string;
  holdExpiresAt?: number; // timestamp
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('enttix-cart');
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        // Filter out expired holds
        const now = Date.now();
        setItems(parsed.filter(i => !i.holdExpiresAt || i.holdExpiresAt > now));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('enttix-cart', JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.listingId !== item.listingId);
      return [...filtered, { ...item, holdExpiresAt: item.holdExpiresAt || Date.now() + 30 * 60 * 1000 }];
    });
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems(prev => prev.filter(i => i.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalPrice = items.reduce((sum, i) => sum + i.pricePerTicket * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalPrice, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
