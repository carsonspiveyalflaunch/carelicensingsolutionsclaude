"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type PendingPurchaseItem = {
  id: string;
  name: string;
  price: number;
  type?: string;
  state?: string;
  quantity?: number;
};

type PendingPurchaseContextType = {
  pendingItem: PendingPurchaseItem | null;
  setPendingItem: (item: PendingPurchaseItem | null) => void;
};

const PendingPurchaseContext = createContext<PendingPurchaseContextType | undefined>(undefined);

const STORAGE_KEY = "pending-purchase-item";

export function PendingPurchaseProvider({ children }: { children: React.ReactNode }) {
  const [pendingItem, setPendingItemState] = useState<PendingPurchaseItem | null>(null);
  const hasRestoredRef = useRef(false);

  // Restore from localStorage on mount (once)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("Restored pending item from localStorage:", parsed);
        setPendingItemState(parsed);
      }
    } catch (err) {
      console.warn("Failed to restore pending item from localStorage:", err);
    }
  }, []);

  // Persist to localStorage whenever pendingItem changes
  const setPendingItem = (item: PendingPurchaseItem | null) => {
    console.log("setPendingItem called with:", item);
    setPendingItemState(item);
    if (item) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
        console.log("✓ Saved pending item to localStorage:", item);
        const verify = localStorage.getItem(STORAGE_KEY);
        console.log("✓ Verified in localStorage:", verify);
      } catch (err) {
        console.warn("✗ Failed to save pending item to localStorage:", err);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.log("✓ Cleared pending item from localStorage");
      } catch (err) {
        console.warn("✗ Failed to remove pending item from localStorage:", err);
      }
    }
  };

  return (
    <PendingPurchaseContext.Provider value={{ pendingItem, setPendingItem }}>
      {children}
    </PendingPurchaseContext.Provider>
  );
}

export function usePendingPurchase() {
  const context = useContext(PendingPurchaseContext);
  if (!context) {
    throw new Error("usePendingPurchase must be used within a PendingPurchaseProvider");
  }
  return context;
}
