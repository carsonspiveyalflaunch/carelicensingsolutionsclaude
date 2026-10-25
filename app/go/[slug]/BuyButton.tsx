"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { trackBeginCheckout } from "@/lib/gads";
import { cancelUrlWithTracking, isTrustedCatalogName, successUrlWithTracking } from "@/lib/tracking-params";

type Props = {
  productSlug: string;
  productId?: string;
  name: string;
  price: number;
  discountCode?: string;
  cancelPath: string;
  label: string;
};

// Sends the buyer straight to Stripe's hosted checkout: no cart, no account first.
// Price is resolved server-side from the products table; the client value is display-only.
// The API also replaces a bad client name. This button still refuses a blank or "x"
// name so checkout never starts for a row that is not a real catalog product.
export default function BuyButton({ productSlug, productId, name, price, discountCode, cancelPath, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buy = async () => {
    setLoading(true);
    setError("");
    const catalogName = isTrustedCatalogName(name) ? name.trim() : "";
    if (!productSlug || !catalogName) {
      setError("This product isn't available right now");
      setLoading(false);
      return;
    }
    try {
      const successUrl = successUrlWithTracking(window.location.origin, window.location.search);
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            product_slug: productSlug,
            product_id: productId || undefined,
            name: catalogName,
            price,
            quantity: 1,
          }],
          discountCode: discountCode || undefined,
          customerInfo: {},
          cancelUrl: cancelUrlWithTracking(window.location.origin, cancelPath, window.location.search),
          successUrl,
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
