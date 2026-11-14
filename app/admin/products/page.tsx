"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ProductSize {
  id: string;
  size: string;
  stock: number;
}

interface ProductImage {
  id: string;
  url: string;
  order: number;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  createdAt: string;
  images: ProductImage[];
  sizes: ProductSize[];
}

function formatIDR(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error("Gagal memuat produk", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteSuccess(true);
        setTimeout(() => {
          setProducts((prev) => prev.filter((p) => p.id !== deleteId));
          setDeleteId(null);
          setDeleteSuccess(false);
        }, 1200);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus produk");
        setDeleteId(null);
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus");
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const productToDelete = products.find((p) => p.id === deleteId);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-[Inter,system-ui,sans-serif]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 sm:px-8 h-14">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-[15px] font-black tracking-[-0.04em] text-stone-900"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              urban<span className="text-emerald-600">.</span>kamen
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-stone-200" />
            <span className="hidden sm:inline-block text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400">
              Manajemen Produk
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 transition-colors"
            >
              ← Dashboard
            </Link>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Produk Baru
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1360px] px-5 sm:px-8 py-8 space-y-6">
        {/* Title + search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1
              className="text-2xl font-black tracking-[-0.03em]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Semua Produk
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {products.length} produk terdaftar
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kategori..."
            className="w-full sm:w-72 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-stone-200/60 bg-white overflow-hidden"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-stone-300 border-t-stone-900"
              />
              <p className="text-xs text-stone-400 tracking-widest uppercase">Memuat produk…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-14 w-14 rounded-full bg-stone-100 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-stone-500">
                {search ? "Tidak ada produk yang cocok" : "Belum ada produk"}
              </p>
              {!search && (
                <Link
                  href="/admin/products/new"
                  className="rounded-full bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  + Tambah Produk Pertama
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-semibold tracking-[0.12em] uppercase text-stone-400">
                    <th className="py-3 pl-5 font-semibold">Produk</th>
                    <th className="py-3 font-semibold">Kategori</th>
                    <th className="py-3 font-semibold">Harga</th>
                    <th className="py-3 font-semibold">Stok / Ukuran</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 pr-5 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((product) => (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors group"
                      >
                        {/* Produk */}
                        <td className="py-3 pl-5">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-9 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  product.images[0]?.url || product.imageUrl
                                }
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 truncate max-w-[200px]">
                                {product.name}
                              </p>
                              {product.isNewDrop && (
                                <span className="inline-block text-[9px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded mt-0.5">
                                  New Drop
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3 text-xs text-stone-500">
                          {product.category || "—"}
                        </td>

                        {/* Harga */}
                        <td className="py-3 font-semibold tabular-nums text-stone-900">
                          {formatIDR(Number(product.price))}
                        </td>

                        {/* Stok per ukuran */}
                        <td className="py-3">
                          {product.sizes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.sizes.map((sz) => (
                                <span
                                  key={sz.id}
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                                    sz.stock <= 0
                                      ? "bg-stone-100 text-stone-400 line-through"
                                      : sz.stock < 5
                                      ? "bg-red-50 text-red-600"
                                      : "bg-stone-100 text-stone-700"
                                  }`}
                                >
                                  {sz.size}:{sz.stock}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span
                              className={`text-xs font-semibold ${
                                product.stock < 5 ? "text-red-500" : "text-stone-600"
                              }`}
                            >
                              {product.stock} pcs
                            </span>
                          )}
                        </td>

                        {/* Badge stok */}
                        <td className="py-3">
                          {product.stock === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-400">
                              Habis
                            </span>
                          ) : product.stock < 5 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Tersedia
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 pr-5">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-semibold text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => setDeleteId(product.id)}
                              className="rounded-lg border border-red-100 px-3 py-1.5 text-[11px] font-semibold text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      {/* ── DELETE MODAL ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setDeleteId(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 400 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <AnimatePresence mode="wait">
                {deleteSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6 text-center gap-3"
                  >
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">Produk dihapus</p>
                  </motion.div>
                ) : (
                  <motion.div key="confirm">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 mb-1">Hapus Produk?</h3>
                    <p className="text-xs text-stone-500 mb-5">
                      <span className="font-semibold text-stone-700">{productToDelete?.name}</span> akan dihapus permanen dan tidak dapat dikembalikan.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteId(null)}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDeleting ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
                          />
                        ) : null}
                        {isDeleting ? "Menghapus…" : "Ya, Hapus"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
