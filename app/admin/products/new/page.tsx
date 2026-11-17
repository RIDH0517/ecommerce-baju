"use client";

import Link from "next/link";
import ProductForm from "../_components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-block font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-950"
        >
          ← Kembali ke Daftar Produk
        </Link>
        <div className="mt-3 border-b border-neutral-200 pb-5">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            [02 / NEW ARTICLE]
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
            Tambah Produk Baru
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Lengkapi foto artikel, harga, spesifikasi material, dan stok per ukuran.
          </p>
        </div>
      </div>

      <ProductForm mode="new" />
    </div>
  );
}
