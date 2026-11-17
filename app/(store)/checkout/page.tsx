"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import { useAuth } from "@/app/(store)/context/AuthContext";
import { useCart } from "@/app/(store)/context/CartContext";
import { PROVINCES, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping/config";
import type { ShippingRate } from "@/lib/shipping/types";
import { PAYMENT_METHODS, PAYMENT_GATEWAY_ENABLED, type PaymentMethodId } from "@/lib/payment/methods";

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

interface AddressForm {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  address: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof AddressForm | "shipping" | "payment", string>>;

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const rateKey = (r: Pick<ShippingRate, "courierCode" | "service">) => `${r.courierCode}:${r.service}`;

function validate(form: AddressForm, shippingKey: string, paymentId: PaymentMethodId | ""): FormErrors {
  const e: FormErrors = {};
  const name = form.recipientName.trim();
  if (name.length < 2 || name.length > 60) e.recipientName = "Nama penerima 2–60 karakter.";
  const phone = form.phone.replace(/[\s-]/g, "");
  if (!/^(\+62|62|0)8\d{7,11}$/.test(phone)) e.phone = "Nomor HP tidak valid (contoh: 0812xxxxxxxx).";
  if (!form.province) e.province = "Pilih provinsi.";
  if (form.city.trim().length < 2) e.city = "Isi kota / kabupaten.";
  if (form.district.trim().length < 2) e.district = "Isi kecamatan.";
  if (!/^\d{5}$/.test(form.postalCode.trim())) e.postalCode = "Kode pos 5 digit.";
  const addr = form.address.trim();
  if (addr.length < 10 || addr.length > 300) e.address = "Alamat lengkap 10–300 karakter.";
  if (form.notes.length > 200) e.notes = "Catatan maksimal 200 karakter.";
  if (!shippingKey) e.shipping = "Pilih jasa pengiriman.";
  if (!paymentId) e.payment = "Pilih metode pembayaran.";
  return e;
}

const inputClass = (hasError?: string) =>
  `mt-1.5 block w-full border px-3.5 py-3 text-sm text-neutral-950 placeholder-neutral-400 bg-white focus:outline-none focus:ring-1 transition-colors ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-neutral-200 focus:border-neutral-950 focus:ring-neutral-950"
  }`;

const labelClass = "block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, isHydrated, setIsCartOpen } = useCart();

  // Auto-fill nama, no. HP, dan alamat dari profil selama field belum diubah manual.
  const [overrides, setOverrides] = useState<Partial<AddressForm>>({});
  const form: AddressForm = {
    recipientName: overrides.recipientName ?? user?.name ?? "",
    phone: overrides.phone ?? user?.phone ?? "",
    province: overrides.province ?? "",
    city: overrides.city ?? "",
    district: overrides.district ?? "",
    postalCode: overrides.postalCode ?? "",
    address: overrides.address ?? user?.address ?? "",
    notes: overrides.notes ?? "",
  };
  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingKey, setShippingKey] = useState("");
  const [paymentId, setPaymentId] = useState<PaymentMethodId | "">("");

  const [quote, setQuote] = useState<Quote | null>(null);
  // Kunci permintaan terakhir yang sudah selesai (sukses/gagal) + pesan error-nya.
  const [resolved, setResolved] = useState<{ key: string; error: string }>({ key: "", error: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Payload keranjang yang dikirim ke server (tanpa harga, server yang menentukan harga).
  const cartPayload = useMemo(
    () => cart.map((i) => ({ productId: i.id, size: i.size, quantity: i.quantity })),
    [cart]
  );
  const cartSignature = JSON.stringify(cartPayload);
  const requestKey = `${cartSignature}|${form.province}`;
  const shouldFetch = isHydrated && cartPayload.length > 0;
  const quoteLoading = shouldFetch && resolved.key !== requestKey;
  const quoteError = resolved.key === requestKey ? resolved.error : "";

  // Ambil ringkasan dari server setiap kali isi keranjang atau provinsi berubah.
  useEffect(() => {
    if (!shouldFetch) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartPayload, province: form.province }),
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
        // Reset pilihan kurir jika sudah tidak tersedia untuk provinsi baru.
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

  const updateField = <K extends keyof AddressForm>(key: K, value: AddressForm[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitNotice("");

    const v = validate(form, shippingKey, paymentId);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      document.getElementById(`field-${Object.keys(v)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // Validasi ulang harga, stok, dan ongkir di server tepat sebelum lanjut.
      const res = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartPayload,
          province: form.province,
          courierCode: selectedRate?.courierCode,
          service: selectedRate?.service,
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memvalidasi pesanan.");
      setQuote(data);
      if (!data.isValid) {
        setSubmitNotice("Beberapa item perlu disesuaikan sebelum melanjutkan. Periksa ringkasan pesanan.");
        return;
      }
      if (!data.selectedShipping) {
        setErrors((prev) => ({ ...prev, shipping: "Jasa pengiriman tidak tersedia, pilih ulang." }));
        return;
      }

      if (!PAYMENT_GATEWAY_ENABLED) {
        setSubmitNotice(
          `Pesanan valid dengan total ${formatIDR(data.total)}. Integrasi pembayaran Midtrans belum aktif, jadi pesanan belum dibuat.`
        );
        return;
      }

      // TODO (Midtrans): POST /api/checkout → buat Order + Payment, dapatkan snapToken,
      // lalu panggil window.snap.pay(snapToken) dan arahkan ke /orders/[id].
    } catch (err) {
      setSubmitNotice(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading awal (keranjang belum dimuat dari localStorage) ──
  if (!isHydrated) {
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

  // ── Keranjang kosong ──
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
        <Navbar />
        <PageTransition>
          <main className="mx-auto max-w-xl px-4 py-28 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">[CHECKOUT]</span>
            <h1 className="mt-4 text-2xl font-black tracking-tight font-[Montserrat,sans-serif]">
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

  // Gambar fallback dari keranjang bila server belum merespons.
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
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Header */}
          <div className="border-b border-neutral-200 pb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-700 font-bold">
              [SECURE CHECKOUT]
            </span>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-[Montserrat,sans-serif]">CHECKOUT</h1>
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
              {/* 01 ALAMAT */}
              <section aria-labelledby="sec-address">
                <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-3">
                  <span className="font-mono text-xs font-bold text-neutral-400">01</span>
                  <h2 id="sec-address" className="text-sm font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
                    Alamat Pengiriman
                  </h2>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="field-recipientName" className={labelClass}>
                      Nama Penerima<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-recipientName"
                      autoComplete="name"
                      value={form.recipientName}
                      onChange={(e) => updateField("recipientName", e.target.value)}
                      className={inputClass(errors.recipientName)}
                      placeholder="Nama lengkap"
                    />
                    {errors.recipientName && <p className="mt-1 text-xs text-red-600">{errors.recipientName}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-phone" className={labelClass}>
                      No. HP / WhatsApp<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={inputClass(errors.phone)}
                      placeholder="0812xxxxxxxx"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-province" className={labelClass}>
                      Provinsi<span className="text-red-500">*</span>
                    </label>
                    <select
                      id="field-province"
                      value={form.province}
                      onChange={(e) => updateField("province", e.target.value)}
                      className={inputClass(errors.province)}
                    >
                      <option value="">Pilih provinsi</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.province && <p className="mt-1 text-xs text-red-600">{errors.province}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-city" className={labelClass}>
                      Kota / Kabupaten<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={inputClass(errors.city)}
                      placeholder="Contoh: Kota Bandung"
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-district" className={labelClass}>
                      Kecamatan<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-district"
                      autoComplete="address-level3"
                      value={form.district}
                      onChange={(e) => updateField("district", e.target.value)}
                      className={inputClass(errors.district)}
                      placeholder="Contoh: Coblong"
                    />
                    {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-postalCode" className={labelClass}>
                      Kode Pos<span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-postalCode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={5}
                      value={form.postalCode}
                      onChange={(e) => updateField("postalCode", e.target.value.replace(/\D/g, ""))}
                      className={inputClass(errors.postalCode)}
                      placeholder="40132"
                    />
                    {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="field-address" className={labelClass}>
                      Alamat Lengkap<span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="field-address"
                      rows={3}
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className={inputClass(errors.address)}
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan"
                    />
                    {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="field-notes" className={labelClass}>
                      Catatan untuk Kurir <span className="normal-case tracking-normal font-normal text-neutral-400">(opsional)</span>
                    </label>
                    <input
                      id="field-notes"
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      className={inputClass(errors.notes)}
                      placeholder="Contoh: titip di pos satpam"
                      maxLength={200}
                    />
                    {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
                  </div>
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
                  {!form.province ? (
                    <p className="border border-dashed border-neutral-300 px-4 py-6 text-center text-xs text-neutral-500">
                      Pilih provinsi terlebih dahulu untuk melihat pilihan kurir dan ongkos kirim.
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
                        Ongkos kirim merupakan estimasi berdasarkan provinsi tujuan dan berat ±400 g per item.
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
                  className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 focus:outline-none"
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
    </div>
  );
}
