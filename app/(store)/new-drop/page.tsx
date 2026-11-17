"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
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
  price: number;
  oldPrice: number | null;
  discount: string | null;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  images: ProductImage[];
  sizes: ProductSize[];
}

function formatIDR(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function CardSkeleton() {
  return (
    <div className="border border-neutral-200 bg-white animate-pulse">
      <div className="aspect-[4/5] bg-neutral-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-neutral-100 rounded w-1/2" />
        <div className="h-4 bg-neutral-100 rounded w-3/4" />
        <div className="h-4 bg-neutral-100 rounded w-1/4" />
      </div>
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <div className="h-8 bg-neutral-100 rounded" />
        <div className="h-8 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

export default function NewDropPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.ok ? res.json() : [])
      .then((data: Product[]) => {
        // Filter hanya produk isNewDrop = true
        setProducts(data.filter((p) => p.isNewDrop));
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Header */}
          <div className="border-b border-neutral-200 pb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
              New Drop Collection
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-500 max-w-xl leading-relaxed">
              Koleksi produk terbaru yang baru saja dirilis. Pilih artikel dan ukuran yang Anda inginkan sebelum kehabisan.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : products.length === 0 ? (
              <div className="col-span-4 flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-sm text-neutral-400">Belum ada produk New Drop saat ini.</p>
                <Link href="/catalog" className="text-xs font-bold text-emerald-700 underline">
                  Lihat semua produk →
                </Link>
              </div>
            ) : (
              products.map((product) => {
                const mainImage =
                  product.images?.find((img) => img.order === 0)?.url ||
                  product.images?.[0]?.url ||
                  product.imageUrl;

                const defaultSize =
                  product.sizes?.find((s) => s.stock > 0)?.size || "M";

                return (
                  <div
                    key={product.id}
                    className="group border border-neutral-200 bg-white flex flex-col justify-between hover:border-neutral-950 transition-all"
                  >
                    <div>
                      <Link
                        href={`/product/${product.id}`}
                        className="block relative aspect-[4/5] bg-neutral-100 overflow-hidden"
                      >
                        <span className="absolute top-3 left-3 z-10 bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          New
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </Link>

                      <div className="p-4 space-y-1.5">
                        <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                          <span>{product.category || "—"}</span>
                          <span>
                            SISA:{" "}
                            <span className={product.stock < 5 ? "text-red-500 font-bold" : ""}>
                              {product.stock} PCS
                            </span>
                          </span>
                        </div>
                        <Link href={`/product/${product.id}`}>
                          <h2 className="text-xs font-bold text-neutral-950 group-hover:text-emerald-700 transition-colors line-clamp-2 font-[Montserrat,sans-serif]">
                            {product.name}
                          </h2>
                        </Link>
                        <div className="flex items-baseline gap-2 font-mono pt-1">
                          <span className="text-xs font-bold text-neutral-950">
                            {formatIDR(Number(product.price))}
                          </span>
                          {product.oldPrice && (
                            <span className="text-[10px] text-neutral-400 line-through">
                              {formatIDR(Number(product.oldPrice))}
                            </span>
                          )}
                        </div>
                        {/* Size availability */}
                        {product.sizes?.length > 0 && (
                          <div className="flex items-center gap-1 pt-0.5">
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

                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <Link
                        href={`/product/${product.id}`}
                        className="border border-neutral-300 py-2 text-center text-[10px] font-bold uppercase tracking-wider hover:border-neutral-950 transition-colors"
                      >
                        Pilih Size
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
                        className="bg-neutral-950 hover:bg-emerald-700 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                      >
                        + Add ({defaultSize})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
