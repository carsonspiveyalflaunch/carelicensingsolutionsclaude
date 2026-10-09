"use client";
import React, { useState, useEffect, useRef } from "react";
import { useCart } from "./cart-context";
import dynamic from "next/dynamic";
const CartModal = dynamic(() => import("./CartModal"), { ssr: false });
const SearchDropdown = dynamic(() => import("./SearchDropdown"), {
  ssr: false,
});
const AuthModal = dynamic(() => import("./AuthModal"), { ssr: false });
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingCart, User, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import LogoImg from "@/public/assets/images/logo-dark-bg.png";
import { useAuth } from "./AuthContext";
import { useToast } from "./SimpleToast";
import { useAuthModal } from "./AuthModalContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/states", label: "By State" },
  { href: "https://carelicensingsolutions.com/blogs/", label: "Guides" },
  { href: "/course", label: "Course" },
  { href: "/about", label: "About" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { items } = useCart();
  const { authModalOpen, openAuthModal, closeAuthModal } = useAuthModal();
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && isAdmin && pathname === "/dashboard") {
      router.replace("/admin");
    }

    if (user && !isAdmin && pathname === "/admin") {
      router.replace("/dashboard");
    }
  }, [user, isAdmin, pathname, router]);

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    setMobileProfileOpen(false);
    setMenuOpen(false);

    try {
      const { error } = await signOut();

      if (error) {
        throw error;
      }

      toast.show("Signed out successfully");
      router.push("/");
    } catch (err: any) {
      toast.show(err?.message || "Error signing out");
    }
  };

  const linkClass =
    "relative w-fit text-gray-700 hover:text-green-700 transition after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-green-700 after:transition-all hover:after:w-full";

  return (
    <>
      <header className="w-full bg-white/85 backdrop-blur-sm shadow-lg px-4 md:px-8 py-3 z-50 fixed top-0 left-0">
        <div className="max-w-7xl mx-auto  flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src={LogoImg}
              alt="Logo"
              className="w-8 h-8 md:w-10 md:h-10 rounded"
            />
            <span className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 whitespace-nowrap">
              Care Licensing{" "}
              <span className="text-green-700 font-bold">Solutions</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {navLinks.map((link, idx) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              const isExternal = link.href.startsWith("http");
              return (
                <a
                  key={idx}
                  href={link.href}
                  {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                  className={`${linkClass} ${
                    isActive ? "text-green-700 font-semibold after:w-full" : ""
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded hover:bg-gray-100 transition cursor-pointer"
            >
              <Search size={20} className="text-black" />
            </button>

            <div className="relative">
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-100 transition cursor-pointer"
                onClick={() => setCartOpen((v) => !v)}
              >
                <ShoppingCart size={20} className="text-black" />
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Auth Buttons */}
            {user ? (
              <>
                <div className="relative" ref={profileMenuRef} onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
                  >
                    <User size={18} className="text-slate-700" />
                    <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-900">
                      {profile?.first_name || user.user_metadata?.first_name || user.email}
                    </span>
                    <ChevronDown size={16} className="text-slate-500" />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                      <div className="px-4 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">Signed in as</p>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {profile?.first_name || user.user_metadata?.first_name || user.email}
                        </p>
                      </div>
                      <div className="flex flex-col p-2 gap-2">
                        {profile?.is_admin ? (
                          <Link
                            href="/admin"
                            className="rounded-2xl px-3 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard"
                            className="rounded-2xl px-3 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="cursor-pointer rounded-2xl px-3 py-3 text-sm font-medium text-rose-600 hover:bg-slate-100 transition text-left"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="bg-green-700 cursor-pointer hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Sign In
              </button>
            )}

            <a
              href="/states"
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu / Close Button */}
          <button
            type="button"
            className="lg:hidden p-2 relative z-50"
            onClick={() => {
              setMenuOpen((open) => {
                if (open) setMobileProfileOpen(false);
                return !open;
              });
            }}
          >
            {menuOpen ? (
              <X size={26} className="text-black" />
            ) : (
              <Menu size={26} className="text-black" />
            )}
          </button>

          {/* Mobile Sidebar Menu */}
          <div
            className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 z-40 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-6 flex flex-col gap-6 mt-16 bg-white">
              {navLinks.map((link, idx) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                const isExternal = link.href.startsWith("http");
                return (
                  <a
                    key={idx}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                    className={`${linkClass} text-lg ${
                      isActive
                        ? "text-green-700 font-semibold after:w-full"
                        : ""
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}

              {user && (
                <>
                  {profile?.is_admin ? (
                    <a
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="text-lg font-semibold text-slate-900 hover:text-slate-700"
                    >
                      Admin Dashboard
                    </a>
                  ) : (
                    <a
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="text-lg font-semibold text-green-700 hover:text-green-800"
                    >
                      Dashboard
                    </a>
                  )}
                </>
              )}

              {/* Mobile Search */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 w-full p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  <Search size={18} className="text-gray-400" />
                  <span className="text-gray-600">Search...</span>
                </button>
              </div>

              {/* Mobile Cart and Auth */}
              <div className="flex items-start justify-between mt-4">
                <div className="relative">
                  <button
                    type="button"
                    className="p-2 rounded hover:bg-gray-100 transition"
                    onClick={() => setCartOpen((v) => !v)}
                  >
                    <ShoppingCart size={22} className="text-black" />
                  </button>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>

                {user ? (
                <div className="w-full" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setMobileProfileOpen((open) => !open)}
                    className="cursor-pointer flex w-full items-center justify-between gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-900">
                      <User size={18} className="text-slate-600" />
                      <span className="truncate">
                        {profile?.first_name || user.user_metadata?.first_name || user.email}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition ${mobileProfileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {mobileProfileOpen && (
                    <div className="mt-3 space-y-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-lg">
                      {profile?.is_admin ? (
                        <Link
                          href="/admin"
                          onClick={() => {
                            setMenuOpen(false);
                            setMobileProfileOpen(false);
                          }}
                          className="block rounded-2xl px-3 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
                        >
                          Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          onClick={() => {
                            setMenuOpen(false);
                            setMobileProfileOpen(false);
                          }}
                          className="block rounded-2xl px-3 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handleSignOut}
                        className="cursor-pointer w-full rounded-2xl px-3 py-3 text-left text-sm font-medium text-rose-600 hover:bg-slate-100 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal();
                    setMenuOpen(false);
                  }}
                  className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
                >
                  Sign In
                </button>
              )}
              </div>

              <a
                href="/states"
                onClick={() => setMenuOpen(false)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition text-center mt-4"
              >
                Get Started
              </a>
            </div>
          </div>

          {/* Overlay */}
          {menuOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30"
              onClick={() => {
                setMenuOpen(false);
                setMobileProfileOpen(false);
              }}
            />
          )}

          {/* Cart Modal */}
          {cartOpen && (
            <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
          )}

          {/* Search Dropdown (Global) */}
          <SearchDropdown
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onNavigate={(url) => {
              router.push(url);
              setMenuOpen(false); // Close mobile menu if open
              setMobileProfileOpen(false);
            }}
          />
        </div>
      </header>
      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />
    </>
  );
};

export default Header;
