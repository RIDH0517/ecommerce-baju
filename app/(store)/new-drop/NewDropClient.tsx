"use client";

import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import PageTransition from "@/app/(store)/components/PageTransition";
import ProductCard from "@/app/(store)/components/ProductCard";
import { useCart } from "@/app/(store)/context/CartContext";
import type { StorefrontProduct } from "@/lib/storefront";

export default function NewDropClient({
  initialProducts,
}: {
  initialProducts: StorefrontProduct[];
}) {
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="border-b border-neutral-200 pb-6 sm:pb-8 space-y-2.5">
            <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              Fresh Releases
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
              New Drop Collection
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-xl leading-relaxed">
              Koleksi produk terbaru yang baru saja dirilis. Pilih artikel dan ukuran yang Anda inginkan sebelum kehabisan.
            </p>
          </div>

          {/* Grid (2 Kolom di HP) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {initialProducts.length === 0 ? (
              <div className="col-span-2 lg:col-span-4 flex flex-col items-center justify-center py-20 gap-3 border border-neutral-200/70 bg-neutral-50/40">
                <p className="text-sm text-neutral-400">Belum ada produk New Drop saat ini.</p>
                <Link href="/catalog" className="text-xs font-bold text-emerald-700 underline">
                  Lihat semua produk →
                </Link>
              </div>
            ) : (
              initialProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showStock
                  detailLabel="Pilih Size"
                  onQuickAdd={addToCart}
                />
              ))
            )}
          </div>
        </main>
        <Footer />
      </PageTransition>
    </div>
  );
}
