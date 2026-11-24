"use client";

import Link from "next/link";

export interface ProductCardSize {
  id: string;
  size: string;
  stock: number;
}

export interface ProductCardImage {
  id: string;
  url: string;
  order: number;
}

export interface ProductCardData {
  id: string;
  name: string;
  category: string | null;
  collection?: string | null;
  description?: string | null;
  price: number;
  oldPrice: number | null;
  discount: string | null;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  images: ProductCardImage[];
  sizes: ProductCardSize[];
}

interface ProductCardProps {
  product: ProductCardData;
  avgRating?: string;
  reviewCount?: number;
  showStock?: boolean;
  showCollectionBadge?: boolean;
  showDescription?: boolean;
  detailLabel?: string;
  onQuickAdd: (item: {
    id: string;
    name: string;
    price: number;
    image: string;
    size: string;
    category: string;
  }) => void;
}

function formatIDR(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Skeleton placeholder aligned with the unified ProductCard dimensions.
 */
export function ProductCardSkeleton() {
  return (
    <div className="border border-neutral-200/80 bg-white animate-pulse flex flex-col justify-between">
      <div>
        <div className="aspect-[4/5] w-full bg-neutral-100" />
        <div className="p-3 sm:p-5 space-y-2">
          <div className="h-3 bg-neutral-100 w-1/3" />
          <div className="h-4 bg-neutral-100 w-3/4" />
          <div className="h-4 bg-neutral-100 w-1/2" />
        </div>
      </div>
      <div className="px-3 pb-3 sm:px-5 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        <div className="hidden sm:block h-9 bg-neutral-100" />
        <div className="h-9 bg-neutral-100" />
      </div>
    </div>
  );
}

/**
 * Unified minimalist product card used across catalog, new-drop, and collections.
 */
export default function ProductCard({
  product,
  avgRating,
  reviewCount,
  showStock = false,
  showCollectionBadge = false,
  showDescription = false,
  detailLabel = "Detail & Size",
  onQuickAdd,
}: ProductCardProps) {
  const mainImage =
    product.images?.find((img) => img.order === 0)?.url ||
    product.images?.[0]?.url ||
    product.imageUrl;

  const firstAvailableSize = product.sizes?.find((s) => s.stock > 0)?.size;
  const defaultSize = firstAvailableSize || product.sizes?.[0]?.size || "M";
  const hasSizeOptions = Boolean(product.sizes && product.sizes.length > 0);
  const totalSizeStock = hasSizeOptions
    ? product.sizes.reduce((sum, sz) => sum + sz.stock, 0)
    : product.stock;
  const isOutOfStock = hasSizeOptions ? !firstAvailableSize || totalSizeStock <= 0 : product.stock <= 0;

  return (
    <div className="group flex flex-col justify-between border border-neutral-200/80 bg-white transition-all duration-300 hover:border-neutral-950 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div>
        {/* Clickable Product Image */}
        <Link
          href={`/product/${product.id}`}
          className="block relative aspect-[4/5] w-full overflow-hidden bg-neutral-100"
        >
          {product.discount && (
            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-neutral-950/95 px-2 sm:px-2.5 py-0.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
              {product.discount}
            </span>
          )}
          {product.isNewDrop && (
            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-emerald-600 px-2 sm:px-2.5 py-0.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
              NEW
            </span>
          )}
          {showCollectionBadge && product.collection && (
            <span className="hidden sm:inline-block absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm border border-neutral-200/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-950">
              {product.collection}
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 z-10 bg-white/55 flex items-center justify-center">
              <span className="bg-neutral-950 text-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Sold Out
              </span>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        {/* Product Info */}
        <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider sm:tracking-widest text-neutral-500">
            <span className="truncate">
              {showCollectionBadge
                ? product.collection || product.category || "—"
                : product.category || "—"}
            </span>

            {avgRating !== undefined ? (
              <span className="flex items-center space-x-1 text-neutral-900 flex-shrink-0">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{avgRating}</span>
                {typeof reviewCount === "number" && (
                  <span className="hidden sm:inline text-neutral-400">({reviewCount})</span>
                )}
              </span>
            ) : showStock ? (
              <span className="flex-shrink-0 text-neutral-400">
                SISA:{" "}
                <span className={product.stock < 5 ? "text-red-500 font-bold" : "text-neutral-700 font-semibold"}>
                  {product.stock}
                </span>
              </span>
            ) : showCollectionBadge && product.category ? (
              <span className="hidden sm:inline truncate text-neutral-400">{product.category}</span>
            ) : null}
          </div>

          <Link href={`/product/${product.id}`} className="block">
            <h2 className="text-xs sm:text-sm font-bold text-neutral-950 group-hover:text-emerald-700 transition-colors line-clamp-2 sm:line-clamp-1 font-[Montserrat,sans-serif]">
              {product.name}
            </h2>
          </Link>

          {showDescription && product.description && (
            <p className="hidden sm:line-clamp-2 text-xs text-neutral-500 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-0.5 font-mono tabular-nums">
            <span className="text-xs sm:text-sm font-bold text-neutral-950">
              {formatIDR(Number(product.price))}
            </span>
            {product.oldPrice && (
              <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                {formatIDR(Number(product.oldPrice))}
              </span>
            )}
          </div>

          {/* Size availability */}
          {product.sizes?.length > 0 && (
            <div className="hidden sm:flex flex-wrap items-center gap-1 pt-1">
              {product.sizes.map((sz) => (
                <span
                  key={sz.size}
                  className={`text-[9px] font-mono font-bold border px-1.5 py-0.5 transition-colors ${
                    sz.stock > 0
                      ? "border-neutral-200 bg-neutral-50/70 text-neutral-700"
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
      <div className="px-3 pb-3 sm:px-5 sm:pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        <Link
          href={`/product/${product.id}`}
          className="hidden sm:block border border-neutral-200 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:border-neutral-950 hover:bg-neutral-50 transition-colors"
        >
          {detailLabel}
        </Link>
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() =>
            onQuickAdd({
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image: mainImage,
              size: defaultSize,
              category: product.category || "",
            })
          }
          className="bg-neutral-950 hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
        >
          {isOutOfStock ? "Sold Out" : `+ Add (${defaultSize})`}
        </button>
      </div>
    </div>
  );
}
