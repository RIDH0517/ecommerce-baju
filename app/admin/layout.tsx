"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/(store)/context/AuthContext";

const NAV_ITEMS = [
  { code: "01", label: "Overview", href: "/admin", match: (p: string) => p === "/admin" },
  {
    code: "02",
    label: "Products",
    href: "/admin/products",
    match: (p: string) => p.startsWith("/admin/products"),
  },
  {
    code: "03",
    label: "Orders",
    href: "/admin/orders",
    match: (p: string) => p.startsWith("/admin/orders"),
  },
  {
    code: "04",
    label: "Banners",
    href: "/admin/banners",
    match: (p: string) => p.startsWith("/admin/banners"),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-neutral-50 text-neutral-950 font-[Inter,system-ui,sans-serif] flex flex-col">
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="text-lg font-black tracking-tighter text-neutral-950 font-[Montserrat,sans-serif] whitespace-nowrap"
            >
              urban<span className="text-emerald-600">.</span>kamen
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-neutral-200" />
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              [ATELIER ADMIN]
            </span>
          </div>

          {/* Primary Desktop Nav */}
          <nav aria-label="Navigasi Admin" className="hidden md:flex items-center h-full gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-full items-center gap-2 border-b-2 px-3.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    active
                      ? "border-neutral-950 text-neutral-950"
                      : "border-transparent text-neutral-400 hover:text-neutral-950"
                  }`}
                >
                  <span className="font-mono text-[10px] text-neutral-400">{item.code}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5">
            {user && (
              <div className="hidden lg:flex flex-col items-end pr-2 border-r border-neutral-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 leading-none">
                  {user.name}
                </span>
                <span className="mt-1 font-mono text-[10px] text-neutral-400 leading-none">
                  {user.email}
                </span>
              </div>
            )}

            <Link
              href="/catalog"
              className="border border-neutral-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-800 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors whitespace-nowrap"
            >
              Storefront ↗
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="border border-neutral-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {loggingOut ? "Keluar..." : "Log Out"}
            </button>
          </div>
        </div>

        {/* Mobile Secondary Nav */}
        <nav
          aria-label="Navigasi Admin Mobile"
          className="flex md:hidden border-t border-neutral-200 overflow-x-auto bg-white px-4 no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${
                  active
                    ? "border-neutral-950 text-neutral-950"
                    : "border-transparent text-neutral-400 hover:text-neutral-950"
                }`}
              >
                <span className="font-mono text-neutral-400">{item.code}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* ── STRUCTURAL FOOTER ── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">
          <span>urban.kamen // Control Panel</span>
          <span>Live Database Mode</span>
        </div>
      </footer>
    </div>
  );
}
