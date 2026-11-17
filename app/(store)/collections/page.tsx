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
  description: string | null;
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
      <div className="p-5 space-y-2">
        <div className="h-3 bg-neutral-100 rounded w-1/3" />
        <div className="h-4 bg-neutral-100 rounded w-3/4" />
        <div className="h-3 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-1/3" />
      </div>
      <div className="px-5 pb-5 grid grid-cols-2 gap-2">
        <div className="h-9 bg-neutral-100 rounded" />
        <div className="h-9 bg-neutral-100 rounded" />
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState("All Collections");
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.ok ? res.json() : [])
      .then((data: Product[]) => {
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
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-neutral-200 pb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
              Collections
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">
              Pilih dan telusuri produk berdasarkan seri koleksi kami.
            </p>

            {/* Filter koleksi — dynamic dari DB */}
            <div className="flex flex-wrap gap-2 pt-2">
              {isLoading ? (
                // Skeleton filter buttons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 w-36 bg-neutral-100 animate-pulse rounded" />
                ))
              ) : (
                collectionsList.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setActiveCollection(col)}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                      activeCollection === col
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950"
                    }`}
                  >
                    {col}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Grid produk */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 gap-3">
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
              filtered.map((product) => {
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
                        {product.collection && (
                          <span className="absolute bottom-3 left-3 z-10 bg-white/95 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-950">
                            {product.collection}
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
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </Link>

                      <div className="p-5 space-y-2">
                        <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                          <span>{product.collection || "—"}</span>
                          <span>{product.category || "—"}</span>
                        </div>
                        <Link href={`/product/${product.id}`}>
                          <h2 className="text-sm font-bold text-neutral-950 group-hover:text-emerald-700 transition-colors font-[Montserrat,sans-serif]">
                            {product.name}
                          </h2>
                        </Link>
                        {product.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-baseline gap-2 font-mono pt-1">
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

                    <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/product/${product.id}`}
                        className="border border-neutral-300 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider hover:border-neutral-950 transition-colors"
                      >
                        Lihat Detail
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
                        + Add to Bag
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
