"use client";

import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import { PRODUCTS_DATA, useCart } from "@/app/(store)/context/CartContext";

export default function NewDropPage() {
  const { addToCart } = useCart();
  const newDropProducts = PRODUCTS_DATA.filter((p) => p.isNewDrop);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Header Rilis Terbatas */}
          <div className="border-b border-neutral-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                [DROP 01 — LIMITED ARCHIVE RELEASE]
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
                AUTUMN / WINTER 2026 DROP
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">
                Diproduksi dalam jumlah terbatas per artikel. Setiap potong pakaian diberi nomor seri produksi dan tidak akan diproduksi ulang setelah stok habis.
              </p>
            </div>

            <div className="flex items-center space-x-4 border border-neutral-200 bg-neutral-50 px-5 py-3 font-mono">
              <div>
                <span className="block text-[10px] uppercase text-neutral-400">
                  Release Status
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  LIVE — IN STOCK
                </span>
              </div>
              <span className="text-neutral-300">|</span>
              <div>
                <span className="block text-[10px] uppercase text-neutral-400">
                  Edition
                </span>
                <span className="text-xs font-bold text-neutral-950">
                  AW26-001
                </span>
              </div>
            </div>
          </div>

          {/* Daftar Artikel New Drop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newDropProducts.map((product, index) => (
              <div
                key={product.id}
                className="group border border-neutral-200 bg-white flex flex-col justify-between hover:border-neutral-950 transition-all"
              >
                <div>
                  <Link
                    href={`/product/${product.id}`}
                    className="block relative aspect-[4/5] bg-neutral-100 overflow-hidden"
                  >
                    <span className="absolute top-3 left-3 z-10 bg-emerald-700 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                      DROP 0{index + 1}
                    </span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </Link>

                  <div className="p-4 space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                      <span>{product.code}</span>
                      <span>SISA: {product.stock} PCS</span>
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <h2 className="text-xs font-bold text-neutral-950 group-hover:text-emerald-700 transition-colors line-clamp-2 font-[Montserrat,sans-serif]">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="font-mono text-xs font-bold text-neutral-950 pt-1">
                      {formatIDR(product.price)}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <Link
                    href={`/product/${product.id}`}
                    className="border border-neutral-300 py-2 text-center text-[10px] font-bold uppercase tracking-wider hover:border-neutral-950"
                  >
                    Pilih Size
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        size: "L",
                        category: product.category,
                      })
                    }
                    className="bg-neutral-950 hover:bg-emerald-700 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                  >
                    + Add (L)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}