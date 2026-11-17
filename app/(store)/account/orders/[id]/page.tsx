"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/(store)/components/Navbar";
import PageTransition from "@/app/(store)/components/PageTransition";
import AccountNav from "@/app/(store)/account/_components/AccountNav";
import { useAuth } from "@/app/(store)/context/AuthContext";

interface OrderDetailDto {
  id: string;
  totalAmount: string | number;
  shippingAddress: string;
  trackingNumber: string | null;
  shippingStatus: "DIPROSES" | "DIKIRIM" | "DALAM_PERJALANAN" | "SELESAI";
  createdAt: string;
  items: {
    id: string;
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
    amount: string | number;
    paidAt: string | null;
  } | null;
}

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
  const orderId = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        return data.order as OrderDetailDto;
      })
      .then((found) => {
        if (active && found) setOrder(found);
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
  }, [status, orderId, router]);

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
                  <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif]">
                      Item Pesanan
                    </h2>
                    <span className="font-mono text-xs text-neutral-500">#{order.id}</span>
                  </div>

                  <ul className="divide-y divide-neutral-100">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-4 flex items-center gap-4">
                        {item.product?.imageUrl && (
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
                            QTY: {item.quantity} × {formatIDR(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-mono text-xs font-bold text-neutral-950">
                          {formatIDR(Number(item.unitPrice) * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <aside className="lg:col-span-5 space-y-4">
                  <div className="border border-neutral-200 p-5 space-y-3 text-xs">
                    <h2 className="text-xs font-black uppercase tracking-[0.15em] font-[Montserrat,sans-serif] border-b border-neutral-100 pb-2">
                      Informasi Pengiriman &amp; Pembayaran
                    </h2>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Status Pengiriman
                      </span>
                      <span className="font-mono font-bold text-neutral-950">{order.shippingStatus}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Nomor Resi
                      </span>
                      <span className="font-mono text-neutral-800">{order.trackingNumber || "Belum tersedia"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Alamat Pengiriman
                      </span>
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                        {order.shippingAddress}
                      </p>
                    </div>
                    <div className="border-t border-neutral-100 pt-3 flex items-baseline justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Total Bayar ({order.payment?.provider ?? "MIDTRANS"})
                      </span>
                      <span className="font-mono text-base font-bold text-neutral-950">
                        {formatIDR(order.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                        Status Pembayaran
                      </span>
                      <span className="font-mono font-bold text-neutral-950">
                        {order.payment?.status ?? "PENDING"}
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
