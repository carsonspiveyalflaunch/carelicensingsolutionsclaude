"use client";
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useToast } from "./SimpleToast";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";
import { assetBelongsToBundle, isBundle } from "@/lib/cart-rules";

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
  // Start empty so server and browser render the same HTML; the saved cart loads right after.
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const isHydrated = useRef(false);
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Load the saved cart once in the browser.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("cart-items");
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed) && parsed.length) {
        setItems((current) => (current.length ? current : parsed));
      }
    } catch {
      // Ignore unreadable storage; the cart just starts empty.
    }
    isHydrated.current = true;
    setLoaded(true);
  }, []);

  // Save cart whenever it changes, but only after the saved cart has loaded.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem("cart-items", JSON.stringify(items));
    } catch {
      // Storage can be blocked (private mode); the cart still works for this visit.
    }
  }, [items, loaded]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const itemId = item.id || item.name;
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        toast.show("This product is already in your cart. Only one purchase per program is allowed.");
        return prev;
      }

      const addedItem = { ...item, id: itemId, quantity: 1 };

      // A single resource is already inside the bundle for the same state + program.
      const coveringBundle = prev.find((b) => assetBelongsToBundle(addedItem, b));
      if (coveringBundle) {
        toast.show(`${addedItem.name} is already included in your ${coveringBundle.name}.`);
        return prev;
      }

      // Adding the bundle replaces single resources it already includes.
      const covered = isBundle(addedItem) ? prev.filter((a) => assetBelongsToBundle(a, addedItem)) : [];
      if (covered.length) {
        toast.show(`The bundle includes ${covered.map((c) => c.name).join(", ")}, so we removed them from your cart.`);
      }
      setLastAdded(addedItem.name);
      return [...prev.filter((a) => !covered.includes(a)), addedItem];
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
