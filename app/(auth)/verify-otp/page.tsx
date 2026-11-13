"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Menangani input per kotak digit OTP
  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // Hanya boleh angka

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Otomatis pindah ke input kotak berikutnya jika terisi
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Menangani tombol backspace untuk kembali ke kotak sebelumnya
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    
    if (code.length < 6) {
      setError("Masukkan 6 digit kode verifikasi dengan lengkap.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Simulasi / Placeholder API Verifikasi 2MFA (nanti dihubungkan ke backend)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Jika berhasil, arahkan ke halaman utama atau dashboard
      alert("Verifikasi 2MFA Berhasil!");
      router.push("/");
    } catch (err: any) {
      setError("Kode OTP salah atau kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-12 lg:px-0">
      <div className="w-full max-w-md space-y-6 p-6 sm:p-8">
        {/* Header Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Two-Factor Authentication</h2>
          <p className="mt-2 text-xs uppercase tracking-wider text-gray-500">
            Enter the 6-digit verification code sent to your email
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* Form OTP */}
        <form className="mt-6 space-y-6" onSubmit={handleVerify}>
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="h-12 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all sm:h-14 sm:w-14 sm:text-xl"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-100 py-3.5 px-4 text-sm font-medium text-gray-500 hover:bg-black hover:text-white focus:outline-none transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? "Memverifikasi..." : "Verify Code"}
          </button>
        </form>

        {/* Kirim Ulang Kode & Kembali */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-xs text-gray-500">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={() => alert("Kode OTP baru telah dikirim ulang!")}
              className="font-semibold text-emerald-600 hover:underline focus:outline-none"
            >
              Resend
            </button>
          </p>

          <div>
            <Link href="/login" className="text-xs font-medium text-gray-600 hover:underline">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}