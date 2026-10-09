"use client";
import { CartProvider } from "./cart-context";
import React from "react";
import { ToastProvider } from "./SimpleToast";
import dynamic from "next/dynamic";
import { AuthModalProvider } from "./AuthModalContext";
import { PendingPurchaseProvider } from "./PendingPurchaseContext";

const AuthProvider = dynamic(() => import("./AuthContext").then(mod => ({ default: mod.AuthProvider })), {
  ssr: false,
  loading: () => null
});

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
