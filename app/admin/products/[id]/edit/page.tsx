"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
    let active = true;
    fetch(`/api/admin/products/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          if (active) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (active && data) setProduct(data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/products"
        className="inline-block font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-950"
      >
        ← Kembali ke Daftar Produk
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-neutral-200 animate-pulse" />
          <div className="h-72 bg-white border border-neutral-200 animate-pulse" />
        </div>
      ) : notFound || !product ? (
        <div className="border border-neutral-200 bg-white p-12 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-600">
            Produk tidak ditemukan
          </p>
          <Link
            href="/admin/products"
            className="inline-block bg-neutral-950 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white"
          >
            ← Kembali ke Daftar Produk
          </Link>
        </div>
      ) : (
        <>
          <div className="border-b border-neutral-200 pb-5">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              [02 / EDIT ARTICLE — #{product.id.slice(-6).toUpperCase()}]
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
              Edit Produk
            </h1>
            <p className="mt-1 text-xs text-neutral-500 truncate">{product.name}</p>
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
    </div>
  );
}
