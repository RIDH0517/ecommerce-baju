"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/(store)/context/AuthContext";

export default function AccountNav({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const tabs = [
    { label: "Profil Saya", href: "/account/profile", active: pathname.startsWith("/account/profile") },
    { label: "Alamat Saya", href: "/account/addresses", active: pathname.startsWith("/account/addresses") },
    { label: "Pesanan Saya", href: "/account/orders", active: pathname.startsWith("/account/orders") },
  ];

  return (
    <div className="border-b border-neutral-200 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
            {title}
          </h1>
          {user && (
            <p className="mt-1.5 text-xs text-neutral-500">
              Masuk sebagai <span className="font-semibold text-neutral-900">{user.name}</span>{" "}
              <span className="font-mono text-[11px] text-neutral-400">({user.email})</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="border border-neutral-200 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors cursor-pointer"
        >
          Log Out
        </button>
      </div>

      <nav aria-label="Navigasi Akun" className="mt-6 flex items-center gap-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`pb-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
              tab.active
                ? "border-b-2 border-neutral-950 text-neutral-950"
                : "text-neutral-400 hover:text-neutral-950"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
