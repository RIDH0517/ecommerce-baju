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

const DEFAULT_BANNER: BannerData = {
  imageUrl:
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1000",
  title: "New Drop Collection",
  description:
    "Koleksi pakaian harian dengan bahan berkualitas dan potongan yang nyaman dipakai setiap hari.",
  tag: null,
};

interface BannerData {
  id?: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  tag?: string | null;
}

const CATEGORIES = ["All", "Outerwear", "T-Shirts", "Jackets", "Shirts", "Denim"];

export default function CatalogPage() {
  const { addToCart, reviews } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loadedKey, setLoadedKey] = useState("");
  const productKey = `${selectedCategory}|${searchQuery}`;
  const isLoadingProducts = loadedKey !== productKey;

  const [banners, setBanners] = useState<BannerData[]>([DEFAULT_BANNER]);
  const [activeSlide, setActiveSlide] = useState(0);

  // Fetch semua banner aktif untuk carousel
  useEffect(() => {
    let active = true;
    fetch("/api/banners", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.imageUrl ? [data] : [];
        if (list.length > 0) {
          setBanners(
            list.map((b: BannerData) => ({
              id: b.id,
              imageUrl: b.imageUrl,
              title: b.title || DEFAULT_BANNER.title,
              description: b.description || DEFAULT_BANNER.description,
              tag: b.tag || null,
            }))
          );
          setActiveSlide(0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Auto-slide carousel banner otomatis tiap 4 detik (reset timer saat diganti manual)
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeSlide, banners.length]);

  // Fetch produk dari DB
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProductCardData[]) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadedKey(productKey);
      });

    return () => {
      active = false;
    };
  }, [selectedCategory, searchQuery, productKey]);

  const safeIndex = banners.length > 0 ? activeSlide % banners.length : 0;

  const goPrevSlide = () =>
    setActiveSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const goNextSlide = () =>
    setActiveSlide((prev) => (prev + 1) % banners.length);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
          {/* Editorial Hero Carousel — Ukuran Tetap (Fixed) & Gambar Lebih Lebar */}
          <section className="grid grid-cols-1 lg:grid-cols-12 lg:h-[460px] border border-neutral-200 bg-neutral-950 text-white overflow-hidden">
            {/* Kolom Kiri: Deskripsi Bergulir + Kontrol Slide (4-5 kolom) */}
            <div className="lg:col-span-5 xl:col-span-4 lg:h-full p-5 sm:p-8 lg:p-10 flex flex-col justify-between gap-5 sm:gap-6 order-2 lg:order-1 overflow-hidden">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                >
                  {banners.map((b, idx) => (
                    <div key={b.id ?? idx} className="w-full flex-shrink-0 space-y-4">
                      {b.tag && (
                        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
                          {b.tag}
                        </span>
                      )}
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.12] line-clamp-3 font-[Montserrat,sans-serif]">
                        {b.title}
                      </h1>
                      <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed line-clamp-4">
                        {b.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/new-drop"
                    className="bg-white text-neutral-950 hover:bg-emerald-500 hover:text-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors font-[Montserrat,sans-serif]"
                  >
                    Explore New Drop →
                  </Link>
                  <Link
                    href="/collections"
                    className="border border-neutral-700 hover:border-white px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-300 hover:text-white transition-colors"
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

            {/* Kolom Kanan: Track Gambar Ukuran Tetap Lebih Lebar (7-8 kolom) */}
            <div className="lg:col-span-7 xl:col-span-8 relative h-[220px] sm:h-[340px] lg:h-full bg-neutral-900 border-b lg:border-b-0 lg:border-l border-neutral-800 overflow-hidden order-1 lg:order-2">
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
                      className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Filter & Search Bar */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200 pb-5 sm:pb-6">
            <div className="flex overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 sm:flex-wrap gap-1.5 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer flex-shrink-0 ${
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
                className="w-full border border-neutral-200 bg-neutral-50/70 pl-9 pr-8 py-2 text-xs text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-950 focus:outline-none transition-colors"
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
                  {searchQuery || selectedCategory !== "All"
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
