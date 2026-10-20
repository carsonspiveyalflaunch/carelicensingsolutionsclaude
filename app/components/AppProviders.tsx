"use client";
import { CartProvider } from "./cart-context";
import React from "react";
import { ToastProvider } from "./SimpleToast";
import { AuthModalProvider } from "./AuthModalContext";
import { PendingPurchaseProvider } from "./PendingPurchaseContext";
// Rendered on the server too, so search engines and first paint get the real page.
// (It was client-only before, which made every page an empty shell to crawlers.)
import { AuthProvider } from "./AuthContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <AuthProvider>
        <PendingPurchaseProvider>
          <ToastProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ToastProvider>
        </PendingPurchaseProvider>
      </AuthProvider>
    </AuthModalProvider>
  );
}
