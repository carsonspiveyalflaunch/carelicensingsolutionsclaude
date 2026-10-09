"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./SimpleToast";

export default function CustomerHeader() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);

    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      toast.show("Signed out successfully");
      router.push("/");
    } catch (err: any) {
      toast.show(err?.message || "Unable to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-lg">
      <div className="mx-auto relative flex max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:px-8 flex-row items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Customer dashboard</p>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-950">Care Licensing Solutions</h1>
          <p className="mt-1 text-sm text-slate-500 hidden sm:block">Secure access to your purchased bundles and downloads.</p>
        </div>

        <div className="hidden sm:flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          >
            View Storefront
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800 max-w-40 truncate">
            <User className="h-4 w-4" />
            <span className="truncate">{profile?.first_name || user?.email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="cursor-pointer inline-flex items-center justify-center rounded-full bg-emerald-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{signingOut ? 'Signing out' : 'Logout'}</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setMenuOpen((s) => !s)}
            className="inline-flex items-center justify-center rounded-full bg-emerald-50 p-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {menuOpen && (
            <div className="absolute right-4 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black/5">
              <div className="flex flex-col p-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  View Storefront
                </Link>

                <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700">
                  <User className="h-4 w-4" />
                  <span className="truncate">{profile?.first_name || user?.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{signingOut ? 'Signing out' : 'Logout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
