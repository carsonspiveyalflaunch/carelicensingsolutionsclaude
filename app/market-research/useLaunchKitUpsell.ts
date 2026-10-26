"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

export function useLaunchKitUpsell(sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/funnel/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "The Launch Kit could not be added.");
      if (body.redirect || (body.alreadyOwned && body.redirect)) {
        window.location.href = body.redirect;
        return;
      }
      if (body.fallback && body.url) {
        window.location.href = body.url;
        return;
      }
      if (body.expired && body.launchKitUrl) {
        window.location.href = body.launchKitUrl;
        return;
      }
      if (body.requiresAction && body.clientSecret && body.paymentIntentId) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key) throw new Error("This card needs a second confirmation. Refresh and try again.");
        const stripe = await loadStripe(key);
        if (!stripe) throw new Error("Card confirmation could not start.");
        const confirmed = await stripe.confirmCardPayment(body.clientSecret);
        if (confirmed.error) throw new Error(confirmed.error.message || "Card confirmation failed.");
        const done = await fetch("/api/funnel/upsell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, paymentIntentId: body.paymentIntentId }),
        });
        const doneBody = await done.json().catch(() => ({}));
        if (!done.ok || !doneBody.redirect) throw new Error(doneBody.error || "The Launch Kit payment did not finish.");
        window.location.href = doneBody.redirect;
        return;
      }
      throw new Error("The Launch Kit could not be added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The Launch Kit could not be added.");
      setLoading(false);
    }
  }

  return { accept, loading, error };
}
