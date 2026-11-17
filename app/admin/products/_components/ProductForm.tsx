"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressImageToWebP } from "@/lib/imageUtils";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const CATEGORIES = ["Outerwear", "T-Shirts", "Jackets", "Shirts", "Denim"];
const MAX_IMAGES = 5;
const LOW_STOCK_THRESHOLD = 5;

interface SizeStock {
  size: string;
  stock: number;
}

interface ImageItem {
  url: string;
  order: number;
  preview: string;
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
  if (isNaN(num) || val === "") return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

const labelClass = "block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600";
const inputClass =
  "mt-1.5 block w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors";

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [collection, setCollection] = useState(initialData?.collection || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [specs, setSpecs] = useState<string[]>(initialData?.specs?.length ? initialData.specs : [""]);
  const [price, setPrice] = useState(initialData?.price || "");
  const [oldPrice, setOldPrice] = useState(initialData?.oldPrice || "");
  const [discount, setDiscount] = useState(initialData?.discount || "");
  const [isNewDrop, setIsNewDrop] = useState(initialData?.isNewDrop || false);

  const [images, setImages] = useState<ImageItem[]>(
    initialData?.images?.length
      ? initialData.images.map((img) => ({ url: img.url, order: img.order, preview: img.url }))
      : []
  );

  const [sizes, setSizes] = useState<SizeStock[]>(
    initialData?.sizes?.length ? initialData.sizes : SIZES.map((s) => ({ size: s, stock: 0 }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const totalStock = sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);

  const handleFileAdd = (files: FileList | null) => {
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
    setImages((prev) => prev.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i })));
  };

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr.map((img, i) => ({ ...img, order: i }));
    });
  };

  const addSpec = () => setSpecs((prev) => [...prev, ""]);
  const updateSpec = (idx: number, val: string) =>
    setSpecs((prev) => prev.map((s, i) => (i === idx ? val : s)));
  const removeSpec = (idx: number) => setSpecs((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) return setErrorMsg("Nama produk wajib diisi.");
    const rawPrice = Number(price.replace(/\D/g, ""));
    if (!rawPrice || rawPrice <= 0) return setErrorMsg("Harga produk tidak valid.");
    if (images.length === 0) return setErrorMsg("Minimal 1 foto produk wajib diupload.");

    setIsSubmitting(true);
    try {
      const uploadedImages: { url: string; order: number }[] = [];

      for (const img of images) {
        if (img.url) {
          uploadedImages.push({ url: img.url, order: img.order });
        } else if (img.file) {
          const compressed = await compressImageToWebP(img.file, 1600, 0.85);
          const fd = new FormData();
          fd.append("file", compressed);
          fd.append("folder", "products");

          const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload gambar.");
          uploadedImages.push({ url: uploadData.url, order: img.order });
        }
      }

      const primaryImageUrl =
        uploadedImages.find((i) => i.order === 0)?.url || uploadedImages[0]?.url;

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
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan produk.");

      setSuccessMsg(
        mode === "edit"
          ? "Produk berhasil diperbarui. Mengalihkan..."
          : "Produk berhasil ditambahkan. Mengalihkan..."
      );
      setTimeout(() => router.push("/admin/products"), 900);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* 01 GALERI FOTO */}
      <section className="border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-xs font-bold text-neutral-400">01</span>
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
              Galeri Foto Produk
            </h2>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">
            {images.length}/{MAX_IMAGES} FOTO
          </span>
        </div>

        <p className="text-xs text-neutral-500">
          Foto pertama (kiri) digunakan sebagai foto utama katalog. File otomatis dikompresi ke WebP.
        </p>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="w-24 space-y-1.5">
                <div
                  className={`relative aspect-[4/5] w-full overflow-hidden border bg-neutral-100 ${
                    idx === 0 ? "border-neutral-950" : "border-neutral-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`foto ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-neutral-950 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                      UTAMA
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleImageRemove(idx)}
                    aria-label={`Hapus foto ${idx + 1}`}
                    className="absolute top-1 right-1 h-5 w-5 bg-white/90 border border-neutral-200 text-neutral-800 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => idx > 0 && moveImage(idx, idx - 1)}
                    disabled={idx === 0}
                    className="border border-neutral-200 px-2 py-0.5 font-mono text-[10px] text-neutral-600 hover:border-neutral-950 disabled:opacity-30 cursor-pointer"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => idx < images.length - 1 && moveImage(idx, idx + 1)}
                    disabled={idx === images.length - 1}
                    className="border border-neutral-200 px-2 py-0.5 font-mono text-[10px] text-neutral-600 hover:border-neutral-950 disabled:opacity-30 cursor-pointer"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES && (
          <div
            ref={dropRef}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileAdd(e.dataTransfer.files);
            }}
            className={`border border-dashed transition-colors ${
              isDragging
                ? "border-emerald-600 bg-emerald-50/40"
                : "border-neutral-300 bg-neutral-50 hover:border-neutral-950"
            }`}
          >
            <label className="flex flex-col items-center justify-center py-8 cursor-pointer gap-1.5">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-neutral-800">
                {images.length === 0 ? "+ Pilih atau Seret Foto ke Sini" : `+ Tambah Foto (${images.length}/${MAX_IMAGES})`}
              </span>
              <span className="text-[11px] text-neutral-400">PNG, JPG, WebP</span>
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

      {/* 02 INFORMASI ARTIKEL */}
      <section className="border border-neutral-200 bg-white p-6 space-y-5">
        <div className="flex items-baseline gap-2.5 border-b border-neutral-100 pb-3">
          <span className="font-mono text-xs font-bold text-neutral-400">02</span>
          <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
            Informasi Artikel
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="prod-name" className={labelClass}>
              Nama Produk<span className="text-red-500">*</span>
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Signature Boxy Heavyweight Hoodie — Obsidian"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="prod-category" className={labelClass}>
              Kategori
            </label>
            <select
              id="prod-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">Pilih kategori...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prod-collection" className={labelClass}>
              Koleksi
            </label>
            <input
              id="prod-collection"
              type="text"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="Contoh: Monolith Archive AW26"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="prod-desc" className={labelClass}>
              Deskripsi
            </label>
            <textarea
              id="prod-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi potongan, karakter bahan, dan detail konstruksi..."
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isNewDrop}
            onChange={(e) => setIsNewDrop(e.target.checked)}
            className="h-4 w-4 accent-neutral-950"
          />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-800">
            Tandai sebagai <span className="text-emerald-700">New Drop</span>
          </span>
        </label>
      </section>

      {/* 03 HARGA & DISKON */}
      <section className="border border-neutral-200 bg-white p-6 space-y-5">
        <div className="flex items-baseline gap-2.5 border-b border-neutral-100 pb-3">
          <span className="font-mono text-xs font-bold text-neutral-400">03</span>
          <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
            Harga &amp; Diskon
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="prod-price" className={labelClass}>
              Harga Jual (Rp)<span className="text-red-500">*</span>
            </label>
            <input
              id="prod-price"
              type="text"
              inputMode="numeric"
              value={formatIDR(price)}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="350.000"
              className={`${inputClass} font-mono font-semibold`}
            />
          </div>

          <div>
            <label htmlFor="prod-old-price" className={labelClass}>
              Harga Coret (opsional)
            </label>
            <input
              id="prod-old-price"
              type="text"
              inputMode="numeric"
              value={formatIDR(oldPrice)}
              onChange={(e) => setOldPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="450.000"
              className={`${inputClass} font-mono font-semibold`}
            />
          </div>

          <div>
            <label htmlFor="prod-discount" className={labelClass}>
              Label Diskon (opsional)
            </label>
            <input
              id="prod-discount"
              type="text"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="22% OFF"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* 04 STOK PER UKURAN */}
      <section className="border border-neutral-200 bg-white p-6 space-y-5">
        <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-xs font-bold text-neutral-400">04</span>
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
              Stok per Ukuran
            </h2>
          </div>
          <span className="font-mono text-xs font-bold text-neutral-950">
            TOTAL: {totalStock} PCS
          </span>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {sizes.map((sz, idx) => (
            <div key={sz.size} className="space-y-1.5 text-center">
              <label
                htmlFor={`stock-${sz.size}`}
                className="block font-mono text-xs font-bold uppercase tracking-widest text-neutral-600"
              >
                {sz.size}
              </label>
              <input
                id={`stock-${sz.size}`}
                type="number"
                min={0}
                value={sz.stock}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, stock: val } : s)));
                }}
                className={`w-full border py-2.5 text-center font-mono text-sm font-bold focus:outline-none transition-colors ${
                  sz.stock === 0
                    ? "border-neutral-200 bg-neutral-50 text-neutral-400"
                    : sz.stock <= LOW_STOCK_THRESHOLD
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-neutral-200 bg-white text-neutral-950 focus:border-neutral-950"
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 05 SPESIFIKASI MATERIAL */}
      <section className="border border-neutral-200 bg-white p-6 space-y-4">
        <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-xs font-bold text-neutral-400">05</span>
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
              Spesifikasi Material
            </h2>
          </div>
          <button
            type="button"
            onClick={addSpec}
            className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:underline cursor-pointer"
          >
            + Tambah Baris
          </button>
        </div>

        <div className="space-y-2.5">
          {specs.map((spec, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={spec}
                onChange={(e) => updateSpec(idx, e.target.value)}
                placeholder={`Spesifikasi ${idx + 1}, contoh: 420 GSM 100% Cotton Fleece`}
                className="flex-1 border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeSpec(idx)}
                aria-label="Hapus baris spesifikasi"
                className="border border-neutral-200 px-3 py-2.5 font-mono text-xs text-neutral-500 hover:border-red-600 hover:text-red-600 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIONS */}
      <div className="flex items-center justify-between gap-4 pt-2 pb-6">
        <Link
          href="/admin/products"
          className="border border-neutral-200 bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-700 hover:border-neutral-950 transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-neutral-950 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 font-[Montserrat,sans-serif] cursor-pointer"
        >
          {isSubmitting
            ? "Menyimpan..."
            : mode === "edit"
            ? "Simpan Perubahan"
            : "Simpan & Terbitkan Produk"}
        </button>
      </div>
    </form>
  );
}
