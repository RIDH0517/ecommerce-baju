"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi kesamaan password
    if (password !== confirmPassword) {
      setError("Kata sandi dan konfirmasi kata sandi tidak cocok!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan registrasi");

      // Tampilkan pesan sukses inline lalu arahkan ke halaman login
      setSuccess("Registrasi berhasil! Mengarahkan ke halaman login...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal melakukan registrasi");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    try {
      const rawNext = new URLSearchParams(window.location.search).get("next");
      if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")) {
        sessionStorage.setItem("urbankamen_oauth_next", rawNext);
      } else {
        sessionStorage.removeItem("urbankamen_oauth_next");
      }
    } catch {
      // Abaikan jika sessionStorage tidak tersedia
    }
    window.location.href = "/api/auth/google";
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
              Create Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
              Register
            </h1>
            <p className="text-xs text-neutral-500">
              Daftar akun urban.kamen untuk pengalaman belanja yang lebih cepat.
            </p>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              {success}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Nama Lengkap */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                className="mt-1.5 block w-full border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-colors"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="block w-full border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-10 text-sm text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-950 focus:outline-none cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Ulangi Password / Confirm Password */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                Confirm Password<span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="block w-full border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-10 text-sm text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-colors"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-950 focus:outline-none cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="w-full bg-neutral-950 hover:bg-emerald-700 py-3.5 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors disabled:opacity-50 cursor-pointer font-[Montserrat,sans-serif]"
            >
              {loading ? "Memproses..." : "Register with Email"}
            </button>
          </form>

          {/* Pemisah */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center font-mono text-[10px] uppercase tracking-widest">
              <span className="bg-white px-3 text-neutral-400">or register using</span>
            </div>
          </div>

          {/* Tombol Sosial Register */}
          <div>
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="flex w-full items-center justify-center border border-neutral-200 bg-white py-3 px-4 text-xs font-bold tracking-wide text-neutral-900 hover:border-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center text-xs text-neutral-600 pt-2 border-t border-neutral-100">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-emerald-700 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}