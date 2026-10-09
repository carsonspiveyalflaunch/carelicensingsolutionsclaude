"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../components/AuthContext';
import { useAuthModal } from '../components/AuthModalContext';
import AuthModal from '../components/AuthModal';
import { useCart } from '../components/cart-context';

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  const { authModalOpen, openAuthModal, closeAuthModal } = useAuthModal();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Verifying your purchase...');
  const [error, setError] = useState<string | null>(null);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get session_id from searchParams first
    const paramSessionId = searchParams.get('session_id');
    if (paramSessionId) {
      setSessionId(paramSessionId);
      return;
    }

    // Fallback: parse from window.location if searchParams is empty
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSessionId = params.get('session_id');
      if (urlSessionId) {
        setSessionId(urlSessionId);
      }
    }
  }, [searchParams]);

  const maxRetries = 3;
  const retryDelayMs = 2000;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    // Wait for sessionId to be extracted from URL
    if (sessionId === null) {
      return;
    }

    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const verifyPurchase = async () => {
      if (cancelled) return;

      setLoading(true);
      setError(null);
      setStatusMessage('Verifying your purchase...');

      let retrying = false;

      try {
        const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`, {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await response.json();

        if (response.ok) {
          // Purchase is confirmed, so clear any remaining cart state.
          clearCart();
          setPurchaseData(data);
          // Show auth prompt if user is not authenticated (guest checkout)
          if (!user) {
            setShowAuthPrompt(true);
          }
          setLoading(false);
          return;
        }

        if (response.status === 404 && retryCount < maxRetries) {
          retrying = true;
          const nextAttempt = retryCount + 1;
          setStatusMessage(`Purchase record not yet available. Retrying ${nextAttempt}/${maxRetries}...`);
          retryTimeout = setTimeout(() => {
            if (!cancelled) setRetryCount(nextAttempt);
          }, retryDelayMs);
          return;
        }

        setError(data.error || 'Failed to verify purchase');
      } catch (err: any) {
        setError(err.message || 'Failed to verify purchase');
      } finally {
        if (!cancelled && !retrying && !purchaseData) {
          setLoading(false);
        }
      }
    };

    verifyPurchase();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [sessionId, user, session, authLoading, retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold mb-2 text-black">{statusMessage}</h2>
          <p className="text-gray-600">Please wait while we confirm your order.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/shop"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <CheckCircle className="text-green-600 w-16 h-16 mx-auto mb-6" />

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for your purchase. Your order has been confirmed and you now have access to your products.
          </p>

          {purchaseData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4 text-black">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-gray-800">{purchaseData.purchase_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-800">${purchaseData.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-800">{new Date(purchaseData.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {showAuthPrompt && !user && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">Create Your Account</h3>
              <p className="text-blue-800 mb-4">
                Sign up now to access your purchased products and unlock exclusive dashboard features!
              </p>
              <button
                onClick={() => openAuthModal()}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Create Account / Sign In
              </button>
              <p className="text-sm text-gray-600 mt-4">
                You can also browse our shop or contact support if you have any questions.
              </p>
            </div>
          )}

          <div className="space-y-4 flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0">
            <Link
              href="/shop"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Continue Shopping
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                View Dashboard
              </Link>
            )}
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              A confirmation email has been sent to your email address.
              If you have any questions, please contact our support team.
            </p>
          </div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
    </>
  );
}