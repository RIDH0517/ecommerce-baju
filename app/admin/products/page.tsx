"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  oldPrice: number | null;
  discount: string | null;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  createdAt: string;
  images: ProductImage[];
  sizes: ProductSize[];
}

const LOW_STOCK_THRESHOLD = 5;

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
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "LOW" | "OUT" | "NEW_DROP">("ALL");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/products", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat produk.");
        return data as Product[];
      })
      .then((list) => {
        if (active) setProducts(list);
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Gagal memuat produk.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus produk.");
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
    if (!matchQuery) return false;

    if (filterMode === "LOW") return p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD;
    if (filterMode === "OUT") return p.stock <= 0;
    if (filterMode === "NEW_DROP") return p.isNewDrop;
    return true;
  });

  const productToDelete = products.find((p) => p.id === deleteId);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            [02 / CATALOG INVENTORY]
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
            Manajemen Produk
          </h1>
          <p className="mt-1 font-mono text-[11px] text-neutral-500">
            {products.length} artikel terdaftar · menampilkan {filtered.length} hasil
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-neutral-950 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif]"
        >
          + Produk Baru
        </Link>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 border border-neutral-200 bg-white p-1">
          {(
            [
              { id: "ALL", label: `Semua (${products.length})` },
              {
                id: "LOW",
                label: `Menipis (${products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length})`,
              },
              { id: "OUT", label: `Habis (${products.filter((p) => p.stock <= 0).length})` },
              { id: "NEW_DROP", label: `New Drop (${products.filter((p) => p.isNewDrop).length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                filterMode === tab.id
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama artikel atau kategori..."
          className="w-full sm:w-80 border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
        />
      </div>

      {loadError && (
        <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">{loadError}</div>
      )}

      {/* ── PRODUCTS TABLE ── */}
      <div className="border border-neutral-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-600">
              {search || filterMode !== "ALL"
                ? "Tidak ada produk yang cocok dengan filter"
                : "Belum ada produk terdaftar"}
            </p>
            {!search && filterMode === "ALL" && (
              <Link
                href="/admin/products/new"
                className="mt-5 inline-block bg-neutral-950 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors"
              >
                + Tambah Produk Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  <th className="py-3.5 pl-5 font-semibold">Artikel</th>
                  <th className="py-3.5 font-semibold">Kategori</th>
                  <th className="py-3.5 font-semibold">Harga</th>
                  <th className="py-3.5 font-semibold">Stok / Ukuran</th>
                  <th className="py-3.5 font-semibold">Status</th>
                  <th className="py-3.5 pr-5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3.5 pl-5">
                      <div className="flex items-center gap-3.5">
                        <div className="h-14 w-11 flex-shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.images[0]?.url || product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-950 truncate max-w-[240px]">
                            {product.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-[10px] text-neutral-400">
                              #{product.id.slice(-6).toUpperCase()}
                            </span>
                            {product.isNewDrop && (
                              <span className="bg-neutral-950 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
                                NEW DROP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-neutral-600">{product.category || "—"}</td>

                    <td className="py-3.5">
                      <p className="font-mono font-semibold text-neutral-950 tabular-nums">
                        {formatIDR(Number(product.price))}
                      </p>
                      {product.oldPrice && (
                        <p className="font-mono text-[10px] text-neutral-400 line-through">
                          {formatIDR(Number(product.oldPrice))}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5">
                      {product.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map((sz) => (
                            <span
                              key={sz.id}
                              className={`border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                                sz.stock <= 0
                                  ? "border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                                  : sz.stock <= LOW_STOCK_THRESHOLD
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-neutral-200 bg-white text-neutral-800"
                              }`}
                            >
                              {sz.size}:{sz.stock}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-neutral-700">{product.stock} pcs</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      {product.stock <= 0 ? (
                        <span className="inline-block border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-neutral-500">
                          Habis
                        </span>
                      ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                        <span className="inline-block border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-red-700">
                          Menipis ({product.stock})
                        </span>
                      ) : (
                        <span className="inline-block border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-700">
                          Tersedia ({product.stock})
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="border border-neutral-200 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:border-neutral-950 hover:text-neutral-950 transition-colors"
                        >
                          Toko ↗
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="border border-neutral-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError("");
                            setDeleteId(product.id);
                          }}
                          className="border border-red-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-[2px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteId(null);
          }}
        >
          <div className="w-full max-w-sm border border-neutral-950 bg-white p-6 space-y-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
              [KONFIRMASI HAPUS]
            </span>
            <h3 className="text-base font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
              Hapus Produk Permanen?
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Artikel <strong className="text-neutral-950">{productToDelete?.name}</strong> beserta galeri foto dan stok ukurannya akan dihapus dari database.
            </p>

            {actionError && (
              <div className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {actionError}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 border border-neutral-200 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-700 hover:border-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
