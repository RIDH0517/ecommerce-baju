"use client";

import Link from "next/link";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />

      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 space-y-16">
          {/* Header */}
          <section className="space-y-4 border-b border-neutral-200 pb-10">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] font-[Montserrat,sans-serif]">
              Tentang urban.kamen
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-3xl">
              <strong>urban.kamen</strong> menghadirkan pakaian harian dengan desain sederhana, potongan rapi, dan bahan yang nyaman serta tahan lama untuk dipakai setiap hari.
            </p>
          </section>

          {/* 3 Pilar Kualitas */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-neutral-200 p-6 space-y-2.5">
              <h2 className="text-sm font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Bahan Berkualitas
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Seluruh koleksi kaos dan outerwear kami menggunakan katun berdensitas 280 GSM hingga 420 GSM serta denim pilihan yang nyaman dan tidak mudah berubah bentuk.
              </p>
            </div>

            <div className="border border-neutral-200 p-6 space-y-2.5">
              <h2 className="text-sm font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Jahitan Rapi &amp; Tahan Lama
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Diproduksi dalam batch terjaga untuk memastikan kontrol kualitas jahitan, kerah yang tidak mudah melar, dan hasil akhir yang konsisten.
              </p>
            </div>

            <div className="border border-neutral-200 p-6 space-y-2.5">
              <h2 className="text-sm font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Ulasan Pelanggan Asli
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Ulasan produk berasal dari pembeli terverifikasi agar membantu Anda memilih ukuran dan model dengan lebih tepat.
              </p>
            </div>
          </section>

          {/* Call to Action */}
          <section className="border border-neutral-950 bg-neutral-950 text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="text-lg font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Koleksi Terbaru
              </h3>
              <p className="text-xs text-neutral-400">
                Temukan pilihan produk terbaru yang siap dipesan hari ini.
              </p>
            </div>
            <Link
              href="/catalog"
              className="bg-white text-neutral-950 hover:bg-emerald-500 hover:text-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors flex-shrink-0 font-[Montserrat,sans-serif]"
            >
              Lihat Katalog →
            </Link>
          </section>
        </main>
      </PageTransition>
    </div>
  );
}