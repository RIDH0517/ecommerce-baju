"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/app/(store)/context/CartContext";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalPrice,
    totalItems,
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 500000;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
  const shippingProgress = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);

  const formatIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) setIsCartOpen(false);
    };

    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  return (
    <div
      aria-hidden={!isCartOpen}
      className={`fixed inset-0 z-50 overflow-hidden font-[Inter,sans-serif] transition-all duration-500 ${
        isCartOpen ? "pointer-events-auto visible" : "pointer-events-none invisible delay-300"
      }`}
    >
      {/* BACKDROP FADE ANIMATION */}
      <div
        onClick={() => setIsCartOpen(false)}
        className={`fixed inset-0 bg-neutral-950/40 backdrop-blur-[2px] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* SLIDE-OVER DRAWER PANEL */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen max-w-[440px] bg-white text-neutral-950 shadow-[0_0_60px_-15px_rgba(0,0,0,0.25)] border-l border-neutral-200/80 flex flex-col justify-between transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* 1. HEADER EDITORIAL */}
          <div className="border-b border-neutral-200/80">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-baseline space-x-2.5">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-950 font-[Montserrat,sans-serif]">
                  Shopping Bag
                </h2>
                <span className="font-mono text-[11px] font-medium text-neutral-400">
                  [{String(totalItems).padStart(2, "0")}]
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Tutup Keranjang"
                className="group flex items-center space-x-1.5 py-1 px-2 text-[11px] font-medium uppercase tracking-widest text-neutral-400 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <span>Close</span>
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* BAR INDIKATOR GRATIS ONGKIR */}
            <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-100">
              <div className="flex justify-between items-center text-[11px] mb-2">
                {remainingForFreeShipping > 0 ? (
                  <p className="text-neutral-600">
                    Tambah <span className="font-semibold text-neutral-950 font-mono">{formatIDR(remainingForFreeShipping)}</span> untuk{" "}
                    <span className="underline decoration-neutral-400 underline-offset-2">Gratis Ongkir</span>
                  </p>
                ) : (
                  <p className="text-neutral-950 font-medium flex items-center space-x-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Pesanan Anda memenuhi syarat Gratis Ongkir standar.</span>
                  </p>
                )}
                <span className="font-mono text-[10px] text-neutral-400">{Math.round(shippingProgress)}%</span>
              </div>
              <div className="h-[2px] w-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full bg-neutral-950 transition-all duration-500 ease-out"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. DAFTAR ITEM KERANJANG */}
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-neutral-200/70">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <svg
                  className="w-10 h-10 text-neutral-300 mb-4 stroke-[1]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="square" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-900 mb-1.5 font-[Montserrat,sans-serif]">
                  Keranjang Anda Kosong
                </p>
                <p className="text-xs text-neutral-500 max-w-[240px] leading-relaxed mb-6">
                  Anda belum memilih artikel apa pun dari koleksi urban.kamen.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="border border-neutral-950 bg-transparent hover:bg-neutral-950 hover:text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer"
                >
                  Eksplorasi Katalog
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="py-6 flex space-x-4 group transition-opacity duration-200"
                >
                  <div className="relative h-28 w-[88px] flex-shrink-0 bg-neutral-100 overflow-hidden border border-neutral-200/60">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-neutral-950 leading-snug line-clamp-2 font-[Montserrat,sans-serif]">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.size)}
                          aria-label="Hapus item"
                          className="text-neutral-400 hover:text-neutral-950 p-0.5 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-1.5 flex items-center space-x-3 text-[11px] text-neutral-500">
                        <span className="uppercase tracking-wider">{item.category}</span>
                        <span className="text-neutral-300">/</span>
                        <span className="font-mono text-neutral-700">SIZE: {item.size}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-3">
                      <div className="inline-flex items-center border border-neutral-200 bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, -1)}
                          aria-label="Kurangi jumlah"
                          className="w-7 h-7 flex items-center justify-center text-xs text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono text-[11px] font-medium text-neutral-950">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, 1)}
                          aria-label="Tambah jumlah"
                          className="w-7 h-7 flex items-center justify-center text-xs text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-xs font-semibold text-neutral-950">
                          {formatIDR(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="font-mono text-[10px] text-neutral-400">
                            {formatIDR(item.price)} / pcs
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 3. FOOTER CHECKOUT */}
          {cart.length > 0 && (
            <div className="border-t border-neutral-200 bg-white p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Pengiriman</span>
                  <span className="font-mono text-[11px] text-neutral-700">
                    {remainingForFreeShipping === 0 ? "GRATIS" : "Dihitung saat checkout"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-950 font-[Montserrat,sans-serif]">
                    Subtotal
                  </span>
                  <span className="font-mono text-base font-bold text-neutral-950">
                    {formatIDR(totalPrice)}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Pajak sudah termasuk. Diskon kode promo dapat dimasukkan di halaman berikutnya.
                </p>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="group relative flex w-full items-center justify-between bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors duration-300 font-[Montserrat,sans-serif]"
                >
                  <span>Proceed to Checkout</span>
                  <span className="flex items-center space-x-2 font-mono text-[11px] font-normal">
                    <span>{formatIDR(totalPrice)}</span>
                    <svg
                      className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="square" strokeWidth="1.5" d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 text-center text-[11px] font-medium text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Lanjutkan Belanja
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}