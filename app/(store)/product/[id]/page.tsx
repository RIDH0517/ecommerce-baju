"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import PageTransition from "@/app/(store)/components/PageTransition";
import { useCart } from "@/app/(store)/context/CartContext";

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
  collection: string | null;
  description: string | null;
  specs: string[];
  price: number;
  oldPrice: number | null;
  discount: string | null;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  images: ProductImage[];
  sizes: ProductSize[];
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = typeof params?.id === "string" ? params.id : "";

  const { addToCart, isLoggedIn, purchasedIds, reviews, addReview } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadedId, setLoadedId] = useState("");
  const [notFound, setNotFound] = useState(false);
  const isLoading = Boolean(productId) && loadedId !== productId;

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Review state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) {
          if (active) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: Product | null) => {
        if (!active || !data) return;
        setProduct(data);
        setNotFound(false);
        const firstAvailable = data.sizes?.find((s) => s.stock > 0)?.size || data.sizes?.[0]?.size || "M";
        setSelectedSize(firstAvailable);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoadedId(productId);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-6 aspect-[4/5] bg-neutral-100 animate-pulse" />
            <div className="md:col-span-6 space-y-4 pt-4">
              <div className="h-4 bg-neutral-100 rounded w-1/3 animate-pulse" />
              <div className="h-8 bg-neutral-100 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-neutral-100 rounded w-1/4 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-24 text-center">
          <p className="text-sm text-neutral-500">Produk tidak ditemukan.</p>
          <Link href="/catalog" className="mt-4 inline-block text-xs font-bold text-emerald-700 underline">
            Kembali ke Catalog
          </Link>
        </main>
      </div>
    );
  }

  const productReviews = reviews[product.id] || [];
  const hasPurchased = purchasedIds.includes(product.id);
  const averageRating =
    productReviews.length > 0
      ? (productReviews.reduce((acc, item) => acc + item.rating, 0) / productReviews.length).toFixed(1)
      : "5.0";

  // Galeri gambar (sorted by order)
  const galleryImages =
    product.images?.length > 0
      ? [...product.images].sort((a, b) => a.order - b.order)
      : [{ id: "main", url: product.imageUrl, order: 0 }];

  const safeImageIdx = galleryImages.length > 0 ? activeImageIdx % galleryImages.length : 0;
  const goPrevImage = () =>
    setActiveImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  const goNextImage = () =>
    setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);

  const selectedSizeData = product.sizes?.find((s) => s.size === selectedSize);
  const selectedSizeStock = selectedSizeData?.stock ?? product.stock;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: galleryImages[0]?.url || product.imageUrl,
        size: selectedSize,
        category: product.category || "",
      },
      quantity
    );
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addReview(product.id, ratingInput, selectedSize, commentInput.trim());
    setCommentInput("");
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
            <Link href="/catalog" className="hover:text-neutral-950">Catalog</Link>
            <span>/</span>
            <span className="text-neutral-600">{product.category}</span>
            <span>/</span>
            <span className="text-neutral-950 font-semibold truncate max-w-[200px]">{product.name}</span>
          </div>

          {/* Bagian Atas: Galeri & Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
            {/* ── Galeri Foto ── */}
            <div className="md:col-span-6 space-y-3">
              {/* Foto Utama */}
              <div className="group relative aspect-[4/5] w-full bg-neutral-100 border border-neutral-200/80 overflow-hidden">
                {product.discount && (
                  <span className="absolute top-4 left-4 z-10 bg-neutral-950/95 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
                    {product.discount}
                  </span>
                )}
                {product.isNewDrop && (
                  <span className="absolute top-4 right-4 z-10 bg-emerald-600 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
                    NEW DROP
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryImages[safeImageIdx]?.url}
                  alt={product.name}
                  className="h-full w-full object-cover transition-opacity duration-300"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrevImage}
                      aria-label="Foto sebelumnya"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 border border-neutral-200/80 bg-white/90 backdrop-blur-sm flex items-center justify-center font-mono text-xs text-neutral-950 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={goNextImage}
                      aria-label="Foto berikutnya"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 border border-neutral-200/80 bg-white/90 backdrop-blur-sm flex items-center justify-center font-mono text-xs text-neutral-950 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    >
                      →
                    </button>
                    <span className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-sm border border-neutral-200/80 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-neutral-900 tabular-nums">
                      {String(safeImageIdx + 1).padStart(2, "0")} /{" "}
                      {String(galleryImages.length).padStart(2, "0")}
                    </span>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`flex-shrink-0 h-16 w-14 border transition-all cursor-pointer overflow-hidden ${
                        safeImageIdx === idx
                          ? "border-neutral-950 ring-1 ring-neutral-950"
                          : "border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`foto ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Detail & Konfigurasi ── */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">
                    {product.collection || product.category}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-mono">
                    <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold">{averageRating}</span>
                    <span className="text-neutral-400">({productReviews.length} Ulasan)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-[Montserrat,sans-serif] leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-baseline space-x-3 font-mono tabular-nums pt-1">
                  <span className="text-2xl font-bold text-neutral-950">
                    {formatIDR(Number(product.price))}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatIDR(Number(product.oldPrice))}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-xs sm:text-sm leading-relaxed text-neutral-600 pt-3 border-t border-neutral-200/80">
                    {product.description}
                  </p>
                )}

                {/* Spesifikasi */}
                {product.specs?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-950">
                      Spesifikasi Konstruksi:
                    </span>
                    <ul className="space-y-1 text-xs text-neutral-600">
                      {product.specs.map((spec, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <span className="h-1 w-1 bg-neutral-950" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Pemilih Ukuran & Cart */}
              <div className="space-y-5 pt-6 border-t border-neutral-200/80">
                {/* Size selector */}
                {product.sizes?.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Pilih Ukuran:{" "}
                        <span className="font-mono text-emerald-700">{selectedSize}</span>
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        Stok:{" "}
                        <span className={selectedSizeStock < 5 ? "text-red-500 font-bold" : ""}>
                          {selectedSizeStock} pcs
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz.size}
                          type="button"
                          disabled={sz.stock <= 0}
                          onClick={() => setSelectedSize(sz.size)}
                          title={sz.stock <= 0 ? "Stok habis" : `${sz.stock} pcs tersedia`}
                          className={`min-w-[52px] px-3.5 py-2.5 text-xs font-mono font-bold border transition-all ${
                            sz.stock <= 0
                              ? "border-neutral-200 text-neutral-300 cursor-not-allowed line-through bg-neutral-50"
                              : selectedSize === sz.size
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-950 hover:bg-neutral-50 cursor-pointer"
                          }`}
                        >
                          {sz.size}
                          {sz.stock > 0 && sz.stock < 5 && (
                            <span className="block text-[8px] text-red-400 mt-0.5 font-normal">
                              sisa {sz.stock}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">Stok Tersedia</span>
                    <span className="font-mono text-[11px] text-neutral-500">
                      {product.stock} pcs
                    </span>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center justify-between sm:justify-start border border-neutral-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 sm:w-10 h-12 text-sm font-bold hover:bg-neutral-100 cursor-pointer transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 sm:w-10 text-center font-mono text-xs font-bold tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(Math.min(quantity + 1, selectedSizeStock || product.stock))
                      }
                      className="w-12 sm:w-10 h-12 text-sm font-bold hover:bg-neutral-100 cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={selectedSizeStock <= 0}
                    className="flex-1 bg-neutral-950 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white py-3.5 px-4 text-xs font-bold uppercase tracking-[0.16em] transition-colors cursor-pointer font-[Montserrat,sans-serif] tabular-nums"
                  >
                    {selectedSizeStock <= 0
                      ? "Stok Habis"
                      : `+ Add to Bag — ${formatIDR(Number(product.price) * quantity)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Ulasan ── */}
          <section id="reviews" className="border-t border-neutral-200 pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Form Ulasan */}
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-lg font-black uppercase tracking-tight font-[Montserrat,sans-serif]">
                  Customer Reviews ({productReviews.length})
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Untuk menjaga keaslian penilaian kualitas, ulasan hanya dapat dikirimkan oleh akun yang telah menyelesaikan pembelian artikel ini.
                </p>

                {!isLoggedIn ? (
                  <div className="border border-neutral-200/80 bg-neutral-50/70 p-6 space-y-4">
                    <p className="text-xs font-semibold text-neutral-800">Ingin memberikan ulasan?</p>
                    <p className="text-xs text-neutral-500">
                      Silakan masuk ke akun urban.kamen Anda terlebih dahulu.
                    </p>
                    <Link
                      href={`/login?next=${encodeURIComponent(`/product/${product.id}#reviews`)}`}
                      className="inline-block bg-neutral-950 text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                    >
                      Login untuk Mengulas
                    </Link>
                  </div>
                ) : !hasPurchased ? (
                  <div className="border border-neutral-200/80 bg-neutral-50/70 p-6 space-y-2">
                    <p className="text-xs font-semibold text-neutral-800">Khusus Pembeli Terverifikasi</p>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Hanya akun yang telah menyelesaikan pembelian artikel{" "}
                      <strong>{product.name}</strong> yang dapat menulis ulasan.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="border border-neutral-950 p-6 space-y-4 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">Tulis Ulasan Anda</span>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold">[VERIFIED BUYER]</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">
                        Rating Kualitas (1–5 Bintang)
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className="p-1 cursor-pointer focus:outline-none"
                          >
                            <svg
                              className={`w-6 h-6 transition-colors ${
                                star <= ratingInput ? "text-amber-500 fill-current" : "text-neutral-300 fill-current"
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">
                        Pengalaman Anda terhadap bahan & ukuran ({selectedSize})
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Bagikan pendapat Anda mengenai kualitas jahitan, ketebalan bahan, dan kecocokan ukuran..."
                        className="w-full border border-neutral-200 bg-neutral-50/50 p-3 text-xs focus:bg-white focus:border-neutral-950 focus:outline-none transition-colors"
                      />
                    </div>

                    {reviewSubmitted && (
                      <p className="text-xs font-semibold text-emerald-700">
                        Terima kasih! Ulasan Anda berhasil ditambahkan.
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-neutral-950 hover:bg-emerald-700 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors cursor-pointer"
                    >
                      Kirim Ulasan
                    </button>
                  </form>
                )}
              </div>

              {/* Daftar Ulasan */}
              <div className="lg:col-span-7 space-y-4">
                {productReviews.length === 0 ? (
                  <div className="border border-neutral-200/80 bg-neutral-50/40 p-8 text-center">
                    <p className="text-xs text-neutral-500">
                      Belum ada ulasan. Jadilah pembeli pertama yang memberikan ulasan.
                    </p>
                  </div>
                ) : (
                  productReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="border border-neutral-200/80 bg-white p-5 sm:p-6 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-neutral-950 font-[Montserrat,sans-serif]">
                            {rev.userName}
                          </span>
                          <span className="bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                            Verified Purchase — Size {rev.sizePurchased}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? "text-amber-500 fill-current" : "text-neutral-200 fill-current"}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pt-0.5">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </PageTransition>
    </div>
  );
}
