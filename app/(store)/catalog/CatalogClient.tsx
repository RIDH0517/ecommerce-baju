"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import PageTransition from "@/app/(store)/components/PageTransition";
import ProductCard, { ProductCardSkeleton } from "@/app/(store)/components/ProductCard";
import { useCart } from "@/app/(store)/context/CartContext";
import type { StorefrontBanner, StorefrontProduct } from "@/lib/storefront";

const CATEGORIES = ["All", "Outerwear", "T-Shirts", "Jackets", "Shirts", "Denim"];

interface CatalogClientProps {
  initialBanners: StorefrontBanner[];
  initialProducts: StorefrontProduct[];
}

export default function CatalogClient({
  initialBanners,
  initialProducts,
}: CatalogClientProps) {
  const { addToCart, reviews } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<StorefrontProduct[]>(initialProducts);
  const [loadedKey, setLoadedKey] = useState("All|");
  const hasInteractedRef = useRef(false);

  const banners = initialBanners;
  const [activeSlide, setActiveSlide] = useState(0);

  const productKey = `${selectedCategory}|${debouncedSearch}`;
  const isLoadingProducts = loadedKey !== productKey;

  // Debounce pencarian 300ms agar tidak membanjiri API saat mengetik cepat
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-slide carousel banner otomatis tiap 4 detik
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeSlide, banners.length]);

  // Fetch produk saat filter kategori atau kata kunci pencarian berubah
  useEffect(() => {
    if (!hasInteractedRef.current && selectedCategory === "All" && debouncedSearch === "") {
      return;
    }

    hasInteractedRef.current = true;
    let active = true;
    const controller = new AbortController();

    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: StorefrontProduct[]) => {
        if (active) setProducts(data);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadedKey(productKey);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedCategory, debouncedSearch, productKey]);

  const safeIndex = banners.length > 0 ? activeSlide % banners.length : 0;

  const goPrevSlide = () =>
    setActiveSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const goNextSlide = () =>
    setActiveSlide((prev) => (prev + 1) % banners.length);

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
          {/* Editorial Hero Carousel — Tanpa Foto Unsplash Default */}
          {banners.length > 0 ? (
            <section className="grid grid-cols-1 lg:grid-cols-12 lg:h-[460px] border border-neutral-200 bg-neutral-950 text-white overflow-hidden">
              {/* Kolom Kiri: Deskripsi Bergulir + Kontrol Slide */}
              <div className="lg:col-span-5 lg:h-full p-5 sm:p-8 lg:p-10 flex flex-col justify-between gap-5 sm:gap-6 order-2 lg:order-1 overflow-hidden">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                  >
                    {banners.map((b, idx) => (
                      <div key={b.id ?? idx} className="w-full flex-shrink-0 space-y-3.5">
                        {b.tag && (
                          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
                            {b.tag}
                          </span>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.12] line-clamp-3 font-[Montserrat,sans-serif]">
                          {b.title || "New Drop Collection"}
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed line-clamp-4">
                          {b.description ||
                            "Koleksi pakaian harian dengan bahan berkualitas dan potongan yang nyaman dipakai setiap hari."}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2 flex-shrink-0">
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                    <Link
                      href="/new-drop"
                      className="bg-white text-neutral-950 hover:bg-emerald-500 hover:text-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors font-[Montserrat,sans-serif] whitespace-nowrap"
                    >
                      Explore New Drop →
                    </Link>
                    <Link
                      href="/collections"
                      className="border border-neutral-700 hover:border-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
                    >
                      Lookbook
                    </Link>
                  </div>

                  {banners.length > 1 && (
                    <div className="flex items-center justify-between gap-4 border-t border-neutral-800 pt-4">
                      <div className="flex items-center gap-1.5 flex-1">
                        {banners.map((b, idx) => (
                          <button
                            key={b.id ?? idx}
                            type="button"
                            onClick={() => setActiveSlide(idx)}
                            aria-label={`Pilih banner ${idx + 1}`}
                            className={`h-1 transition-all duration-300 cursor-pointer ${
                              idx === safeIndex
                                ? "w-8 bg-emerald-400"
                                : "w-3 bg-neutral-700 hover:bg-neutral-500"
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-mono text-[10px] text-neutral-400">
                          {String(safeIndex + 1).padStart(2, "0")} /{" "}
                          {String(banners.length).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={goPrevSlide}
                          aria-label="Banner sebelumnya"
                          className="h-8 w-8 border border-neutral-700 flex items-center justify-center font-mono text-xs text-neutral-300 hover:border-white hover:text-white transition-colors cursor-pointer"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={goNextSlide}
                          aria-label="Banner berikutnya"
                          className="h-8 w-8 border border-neutral-700 flex items-center justify-center font-mono text-xs text-neutral-300 hover:border-white hover:text-white transition-colors cursor-pointer"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Track Gambar Banner Asli */}
              <div className="lg:col-span-7 relative h-[220px] sm:h-[340px] lg:h-full bg-neutral-900 border-b lg:border-b-0 lg:border-l border-neutral-800 overflow-hidden order-1 lg:order-2">
                <div
                  className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                >
                  {banners.map((b, idx) => (
                    <div key={b.id ?? idx} className="relative h-full w-full flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.imageUrl}
                        alt={b.title || `urban.kamen Campaign ${idx + 1}`}
                        fetchPriority={idx === 0 ? "high" : "auto"}
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            /* Fallback Editorial Minimalis (jika 0 banner aktif di DB — tanpa foto stok Unsplash) */
            <section className="grid grid-cols-1 lg:grid-cols-12 lg:h-[380px] border border-neutral-200 bg-neutral-950 text-white overflow-hidden">
              <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between gap-6">
                <div className="space-y-3.5">
                  <span className="inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Official Storefront
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-[1.1] font-[Montserrat,sans-serif]">
                    New Drop Collection
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
                    Koleksi pakaian harian dengan bahan berkualitas dan potongan yang nyaman dipakai setiap hari.
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <Link
                    href="/new-drop"
                    className="bg-white text-neutral-950 hover:bg-emerald-500 hover:text-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors font-[Montserrat,sans-serif] whitespace-nowrap"
                  >
                    Explore New Drop →
                  </Link>
                  <Link
                    href="/collections"
                    className="border border-neutral-700 hover:border-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-300 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Lookbook
                  </Link>
                </div>
              </div>

              <div className="hidden lg:flex lg:col-span-6 bg-neutral-900 border-l border-neutral-800 items-center justify-center relative overflow-hidden">
                <div className="text-center space-y-2 select-none">
                  <p className="font-[Montserrat,sans-serif] text-3xl font-black tracking-tighter text-neutral-200">
                    urban<span className="text-emerald-500">.</span>kamen
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-neutral-500">
                    Modern Streetwear Essentials
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Filter & Search Bar */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200 pb-5 sm:pb-6">
            <div className="flex overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 sm:flex-wrap gap-1.5 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[38px] px-3.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer flex-shrink-0 ${
                    selectedCategory === cat
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-transparent bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kategori..."
                className="w-full min-h-[38px] border border-neutral-200 bg-neutral-50/70 pl-9 pr-8 py-2 text-xs text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-950 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm leading-none text-neutral-400 hover:text-neutral-950 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </section>

          {/* Product Grid (2 Kolom di HP) */}
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-y-10">
            {isLoadingProducts ? (
              Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 gap-3 border border-neutral-200/70 bg-neutral-50/40">
                <p className="text-sm text-neutral-400">
                  {debouncedSearch || selectedCategory !== "All"
                    ? "Tidak ada produk yang sesuai filter."
                    : "Belum ada produk tersedia."}
                </p>
              </div>
            ) : (
              products.map((product) => {
                const productReviews = reviews[product.id] || [];
                const avgRating =
                  productReviews.length > 0
                    ? (
                        productReviews.reduce((acc, r) => acc + r.rating, 0) /
                        productReviews.length
                      ).toFixed(1)
                    : "5.0";

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    avgRating={avgRating}
                    reviewCount={productReviews.length}
                    detailLabel="Detail & Size"
                    onQuickAdd={addToCart}
                  />
                );
              })
            )}
          </section>
        </main>
        <Footer />
      </PageTransition>
    </div>
  );
}
