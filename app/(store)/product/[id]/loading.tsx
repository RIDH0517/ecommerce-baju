import Navbar from "@/app/(store)/components/Navbar";
import Footer from "@/app/(store)/components/Footer";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12">
        <div className="h-3.5 w-48 bg-neutral-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14">
          <div className="md:col-span-6 space-y-3">
            <div className="aspect-[4/5] w-full bg-neutral-100 animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-14 bg-neutral-100 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="md:col-span-6 space-y-5 pt-2">
            <div className="h-3.5 w-32 bg-neutral-100 animate-pulse" />
            <div className="h-8 w-3/4 bg-neutral-100 animate-pulse" />
            <div className="h-7 w-40 bg-neutral-100 animate-pulse" />
            <div className="space-y-2 pt-3 border-t border-neutral-100">
              <div className="h-3.5 w-full bg-neutral-100 animate-pulse" />
              <div className="h-3.5 w-5/6 bg-neutral-100 animate-pulse" />
            </div>
            <div className="flex gap-2 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 w-14 bg-neutral-100 animate-pulse" />
              ))}
            </div>
            <div className="h-12 w-full bg-neutral-100 animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
