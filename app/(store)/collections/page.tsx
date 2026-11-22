"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import PageTransition from "@/app/(store)/components/PageTransition";
import ProductCard, {
  ProductCardData,
  ProductCardSkeleton,
} from "@/app/(store)/components/ProductCard";
import { useCart } from "@/app/(store)/context/CartContext";

export default function CollectionsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState("All Collections");
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProductCardData[]) => {
        setProducts(data);
        // Build daftar koleksi unik dari data DB
        const uniqueCollections = Array.from(
          new Set(data.map((p) => p.collection).filter(Boolean))
        ) as string[];
        setCollections(uniqueCollections);
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  const collectionsList = ["All Collections", ...collections];

  const filtered =
    activeCollection === "All Collections"
      ? products
      : products.filter((p) => p.collection === activeCollection);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
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
              {isLoading ? (
                // Skeleton filter buttons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 w-36 bg-neutral-100 animate-pulse flex-shrink-0" />
                ))
              ) : (
                collectionsList.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setActiveCollection(col)}
                    className={`px-3.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer flex-shrink-0 ${
                      activeCollection === col
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950 hover:text-neutral-950"
                    }`}
                  >
                    {col}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Grid produk (2 Kolom di HP) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : filtered.length === 0 ? (
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
