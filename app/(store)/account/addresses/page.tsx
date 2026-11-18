"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import AccountNav from "@/app/(store)/account/_components/AccountNav";
import AddressFormModal from "@/app/(store)/account/_components/AddressFormModal";
import { useAuth } from "@/app/(store)/context/AuthContext";
import { MAX_ADDRESSES_PER_USER, type UserAddress } from "@/lib/addresses";

export default function AccountAddressesPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [modalMode, setModalMode] = useState<"closed" | "new" | "edit">("closed");
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    const res = await fetch("/api/account/addresses", { cache: "no-store" });
    if (res.status === 401) {
      router.push("/login?next=/account/addresses");
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat alamat.");
    setAddresses((data.addresses ?? []) as UserAddress[]);
  }, [router]);

  useEffect(() => {
    if (status === "guest") {
      router.push("/login?next=/account/addresses");
      return;
    }
    if (status !== "authenticated") return;

    let active = true;
    fetch("/api/account/addresses", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login?next=/account/addresses");
          return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat alamat.");
        return (data.addresses ?? []) as UserAddress[];
      })
      .then((list) => {
        if (active && list) setAddresses(list);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat alamat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, router]);

  const handleSetPrimary = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setPrimaryOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah alamat utama.");
      await loadAddresses();
      setNotice({ type: "ok", text: "Alamat utama berhasil diubah." });
    } catch (err) {
      setNotice({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal mengubah alamat utama.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus alamat.");
      setConfirmDeleteId(null);
      await loadAddresses();
      setNotice({ type: "ok", text: "Alamat berhasil dihapus." });
    } catch (err) {
      setNotice({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal menghapus alamat.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = async () => {
    const wasEdit = modalMode === "edit";
    setModalMode("closed");
    setEditingAddress(null);
    await loadAddresses();
    setNotice({
      type: "ok",
      text: wasEdit ? "Alamat berhasil diperbarui." : "Alamat baru berhasil ditambahkan.",
    });
  };

  const limitReached = addresses.length >= MAX_ADDRESSES_PER_USER;

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <AccountNav title="Alamat Saya" />

          <div className="mt-8 space-y-6">
            {/* Bar Atas: Hitungan & Tombol Tambah */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-600">
                  Simpan hingga {MAX_ADDRESSES_PER_USER} alamat untuk mempercepat proses checkout.
                </p>
                <p className="mt-1 font-mono text-[11px] text-neutral-400">
                  {addresses.length} / {MAX_ADDRESSES_PER_USER} alamat tersimpan
                </p>
              </div>

              <button
                type="button"
                disabled={limitReached || loading}
                onClick={() => {
                  setEditingAddress(null);
                  setModalMode("new");
                }}
                className="bg-neutral-950 px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-[Montserrat,sans-serif] cursor-pointer"
              >
                {limitReached ? `Maksimal ${MAX_ADDRESSES_PER_USER} Alamat` : "+ Tambah Alamat Baru"}
              </button>
            </div>

            {error && (
              <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}</div>
            )}

            {notice && (
              <div
                aria-live="polite"
                className={`border p-3.5 text-xs ${
                  notice.type === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {notice.text}
              </div>
            )}

            {/* Daftar Kartu Alamat */}
            {status === "loading" || loading ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className="h-36 bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="border border-dashed border-neutral-300 px-6 py-16 text-center space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-neutral-900 font-[Montserrat,sans-serif]">
                  Belum Ada Alamat Tersimpan
                </p>
                <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                  Tambahkan alamat pengiriman pertama Anda. Alamat pertama otomatis menjadi Alamat Utama saat Anda berbelanja di halaman checkout.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setModalMode("new");
                  }}
                  className="inline-block bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif] cursor-pointer"
                >
                  + Tambah Alamat Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <article
                    key={addr.id}
                    className={`border p-5 sm:p-6 transition-colors ${
                      addr.isPrimary ? "border-neutral-950 bg-neutral-50/50" : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-neutral-950">
                            {addr.recipientName}
                          </span>
                          <span className="text-neutral-300">|</span>
                          <span className="font-mono text-xs text-neutral-600">{addr.phone}</span>

                          <span className="border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                            {addr.label}
                          </span>

                          {addr.isPrimary && (
                            <span className="border border-emerald-700 bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              Utama
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-700 leading-relaxed">{addr.fullAddress}</p>
                        <p className="text-xs text-neutral-500 uppercase tracking-wide">
                          Kec. {addr.district}, {addr.city}, {addr.province}, {addr.postalCode}
                        </p>
                        {addr.notes && (
                          <p className="text-[11px] text-neutral-500">
                            Catatan: <span className="italic">{addr.notes}</span>
                          </p>
                        )}
                      </div>

                      {/* Aksi */}
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(addr);
                            setModalMode("edit");
                          }}
                          className="border border-neutral-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:border-neutral-950 transition-colors cursor-pointer"
                        >
                          Ubah
                        </button>

                        {!addr.isPrimary && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === addr.id}
                              onClick={() => handleSetPrimary(addr.id)}
                              className="border border-neutral-950 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Atur sebagai Utama
                            </button>

                            {confirmDeleteId === addr.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={busyId === addr.id}
                                  onClick={() => handleDelete(addr.id)}
                                  className="bg-red-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-700 cursor-pointer"
                                >
                                  Konfirmasi Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="border border-neutral-200 px-2.5 py-2 text-[11px] font-bold uppercase text-neutral-600 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === addr.id}
                                onClick={() => setConfirmDeleteId(addr.id)}
                                className="border border-red-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </PageTransition>

      {modalMode !== "closed" && (
        <AddressFormModal
          key={editingAddress?.id ?? "new"}
          initialAddress={editingAddress}
          forcePrimary={modalMode === "new" && addresses.length === 0}
          defaultRecipientName={user?.name ?? ""}
          defaultPhone={user?.phone ?? ""}
          onClose={() => {
            setModalMode("closed");
            setEditingAddress(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
