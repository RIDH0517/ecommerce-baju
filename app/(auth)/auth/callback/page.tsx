"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(store)/context/AuthContext";

function getSafeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/register") || raw.startsWith("/auth")) {
    return null;
  }
  return raw;
}

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const { setUser, refresh } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const queryParams = new URLSearchParams(window.location.search);

        const oauthError =
          hashParams.get("error_description") ||
          hashParams.get("error") ||
          queryParams.get("error_description") ||
          queryParams.get("error");

        if (oauthError) {
          throw new Error("Autentikasi Google dibatalkan atau gagal.");
        }

        const accessToken = hashParams.get("access_token");
        if (!accessToken) {
          throw new Error("Token Google tidak ditemukan. Silakan coba login ulang.");
        }

        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal memverifikasi akun Google.");
        }

        if (!active) return;

        if (data.user) {
          setUser(data.user);
        }
        await refresh();

        let savedNext: string | null = null;
        try {
          savedNext = sessionStorage.getItem("urbankamen_oauth_next");
          sessionStorage.removeItem("urbankamen_oauth_next");
        } catch {
          // Abaikan jika sessionStorage tidak tersedia
        }

        const safeNext = getSafeNextPath(savedNext);
        let target: string;
        if (safeNext) {
          target = safeNext.startsWith("/admin") && data.role !== "ADMIN" ? "/catalog" : safeNext;
        } else {
          target = data.role === "ADMIN" ? "/admin" : "/catalog";
        }

        router.replace(target);
        router.refresh();
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Gagal memverifikasi akun Google.");
        }
      }
    });

    return () => {
      active = false;
    };
  }, [router, setUser, refresh]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-md border border-neutral-200 p-8 text-center space-y-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
          [GOOGLE OAUTH VERIFICATION]
        </span>

        {error ? (
          <>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
              Login Google Gagal
            </h1>
            <p className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>
            <Link
              href="/login"
              className="inline-block w-full bg-neutral-950 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif]"
            >
              Kembali ke Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
              Memverifikasi Akun Google
            </h1>
            <p className="text-xs text-neutral-500">
              Mohon tunggu sebentar, sesi Anda sedang disiapkan...
            </p>
            <div className="mx-auto h-6 w-6 animate-spin border-2 border-neutral-200 border-t-neutral-950" />
          </>
        )}
      </div>
    </div>
  );
}
