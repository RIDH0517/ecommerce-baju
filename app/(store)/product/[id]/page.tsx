"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import { PRODUCTS_DATA, useCart } from "@/app/(store)/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = typeof params?.id === "string" ? params.id : "uk-01";

  const {
    addToCart,
    isLoggedIn,
    purchasedIds,
    markAsPurchased,
    reviews,
    addReview,
  } = useCart();

  const product =
    PRODUCTS_DATA.find((p) => p.id === productId) || PRODUCTS_DATA[0];

  const [selectedSize, setSelectedSize] = useState("L");
  const [quantity, setQuantity] = useState(1);

  // State Form Ulasan
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const productReviews = reviews[product.id] || [];
  const hasPurchased = purchasedIds.includes(product.id);

  const averageRating =
    productReviews.length > 0
      ? (
          productReviews.reduce((acc, item) => acc + item.rating, 0) /
          productReviews.length
        ).toFixed(1)
      : "5.0";

  const formatIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: selectedSize,
        category: product.category,
      },
      quantity
    );
  };

  const handleDirectPurchaseSimulation = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    markAsPurchased([product.id]);
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
            <Link href="/catalog" className="hover:text-neutral-950">
              Catalog
            </Link>
            <span>/</span>
            <span className="text-neutral-600">{product.category}</span>
            <span>/</span>
            <span className="text-neutral-950 font-semibold">{product.code}</span>
          </div>

          {/* Bagian Atas: Galeri & Spesifikasi Pembelian */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14">
            {/* Foto Produk */}
            <div className="md:col-span-6">
              <div className="relative aspect-[4/5] w-full bg-neutral-100 border border-neutral-200 overflow-hidden">
                {product.discount && (
                  <span className="absolute top-4 left-4 z-10 bg-neutral-950 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
                    {product.discount}
                  </span>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Detail & Konfigurasi Ukuran */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">
                    {product.collection}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-mono">
                    <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold">{averageRating}</span>
                    <span className="text-neutral-400">
                      ({productReviews.length} Ulasan)
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-[Montserrat,sans-serif] leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-baseline space-x-3 font-mono pt-1">
                  <span className="text-2xl font-bold text-neutral-950">
                    {formatIDR(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatIDR(product.oldPrice)}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-neutral-600 pt-2 border-t border-neutral-200">
                  {product.description}
                </p>

                {/* Spesifikasi Material */}
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
              </div>

              {/* Pemilih Ukuran (Size Selector) */}
              <div className="space-y-5 pt-6 border-t border-neutral-200">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Pilih Ukuran: <span className="font-mono text-emerald-700">{selectedSize}</span>
                    </span>
                    <span className="font-mono text-[11px] text-neutral-500">
                      Stok Tersedia: {product.stock} pcs
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {["S", "M", "L", "XL"].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-xs font-mono font-bold border transition-all cursor-pointer ${
                          selectedSize === size
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kuantitas & Add to Cart */}
                <div className="flex space-x-3">
                  <div className="flex items-center border border-neutral-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-12 text-sm font-bold hover:bg-neutral-100 cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-mono text-xs font-bold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-12 text-sm font-bold hover:bg-neutral-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 bg-neutral-950 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-[0.18em] transition-colors cursor-pointer font-[Montserrat,sans-serif]"
                  >
                    + Add to Bag — {formatIDR(product.price * quantity)}
                  </button>
                </div>

                {/* Tombol Beli Instan untuk Membuka Akses Review Pembeli */}
                <div className="pt-2">
                  {hasPurchased ? (
                    <div className="border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900 flex items-center justify-between">
                      <span className="font-medium">
                        Status: Anda telah membeli produk ini (Verified Buyer).
                      </span>
                      <a href="#reviews" className="font-bold underline">
                        Tulis Ulasan ↓
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDirectPurchaseSimulation}
                      className="w-full border border-neutral-300 hover:border-neutral-950 py-2.5 text-[11px] font-semibold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                    >
                      Simulasi Selesaikan Pembelian Produk Ini (Aktifkan Hak Ulasan Pembeli)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bagian Bawah: Ulasan & Rating Bintang (Verified Buyers Only) */}
          <section id="reviews" className="border-t border-neutral-200 pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Kolom Kiri: Form Ulasan (Khusus Pembeli) */}
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-lg font-black uppercase tracking-tight font-[Montserrat,sans-serif]">
                  Customer Reviews ({productReviews.length})
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Untuk menjaga keaslian penilaian kualitas, ulasan hanya dapat dikirimkan oleh akun yang telah menyelesaikan pembelian artikel ini.
                </p>

                {!isLoggedIn ? (
                  <div className="border border-neutral-200 bg-neutral-50 p-6 space-y-4">
                    <p className="text-xs font-semibold text-neutral-800">
                      Ingin memberikan ulasan untuk produk ini?
                    </p>
                    <p className="text-xs text-neutral-500">
                      Silakan masuk ke akun urban.kamen Anda terlebih dahulu untuk memverifikasi riwayat pesanan.
                    </p>
                    <Link
                      href="/login"
                      className="inline-block bg-neutral-950 text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                    >
                      Login untuk Mengulas
                    </Link>
                  </div>
                ) : !hasPurchased ? (
                  <div className="border border-neutral-200 bg-neutral-50 p-6 space-y-4">
                    <span className="inline-block bg-neutral-200 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-neutral-700">
                      Verified Buyers Only
                    </span>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Akun Anda belum memiliki riwayat pembelian untuk artikel <strong>{product.name}</strong>. Beli produk ini terlebih dahulu untuk membuka formulir ulasan.
                    </p>
                    <button
                      type="button"
                      onClick={handleDirectPurchaseSimulation}
                      className="bg-neutral-950 text-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Beli Sekarang & Buka Form Ulasan
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="border border-neutral-950 p-6 space-y-4 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Tulis Ulasan Anda
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold">
                        [VERIFIED BUYER]
                      </span>
                    </div>

                    {/* Pemilih Bintang Interaktif */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">
                        Rating Kualitas (1 - 5 Bintang)
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
                                star <= ratingInput
                                  ? "text-amber-500 fill-current"
                                  : "text-neutral-300 fill-current"
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
                        className="w-full border border-neutral-300 p-3 text-xs focus:border-neutral-950 focus:outline-none"
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

              {/* Kolom Kanan: Daftar Ulasan Pelanggan */}
              <div className="lg:col-span-7 divide-y divide-neutral-200 border-t lg:border-t-0 border-neutral-200">
                {productReviews.length === 0 ? (
                  <p className="py-8 text-xs text-neutral-500">
                    Belum ada ulasan untuk artikel ini. Jadilah pembeli pertama yang memberikan ulasan.
                  </p>
                ) : (
                  productReviews.map((rev) => (
                    <div key={rev.id} className="py-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-bold text-neutral-950">
                            {rev.userName}
                          </span>
                          <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                            Verified Purchase — Size {rev.sizePurchased}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400">
                          {rev.date}
                        </span>
                      </div>

                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? "text-amber-500 fill-current"
                                : "text-neutral-200 fill-current"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed pt-1">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      </PageTransition>
    </div>
  );
}