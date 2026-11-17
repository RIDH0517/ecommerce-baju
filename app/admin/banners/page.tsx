"use client";

import { useEffect, useState } from "react";
import { compressImageToWebP } from "@/lib/imageUtils";

interface BannerItem {
  id: string;
  tag: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

const labelClass = "block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600";
const inputClass =
  "mt-1.5 block w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form upload baru
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/banners", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat banner.");
        return data as BannerItem[];
      })
      .then((list) => {
        if (active) setBanners(list);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat banner.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshBanners = async () => {
    const res = await fetch("/api/admin/banners", { cache: "no-store" });
    if (res.ok) setBanners(await res.json());
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!file) {
      setNotice({ type: "err", text: "Pilih gambar banner terlebih dahulu." });
      return;
    }

    setSubmitting(true);
    try {
      const optimized = await compressImageToWebP(file, 1600, 0.85);
      const fd = new FormData();
      fd.append("file", optimized);
      fd.append("folder", "banners");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah gambar.");

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          tag: tag.trim() || undefined,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan banner.");

      setFile(null);
      setPreview("");
      setTag("");
      setTitle("");
      setDescription("");
      await refreshBanners();
      setNotice({ type: "ok", text: "Banner baru diunggah dan langsung aktif di beranda toko." });
    } catch (err) {
      setNotice({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal menyimpan banner.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengaktifkan banner.");
      await refreshBanners();
      setNotice({ type: "ok", text: "Banner aktif beranda berhasil diganti." });
    } catch (err) {
      setNotice({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal mengaktifkan banner.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus banner.");
      await refreshBanners();
      setNotice({ type: "ok", text: "Banner dihapus dari daftar." });
    } catch (err) {
      setNotice({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal menghapus banner.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const activeBanner = banners.find((b) => b.isActive) ?? null;

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="border-b border-neutral-200 pb-6">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          [04 / STOREFRONT HERO]
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
          Manajemen Banner
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Kelola banner hero beranda toko. Mengupload banner baru atau mengaktifkan arsip langsung memperbarui halaman katalog.
        </p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}</div>
      )}
      {notice && (
        <div
          aria-live="polite"
          className={`border p-4 text-xs font-medium ${
            notice.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT (7 cols): Active Banner + History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Banner */}
          <section className="border border-neutral-950 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neutral-950">
                01 / Banner Aktif di Storefront
              </span>
              {activeBanner && (
                <span className="bg-emerald-700 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                  LIVE
                </span>
              )}
            </div>

            {loading ? (
              <div className="aspect-[16/7] bg-neutral-100 animate-pulse" />
            ) : activeBanner ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/7] w-full overflow-hidden border border-neutral-200 bg-neutral-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeBanner.imageUrl}
                    alt={activeBanner.title || "Banner aktif"}
                    className="h-full w-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-5 flex flex-col justify-end text-white">
                    {activeBanner.tag && (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                        [{activeBanner.tag}]
                      </span>
                    )}
                    <h2 className="mt-1 text-lg font-black uppercase tracking-tight font-[Montserrat,sans-serif]">
                      {activeBanner.title || "Banner Tanpa Judul"}
                    </h2>
                    {activeBanner.description && (
                      <p className="mt-1 text-xs text-neutral-200 line-clamp-2">
                        {activeBanner.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-neutral-300 py-12 text-center text-xs text-neutral-500">
                Belum ada banner aktif. Unggah banner di sebelah kanan untuk menayangkannya di beranda.
              </div>
            )}
          </section>

          {/* Banner History */}
          <section className="border border-neutral-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neutral-950">
                02 / Riwayat Banner ({banners.length})
              </span>
            </div>

            {loading ? (
              <div className="h-32 bg-neutral-100 animate-pulse" />
            ) : banners.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-500">Belum ada arsip banner.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {banners.map((b) => (
                  <li key={b.id} className="py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <div className="h-16 w-28 flex-shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.imageUrl} alt={b.title || "Banner"} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {b.isActive && (
                          <span className="bg-neutral-950 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                            AKTIF
                          </span>
                        )}
                        {b.tag && (
                          <span className="font-mono text-[10px] uppercase text-emerald-700">
                            {b.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-neutral-950 truncate">
                        {b.title || "Banner Tanpa Judul"}
                      </p>
                      <p className="font-mono text-[10px] text-neutral-400">
                        {new Date(b.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!b.isActive && (
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => handleActivate(b.id)}
                          className="border border-neutral-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Aktifkan
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => handleDelete(b.id)}
                        className="border border-red-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT (5 cols): Upload Form */}
        <section className="lg:col-span-5 border border-neutral-200 bg-white p-6 space-y-5">
          <div className="border-b border-neutral-200 pb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neutral-950">
              03 / Upload Banner Baru
            </span>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <span className={labelClass}>Gambar Banner*</span>
              <div className="mt-1.5 border border-dashed border-neutral-300 bg-neutral-50">
                {preview ? (
                  <div className="relative">
                    <div className="aspect-[16/7] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Preview banner" className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview("");
                      }}
                      className="absolute top-2 right-2 bg-neutral-950 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-white hover:bg-red-600 cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-8 cursor-pointer text-center px-4">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-neutral-800">
                      + Pilih Gambar Banner
                    </span>
                    <span className="mt-1 text-[11px] text-neutral-400">
                      Rasio landscape 16:7 disarankan · dikompresi ke WebP
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                        if (f) setPreview(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="banner-tag" className={labelClass}>
                Tag Label (opsional)
              </label>
              <input
                id="banner-tag"
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="NEW DROP / AW26 ARCHIVE"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="banner-title" className={labelClass}>
                Judul Utama (opsional)
              </label>
              <input
                id="banner-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Essentials Crafted For Modern Lifestyle."
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="banner-desc" className={labelClass}>
                Deskripsi (opsional)
              </label>
              <textarea
                id="banner-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Koleksi terbatas material heavyweight 420 GSM."
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full bg-neutral-950 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-[Montserrat,sans-serif] cursor-pointer"
            >
              {submitting ? "Mengunggah..." : "Upload & Jadikan Aktif"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
