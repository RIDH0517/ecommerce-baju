"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import { useCart } from "@/app/(store)/context/CartContext";

const DEFAULT_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1000";
const DEFAULT_BANNER_TITLE = "STRUCTURAL GARMENTS FOR MODERN LIVING.";
const DEFAULT_BANNER_DESC =
  "Konstruksi tekstil berdensitas tinggi dengan potongan presisi. Klik pada setiap artikel di bawah untuk melihat spesifikasi lengkap, memilih ukuran, dan membaca ulasan pembeli terverifikasi.";
const DEFAULT_BANNER_TAG = "[ARCHIVE — AW26]";

interface BannerData {
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
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [banner, setBanner] = useState<BannerData>({
    imageUrl: DEFAULT_BANNER_IMAGE,
    title: DEFAULT_BANNER_TITLE,
    description: DEFAULT_BANNER_DESC,
    tag: DEFAULT_BANNER_TAG,
  });

  // Fetch banner
  useEffect(() => {
    fetch("/api/banners")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.imageUrl) {
          setBanner({
            imageUrl: data.imageUrl,
            title: data.title || DEFAULT_BANNER_TITLE,
            description: data.description || DEFAULT_BANNER_DESC,
            tag: data.tag || DEFAULT_BANNER_TAG,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch produk dari DB
  useEffect(() => {
    setIsLoadingProducts(true);
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setIsLoadingProducts(false));
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Editorial Hero Header */}
          <section className="grid grid-cols-1 lg:grid-cols-12 border border-neutral-200 bg-neutral-950 text-white overflow-hidden">
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                    {banner.tag}
                  </span>
                  <span className="h-[1px] w-8 bg-neutral-700" />
                  <span className="font-mono text-[11px] text-neutral-400">
                    SEMARANG / TOKYO
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] font-[Montserrat,sans-serif]">
                  {banner.title}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
                  {banner.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/new-drop"
                  className="bg-white text-neutral-950 hover:bg-emerald-500 hover:text-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors font-[Montserrat,sans-serif]"
                >
                  Explore New Drop →
                </Link>
                <Link
                  href="/collections"
                  className="border border-neutral-700 hover:border-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-neutral-300 hover:text-white transition-colors"
                >
                  View Lookbook
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800">
              <img
                src={banner.imageUrl}
                alt="urban.kamen Campaign"
                className="h-full w-full object-cover opacity-90"
              />
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
