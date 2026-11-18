"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/(store)/context/AuthContext";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "UK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Simpan pathname saat menu dibuka agar otomatis tertutup saat navigasi tanpa useEffect.
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const open = openForPath !== null && openForPath === pathname;

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenForPath(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenForPath(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0] || "Profil";
  const initials = getInitials(user.name);

  const handleToggle = () => {
    setOpenForPath((prev) => (prev === pathname ? null : pathname));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setOpenForPath(null);
    setLoggingOut(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center space-x-2 border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${
          open
            ? "border-neutral-950 bg-neutral-950 text-white"
            : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-950"
        }`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center font-mono text-[10px] font-bold ${
            open ? "bg-emerald-500 text-white" : "bg-neutral-950 text-white"
          }`}
        >
          {initials}
        </span>
        <span className="hidden sm:inline max-w-[100px] truncate">{firstName}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="square" strokeWidth="1.75" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu Profil"
          className="absolute right-0 mt-2 w-64 border border-neutral-950 bg-white shadow-xl z-50"
        >
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-950 truncate font-[Montserrat,sans-serif]">
              {user.name}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-neutral-500 truncate">{user.email}</p>
          </div>

          <div className="py-1.5">
            <Link
              role="menuitem"
              href="/account/profile"
              onClick={() => setOpenForPath(null)}
              className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <span>Profil Saya</span>
              <span className="font-mono text-[10px] text-neutral-400">01</span>
            </Link>

            <Link
              role="menuitem"
              href="/account/addresses"
              onClick={() => setOpenForPath(null)}
              className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <span>Alamat Saya</span>
              <span className="font-mono text-[10px] text-neutral-400">02</span>
            </Link>

            <Link
              role="menuitem"
              href="/account/orders"
              onClick={() => setOpenForPath(null)}
              className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <span>Pesanan Saya</span>
              <span className="font-mono text-[10px] text-neutral-400">03</span>
            </Link>

            {user.role === "ADMIN" && (
              <Link
                role="menuitem"
                href="/admin"
                onClick={() => setOpenForPath(null)}
                className="flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <span>Dashboard Admin</span>
                <span className="font-mono text-[10px] text-emerald-600">ADM</span>
              </Link>
            )}
          </div>

          <div className="border-t border-neutral-200 py-1.5">
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{loggingOut ? "Keluar..." : "Log Out"}</span>
              <span className="font-mono text-[10px]">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
