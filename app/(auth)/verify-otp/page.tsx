"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/(store)/context/AuthContext";

function getSafeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/register") || raw.startsWith("/verify-otp")) {
    return null;
  }
  return raw;
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const { setUser, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active || typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const queryEmail = params.get("email")?.trim().toLowerCase() || "";
      let pendingEmail = "";
      try {
        pendingEmail = sessionStorage.getItem("urbankamen_pending_otp_email") || "";
      } catch {
        pendingEmail = "";
      }
      setEmail(queryEmail || pendingEmail);
      setNextPath(getSafeNextPath(params.get("next")));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (value: string, index: number) => {
    const cleanDigit = value.replace(/\D/g, "");
    if (!cleanDigit) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    if (cleanDigit.length > 1) {
      const chars = cleanDigit.slice(0, 6).split("");
      const nextOtp = ["", "", "", "", "", ""];
      chars.forEach((ch, idx) => {
        nextOtp[idx] = ch;
      });
      setOtp(nextOtp);
      const focusIdx = Math.min(chars.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleanDigit;
    setOtp(nextOtp);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const nextOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, idx) => {
      nextOtp[idx] = ch;
    });
    setOtp(nextOtp);
    inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const code = otp.join("");

    if (!trimmedEmail) {
      setError("Masukkan alamat email yang Anda daftarkan.");
      return;
    }

    if (code.length < 6) {
      setError("Masukkan 6 digit kode verifikasi dengan lengkap.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kode OTP salah atau sudah kedaluwarsa.");
      }

      try {
        sessionStorage.removeItem("urbankamen_pending_otp_email");
      } catch {
        // Abaikan jika sessionStorage tidak tersedia
      }

      if (data.user) {
        setUser(data.user);
      }
      await refresh();

      setInfoMessage("Verifikasi berhasil! Mengalihkan ke toko...");
      const target =
        nextPath && !(nextPath.startsWith("/admin") && data.role !== "ADMIN")
          ? nextPath
          : data.role === "ADMIN"
          ? "/admin"
          : "/catalog";

      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memverifikasi kode OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Masukkan alamat email terlebih dahulu untuk mengirim ulang kode.");
      return;
    }

    setError("");
    setInfoMessage("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (typeof data.retryAfterSec === "number" && data.retryAfterSec > 0) {
          setCooldown(data.retryAfterSec);
        }
        throw new Error(data.error || "Gagal mengirim ulang kode OTP.");
      }

      setOtp(["", "", "", "", "", ""]);
      setCooldown(typeof data.cooldownSec === "number" ? data.cooldownSec : 60);
      setInfoMessage(data.message || "Kode OTP baru telah dikirim ke email Anda.");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang kode OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50/50 text-neutral-950 font-[Inter,sans-serif] flex flex-col">
      {/* Top Brand Header */}
      <header className="w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/catalog"
            className="text-base sm:text-lg font-black tracking-tighter font-[Montserrat,sans-serif] text-neutral-950"
          >
            urban<span className="text-emerald-600">.</span>kamen
          </Link>
          <Link
            href="/catalog"
            className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-950 transition-colors"
          >
            ← Kembali ke Toko
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-neutral-200/90 bg-white p-6 sm:p-10 space-y-6 shadow-[0_12px_40px_rgb(0,0,0,0.03)]">
          {/* Header Title */}
          <div className="space-y-1.5">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              Email Verification
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
              Verifikasi OTP
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Masukkan 6 digit kode verifikasi yang telah dikirim ke{" "}
              {email ? (
                <span className="font-mono font-semibold text-neutral-900">{email}</span>
              ) : (
                "alamat email Anda"
              )}
              . Berlaku 5 menit.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {infoMessage && (
            <div
              aria-live="polite"
              className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
            >
              {infoMessage}
            </div>
          )}

          {/* Form OTP */}
          <form className="space-y-5" onSubmit={handleVerify}>
            {!email && (
              <div>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="mt-1.5 block w-full border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-600 mb-2.5">
                Kode Verifikasi 6 Digit
              </label>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={6}
                    aria-label={`Digit OTP ke-${index + 1}`}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="h-12 sm:h-14 w-full border border-neutral-200 bg-neutral-50/50 text-center font-mono text-lg sm:text-xl font-bold text-neutral-950 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-colors"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-950 hover:bg-emerald-700 py-3.5 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors disabled:opacity-50 cursor-pointer font-[Montserrat,sans-serif]"
            >
              {loading ? "Memverifikasi..." : "Verify & Activate"}
            </button>
          </form>

          {/* Kirim Ulang Kode & Kembali */}
          <div className="space-y-3 pt-4 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              Tidak menerima email?{" "}
              <button
                type="button"
                disabled={cooldown > 0 || resending}
                onClick={handleResend}
                className="font-bold text-emerald-700 hover:underline disabled:text-neutral-400 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
              >
                {resending
                  ? "Mengirim..."
                  : cooldown > 0
                  ? `Kirim ulang (${cooldown}s)`
                  : "Kirim Ulang OTP"}
              </button>
            </p>

            <div>
              <Link
                href="/login"
                className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500 hover:text-neutral-950 transition-colors"
              >
                ← Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
