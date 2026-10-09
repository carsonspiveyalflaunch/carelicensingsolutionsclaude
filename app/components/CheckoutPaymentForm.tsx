"use client";
import React, { useState } from "react";
import { Lock, ChevronLeft, Loader } from "lucide-react";
import { useAuth } from "../components/AuthContext";

export default function CheckoutPaymentForm({
  total,
  onSuccess,
  onBack,
  loading: parentLoading,
  items,
  discountCode,
  customerInfo,
}: {
  total: number;
  onSuccess: () => void;
  onBack: () => void;
  loading: boolean;
  items: any[];
  discountCode: string;
  customerInfo: any;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!items || items.length === 0) {
      setError('Your cart is empty. Please add a program before proceeding to payment.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          items,
          discountCode,
          customerEmail: customerInfo.email,
          customerInfo,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/checkout`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-md w-full lg:max-w-xl">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-black">Payment</h2>

      {/* Payment Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded-full">
            <Lock size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Secure Checkout</h3>
            <p className="text-sm text-gray-600">You'll be redirected to Stripe for secure payment</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
          </div>
          {discountCode && (
            <div className="flex justify-between text-green-600">
              <span>Discount Code:</span>
              <span className="font-semibold">{discountCode.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4">
          <p className="text-red-700 text-xs md:text-sm">{error}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 md:p-4 mb-6">
        <p className="text-xs text-orange-800">
          <span className="font-semibold">Disclaimer:</span> This product is an informational resource designed to assist with the licensing and startup process for care facilities. It does not constitute legal, financial, or professional compliance advice. The purchaser is solely responsible for verifying all information with applicable state and local regulatory agencies. Care Licensing Solutions makes no guarantees regarding licensing approval or business outcomes. All sales are final.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center gap-3 flex-col sm:flex-row">
        <button
          type="button"
          className="text-green-700 font-semibold cursor-pointer hover:text-green-900 flex items-center gap-1 text-sm md:text-base"
          onClick={onBack}
          disabled={loading || parentLoading}
        >
          <ChevronLeft size={16} />
          Back to Information
        </button>
        <button
          type="submit"
          onClick={handlePayment}
          className={`bg-green-800 hover:bg-green-900 text-white font-semibold py-2 md:py-3 px-4 md:px-8 rounded-lg flex items-center gap-2 transition text-sm md:text-base w-full sm:w-auto justify-center ${
            loading || parentLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading || parentLoading}
        >
          {loading ? <Loader className="animate-spin" size={16} /> : null}
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
