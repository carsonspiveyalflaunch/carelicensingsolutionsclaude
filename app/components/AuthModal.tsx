"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useToast } from './SimpleToast';
import Swal from 'sweetalert2';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { signIn, signUp } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;

        // Show success alert
        await Swal.fire({
          title: 'Sign In Successfully',
          text: 'You can now add bundles to your cart and proceed with checkout.',
          icon: 'success',
          confirmButtonText: 'Continue',
          confirmButtonColor: '#417a5a',
          background: '#ffffff',
          color: '#0f172a',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        // Close modal - useBuyNow hook will handle pending items automatically
        onClose();
        
        // Check if there's a pending purchase item in localStorage
        // If so, let useBuyNow hook handle the redirect to checkout
        let destination = pathname || '/dashboard';
        try {
          const pendingItemStr = localStorage.getItem('pending-purchase-item');
          if (pendingItemStr) {
            // Pending item exists - don't redirect here, let useBuyNow handle it
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Failed to check pending item:', err);
        }

        // No pending item - redirect normally
        // Check pathname for admin/dashboard redirects
        if (pathname?.startsWith('/admin')) {
          destination = '/admin';
        } else if (pathname?.startsWith('/dashboard')) {
          destination = '/dashboard';
        }

        // Small delay to ensure modal closes before navigation
        setTimeout(() => {
          router.replace(destination);
        }, 100);
      } else {
        // First, ask the server if this email already exists to avoid ambiguous Supabase behaviour
        try {
          const res = await fetch('/api/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const json = await res.json();
          if (json?.exists) {
            await Swal.fire({
              title: 'Account already exists',
              text: `An account already exists for ${email}. Would you like to sign in instead?`,
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'Sign In',
              cancelButtonText: 'Cancel',
              confirmButtonColor: '#417a5a',
              background: '#ffffff',
              color: '#0f172a',
            });
            setIsLogin(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          // If the check failed, continue with the signup attempt and let supabase respond.
          console.warn('Email existence check failed, continuing to signup', err);
        }

        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
        });

        if (error) {
          const msg = (error?.message || '').toString();
          const isExists = /already|registered|duplicate|exists?/i.test(msg);
          if (isExists) {
            await Swal.fire({
              title: 'Account already exists',
              text: `An account already exists for ${email}. Would you like to sign in instead?`,
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'Sign In',
              cancelButtonText: 'Cancel',
              confirmButtonColor: '#417a5a',
              background: '#ffffff',
              color: '#0f172a',
            });
            setIsLogin(true);
            setLoading(false);
            return;
          }

          throw error;
        }

        // Show success alert for signup
        await Swal.fire({
          title: 'Sign Up Successfully',
          text: 'Please check your email to confirm your account. Once confirmed, you can add bundles and proceed with checkout.',
          icon: 'success',
          confirmButtonText: 'Got It',
          confirmButtonColor: '#417a5a',
          background: '#ffffff',
          color: '#0f172a',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        onClose();
      }
    } catch (error: any) {
      toast.show(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 shadow-2xl text-white bg-green-800 hover:bg-green-900 transition-all w-8 h-8 rounded-full cursor-pointer"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-black">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-800 cursor-pointer text-white py-2 px-4 rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:text-green-800 text-sm cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        
      </div>
    </div>
  );
}