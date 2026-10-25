"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { trackBeginCheckout } from "@/lib/gads";

type Props = {
  productSlug: string;
  name: string;
  price: number;
  discountCode?: string;
  cancelPath: string;
  label: string;
};

// Sends the buyer straight to Stripe's hosted checkout: no cart, no account first.
// Price is resolved server-side from the products table; the client value is display-only.
export default function BuyButton({ productSlug, name, price, discountCode, cancelPath, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buy = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ product_slug: productSlug, name, price, quantity: 1 }],
          discountCode: discountCode || undefined,
          customerInfo: {},
          cancelUrl: `${window.location.origin}${cancelPath}`,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Checkout could not start");
      trackBeginCheckout(price);
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout could not start");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        {loading ? "Opening secure checkout…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}. Please try again.</p>}
    </div>
  );
}
