import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";
import { ProductCardSkeleton } from "@/app/(store)/components/ProductCard";

export default function NewDropLoading() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <div className="border-b border-neutral-200 pb-6 sm:pb-8 space-y-3">
          <div className="h-3 w-24 bg-neutral-100 animate-pulse" />
          <div className="h-8 sm:h-10 w-64 bg-neutral-100 animate-pulse" />
          <div className="h-4 w-full max-w-xl bg-neutral-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
