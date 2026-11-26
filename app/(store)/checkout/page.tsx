"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import AddressFormModal from "@/app/(store)/account/_components/AddressFormModal";
import { useAuth } from "@/app/(store)/context/AuthContext";
import { useCart } from "@/app/(store)/context/CartContext";
import { MAX_ADDRESSES_PER_USER, type UserAddress } from "@/lib/addresses";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping/config";
import type { ShippingRate } from "@/lib/shipping/types";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/payment/methods";
import { loadMidtransSnap } from "@/lib/payment/snapClient";

interface QuoteLine {
  productId: string;
  size: string;
  quantity: number;
  name: string | null;
  imageUrl: string | null;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  available: boolean;
}

interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  totalQty: number;
  shippingRates: ShippingRate[];
  issues: string[];
  isValid: boolean;
}

interface FormErrors {
  address?: string;
  shipping?: string;
  payment?: string;
}

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const rateKey = (r: Pick<ShippingRate, "courierCode" | "service">) => `${r.courierCode}:${r.service}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const { cart, isHydrated, setIsCartOpen, clearCart, markAsPurchased } = useCart();

  // Buku alamat pelanggan
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; editing: UserAddress | null }>({
    open: false,
    editing: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingKey, setShippingKey] = useState("");
  const [paymentId, setPaymentId] = useState<PaymentMethodId | "">(DEFAULT_PAYMENT_METHOD);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [resolved, setResolved] = useState<{ key: string; error: string }>({ key: "", error: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const fetchAddresses = useCallback(
    async (preferId?: string) => {
      const res = await fetch("/api/account/addresses", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.addresses ?? []) as UserAddress[];
      setAddresses(list);
      setSelectedAddressId((prev) => {
        if (preferId && list.some((a) => a.id === preferId)) return preferId;
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list.find((a) => a.isPrimary)?.id ?? list[0]?.id ?? null;
      });
    },
    [router]
  );

  // Muat daftar alamat begitu user terautentikasi
  useEffect(() => {
    if (authStatus === "guest") {
      router.push("/login?next=/checkout");
      return;
    }
    if (authStatus !== "authenticated") return;

    let active = true;
    fetch("/api/account/addresses", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login?next=/checkout");
          return null;
        }
        if (!res.ok) return null;
        const data = await res.json();
        return (data.addresses ?? []) as UserAddress[];
      })
      .then((list) => {
        if (!active || !list) return;
        setAddresses(list);
        const primary = list.find((a) => a.isPrimary) ?? list[0] ?? null;
        setSelectedAddressId(primary?.id ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAddressesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authStatus, router]);

  const selectedAddress = useMemo(
    () =>
      addresses.find((a) => a.id === selectedAddressId) ??
      addresses.find((a) => a.isPrimary) ??
      addresses[0] ??
      null,
    [addresses, selectedAddressId]
  );

  const selectedProvince = selectedAddress?.province ?? "";
  const selectedCity = selectedAddress?.city ?? "";
  const selectedPostalCode = selectedAddress?.postalCode ?? "";

  // Payload keranjang yang dikirim ke server (tanpa harga, server yang menentukan harga).
  const cartPayload = useMemo(
    () => cart.map((i) => ({ productId: i.id, size: i.size, quantity: i.quantity })),
    [cart]
  );
  const cartSignature = JSON.stringify(cartPayload);
  const requestKey = `${cartSignature}|${selectedProvince}|${selectedPostalCode}`;
  const shouldFetch = isHydrated && cartPayload.length > 0 && authStatus === "authenticated";
  const quoteLoading = shouldFetch && resolved.key !== requestKey;
  const quoteError = resolved.key === requestKey ? resolved.error : "";

  // Ambil ringkasan dari server setiap kali isi keranjang atau alamat berubah.
  useEffect(() => {
    if (!shouldFetch) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartPayload,
        province: selectedProvince,
        city: selectedCity,
        postalCode: selectedPostalCode,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login?next=/checkout");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat ringkasan.");
        setQuote(data as Quote);
        // Reset pilihan kurir jika sudah tidak tersedia untuk provinsi alamat baru.
        setShippingKey((prev) =>
          (data as Quote).shippingRates.some((r) => rateKey(r) === prev) ? prev : ""
        );
        setResolved({ key: requestKey, error: "" });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResolved({ key: requestKey, error: err?.message || "Gagal memuat ringkasan." });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch, requestKey, router]);

  const selectedRate = quote?.shippingRates.find((r) => rateKey(r) === shippingKey) ?? null;
  const subtotal = quote?.subtotal ?? 0;
  const shippingCost = selectedRate?.cost ?? 0;
  const total = subtotal + shippingCost;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleAddressSaved = async (saved: UserAddress) => {
    setFormModal({ open: false, editing: null });
    setErrors((prev) => ({ ...prev, address: undefined }));
    await fetchAddresses(saved.id);
    setSelectedAddressId(saved.id);
    setIsPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitNotice("");

    const v: FormErrors = {};
    if (!selectedAddress) v.address = "Pilih atau tambahkan alamat pengiriman terlebih dahulu.";
    if (!shippingKey) v.shipping = "Pilih jasa pengiriman.";
    if (!paymentId) v.payment = "Pilih metode pembayaran.";
    setErrors(v);

    if (Object.keys(v).length > 0) {
      document.getElementById(`field-${Object.keys(v)[0]}`)?.focus();
      return;
    }

    if (!selectedAddress || !selectedRate) return;

    const purchasedProductIds = [...new Set(cartPayload.map((i) => i.productId))];
    setSubmitting(true);
    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress.id,
          courierCode: selectedRate.courierCode,
          service: selectedRate.service,
          paymentMethod: paymentId,
          items: cartPayload,
        }),
      });

      if (checkoutRes.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        // Segarkan ringkasan bila stok berubah di server
        if (checkoutRes.status === 409) {
          const quoteRes = await fetch("/api/checkout/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cartPayload,
              province: selectedProvince,
              city: selectedCity,
              postalCode: selectedPostalCode,
              courierCode: selectedRate.courierCode,
              service: selectedRate.service,
            }),
          });
          if (quoteRes.ok) {
            setQuote((await quoteRes.json()) as Quote);
          }
        }
        throw new Error(checkoutData.error || "Gagal membuat pesanan pembayaran.");
      }

      const {
        orderId,
        snapToken,
        redirectUrl,
        snapClientKey,
        snapScriptUrl,
      } = checkoutData as {
        orderId: string;
        snapToken: string;
        redirectUrl: string;
        snapClientKey: string;
        snapScriptUrl: string;
      };

      // Jaga halaman tetap tenang selama popup QRIS terbuka meskipun keranjang dikosongkan
      setCompletedOrderId(orderId);
      clearCart();

      const finalizeAndRedirect = async () => {
        try {
          const verifyRes = await fetch(`/api/account/orders/${encodeURIComponent(orderId)}/verify`, {
            method: "POST",
          });
          if (verifyRes.ok) {
            const verifyJson = await verifyRes.json();
            if (verifyJson?.order?.payment?.status === "SUCCESS") {
              markAsPurchased(purchasedProductIds);
            }
          }
        } catch {
          // Abaikan error jaringan sementara; halaman detail pesanan akan mengecek ulang
        }
        router.push(`/account/orders/${orderId}`);
      };

      try {
        await loadMidtransSnap(snapScriptUrl, snapClientKey);
      } catch {
        if (redirectUrl) {
          window.location.assign(redirectUrl);
          return;
        }
        router.push(`/account/orders/${orderId}`);
        return;
      }

      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            void finalizeAndRedirect();
          },
          onPending: () => {
            void finalizeAndRedirect();
          },
          onError: () => {
            void finalizeAndRedirect();
          },
          onClose: () => {
            void finalizeAndRedirect();
          },
        });
      } else if (redirectUrl) {
        window.location.assign(redirectUrl);
      } else {
        router.push(`/account/orders/${orderId}`);
      }
    } catch (err) {
      setSubmitNotice(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  };

  // ── Loading awal ──
  if (!isHydrated || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="h-8 w-48 bg-neutral-100 animate-pulse" />
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 h-96 bg-neutral-100 animate-pulse" />
            <div className="lg:col-span-5 h-72 bg-neutral-100 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  // ── Menunggu popup pembayaran QRIS / pengalihan ke halaman pesanan ──
  if (completedOrderId) {
    return (
      <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-xl px-4 py-28 text-center space-y-4">
            <span className="inline-block border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              QRIS MIDTRANS AKTIF
            </span>
            <h1 className="text-2xl font-black tracking-tight font-[Montserrat,sans-serif]">
              SELESAIKAN PEMBAYARAN QRIS
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Silakan scan kode QRIS pada jendela pembayaran Midtrans. Jika jendela tertutup, Anda dapat membukanya kembali dari halaman detail pesanan.
            </p>
            <div className="pt-4">
              <Link
                href={`/account/orders/${completedOrderId}`}
                className="inline-block bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif]"
              >
                Lihat Detail Pesanan →
              </Link>
            </div>
          </main>
        </PageTransition>
      </div>
    );
  }

  // ── Keranjang kosong ──
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-xl px-4 py-28 text-center">
            <h1 className="text-2xl font-black tracking-tight font-[Montserrat,sans-serif]">
              KERANJANG ANDA KOSONG
            </h1>
            <p className="mt-3 text-sm text-neutral-500">Tambahkan artikel dari katalog sebelum melanjutkan ke checkout.</p>
            <Link
              href="/catalog"
              className="mt-8 inline-block bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif]"
            >
              Lihat Katalog →
            </Link>
          </main>
        </PageTransition>
      </div>
    );
  }

  const cartImageByKey = new Map(cart.map((i) => [`${i.id}::${i.size.toUpperCase()}`, i]));
  const summaryLines: QuoteLine[] =
    quote?.lines ??
    cart.map((i) => ({
      productId: i.id,
      size: i.size,
      quantity: i.quantity,
      name: i.name,
      imageUrl: i.image,
      unitPrice: i.price,
      lineTotal: i.price * i.quantity,
      availableStock: 0,
      available: true,
    }));

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Header */}
          <div className="border-b border-neutral-200 pb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">Checkout</h1>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-950 underline underline-offset-4 cursor-pointer"
              >
                Ubah Keranjang
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* ═════════ KOLOM KIRI ═════════ */}
            <div className="lg:col-span-7 space-y-12">
              {/* 01 ALAMAT PENGIRIMAN (TERHUBUNG KE BUKU ALAMAT) */}
              <section aria-labelledby="sec-address">
                <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 pb-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-bold text-neutral-400">01</span>
                    <h2 id="sec-address" className="text-sm font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
                      Alamat Pengiriman
                    </h2>
                  </div>

                  {selectedAddress && (
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 hover:underline cursor-pointer"
                    >
                      Ubah Alamat
                    </button>
                  )}
                </div>

                <div id="field-address" tabIndex={-1} className="mt-5 focus:outline-none">
                  {addressesLoading ? (
                    <div className="h-32 border border-neutral-200 bg-neutral-100 animate-pulse" />
                  ) : selectedAddress ? (
                    <div className="border border-neutral-950 bg-neutral-50/50 p-5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-neutral-950">
                            {selectedAddress.recipientName}
                          </span>
                          <span className="text-neutral-300">|</span>
                          <span className="font-mono text-xs text-neutral-600">
                            {selectedAddress.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                            {selectedAddress.label}
                          </span>
                          {selectedAddress.isPrimary && (
                            <span className="border border-emerald-700 bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              Utama
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {selectedAddress.fullAddress}
                      </p>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">
                        Kec. {selectedAddress.district}, {selectedAddress.city}, {selectedAddress.province},{" "}
                        {selectedAddress.postalCode}
                      </p>
                      {selectedAddress.notes && (
                        <p className="text-[11px] text-neutral-500">
                          Catatan: <span className="italic">{selectedAddress.notes}</span>
                        </p>
                      )}

                      <div className="pt-2 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-neutral-500">
                          {addresses.length} alamat tersimpan di buku alamat
                        </span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setFormModal({ open: true, editing: selectedAddress })}
                            className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-950 underline underline-offset-4 cursor-pointer"
                          >
                            Edit Alamat Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsPickerOpen(true)}
                            className="text-[11px] font-bold text-neutral-950 hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
                          >
                            Pilih Alamat Lain →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-neutral-300 p-6 text-center space-y-3">
                      <p className="text-xs font-semibold text-neutral-800">
                        Anda belum memiliki alamat pengiriman tersimpan.
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Tambahkan alamat terlebih dahulu agar ongkos kirim kurir dapat dihitung otomatis.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormModal({ open: true, editing: null })}
                        className="inline-block bg-neutral-950 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif] cursor-pointer"
                      >
                        + Tambah Alamat Pengiriman
                      </button>
                    </div>
                  )}
                  {errors.address && <p className="mt-2 text-xs text-red-600">{errors.address}</p>}
                </div>
              </section>

              {/* 02 PENGIRIMAN */}
              <section aria-labelledby="sec-shipping">
                <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">02</span>
                  <h2 id="sec-shipping" className="text-sm font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
                    Jasa Pengiriman
                  </h2>
                </div>

                <div id="field-shipping" tabIndex={-1} className="mt-6 space-y-3 focus:outline-none">
                  {!selectedProvince ? (
                    <p className="border border-dashed border-neutral-300 px-4 py-6 text-center text-xs text-neutral-500">
                      Tambahkan atau pilih alamat pengiriman terlebih dahulu untuk melihat ongkos kirim.
                    </p>
                  ) : quoteLoading && !quote?.shippingRates.length ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-[68px] bg-neutral-100 animate-pulse" />
                      ))}
                    </div>
                  ) : quote?.shippingRates.length ? (
                    <>
                      {remainingForFree > 0 ? (
                        <p className="text-[11px] text-neutral-500">
                          Tambah <span className="font-mono font-semibold text-neutral-950">{formatIDR(remainingForFree)}</span> lagi
                          untuk gratis ongkir layanan reguler.
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Pesanan Anda mendapat gratis ongkir untuk layanan reguler.
                        </p>
                      )}
                      <div role="radiogroup" aria-label="Jasa pengiriman" className="space-y-3">
                        {quote.shippingRates.map((r) => {
                          const key = rateKey(r);
                          const active = key === shippingKey;
                          return (
                            <label
                              key={key}
                              className={`flex cursor-pointer items-center justify-between gap-4 border px-4 py-3.5 transition-colors ${
                                active ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              <span className="flex items-center gap-3.5 min-w-0">
                                <input
                                  type="radio"
                                  name="shipping"
                                  value={key}
                                  checked={active}
                                  onChange={() => {
                                    setShippingKey(key);
                                    setErrors((prev) => ({ ...prev, shipping: undefined }));
                                  }}
                                  className="accent-neutral-950 w-4 h-4 flex-shrink-0"
                                />
                                <span className="min-w-0">
                                  <span className="block text-xs font-bold uppercase tracking-wider text-neutral-950">
                                    {r.courierName} <span className="font-mono font-medium text-neutral-500">{r.service}</span>
                                  </span>
                                  <span className="block text-[11px] text-neutral-500">
                                    {r.serviceName} · Estimasi {r.etd}
                                  </span>
                                </span>
                              </span>
                              <span className="text-right flex-shrink-0">
                                {r.isFreeShipping ? (
                                  <>
                                    <span className="block font-mono text-xs font-bold text-emerald-700">GRATIS</span>
                                    <span className="block font-mono text-[10px] text-neutral-400 line-through">
                                      {formatIDR(r.originalCost)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-mono text-xs font-semibold text-neutral-950">{formatIDR(r.cost)}</span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        Ongkos kirim dihitung otomatis ke tujuan {selectedProvince} (estimasi ±400 g per item).
                      </p>
                    </>
                  ) : (
                    <p className="border border-dashed border-neutral-300 px-4 py-6 text-center text-xs text-neutral-500">
                      Pengiriman ke provinsi ini belum tersedia.
                    </p>
                  )}
                  {errors.shipping && <p className="text-xs text-red-600">{errors.shipping}</p>}
                </div>
              </section>

              {/* 03 PEMBAYARAN */}
              <section aria-labelledby="sec-payment">
                <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">03</span>
                  <h2 id="sec-payment" className="text-sm font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
                    Metode Pembayaran
                  </h2>
                </div>

                <div
                  id="field-payment"
                  tabIndex={-1}
                  role="radiogroup"
                  aria-label="Metode pembayaran"
                  className="mt-6 grid grid-cols-1 gap-3 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => {
                    const active = m.id === paymentId;
                    return (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer flex-col gap-2 border px-4 py-4 transition-colors ${
                          active ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment"
                            value={m.id}
                            checked={active}
                            onChange={() => {
                              setPaymentId(m.id);
                              setErrors((prev) => ({ ...prev, payment: undefined }));
                            }}
                            className="accent-neutral-950 w-4 h-4"
                          />
                          <span className="text-xs font-bold uppercase tracking-wider">{m.name}</span>
                        </span>
                        <span className="text-[11px] text-neutral-500 leading-relaxed">{m.description}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {m.providers.map((p) => (
                            <span
                              key={p}
                              className="border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-600"
                            >
                              {p}
                            </span>
                          ))}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.payment && <p className="mt-2 text-xs text-red-600">{errors.payment}</p>}
                <p className="mt-3 text-[10px] text-neutral-400">
                  Pembayaran akan diproses secara aman melalui Midtrans.
                </p>
              </section>
            </div>

            {/* ═════════ KOLOM KANAN: RINGKASAN ═════════ */}
            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-24 border border-neutral-200">
                <div className="flex items-baseline justify-between border-b border-neutral-200 px-5 py-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] font-[Montserrat,sans-serif]">Ringkasan Pesanan</h2>
                  <span className="font-mono text-[11px] text-neutral-400">
                    [{String(quote?.totalQty ?? cart.reduce((a, i) => a + i.quantity, 0)).padStart(2, "0")}]
                  </span>
                </div>

                <ul className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100 px-5">
                  {summaryLines.map((l) => {
                    const fallback = cartImageByKey.get(`${l.productId}::${l.size.toUpperCase()}`);
                    const img = l.imageUrl || fallback?.image;
                    return (
                      <li key={`${l.productId}-${l.size}`} className="flex gap-3.5 py-4">
                        <div className="h-20 w-16 flex-shrink-0 overflow-hidden border border-neutral-200/70 bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {img && <img src={img} alt={l.name ?? ""} className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <p className="text-xs font-semibold leading-snug line-clamp-2 font-[Montserrat,sans-serif]">
                              {l.name ?? fallback?.name ?? "Produk tidak tersedia"}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-neutral-500">
                              SIZE: {l.size} · QTY: {l.quantity}
                            </p>
                          </div>
                          {quote && !l.available && (
                            <p className="text-[10px] font-semibold text-red-600">
                              {l.availableStock === 0 ? "Stok habis" : `Sisa ${l.availableStock} pcs`}
                            </p>
                          )}
                        </div>
                        <p className="font-mono text-xs font-semibold flex-shrink-0">{formatIDR(l.lineTotal)}</p>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-2.5 border-t border-neutral-200 px-5 py-5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-mono text-neutral-950">{quote ? formatIDR(subtotal) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>
                      Ongkos Kirim
                      {selectedRate && (
                        <span className="text-neutral-400">
                          {" "}
                          ({selectedRate.courierName} {selectedRate.service})
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-neutral-950">
                      {!selectedRate ? "—" : selectedRate.isFreeShipping ? "GRATIS" : formatIDR(shippingCost)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-neutral-100 pt-3">
                    <span className="text-xs font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">Total</span>
                    <span className="font-mono text-lg font-bold">{quote ? formatIDR(total) : "—"}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">Harga sudah termasuk pajak. Total dihitung ulang oleh server.</p>
                </div>

                {(quoteError || (quote && quote.issues.length > 0)) && (
                  <div aria-live="polite" className="mx-5 mb-4 border border-red-100 bg-red-50 p-3 text-[11px] text-red-700 space-y-1">
                    {quoteError && <p>{quoteError}</p>}
                    {quote?.issues.map((msg) => (
                      <p key={msg}>• {msg}</p>
                    ))}
                    {quote && quote.issues.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCartOpen(true)}
                        className="mt-1 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Sesuaikan keranjang
                      </button>
                    )}
                  </div>
                )}

                <div className="px-5 pb-5 space-y-3">
                  <button
                    type="submit"
                    disabled={submitting || quoteLoading || !quote || !quote.isValid}
                    className="group flex w-full items-center justify-between bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors duration-300 disabled:cursor-not-allowed disabled:bg-neutral-300 font-[Montserrat,sans-serif] cursor-pointer"
                  >
                    <span>{submitting ? "Memproses..." : "Bayar Sekarang"}</span>
                    <span className="font-mono text-[11px] font-normal">{quote ? formatIDR(total) : ""}</span>
                  </button>

                  {submitNotice && (
                    <p aria-live="polite" className="border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                      {submitNotice}
                    </p>
                  )}

                  <Link
                    href="/catalog"
                    className="block text-center text-[11px] font-medium text-neutral-500 hover:text-neutral-950 transition-colors"
                  >
                    ← Lanjutkan Belanja
                  </Link>
                </div>
              </div>
            </aside>
          </form>
        </main>
      </PageTransition>

      {/* ═════════ MODAL PILIH ALAMAT ALA SHOPEE ═════════ */}
      {isPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-[2px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPickerOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pilih Alamat Pengiriman"
            className="w-full max-w-xl max-h-[88vh] flex flex-col border border-neutral-950 bg-white"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
                  Pilih Alamat Pengiriman
                </h2>
                <p className="font-mono text-[10px] text-neutral-400">
                  {addresses.length} / {MAX_ADDRESSES_PER_USER} alamat tersimpan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                aria-label="Tutup pemilih alamat"
                className="border border-neutral-200 px-2.5 py-1 font-mono text-xs text-neutral-500 hover:border-neutral-950 hover:text-neutral-950 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 px-6">
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddress?.id;
                return (
                  <div key={addr.id} className="py-4 flex items-start justify-between gap-4">
                    <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="radio"
                        name="checkout-address"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedAddressId(addr.id);
                          setErrors((prev) => ({ ...prev, address: undefined }));
                          setIsPickerOpen(false);
                        }}
                        className="mt-1 h-4 w-4 accent-neutral-950 flex-shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-neutral-950">{addr.recipientName}</span>
                          <span className="text-neutral-300">|</span>
                          <span className="font-mono text-[11px] text-neutral-600">{addr.phone}</span>
                          <span className="border border-neutral-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neutral-600">
                            {addr.label}
                          </span>
                          {addr.isPrimary && (
                            <span className="bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed">{addr.fullAddress}</p>
                        <p className="text-[11px] text-neutral-500">
                          Kec. {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                        </p>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => setFormModal({ open: true, editing: addr })}
                      className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 underline flex-shrink-0 cursor-pointer"
                    >
                      Ubah
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-neutral-50">
              <button
                type="button"
                disabled={addresses.length >= MAX_ADDRESSES_PER_USER}
                onClick={() => setFormModal({ open: true, editing: null })}
                className="border border-neutral-950 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {addresses.length >= MAX_ADDRESSES_PER_USER
                  ? `Maksimal ${MAX_ADDRESSES_PER_USER} Alamat`
                  : "+ Tambah Alamat Baru"}
              </button>

              <Link
                href="/account/addresses"
                className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-950 underline"
              >
                Kelola Buku Alamat →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ MODAL TAMBAH / EDIT ALAMAT ═════════ */}
      {formModal.open && (
        <AddressFormModal
          key={formModal.editing?.id ?? "new-checkout"}
          initialAddress={formModal.editing}
          forcePrimary={!formModal.editing && addresses.length === 0}
          defaultRecipientName={user?.name ?? ""}
          defaultPhone={user?.phone ?? ""}
          onClose={() => setFormModal({ open: false, editing: null })}
          onSaved={handleAddressSaved}
        />
      )}
    </div>
  );
}
