"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import AccountNav from "@/app/(store)/account/_components/AccountNav";
import { useAuth } from "@/app/(store)/context/AuthContext";
import { useCart } from "@/app/(store)/context/CartContext";
import { loadMidtransSnap } from "@/lib/payment/snapClient";

interface OrderDetailDto {
  id: string;
  totalAmount: string | number;
  shippingAddress: string;
  courier?: string | null;
  shippingCost?: string | number;
  trackingNumber: string | null;
  shippingStatus: "DIPROSES" | "DIKIRIM" | "DALAM_PERJALANAN" | "SELESAI";
  createdAt: string;
  items: {
    id: string;
    size?: string | null;
    quantity: number;
    unitPrice: string | number;
    product: {
      id: string;
      name: string;
      imageUrl: string;
      category: string | null;
    } | null;
  }[];
  payment: {
    status: "PENDING" | "SUCCESS" | "FAILED";
    provider: string;
    transactionToken: string;
    externalRefId: string | null;
    amount: string | number;
    paidAt: string | null;
  } | null;
}

const PAYMENT_STATUS_META: Record<
  "PENDING" | "SUCCESS" | "FAILED",
  { label: string; cls: string }
> = {
  PENDING: {
    label: "Menunggu Pembayaran QRIS",
    cls: "border-amber-200 bg-amber-50 text-amber-800",
  },
  SUCCESS: {
    label: "Lunas (QRIS)",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  FAILED: {
    label: "Kedaluwarsa / Dibatalkan",
    cls: "border-red-200 bg-red-50 text-red-700",
  },
};

const formatIDR = (n: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n));

export default function AccountOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useAuth();
  const { markAsPurchased } = useCart();
  const orderId = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [snapConfig, setSnapConfig] = useState<{ clientKey: string; scriptUrl: string }>({
    clientKey: "",
    scriptUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [openingSnap, setOpeningSnap] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "ok" | "info" | "err";
    text: string;
  } | null>(null);

  const verifyPaymentStatus = useCallback(
    async (silent = false) => {
      if (!orderId) return;
      if (!silent) {
        setVerifying(true);
        setStatusMessage(null);
      }

      try {
        const res = await fetch(`/api/account/orders/${encodeURIComponent(orderId)}/verify`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          if (!silent) {
            setStatusMessage({
              tone: "err",
              text: data.error || "Gagal memeriksa status pembayaran.",
            });
          }
          return;
        }

        const updated = data.order as OrderDetailDto | undefined;
        if (data.snapClientKey && data.snapScriptUrl) {
          setSnapConfig({
            clientKey: data.snapClientKey,
            scriptUrl: data.snapScriptUrl,
          });
        }
        if (!updated) return;

        setOrder(updated);
        const payStatus = updated.payment?.status ?? "PENDING";

        if (payStatus === "SUCCESS") {
          const ids = updated.items
            .map((it) => it.product?.id)
            .filter((id): id is string => Boolean(id));
          if (ids.length > 0) markAsPurchased(ids);
          if (!silent) {
            setStatusMessage({
              tone: "ok",
              text: "Pembayaran QRIS terkonfirmasi lunas! Pesanan Anda segera kami proses.",
            });
          }
        } else if (payStatus === "FAILED" && !silent) {
          setStatusMessage({
            tone: "err",
            text: "Waktu pembayaran QRIS telah berakhir atau dibatalkan. Stok produk telah dikembalikan.",
          });
        } else if (!silent) {
          setStatusMessage({
            tone: "info",
            text: "Pembayaran masih menunggu penyelesaian scan QRIS.",
          });
        }
      } catch {
        if (!silent) {
          setStatusMessage({
            tone: "err",
            text: "Gagal menghubungi server untuk cek status pembayaran.",
          });
        }
      } finally {
        if (!silent) setVerifying(false);
      }
    },
    [orderId, markAsPurchased]
  );

  useEffect(() => {
    if (status === "guest") {
      router.push(`/login?next=${encodeURIComponent(`/account/orders/${orderId}`)}`);
      return;
    }
    if (status !== "authenticated" || !orderId) return;

    let active = true;
    fetch(`/api/account/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/account/orders/${orderId}`)}`);
          return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Pesanan tidak ditemukan.");
        if (active && data.snapClientKey && data.snapScriptUrl) {
          setSnapConfig({
            clientKey: data.snapClientKey,
            scriptUrl: data.snapScriptUrl,
          });
        }
        return data.order as OrderDetailDto;
      })
      .then((found) => {
        if (!active || !found) return;
        setOrder(found);
        // Sinkronisasi otomatis ke Midtrans saat halaman dibuka bila masih PENDING
        if (found.payment?.status === "PENDING") {
          void verifyPaymentStatus(true);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Pesanan tidak ditemukan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, orderId, router, verifyPaymentStatus]);

  const handleOpenQrisPopup = async () => {
    const token = order?.payment?.transactionToken;
    if (!token || token.startsWith("pending:")) {
      setStatusMessage({
        tone: "err",
        text: "Token pembayaran QRIS tidak tersedia untuk pesanan ini.",
      });
      return;
    }

    setOpeningSnap(true);
    setStatusMessage(null);
    try {
      await loadMidtransSnap(snapConfig.scriptUrl, snapConfig.clientKey);
      if (!window.snap) {
        throw new Error("Popup Midtrans Snap belum siap.");
      }

      window.snap.pay(token, {
        onSuccess: () => {
          void verifyPaymentStatus(false);
        },
        onPending: () => {
          void verifyPaymentStatus(false);
        },
        onError: () => {
          void verifyPaymentStatus(false);
        },
        onClose: () => {
          void verifyPaymentStatus(true);
        },
      });
    } catch (err) {
      setStatusMessage({
        tone: "err",
        text: err instanceof Error ? err.message : "Gagal membuka popup QRIS.",
      });
    } finally {
      setOpeningSnap(false);
    }
  };

  const payStatus = order?.payment?.status ?? "PENDING";
  const payBadge = PAYMENT_STATUS_META[payStatus];
  const itemsSubtotal =
    order?.items.reduce((sum, it) => sum + Number(it.unitPrice) * it.quantity, 0) ?? 0;
  const shippingCost = Number(order?.shippingCost ?? 0);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <AccountNav title="Detail Pesanan" />

          <div className="mt-8">
            <Link
              href="/account/orders"
              className="inline-block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-950"
            >
              ← Kembali ke Pesanan Saya
            </Link>

            {status === "loading" || loading ? (
              <div className="mt-6 h-64 bg-neutral-100 animate-pulse" />
            ) : error || !order ? (
              <div className="mt-6 border border-red-200 bg-red-50 p-6 text-xs text-red-700">
                {error || "Pesanan tidak ditemukan."}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <section className="lg:col-span-7 border border-neutral-200 p-5 space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 pb-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
                      Item Pesanan
                    </h2>
                    <span className="font-mono text-xs text-neutral-500 break-all">
                      #{order.id}
                    </span>
                  </div>

                  <ul className="divide-y divide-neutral-100">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-4 flex items-center gap-4">
                        {item.product?.imageUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-20 w-16 object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-950 line-clamp-2">
                            {item.product?.name ?? "Produk"}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-neutral-500">
                            {item.size ? `SIZE: ${item.size} · ` : ""}QTY: {item.quantity} ×{" "}
                            {formatIDR(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-mono text-xs font-bold text-neutral-950 flex-shrink-0">
                          {formatIDR(Number(item.unitPrice) * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-500">
                      <span>Subtotal Produk</span>
                      <span className="font-mono text-neutral-900">
                        {formatIDR(itemsSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-500">
                      <span>
                        Ongkos Kirim{order.courier ? ` (${order.courier})` : ""}
                      </span>
                      <span className="font-mono text-neutral-900">
                        {shippingCost === 0 ? "GRATIS" : formatIDR(shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-100 pt-2.5 font-bold text-neutral-950">
                      <span className="uppercase tracking-wider text-[11px]">Total Pesanan</span>
                      <span className="font-mono text-sm">{formatIDR(order.totalAmount)}</span>
                    </div>
                  </div>
                </section>

                <aside className="lg:col-span-5 space-y-4">
                  <div className="border border-neutral-200 p-5 space-y-4 text-xs">
                    <h2 className="text-xs font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif] border-b border-neutral-100 pb-2">
                      Informasi Pengiriman &amp; Pembayaran
                    </h2>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                          Status Pembayaran
                        </span>
                        <span
                          className={`mt-1 inline-block border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${payBadge.cls}`}
                        >
                          {payBadge.label}
                        </span>
                      </div>

                      {order.payment?.paidAt && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                            Dibayar Pada
                          </span>
                          <span className="font-mono text-[11px] text-neutral-700">
                            {new Date(order.payment.paidAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {payStatus === "PENDING" && (
                      <div className="space-y-2.5 border border-neutral-200 bg-neutral-50 p-3.5">
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Selesaikan pembayaran menggunakan kode QRIS melalui aplikasi m-banking atau e-wallet Anda.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenQrisPopup}
                          disabled={openingSnap || verifying}
                          className="w-full bg-neutral-950 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 font-[Montserrat,sans-serif] cursor-pointer"
                        >
                          {openingSnap ? "Membuka QRIS..." : "Tampilkan QRIS / Bayar Sekarang"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void verifyPaymentStatus(false)}
                          disabled={verifying || openingSnap}
                          className="w-full border border-neutral-300 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-800 hover:border-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {verifying ? "Memeriksa ke Midtrans..." : "Cek Status Pembayaran"}
                        </button>
                      </div>
                    )}

                    {statusMessage && (
                      <div
                        aria-live="polite"
                        className={`border p-3 text-[11px] leading-relaxed ${
                          statusMessage.tone === "ok"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : statusMessage.tone === "err"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {statusMessage.text}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                          Status Pengiriman
                        </span>
                        <span className="font-mono font-bold text-neutral-950">
                          {order.shippingStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                          Kurir
                        </span>
                        <span className="font-mono text-neutral-800">
                          {order.courier || "Standar"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Nomor Resi
                      </span>
                      <span className="font-mono text-neutral-800">
                        {order.trackingNumber || "Belum tersedia"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Alamat Pengiriman
                      </span>
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-line mt-0.5">
                        {order.shippingAddress}
                      </p>
                    </div>

                    <div className="border-t border-neutral-100 pt-3 flex items-baseline justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Total Bayar ({order.payment?.provider === "MIDTRANS_QRIS" ? "QRIS" : order.payment?.provider ?? "QRIS"})
                      </span>
                      <span className="font-mono text-base font-bold text-neutral-950">
                        {formatIDR(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
