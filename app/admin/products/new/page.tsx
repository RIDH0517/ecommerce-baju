"use client";

import Link from "next/link";
import ProductForm from "../_components/ProductForm";

export default function NewProductPage() {
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
              Produk Baru
            </span>
          </div>
          <Link
            href="/admin/products"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 transition-colors"
          >
            ← Daftar Produk
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-black tracking-[-0.03em]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Tambah Produk Baru
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Isi semua informasi produk, upload foto, dan atur stok per ukuran.
          </p>
        </div>

        <ProductForm mode="new" />
      </main>
    </div>
  );
}
