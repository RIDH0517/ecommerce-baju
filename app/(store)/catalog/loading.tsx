import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import { ProductCardSkeleton } from "@/app/(store)/components/ProductCard";

export default function CatalogLoading() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Editorial Dark Hero Skeleton — tanpa gambar Unsplash palsu */}
        <section
          aria-hidden="true"
          className="grid grid-cols-1 lg:grid-cols-12 lg:h-[460px] border border-neutral-200 bg-neutral-950 text-white overflow-hidden"
        >
          <div className="lg:col-span-5 lg:h-full p-5 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="h-3 w-28 bg-neutral-800 animate-pulse" />
              <div className="space-y-2.5">
                <div className="h-7 sm:h-8 w-4/5 bg-neutral-800 animate-pulse" />
                <div className="h-7 sm:h-8 w-3/5 bg-neutral-800 animate-pulse" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-full bg-neutral-800/80 animate-pulse" />
                <div className="h-3.5 w-5/6 bg-neutral-800/80 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <div className="h-10 w-40 bg-neutral-800 animate-pulse" />
              <div className="h-10 w-28 border border-neutral-800 bg-neutral-900 animate-pulse" />
            </div>
          </div>

          <div className="lg:col-span-7 relative h-[220px] sm:h-[340px] lg:h-full bg-neutral-900 border-b lg:border-b-0 lg:border-l border-neutral-800 flex items-center justify-center order-1 lg:order-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800/40 to-neutral-950 animate-pulse" />
            <span className="relative font-[Montserrat,sans-serif] text-lg sm:text-xl font-black tracking-tighter text-neutral-800 select-none">
              urban<span className="text-emerald-900">.</span>kamen
            </span>
          </div>
        </section>

        {/* Filter & Search Bar Skeleton */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200 pb-5 sm:pb-6">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-20 sm:w-24 bg-neutral-100 animate-pulse flex-shrink-0" />
            ))}
          </div>
          <div className="h-9 w-full md:w-72 bg-neutral-100 animate-pulse" />
        </section>

        {/* Product Grid Skeleton (2 Kolom di HP) */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-y-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
