"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/(store)/context/AuthContext";
import { useCart } from "@/app/(store)/context/CartContext";
import ProfileMenu from "@/app/(store)/components/ProfileMenu";

export default function Navbar() {
  const pathname = usePathname();
  const { status, isLoggedIn } = useAuth();
  const { setIsCartOpen, totalItems } = useCart();

  const navLinks = [
    { name: "Catalog", href: "/catalog" },
    { name: "New Drop", href: "/new-drop" },
    { name: "Collections", href: "/collections" },
    { name: "About", href: "/about" },
  ];

  const loginHref =
    pathname && pathname !== "/login" && pathname !== "/register"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md font-[Inter,sans-serif]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <Link
          href="/catalog"
          className="text-lg font-black tracking-tighter font-[Montserrat,sans-serif] text-neutral-950"
        >
          urban<span className="text-emerald-600">.</span>kamen
        </Link>

        {/* Center Editorial Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
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
        <div className="flex items-center space-x-3">
          {status === "loading" ? (
            <div
              aria-hidden="true"
              className="h-9 w-24 border border-neutral-200 bg-neutral-100 animate-pulse"
            />
          ) : isLoggedIn ? (
            <ProfileMenu />
          ) : (
            <Link
              href={loginHref}
              className="border border-neutral-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-900 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all duration-200"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center space-x-2.5 bg-neutral-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors duration-200 cursor-pointer"
          >
            <span>Bag</span>
            <span className="font-mono text-[11px] text-emerald-400">
              [{String(totalItems).padStart(2, "0")}]
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
