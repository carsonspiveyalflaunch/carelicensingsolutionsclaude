"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/SimpleToast';

interface AdminLoginClientProps {
  unauthorized?: boolean;
}

export default function AdminLoginClient({ unauthorized }: AdminLoginClientProps) {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        throw error;
      }
      toast.show('Signed in successfully. Redirecting...');
      // Small delay to allow auth state to update
      setTimeout(() => {
        router.push('/admin');
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
      toast.show(err?.message || 'Unable to sign in.');
      setLoading(false);
    }
  };

  /* Commented out entire component
  return (
    <div className="min-h-screen bg-[#f5f8f6] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-4xl border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,57,34,0.12)]">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Admin access</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-950">Sign in with admin credentials</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {unauthorized
              ? 'Your current account is not authorized for admin access. Sign in with an admin account to continue.'
              : 'Please use your admin credentials to access the admin console.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Continue to Admin'}
          </button>
        </form>

        <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
          <p>
            Only accounts with admin privileges can access this area. If you do not have access, return to the public site and continue from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
  */
  
  return null;
}
