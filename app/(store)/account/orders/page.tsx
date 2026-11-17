"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import AccountNav from "@/app/(store)/account/_components/AccountNav";
import { useAuth } from "@/app/(store)/context/AuthContext";

interface OrderItemDto {
  id: string;
  quantity: number;
  unitPrice: string | number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    category: string | null;
  } | null;
}

interface OrderDto {
  id: string;
  totalAmount: string | number;
  shippingAddress: string;
  trackingNumber: string | null;
  shippingStatus: "DIPROSES" | "DIKIRIM" | "DALAM_PERJALANAN" | "SELESAI";
  createdAt: string;
  items: OrderItemDto[];
  payment: {
    status: "PENDING" | "SUCCESS" | "FAILED";
    provider: string;
  } | null;
}

const formatIDR = (n: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n));

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  SUCCESS: { label: "Dibayar", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Menunggu Pembayaran", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  FAILED: { label: "Gagal", cls: "border-red-200 bg-red-50 text-red-700" },
};

const SHIPPING_BADGE: Record<OrderDto["shippingStatus"], { label: string; cls: string }> = {
  DIPROSES: { label: "Diproses", cls: "border-neutral-200 bg-neutral-100 text-neutral-700" },
  DIKIRIM: { label: "Dikirim", cls: "border-blue-200 bg-blue-50 text-blue-700" },
  DALAM_PERJALANAN: { label: "Dalam Perjalanan", cls: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  SELESAI: { label: "Selesai", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "guest") {
      router.push("/login?next=/account/orders");
      return;
    }
    if (status !== "authenticated") return;

    let active = true;
    fetch("/api/account/orders", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login?next=/account/orders");
          return null;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat pesanan.");
        return data.orders as OrderDto[];
      })
      .then((list) => {
        if (active && list) setOrders(list);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, router]);

  return (
    <div className="min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif]">
      <Navbar />
      <PageTransition>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <AccountNav title="Pesanan Saya" />

          <div className="mt-10">
            {status === "loading" || loading ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className="h-36 bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="border border-red-200 bg-red-50 p-5 text-xs text-red-700">{error}</div>
            ) : orders.length === 0 ? (
              <div className="border border-dashed border-neutral-300 px-6 py-16 text-center">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-neutral-900 font-[Montserrat,sans-serif]">
                  Belum Ada Riwayat Pesanan
                </p>
                <p className="mt-2 text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                  Pesanan yang Anda buat melalui checkout akan tercatat di sini beserta status pembayaran dan pengirimannya.
                </p>
                <Link
                  href="/catalog"
                  className="mt-6 inline-block bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif]"
                >
                  Eksplorasi Katalog →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const payInfo = PAYMENT_BADGE[order.payment?.status ?? "PENDING"];
                  const shipInfo = SHIPPING_BADGE[order.shippingStatus];
                  const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
                  const dateLabel = new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <article
                      key={order.id}
                      className="border border-neutral-200 p-5 hover:border-neutral-950 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div>
                          <p className="font-mono text-xs font-bold text-neutral-950">#{order.id}</p>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {dateLabel} · {totalQty} item
                            {order.trackingNumber ? ` · Resi: ${order.trackingNumber}` : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${payInfo.cls}`}
                          >
                            {payInfo.label}
                          </span>
                          <span
                            className={`border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${shipInfo.cls}`}
                          >
                            {shipInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {order.items[0]?.product?.imageUrl && (
                            <img
                              src={order.items[0].product.imageUrl}
                              alt={order.items[0].product.name}
                              className="h-14 w-11 object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 truncate">
                              {order.items[0]?.product?.name ?? "Pesanan UrbanKamen"}
                            </p>
                            {order.items.length > 1 && (
                              <p className="text-[11px] text-neutral-500">
                                +{order.items.length - 1} produk lainnya
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <span className="block text-[10px] uppercase tracking-wider text-neutral-400">
                              Total
                            </span>
                            <span className="font-mono text-sm font-bold text-neutral-950">
                              {formatIDR(order.totalAmount)}
                            </span>
                          </div>
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="border border-neutral-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
                          >
                            Detail →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
