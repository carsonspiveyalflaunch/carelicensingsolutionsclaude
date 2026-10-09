"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader, FileText, Users, BookOpen, Lock, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthContext';
import { useCart } from '@/app/components/cart-context';

const SKOOL_INVITE_LINK = "https://www.skool.com/carelicensingsolutions?invite=c486b98509704b52a9a0ba10e535c2ba";

export default function CourseSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Verifying your enrollment...');
  const [error, setError] = useState<string | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [copiedSkool, setCopiedSkool] = useState(false);

  const sessionId = searchParams.get('session_id');
  const maxRetries = 3;
  const retryDelayMs = 2000;

  const handleCopySkoolLink = async () => {
    try {
      await navigator.clipboard.writeText(SKOOL_INVITE_LINK);
      setCopiedSkool(true);
      setTimeout(() => setCopiedSkool(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    // Allow access without authentication for course enrollments
    // User may or may not be logged in
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const verifyEnrollment = async () => {
      if (cancelled) return;

      setLoading(true);
      setError(null);
      setStatusMessage('Verifying your enrollment...');

      let retrying = false;

      try {
        const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`, {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });
        const data = await response.json();

        if (response.ok) {
          // Enrollment is confirmed, so clear cart after a successful checkout.
          clearCart();
          setEnrollmentData(data);
          setLoading(false);
          return;
        }

        if (response.status === 404 && retryCount < maxRetries) {
          retrying = true;
          const nextAttempt = retryCount + 1;
          setStatusMessage(`Enrollment record not yet available. Retrying ${nextAttempt}/${maxRetries}...`);
          retryTimeout = setTimeout(() => {
            if (!cancelled) setRetryCount(nextAttempt);
          }, retryDelayMs);
          return;
        }

        setError(data.error || 'Failed to verify enrollment');
      } catch (err: any) {
        setError(err.message || 'Failed to verify enrollment');
      } finally {
        if (!cancelled && !retrying && !enrollmentData) {
          setLoading(false);
        }
      }
    };

    verifyEnrollment();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [sessionId, user, session, authLoading, retryCount, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1f4d3a] to-[#0f2818] flex items-center justify-center pt-20">
        <div className="text-center px-4">
          <Loader className="animate-spin mx-auto mb-4" size={48} color="white" />
          <h2 className="text-xl font-semibold mb-2 text-white">{statusMessage}</h2>
          <p className="text-gray-300">Please wait while we set up your course access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1f4d3a] to-[#0f2818] flex items-center justify-center pt-20">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">Enrollment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/course"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Return to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f4d3a] to-[#0f2818] pt-12 pb-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-2xl md:p-8 p-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-600 w-16 h-16" />
            </div>
            <h1 className="md:text-4xl text-2xl font-bold text-gray-900 mb-4">
              Welcome to the Academy!
            </h1>
            <p className="md:text-xl text-base text-gray-600 mb-2">
              Your enrollment is complete and your access is activated.
            </p>
            <p className="text-gray-500 md:text-base text-sm">
              Check your email for the Skool community invite and course materials
            </p>
          </div>
{/* Skool Community Link */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex md:items-center md:flex-row flex-col gap-2">
              <Users className="text-green-600 w-6 h-6" />
              Join Our Skool Community (If You Haven't Already Recieved the Invite)
            </h3>
            <p className="text-gray-600 mb-4 md:text-base text-sm">
              Get exclusive access to our private community where you can network with other care licensing professionals, ask questions, and share experiences.
            </p>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-green-200">
              <a
                href={SKOOL_INVITE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-green-700 hover:text-green-800 font-medium truncate"
              >
                {SKOOL_INVITE_LINK}
              </a>
              <button
                onClick={handleCopySkoolLink}
                className="p-2 hover:bg-green-100 rounded transition flex-shrink-0"
                title={copiedSkool ? "Copied!" : "Copy link"}
              >
                {copiedSkool ? (
                  <Check size={20} className="text-green-600" />
                ) : (
                  <Copy size={20} className="text-green-600" />
                )}
              </button>
            </div>
            {copiedSkool && (
              <p className="text-sm text-green-600 mt-2">✓ Link copied to clipboard!</p>
            )}
          </div>
          {/* Order Details */}
          {enrollmentData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between md:flex-row flex-col gap-3">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-gray-800 font-semibold">{enrollmentData.purchase_id}</span>
                </div>
                <div className="flex justify-between md:flex-row flex-col gap-3">
                  <span className="text-gray-600">Enrollment Type:</span>
                  <span className="text-gray-800 font-semibold">
                    Care Licensing Solutions Operational Success Academy
                  </span>
                </div>
                <div className="flex justify-between md:flex-row flex-col gap-3">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-800 font-semibold">${(enrollmentData.amount / 100)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between md:flex-row flex-col gap-3">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-800 font-semibold">
                    {new Date(enrollmentData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between md:flex-row flex-col gap-3">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-700 font-semibold bg-green-50 px-3 py-1 rounded-full">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What You Get */}
          <div className="mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4">What You Now Have Access To:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">11 Modules</h4>
                    <p className="text-sm text-gray-600">Complete video training system</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Community</h4>
                    <p className="text-sm text-gray-600">Private Skool community access</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="text-green-600 w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Resources</h4>
                    <p className="text-sm text-gray-600">Downloadable guides and worksheets</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="text-green-600 w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Lifetime Access</h4>
                    <p className="text-sm text-gray-600">Forever access to your course</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Next Steps:</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">1.</span>
                <span>Check your email for the Skool community invite (check spam folder too)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">2.</span>
                <span>Accept the invite to join the private community</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">3.</span>
                <span>Start with Module 1: Getting Started</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-green-600 flex-shrink-0">4.</span>
                <span>Connect with other care licensing professionals</span>
              </li>
            </ol>
          </div>

          

          {/* Action Buttons */}
          <div className="space-y-3 flex flex-col sm:flex-row sm:space-x-3 sm:space-y-0">
            <Link
              href="/course"
              className="flex-1 bg-gradient-to-r from-[#1f4d3a] to-[#0f2818] hover:from-[#163d2e] hover:to-[#0a1f12] text-white font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              Return to Website
            </Link>
            {/* <Link
              href="/dashboard"
              className="flex-1 border-2 border-[#1f4d3a] text-[#1f4d3a] hover:bg-[#1f4d3a]/5 font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              Go to Dashboard
            </Link> */}
          </div>

          {/* Support Message */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p className="mb-2">
              If you don't see the Skool invite within 10 minutes, please check your spam folder. Or just simply copy the link from above.
            </p>
            <p>
              Need help? <a href="/contact" className="text-[#1f4d3a] hover:underline font-semibold">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
