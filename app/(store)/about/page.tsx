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
          {/* Header Manifesto */}
          <section className="space-y-6 border-b border-neutral-200 pb-12">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">
              [MANIFESTO & ATELIER STANDARD]
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] font-[Montserrat,sans-serif]">
              CRAFTED WITHOUT COMPROMISE. BUILT FOR PERMANENCE.
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-3xl">
              Didirikan dengan visi mendefinisikan ulang pakaian esensial kontemporer, <strong>urban.kamen</strong> menggabungkan siluet arsitektural jalanan dengan standar konstruksi garmen kelas berat (heavyweight). Kami menolak siklus fast-fashion dengan merancang artikel yang semakin berkarakter seiring waktu pemakaian.
            </p>
          </section>

          {/* 3 Pilar Kualitas */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-neutral-200 p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-neutral-400">
                01 / MATERIAL DENSITY
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Heavyweight Grade Fabrics
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Seluruh koleksi kaos dan outerwear kami menggunakan katun murni berdensitas 280 GSM hingga 420 GSM serta denim selvedge 14 oz untuk struktur jatuh kain yang tegas.
              </p>
            </div>

            <div className="border border-neutral-200 p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-neutral-400">
                02 / SMALL-BATCH PRODUCTION
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Precision Tailoring
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Diproduksi dalam jumlah terbatas untuk memastikan kontrol kualitas jahitan rantai ganda, presisi kerah anti-melar, dan pencucian enzim ramah lingkungan.
              </p>
            </div>

            <div className="border border-neutral-200 p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-neutral-400">
                03 / VERIFIED TRANSPARENCY
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Direct-to-Archive
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Setiap ulasan pada katalog kami terverifikasi langsung dari riwayat transaksi pelanggan resmi untuk menjamin keakuratan penilaian ukuran dan material.
              </p>
            </div>
          </section>

          {/* Call to Action */}
          <section className="border border-neutral-950 bg-neutral-950 text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="text-lg font-black uppercase tracking-wider font-[Montserrat,sans-serif]">
                Explore The AW26 Archive
              </h3>
              <p className="text-xs text-neutral-400">
                Temukan siluet esensial terbaru yang tersedia untuk pengiriman langsung hari ini.
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