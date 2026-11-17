"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
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
  images: ProductImage[];
  sizes: ProductSize[];
}

const CATEGORIES = ["All", "Outerwear", "T-Shirts", "Jackets", "Shirts", "Denim"];

function formatIDR(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function ProductCardSkeleton() {
  return (
    <div className="border border-neutral-200/80 bg-white animate-pulse">
      <div className="aspect-[4/5] w-full bg-neutral-100" />
      <div className="p-5 space-y-2">
        <div className="h-3 bg-neutral-100 rounded w-1/3" />
        <div className="h-4 bg-neutral-100 rounded w-3/4" />
        <div className="h-4 bg-neutral-100 rounded w-1/2" />
      </div>
      <div className="px-5 pb-5 grid grid-cols-2 gap-2">
        <div className="h-9 bg-neutral-100 rounded" />
        <div className="h-9 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { addToCart, reviews } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
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
      .then((data: Product[]) => {
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
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Editorial Hero Carousel — Ukuran Tetap (Fixed) & Gambar Lebih Lebar */}
          <section className="grid grid-cols-1 lg:grid-cols-12 lg:h-[460px] border border-neutral-200 bg-neutral-950 text-white overflow-hidden">
            {/* Kolom Kiri: Deskripsi Bergulir + Kontrol Slide (4-5 kolom) */}
            <div className="lg:col-span-5 xl:col-span-4 lg:h-full p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 order-2 lg:order-1 overflow-hidden">
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
            <div className="lg:col-span-7 xl:col-span-8 relative h-[280px] sm:h-[360px] lg:h-full bg-neutral-900 border-b lg:border-b-0 lg:border-l border-neutral-800 overflow-hidden order-1 lg:order-2">
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
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kategori..."
                className="w-full border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-950 focus:border-neutral-950 focus:outline-none"
              />
            </div>
          </section>

          {/* Product Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {isLoadingProducts ? (
              Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 gap-3">
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

                const mainImage =
                  product.images?.find((img) => img.order === 0)?.url ||
                  product.images?.[0]?.url ||
                  product.imageUrl;

                // Size default untuk "Quick Add" — ukuran pertama yang masih ada stok
                const defaultSize =
                  product.sizes?.find((s) => s.stock > 0)?.size || "M";

                return (
                  <div
                    key={product.id}
                    className="group flex flex-col justify-between border border-neutral-200/80 bg-white transition-all duration-300 hover:border-neutral-950"
                  >
                    <div>
                      {/* Clickable Product Image */}
                      <Link
                        href={`/product/${product.id}`}
                        className="block relative aspect-[4/5] w-full overflow-hidden bg-neutral-100"
                      >
                        {product.discount && (
                          <span className="absolute top-3 left-3 z-10 bg-neutral-950 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                            {product.discount}
                          </span>
                        )}
                        {product.isNewDrop && (
                          <span className="absolute top-3 right-3 z-10 bg-emerald-600 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                            NEW
                          </span>
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                          <span>{product.category || "—"}</span>
                          <span className="flex items-center space-x-1 text-neutral-900">
                            <svg className="w-3 h-3 text-amber-500 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{avgRating}</span>
                            <span className="text-neutral-400">({productReviews.length})</span>
                          </span>
                        </div>

                        <Link href={`/product/${product.id}`} className="block">
                          <h2 className="text-sm font-bold text-neutral-950 group-hover:text-emerald-700 transition-colors line-clamp-1 font-[Montserrat,sans-serif]">
                            {product.name}
                          </h2>
                        </Link>

                        <div className="flex items-baseline space-x-2.5 pt-1 font-mono">
                          <span className="text-sm font-bold text-neutral-950">
                            {formatIDR(Number(product.price))}
                          </span>
                          {product.oldPrice && (
                            <span className="text-xs text-neutral-400 line-through">
                              {formatIDR(Number(product.oldPrice))}
                            </span>
                          )}
                        </div>

                        {/* Size availability dots */}
                        {product.sizes?.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {product.sizes.map((sz) => (
                              <span
                                key={sz.size}
                                className={`text-[9px] font-mono font-bold border px-1 py-0.5 ${
                                  sz.stock > 0
                                    ? "border-neutral-300 text-neutral-600"
                                    : "border-neutral-100 text-neutral-300 line-through"
                                }`}
                              >
                                {sz.size}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-2">
                      <Link
                        href={`/product/${product.id}`}
                        className="border border-neutral-300 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:border-neutral-950 hover:bg-neutral-50 transition-colors"
                      >
                        Detail & Size
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: Number(product.price),
                            image: mainImage,
                            size: defaultSize,
                            category: product.category || "",
                          })
                        }
                        className="bg-neutral-950 hover:bg-emerald-700 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                      >
                        + Add ({defaultSize})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </main>
      </PageTransition>
    </div>
  );
}
