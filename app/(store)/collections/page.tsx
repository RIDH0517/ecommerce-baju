"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import { PRODUCTS_DATA, useCart } from "@/app/(store)/context/CartContext";

export default function CollectionsPage() {
  const { addToCart } = useCart();
  const collectionsList = [
    "All Collections",
    "Monolith Archive AW26",
    "Kyoto Workwear Capsule",
    "Essential Uniform",
  ];
  const [activeCollection, setActiveCollection] = useState("All Collections");

  const filtered =
    activeCollection === "All Collections"
      ? PRODUCTS_DATA
      : PRODUCTS_DATA.filter((p) => p.collection === activeCollection);

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Editorial Lookbook Banner */}
          <div className="space-y-4 border-b border-neutral-200 pb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
              [SEASONAL CURATION & LOOKBOOK]
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">
              CURATED COLLECTIONS
            </h1>
            <div className="flex flex-wrap gap-2 pt-2">
              {collectionsList.map((col) => (
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
              ))}
            </div>
          </div>

          {/* Grid Koleksi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group border border-neutral-200 bg-white flex flex-col justify-between hover:border-neutral-950 transition-all"
              >
                <div>
                  <Link
                    href={`/product/${product.id}`}
                    className="block relative aspect-[4/5] bg-neutral-100 overflow-hidden"
                  >
                    <span className="absolute bottom-3 left-3 z-10 bg-white/95 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-950">
                      {product.collection}
                    </span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </Link>

                  <div className="p-5 space-y-2">
                    <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                      <span>{product.code}</span>
                      <span>{product.category}</span>
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <h2 className="text-sm font-bold text-neutral-950 group-hover:text-emerald-700 transition-colors font-[Montserrat,sans-serif]">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {product.description}
                    </p>
                    <p className="font-mono text-sm font-bold text-neutral-950 pt-1">
                      {formatIDR(product.price)}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/product/${product.id}`}
                    className="border border-neutral-300 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider hover:border-neutral-950"
                  >
                    Lihat Detail
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        size: "L",
                        category: product.category,
                      })
                    }
                    className="bg-neutral-950 hover:bg-emerald-700 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                  >
                    + Add to Bag
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}