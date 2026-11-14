"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { compressImageToWebP } from "@/lib/imageUtils";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const CATEGORIES = ["Outerwear", "T-Shirts", "Jackets", "Shirts", "Denim"];
const MAX_IMAGES = 5;

interface SizeStock {
  size: string;
  stock: number;
}

interface ImageItem {
  url: string;
  order: number;
  preview: string; // local object URL for preview
  file?: File;
}

interface ProductFormProps {
  mode: "new" | "edit";
  initialData?: {
    id?: string;
    name: string;
    category: string;
    collection: string;
    description: string;
    specs: string[];
    price: string;
    oldPrice: string;
    discount: string;
    isNewDrop: boolean;
    imageUrl: string;
    images: { url: string; order: number }[];
    sizes: SizeStock[];
  };
}

function formatIDR(val: string) {
  const num = Number(val.replace(/\D/g, ""));
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [collection, setCollection] = useState(initialData?.collection || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [specs, setSpecs] = useState<string[]>(initialData?.specs?.length ? initialData.specs : [""]);
  const [price, setPrice] = useState(initialData?.price || "");
  const [oldPrice, setOldPrice] = useState(initialData?.oldPrice || "");
  const [discount, setDiscount] = useState(initialData?.discount || "");
  const [isNewDrop, setIsNewDrop] = useState(initialData?.isNewDrop || false);

  // Images state — existing images (from DB) + newly uploaded
  const [images, setImages] = useState<ImageItem[]>(
    initialData?.images?.length
      ? initialData.images.map((img) => ({ url: img.url, order: img.order, preview: img.url }))
      : []
  );

  // Sizes / stock
  const [sizes, setSizes] = useState<SizeStock[]>(
    initialData?.sizes?.length
      ? initialData.sizes
      : SIZES.map((s) => ({ size: s, stock: 0 }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalStock = sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  // ── Image handlers ──────────────────────────────────────
  const handleFileAdd = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const toProcess = Array.from(files).slice(0, remaining);
    const previews: ImageItem[] = toProcess
      .filter((f) => f.type.startsWith("image/"))
      .map((f, i) => ({
        url: "",
        order: images.length + i,
        preview: URL.createObjectURL(f),
        file: f,
      }));

    setImages((prev) => [...prev, ...previews]);
  };

  const handleImageRemove = (idx: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated.map((img, i) => ({ ...img, order: i }));
    });
  };

  // Move image left/right to reorder
  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr.map((img, i) => ({ ...img, order: i }));
    });
  };

  // ── Spec handlers ───────────────────────────────────────
  const addSpec = () => setSpecs((prev) => [...prev, ""]);
  const updateSpec = (idx: number, val: string) =>
    setSpecs((prev) => prev.map((s, i) => (i === idx ? val : s)));
  const removeSpec = (idx: number) =>
    setSpecs((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) return setErrorMsg("Nama produk wajib diisi.");
    const rawPrice = Number(price.replace(/\D/g, ""));
    if (!rawPrice || rawPrice <= 0) return setErrorMsg("Harga produk tidak valid.");
    if (images.length === 0) return setErrorMsg("Minimal 1 foto produk wajib diupload.");

    setIsSubmitting(true);
    try {
      // 1. Upload semua gambar yang belum punya URL (file baru)
      const uploadedImages: { url: string; order: number }[] = [];

      for (const img of images) {
        if (img.url) {
          // Gambar lama (edit mode), URL sudah ada
          uploadedImages.push({ url: img.url, order: img.order });
        } else if (img.file) {
          // Gambar baru — kompres & upload
          const compressed = await compressImageToWebP(img.file, 1600, 0.85);
          const fd = new FormData();
          fd.append("file", compressed);
          fd.append("folder", "products");

          const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload gambar");
          uploadedImages.push({ url: uploadData.url, order: img.order });
        }
      }

      // 2. Foto pertama sebagai imageUrl utama
      const primaryImageUrl = uploadedImages.find((i) => i.order === 0)?.url || uploadedImages[0]?.url;

      // 3. POST atau PUT ke API
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: rawPrice,
        oldPrice: oldPrice ? Number(oldPrice.replace(/\D/g, "")) : null,
        discount: discount.trim() || null,
        category: category.trim() || null,
        collection: collection.trim() || null,
        specs: specs.filter((s) => s.trim()),
        imageUrl: primaryImageUrl,
        isNewDrop,
        images: uploadedImages,
        sizes: sizes.map((s) => ({ size: s.size, stock: Number(s.stock) || 0 })),
      };

      const url =
        mode === "edit" && initialData?.id
          ? `/api/admin/products/${initialData.id}`
          : "/api/admin/products";

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan produk");

      setIsSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <p className="text-sm font-bold text-stone-900">
          Produk berhasil {mode === "edit" ? "diperbarui" : "ditambahkan"}!
        </p>
        <p className="text-xs text-stone-400">Mengalihkan ke daftar produk…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs font-semibold text-red-700">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOTO PRODUK (Multi-Upload) ── */}
      <section className="rounded-2xl border border-stone-200/60 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-stone-500 mb-0.5">Foto Produk</h2>
          <p className="text-[11px] text-stone-400">
            Upload hingga {MAX_IMAGES} foto. Foto pertama (kiri) akan jadi foto utama. Klik panah untuk mengubah urutan.
          </p>
        </div>

        {/* Preview gallery */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <div
                  className={`relative h-28 w-24 rounded-xl overflow-hidden border-2 ${
                    idx === 0 ? "border-emerald-400" : "border-stone-200"
                  } bg-stone-100`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`foto ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      UTAMA
                    </span>
                  )}
                </div>
                {/* Controls */}
                <div className="absolute -top-2 -right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleImageRemove(idx)}
                    className="h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
                <div className="flex justify-center gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => idx > 0 && moveImage(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-[10px] font-bold text-stone-400 hover:text-stone-900 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => idx < images.length - 1 && moveImage(idx, idx + 1)}
                    disabled={idx === images.length - 1}
                    className="text-[10px] font-bold text-stone-400 hover:text-stone-900 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        {images.length < MAX_IMAGES && (
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileAdd(e.dataTransfer.files);
            }}
            className={`rounded-xl border-2 border-dashed transition-all ${
              isDragging ? "border-emerald-400 bg-emerald-50/50" : "border-stone-200 bg-stone-50 hover:border-stone-300"
            }`}
          >
            <label className="flex flex-col items-center justify-center py-8 cursor-pointer gap-2">
              <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-stone-600">
                {images.length === 0 ? "Klik atau seret foto ke sini" : `Tambah foto (${images.length}/${MAX_IMAGES})`}
              </p>
              <p className="text-[10px] text-stone-400">PNG, JPG, WebP — otomatis dikompresi ke WebP</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileAdd(e.target.files)}
              />
            </label>
          </div>
        )}
      </section>

      {/* ── INFO DASAR ── */}
      <section className="rounded-2xl border border-stone-200/60 bg-white p-6 space-y-4">
        <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-stone-500">Informasi Produk</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">
              Nama Produk <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Signature Boxy Heavyweight Hoodie — Obsidian"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-stone-400 focus:outline-none transition-colors"
            >
              <option value="">Pilih kategori…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Koleksi</label>
            <input
              type="text"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="Contoh: Monolith Archive AW26"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Deskripsi</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi lengkap produk, bahan, dan karakteristik…"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Spesifikasi */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-stone-500">Spesifikasi / Material</label>
            <button
              type="button"
              onClick={addSpec}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
            >
              + Tambah baris
            </button>
          </div>
          <div className="space-y-2">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => updateSpec(idx, e.target.value)}
                  placeholder={`Spek ${idx + 1}, contoh: 420 GSM Heavyweight Cotton`}
                  className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(idx)}
                  className="text-stone-300 hover:text-red-400 transition-colors"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* New Drop toggle */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsNewDrop((prev) => !prev)}
            className={`relative h-6 w-11 rounded-full transition-colors ${isNewDrop ? "bg-emerald-600" : "bg-stone-200"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isNewDrop ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-stone-600">
            Tandai sebagai <span className="text-emerald-700">New Drop</span>
          </span>
        </div>
      </section>

      {/* ── HARGA ── */}
      <section className="rounded-2xl border border-stone-200/60 bg-white p-6 space-y-4">
        <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-stone-500">Harga</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">
              Harga Jual <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">Rp</span>
              <input
                type="text"
                value={formatIDR(price)}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="350.000"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3.5 py-2.5 text-sm font-semibold tabular-nums text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">
              Harga Coret <span className="text-stone-300 font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">Rp</span>
              <input
                type="text"
                value={formatIDR(oldPrice)}
                onChange={(e) => setOldPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="450.000"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3.5 py-2.5 text-sm font-semibold tabular-nums text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">
              Label Diskon <span className="text-stone-300 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="22% OFF"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── STOK PER UKURAN ── */}
      <section className="rounded-2xl border border-stone-200/60 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-[0.12em] uppercase text-stone-500">Stok per Ukuran</h2>
          <span className="text-[11px] font-semibold text-stone-400">
            Total:{" "}
            <span className={`font-bold ${totalStock < 5 ? "text-red-500" : "text-stone-900"}`}>
              {totalStock} pcs
            </span>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {sizes.map((sz, idx) => (
            <div key={sz.size} className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">
                {sz.size}
              </span>
              <input
                type="number"
                min={0}
                value={sz.stock}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setSizes((prev) =>
                    prev.map((s, i) => (i === idx ? { ...s, stock: val } : s))
                  );
                }}
                className={`w-full rounded-xl border text-center py-2.5 text-sm font-bold tabular-nums focus:outline-none transition-colors ${
                  sz.stock === 0
                    ? "border-stone-200 bg-stone-50 text-stone-300"
                    : sz.stock < 5
                    ? "border-red-200 bg-red-50 text-red-600 focus:border-red-400"
                    : "border-stone-200 bg-stone-50 text-stone-900 focus:border-stone-400"
                }`}
              />
              {sz.stock > 0 && sz.stock < 5 && (
                <span className="text-[9px] text-red-500 font-semibold">Menipis</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SUBMIT ── */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <Link
          href="/admin/products"
          className="rounded-xl border border-stone-200 px-5 py-2.5 text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {isSubmitting && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {isSubmitting
            ? "Menyimpan…"
            : mode === "edit"
            ? "Simpan Perubahan"
            : "Tambah Produk"}
        </button>
      </div>
    </form>
  );
}
