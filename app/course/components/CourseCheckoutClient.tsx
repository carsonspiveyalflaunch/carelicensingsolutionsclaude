"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Check } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

const COURSE_PRICE = 697;
const COURSE_NAME = "Care Licensing Solutions Operational Success Academy";
const SKOOL_INVITE_LINK = "https://www.skool.com/carelicensingsolutions?invite=c486b98509704b52a9a0ba10e535c2ba";

export default function CourseCheckoutClient() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSkool, setCopiedSkool] = useState(false);

  const handleCopySkoolLink = async () => {
    try {
      await navigator.clipboard.writeText(SKOOL_INVITE_LINK);
      setCopiedSkool(true);
      setTimeout(() => setCopiedSkool(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleProceedToPayment = async () => {
    setIsProcessing(true);

    try {
      // Create enrollment session via API
      const response = await fetch("/api/course-enrollment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/course/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/checkout?cancelled=true`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      setIsProcessing(false);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to proceed to payment. Please try again.",
        icon: "error",
        confirmButtonColor: "#1f4d3a",
      });
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/course"
          className="flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold mb-8 transition"
        >
          <ArrowLeft size={18} />
          Back to Course
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Left Side - Course Details */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {COURSE_NAME}
              </h1>

              <p className="text-gray-600 mb-6">
                The complete 11-module system to launch and scale your care business
                with confidence. Learn from industry experts who've helped hundreds of
                businesses succeed.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-lg text-gray-900">What's Included:</h3>
                <ul className="space-y-3">
                  {[
                    "11 comprehensive video modules",
                    "Community access for networking",
                    "Resource library with templates and guides",
                    "Lifetime access to course materials",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Note:</span> You don't need to create an
                  account. Stripe will capture your email during payment, and you'll receive
                  your course access details automatically.
                </p>
              </div>
            </div>

            {/* Right Side - Order Summary */}
            <div>
              <div className="bg-gray-50 rounded-lg p-6 sticky top-20">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>

                {/* Course Item */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">{COURSE_NAME}</p>
                    <p className="text-sm text-gray-600">1x Course Access</p>
                  </div>
                  <p className="font-semibold text-gray-900">${COURSE_PRICE.toFixed(2)}</p>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center mb-3 text-gray-600">
                  <span>Subtotal:</span>
                  <span>${COURSE_PRICE.toFixed(2)}</span>
                </div>

                {/* Tax Note */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200 text-gray-600 text-sm">
                  <span>Tax (if applicable):</span>
                  <span>Calculated at checkout</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${COURSE_PRICE.toFixed(2)}
                  </span>
                </div>

                {/* Payment Method Info */}
                <div className="bg-white rounded p-3 mb-6 text-sm text-gray-600 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">Payment Method</p>
                  <p>Credit or Debit Card via Stripe</p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>🔒 Secure payment powered by Stripe</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-semibold text-gray-900 mb-1">🎓 Course Access</p>
                <p className="text-gray-600">You'll receive access immediately after payment</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">💌 Email Required</p>
                <p className="text-gray-600">We'll send your access link and course materials</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">❓ Need Help?</p>
                <p className="text-gray-600">
                  <Link href="/contact" className="text-green-700 hover:text-green-800 font-semibold">
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>No Hidden Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>Lifetime Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
