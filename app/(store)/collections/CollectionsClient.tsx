"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import PageTransition from "@/app/(store)/components/PageTransition";
import ProductCard from "@/app/(store)/components/ProductCard";
import { useCart } from "@/app/(store)/context/CartContext";
import type { StorefrontProduct } from "@/lib/storefront";

export default function CollectionsClient({
  initialProducts,
}: {
  initialProducts: StorefrontProduct[];
}) {
  const { addToCart } = useCart();
  const [activeCollection, setActiveCollection] = useState("All Collections");

  const collectionsList = useMemo(() => {
    const uniqueCollections = Array.from(
      new Set(initialProducts.map((p) => p.collection).filter(Boolean))
    ) as string[];
    return ["All Collections", ...uniqueCollections];
  }, [initialProducts]);

  const filtered =
    activeCollection === "All Collections"
      ? initialProducts
      : initialProducts.filter((p) => p.collection === activeCollection);

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-neutral-200 pb-6 sm:pb-8">
            <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              Curated Series
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
              Collections
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">
              Pilih dan telusuri produk berdasarkan seri koleksi kami.
            </p>

            {/* Filter koleksi — geser horizontal di HP */}
            <div className="flex overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 sm:flex-wrap gap-2 pt-2 no-scrollbar">
              {collectionsList.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setActiveCollection(col)}
                  className={`min-h-[38px] px-3.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer flex-shrink-0 ${
                    activeCollection === col
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Grid produk (2 Kolom di HP) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {filtered.length === 0 ? (
              <div className="col-span-2 md:col-span-3 flex flex-col items-center justify-center py-20 gap-3 border border-neutral-200/70 bg-neutral-50/40">
                <p className="text-sm text-neutral-400">
                  {activeCollection === "All Collections"
                    ? "Belum ada produk tersedia."
                    : `Tidak ada produk di koleksi "${activeCollection}".`}
                </p>
                <Link href="/catalog" className="text-xs font-bold text-emerald-700 underline">
                  Lihat semua produk →
                </Link>
              </div>
            ) : (
              filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showCollectionBadge
                  showDescription
                  detailLabel="Lihat Detail"
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
