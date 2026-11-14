"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProductForm from "../../_components/ProductForm";

interface ProductSize {
  size: string;
  stock: number;
}

interface ProductImage {
  url: string;
  order: number;
}

interface ProductDetail {
  id: string;
  name: string;
  category: string | null;
  collection: string | null;
  description: string | null;
  specs: string[];
  price: number;
  oldPrice: number | null;
  discount: string | null;
  isNewDrop: boolean;
  imageUrl: string;
  images: ProductImage[];
  sizes: ProductSize[];
}

export default function EditProductPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/products/${id}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) setProduct(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-[Inter,system-ui,sans-serif]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 sm:px-8 h-14">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-[15px] font-black tracking-[-0.04em] text-stone-900"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              urban<span className="text-emerald-600">.</span>kamen
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-stone-200" />
            <span className="hidden sm:inline-block text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400">
              Edit Produk
            </span>
          </div>
          <Link
            href="/admin/products"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 transition-colors"
          >
            ← Daftar Produk
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 rounded-full border-2 border-stone-300 border-t-stone-900"
            />
            <p className="text-xs text-stone-400 tracking-widest uppercase">Memuat produk…</p>
          </div>
        ) : notFound || !product ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-sm font-semibold text-stone-500">Produk tidak ditemukan</p>
            <Link
              href="/admin/products"
              className="rounded-full bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white"
            >
              ← Kembali
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1
                className="text-2xl font-black tracking-[-0.03em]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Edit Produk
              </h1>
              <p className="text-xs text-stone-400 mt-1 truncate max-w-sm">
                {product.name}
              </p>
            </div>

            <ProductForm
              mode="edit"
              initialData={{
                id: product.id,
                name: product.name,
                category: product.category || "",
                collection: product.collection || "",
                description: product.description || "",
                specs: product.specs || [],
                price: String(product.price),
                oldPrice: product.oldPrice ? String(product.oldPrice) : "",
                discount: product.discount || "",
                isNewDrop: product.isNewDrop,
                imageUrl: product.imageUrl,
                images: product.images || [],
                sizes: product.sizes || [],
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
