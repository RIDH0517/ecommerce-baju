"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/(store)/context/AuthContext";
import { useCart } from "@/app/(store)/context/CartContext";
import ProfileMenu from "@/app/(store)/components/ProfileMenu";

const NAV_LINKS = [
  { name: "Catalog", href: "/catalog" },
  { name: "New Drop", href: "/new-drop" },
  { name: "Collections", href: "/collections" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { status, isLoggedIn } = useAuth();
  const { setIsCartOpen, totalItems } = useCart();

  const loginHref =
    pathname && pathname !== "/login" && pathname !== "/register"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md font-[Inter,sans-serif]">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <Link
          href="/catalog"
          className="text-base sm:text-lg font-black tracking-tighter font-[Montserrat,sans-serif] text-neutral-950 whitespace-nowrap"
        >
          urban<span className="text-emerald-600">.</span>kamen
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center space-x-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-bold uppercase tracking-[0.18em] transition-colors py-1 ${
                  isActive
                    ? "text-neutral-950 border-b-2 border-neutral-950"
                    : "text-neutral-400 hover:text-neutral-950"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Profile/Login & Cart */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {status === "loading" ? (
            <div
              aria-hidden="true"
              className="h-8 sm:h-9 w-16 sm:w-20 border border-neutral-200/60 bg-neutral-100/60 animate-pulse"
            />
          ) : isLoggedIn ? (
            <ProfileMenu />
          ) : (
            <Link
              href={loginHref}
              className="border border-neutral-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-900 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all duration-200"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center space-x-1.5 sm:space-x-2.5 bg-neutral-950 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <span>Bag</span>
            <span className="font-mono text-[10px] sm:text-[11px] text-emerald-400">
              [{String(totalItems).padStart(2, "0")}]
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar (Langsung Terlihat di HP) */}
      <nav
        aria-label="Navigasi Mobile"
        className="flex md:hidden items-center gap-5 border-t border-neutral-100 bg-white/95 px-4 overflow-x-auto whitespace-nowrap no-scrollbar"
      >
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] border-b-2 transition-colors ${
                isActive
                  ? "border-neutral-950 text-neutral-950"
                  : "border-transparent text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
