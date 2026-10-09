"use client";
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useToast } from "./SimpleToast";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  type?: string;
  state?: string;
  quantity?: number;
  product_id?: string;      // Link to database product (bundle)
  product_slug?: string;    // For fetching product details
  metadata?: any;           // Full product metadata
  bundle_id?: string;       // Bundle identifier for organization
  purchased_item?: string;  // If purchasing individual item from bundle
  purchased_item_price?: number; // Price of individual item
};

type CartContextType = {
  items: CartItem[];
  loaded: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("cart-items");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [loaded, setLoaded] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const isHydrated = useRef(false);
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Hydration marker for localStorage saves
  useEffect(() => {
    isHydrated.current = true;
    setLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes after hydration
  useEffect(() => {
    if (!isHydrated.current) return;
    window.localStorage.setItem("cart-items", JSON.stringify(items));
  }, [items]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const itemId = item.id || item.name;
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        toast.show("This product is already in your cart. Only one purchase per program is allowed.");
        return prev;
      }

      const addedItem = { ...item, id: itemId, quantity: 1 };
      setLastAdded(addedItem.name);
      return [...prev, addedItem];
    });
  }
  React.useEffect(() => {
    if (lastAdded) {
      toast.show(`${lastAdded} added to cart!`);
      setLastAdded(null);
    }
  }, [lastAdded, toast]);

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, loaded, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
