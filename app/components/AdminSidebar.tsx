"use client";

import { BarChart3, Package, Settings, Sparkles, Users, LogOut, X, UploadIcon, HardDriveUpload } from "lucide-react";

type AdminSection = "Overview" | "Bundles" | "Upload Bundle" | "Upload Individual Bundle" | "Users" | "Profile Settings";

interface SidebarItem {
  label: string;
  section: AdminSection;
  icon: typeof BarChart3;
  accent?: string;
}

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: SidebarItem[] = [
  { label: "Overview", section: "Overview", icon: BarChart3 },
  { label: "Bundles", section: "Bundles", icon: Package },
  { label: "Upload Bundle", section: "Upload Bundle", icon: HardDriveUpload, accent: "bg-emerald-500/15 text-emerald-300" },
  // { label: "Upload Individual Bundle", section: "Upload Individual Bundle", icon: UploadIcon, accent: "bg-emerald-500/15 text-emerald-300" },
  { label: "Users", section: "Users", icon: Users },
  { label: "Profile Settings", section: "Profile Settings", icon: Settings },
];

export default function AdminSidebar({
  activeSection,
  onSelectSection,
  onLogout,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-slate-800 bg-slate-950/95 shadow-2xl shadow-slate-950/25 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300 shadow-inner shadow-slate-950/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                CareLicense Admin
              </p>
              <p className="text-sm font-semibold text-white/90">
                Control center
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition hover:bg-white/10 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {/* <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Navigation
          </p> */}
          <div className="mt-4 space-y-3 pb-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.section;
              return (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.section);
                    onClose();
                  }}
                  className={`cursor-pointer flex w-full items-center justify-between gap-3 rounded-md border px-3.5 py-2 text-left text-sm font-semibold transition duration-200 ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/10 text-white shadow-[0_20px_60px_-35px_rgba(16,185,129,0.8)]"
                      : "border-transparent bg-slate-900/80 text-slate-300 hover:border-emerald-300 hover:bg-slate-900/90 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl ${
                        isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span>{item.label}</span>
                      {/* {item.accent ? (
                        <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.accent}`}>
                          New
                        </div>
                      ) : null} */}
                    </div>
                  </div>
                  {/* {isActive ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      ✓
                    </span>
                  ) : null} */}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-5 sm:px-6">
          <button
            type="button"
            onClick={onLogout}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
