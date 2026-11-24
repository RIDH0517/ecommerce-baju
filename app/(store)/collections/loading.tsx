import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import { ProductCardSkeleton } from "@/app/(store)/components/ProductCard";

export default function CollectionsLoading() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <div className="space-y-4 border-b border-neutral-200 pb-6 sm:pb-8">
          <div className="h-3 w-24 bg-neutral-100 animate-pulse" />
          <div className="h-8 sm:h-10 w-48 bg-neutral-100 animate-pulse" />
          <div className="h-4 w-full max-w-xl bg-neutral-100 animate-pulse" />
          <div className="flex gap-2 pt-2 overflow-x-auto no-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-36 bg-neutral-100 animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
