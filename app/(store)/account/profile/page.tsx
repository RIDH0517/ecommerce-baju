"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import AccountNav from "@/app/(store)/account/_components/AccountNav";
import { useAuth, type AuthUser } from "@/app/(store)/context/AuthContext";
import type { UserAddress } from "@/lib/addresses";

const labelClass = "block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600";
const inputClass =
  "mt-1.5 block w-full border border-neutral-200 bg-white px-3.5 py-3 text-sm text-neutral-950 placeholder-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 transition-colors";

function ProfileEditor({ initialUser }: { initialUser: AuthUser }) {
  const { setUser } = useAuth();

  // Form data diri
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Ringkasan Alamat Utama dari Buku Alamat
  const [primaryAddress, setPrimaryAddress] = useState<UserAddress | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/addresses", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.addresses) return;
        const list = data.addresses as UserAddress[];
        setAddressCount(list.length);
        setPrimaryAddress(list.find((a) => a.isPrimary) ?? list[0] ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Form ganti password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const joinedDate = new Date(initialUser.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address: initialUser.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan profil.");
      if (data.user) setUser(data.user);
      setProfileMsg({ type: "ok", text: data.message || "Profil berhasil diperbarui." });
    } catch (err) {
      setProfileMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal menyimpan profil.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "Password baru minimal 8 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "Konfirmasi password baru tidak cocok." });
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ type: "ok", text: data.message || "Password berhasil diperbarui." });
    } catch (err) {
      setPwMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal memperbarui password.",
      });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
      {/* 01 INFORMASI PRIBADI & ALAMAT */}
      <section aria-labelledby="sec-profile" className="lg:col-span-7">
        <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-3">
          <span className="font-mono text-xs font-bold text-neutral-400">01</span>
          <h2 id="sec-profile" className="text-sm font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
            Informasi Pribadi &amp; Alamat
          </h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-neutral-200 bg-neutral-50 p-4">
            <div>
              <span className={labelClass}>Email Terdaftar</span>
              <p className="mt-1 font-mono text-xs font-semibold text-neutral-900 break-all">
                {initialUser.email}
              </p>
            </div>
            <div>
              <span className={labelClass}>Bergabung Sejak</span>
              <p className="mt-1 text-xs font-medium text-neutral-700">{joinedDate}</p>
            </div>
          </div>

          <div>
            <label htmlFor="profile-name" className={labelClass}>
              Nama Lengkap<span className="text-red-500">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              required
              minLength={2}
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className={labelClass}>
              No. HP / WhatsApp
            </label>
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="0812xxxxxxxx"
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              Digunakan untuk mengisi formulir checkout secara otomatis.
            </p>
          </div>

          <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className={labelClass}>
                Buku Alamat {addressCount !== null ? `(${addressCount})` : ""}
              </span>
              <Link
                href="/account/addresses"
                className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:underline"
              >
                Kelola Daftar Alamat →
              </Link>
            </div>
            {primaryAddress ? (
              <div className="text-xs text-neutral-700 space-y-1">
                <p className="font-semibold text-neutral-950">
                  {primaryAddress.recipientName} · {primaryAddress.phone}{" "}
                  <span className="ml-1 bg-neutral-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    {primaryAddress.label} · Utama
                  </span>
                </p>
                <p>{primaryAddress.fullAddress}</p>
                <p className="text-[11px] text-neutral-500">
                  Kec. {primaryAddress.district}, {primaryAddress.city}, {primaryAddress.province}{" "}
                  {primaryAddress.postalCode}
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                Belum ada alamat tersimpan. Tambahkan beberapa alamat pengiriman (Rumah, Kantor, dll.) di halaman Alamat Saya.
              </p>
            )}
          </div>

          {profileMsg && (
            <div
              aria-live="polite"
              className={`border p-3 text-xs ${
                profileMsg.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 font-[Montserrat,sans-serif] cursor-pointer"
          >
            {profileSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </section>

      {/* 02 UBAH PASSWORD */}
      <section aria-labelledby="sec-password" className="lg:col-span-5">
        <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-3">
          <span className="font-mono text-xs font-bold text-neutral-400">02</span>
          <h2 id="sec-password" className="text-sm font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
            Ubah Kata Sandi
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5 border border-neutral-200 p-5">
          <div>
            <label htmlFor="pw-current" className={labelClass}>
              Password Saat Ini<span className="text-red-500">*</span>
            </label>
            <input
              id="pw-current"
              type={showPasswords ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="pw-new" className={labelClass}>
              Password Baru<span className="text-red-500">*</span>
            </label>
            <input
              id="pw-new"
              type={showPasswords ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label htmlFor="pw-confirm" className={labelClass}>
              Konfirmasi Password Baru<span className="text-red-500">*</span>
            </label>
            <input
              id="pw-confirm"
              type={showPasswords ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Ulangi password baru"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="accent-neutral-950"
            />
            <span>Tampilkan kata sandi</span>
          </label>

          {pwMsg && (
            <div
              aria-live="polite"
              className={`border p-3 text-xs ${
                pwMsg.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {pwMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="w-full border border-neutral-950 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors disabled:opacity-50 font-[Montserrat,sans-serif] cursor-pointer"
          >
            {pwSaving ? "Memperbarui..." : "Perbarui Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function AccountProfilePage() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === "guest") {
      router.push("/login?next=/account/profile");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <AccountNav title="Profil Saya" />

          {status === "loading" || !user ? (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 h-80 bg-neutral-100 animate-pulse" />
              <div className="lg:col-span-5 h-80 bg-neutral-100 animate-pulse" />
            </div>
          ) : (
            <ProfileEditor key={user.id} initialUser={user} />
          )}
        </main>
      </PageTransition>
    </div>
  );
}
