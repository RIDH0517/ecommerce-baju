"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface LowStockProduct {
  id: string;
  name: string;
  category: string | null;
  stock: number;
  imageUrl: string;
  sizes: { size: string; stock: number }[];
}

interface RecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalAmount: number;
  shippingStatus: "DIPROSES" | "DIKIRIM" | "DALAM_PERJALANAN" | "SELESAI";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  trackingNumber: string | null;
  createdAt: string;
}

interface BannerSummary {
  id: string;
  tag: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string;
  createdAt: string;
}

interface AdminStatsResponse {
  paidRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  ordersByStatus: {
    DIPROSES: number;
    DIKIRIM: number;
    DALAM_PERJALANAN: number;
    SELESAI: number;
  };
  totalProducts: number;
  totalUnitsInStock: number;
  outOfStockCount: number;
  lowStockCount: number;
  lowStockThreshold: number;
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
  activeBanner: BannerSummary | null;
  totalBanners: number;
}

const formatIDR = (num: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);

const SHIPPING_STYLE: Record<RecentOrder["shippingStatus"], { label: string; cls: string }> = {
  DIPROSES: { label: "Diproses", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  DIKIRIM: { label: "Dikirim", cls: "border-sky-200 bg-sky-50 text-sky-800" },
  DALAM_PERJALANAN: { label: "Perjalanan", cls: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  SELESAI: { label: "Selesai", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
};

const PAYMENT_STYLE: Record<RecentOrder["paymentStatus"], { label: string; cls: string }> = {
  SUCCESS: { label: "Lunas", cls: "text-emerald-700" },
  PENDING: { label: "Pending", cls: "text-amber-700" },
  FAILED: { label: "Gagal", cls: "text-red-600" },
};

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "DIPROSES" | "DIKIRIM" | "SELESAI">("ALL");

  const loadStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data dashboard.");
      setStats(data as AdminStatsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/stats", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat data dashboard.");
        return data as AdminStatsResponse;
      })
      .then((json) => {
        if (active) setStats(json);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat data dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-72 bg-neutral-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 border border-neutral-200 bg-white animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 border border-neutral-200 bg-white animate-pulse" />
          <div className="lg:col-span-5 h-80 border border-neutral-200 bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="border border-red-200 bg-red-50 p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-red-700">
          Gagal Memuat Statistik
        </p>
        <p className="text-sm text-red-700">{error || "Terjadi kesalahan saat membaca database."}</p>
        <button
          type="button"
          onClick={() => void loadStats(true)}
          className="border border-red-700 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700 hover:bg-red-700 hover:text-white transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const filteredOrders = stats.recentOrders.filter((o) => {
    if (orderFilter === "ALL") return true;
    if (orderFilter === "DIKIRIM") {
      return o.shippingStatus === "DIKIRIM" || o.shippingStatus === "DALAM_PERJALANAN";
    }
    return o.shippingStatus === orderFilter;
  });

  return (
    <div className="space-y-8">
      {/* ── PAGE HEADER ── */}
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            [01 / SYSTEM OVERVIEW — LIVE DATABASE]
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
            Dashboard Operasional
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadStats(true)}
            disabled={refreshing}
            className="border border-neutral-200 bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-800 hover:border-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {refreshing ? "Memuat..." : "Refresh Data"}
          </button>
          <Link
            href="/admin/products/new"
            className="bg-neutral-950 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors font-[Montserrat,sans-serif]"
          >
            + Produk Baru
          </Link>
        </div>
      </section>

      {/* ── 4 STRUCTURAL KPI CARDS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 01: Revenue */}
        <div className="bg-neutral-950 text-white p-5 border border-neutral-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              01 / Revenue (Paid)
            </span>
            <span className="h-2 w-2 bg-emerald-500" />
          </div>
          <div className="mt-4">
            <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
              {formatIDR(stats.paidRevenue)}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-neutral-400">
              Pending: {formatIDR(stats.pendingRevenue)}
            </p>
          </div>
        </div>

        {/* KPI 02: Orders to Ship */}
        <div
          className={`bg-white p-5 border flex flex-col justify-between ${
            stats.ordersByStatus.DIPROSES > 0 ? "border-amber-400" : "border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              02 / Perlu Dikirim
            </span>
            {stats.ordersByStatus.DIPROSES > 0 && (
              <span className="font-mono text-[10px] font-bold uppercase text-amber-700">ACTION</span>
            )}
          </div>
          <div className="mt-4">
            <p className="font-mono text-3xl font-bold text-neutral-950 tabular-nums">
              {stats.ordersByStatus.DIPROSES}
            </p>
            <Link
              href="/admin/orders"
              className="mt-1.5 inline-block text-[11px] font-semibold text-neutral-500 hover:text-neutral-950 underline underline-offset-4"
            >
              Proses &amp; input resi →
            </Link>
          </div>
        </div>

        {/* KPI 03: Total Orders */}
        <div className="bg-white p-5 border border-neutral-200 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            03 / Total Pesanan
          </span>
          <div className="mt-4">
            <p className="font-mono text-3xl font-bold text-neutral-950 tabular-nums">
              {stats.totalOrders}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-neutral-500">
              Dikirim: {stats.ordersByStatus.DIKIRIM + stats.ordersByStatus.DALAM_PERJALANAN} · Selesai:{" "}
              {stats.ordersByStatus.SELESAI}
            </p>
          </div>
        </div>

        {/* KPI 04: Inventory SKU */}
        <div className="bg-white p-5 border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              04 / Katalog SKU
            </span>
            {stats.lowStockCount > 0 && (
              <span className="font-mono text-[10px] font-bold uppercase text-red-600">
                {stats.lowStockCount} LOW
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="font-mono text-3xl font-bold text-neutral-950 tabular-nums">
              {stats.totalProducts}
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-neutral-500">
              {stats.totalUnitsInStock} unit total · {stats.outOfStockCount} habis
            </p>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 cols): Recent Orders */}
        <section className="lg:col-span-7 border border-neutral-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
                Pesanan Terbaru
              </h2>
              <p className="mt-0.5 text-[11px] text-neutral-400">
                Maksimal 8 transaksi terakhir dari database
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-700 hover:text-emerald-700 underline underline-offset-4"
            >
              Semua Pesanan →
            </Link>
          </div>

          <div className="flex items-center gap-1 border-b border-neutral-100 px-5 py-2.5 overflow-x-auto bg-neutral-50">
            {(
              [
                { id: "ALL", label: "Semua" },
                { id: "DIPROSES", label: "Diproses" },
                { id: "DIKIRIM", label: "Dikirim" },
                { id: "SELESAI", label: "Selesai" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOrderFilter(tab.id)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                  orderFilter === tab.id
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:text-neutral-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
                {stats.totalOrders === 0
                  ? "Belum Ada Pesanan di Database"
                  : "Tidak Ada Pesanan pada Filter Ini"}
              </p>
              <p className="mt-1.5 text-xs text-neutral-400">
                Transaksi yang dibuat pelanggan akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                    <th className="py-3 pl-5 font-semibold">Order ID</th>
                    <th className="py-3 font-semibold">Pelanggan</th>
                    <th className="py-3 font-semibold">Total</th>
                    <th className="py-3 font-semibold">Bayar</th>
                    <th className="py-3 pr-5 font-semibold text-right">Kirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((ord) => {
                    const ship = SHIPPING_STYLE[ord.shippingStatus];
                    const pay = PAYMENT_STYLE[ord.paymentStatus];
                    return (
                      <tr key={ord.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3.5 pl-5 font-mono text-[11px] font-bold text-neutral-900">
                          <Link href="/admin/orders" className="hover:underline">
                            #{ord.id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-neutral-900 truncate max-w-[160px]">
                            {ord.customerName}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">{ord.itemCount} item</p>
                        </td>
                        <td className="py-3.5 font-mono font-semibold text-neutral-950 tabular-nums">
                          {formatIDR(ord.totalAmount)}
                        </td>
                        <td className={`py-3.5 font-mono text-[10px] font-bold uppercase ${pay.cls}`}>
                          {pay.label}
                        </td>
                        <td className="py-3.5 pr-5 text-right">
                          <span
                            className={`inline-block border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${ship.cls}`}
                          >
                            {ship.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RIGHT (5 cols): Low Stock + Active Banner */}
        <div className="lg:col-span-5 space-y-6">
          {/* Low Stock Panel */}
          <section className="border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
                  Peringatan Stok (≤ {stats.lowStockThreshold} pcs)
                </h2>
              </div>
              <span className="border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] font-bold text-red-700">
                {stats.lowStockCount} SKU
              </span>
            </div>

            {stats.lowStockProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-500">
                Seluruh produk memiliki stok di atas {stats.lowStockThreshold} pcs.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100 mt-2">
                {stats.lowStockProducts.map((prod) => (
                  <li key={prod.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${prod.id}/edit`}
                        className="text-xs font-semibold text-neutral-950 hover:text-emerald-700 truncate block"
                      >
                        {prod.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase text-neutral-400">
                          {prod.category || "Uncategorized"}
                        </span>
                        {prod.sizes.slice(0, 5).map((s) => (
                          <span
                            key={s.size}
                            className={`font-mono text-[9px] px-1 border ${
                              s.stock <= 0
                                ? "border-neutral-200 text-neutral-400 line-through"
                                : s.stock <= stats.lowStockThreshold
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-neutral-200 text-neutral-600"
                            }`}
                          >
                            {s.size}:{s.stock}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`block font-mono text-xs font-bold ${
                          prod.stock === 0 ? "text-red-700" : "text-amber-700"
                        }`}
                      >
                        {prod.stock} pcs
                      </span>
                      <Link
                        href={`/admin/products/${prod.id}/edit`}
                        className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-950 underline"
                      >
                        Restock
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/admin/products"
              className="mt-4 block w-full border border-neutral-950 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
            >
              Kelola Semua Produk
            </Link>
          </section>

          {/* Active Banner Preview Panel */}
          <section className="border border-neutral-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-neutral-950 font-[Montserrat,sans-serif]">
                Banner Storefront Aktif
              </h2>
              <span className="font-mono text-[10px] text-neutral-400">
                {stats.totalBanners} tersimpan
              </span>
            </div>

            {stats.activeBanner ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/7] w-full overflow-hidden border border-neutral-200 bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stats.activeBanner.imageUrl}
                    alt={stats.activeBanner.title || "Banner aktif"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  {stats.activeBanner.tag && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                      [{stats.activeBanner.tag}]
                    </span>
                  )}
                  <p className="mt-0.5 text-xs font-bold text-neutral-950 truncate">
                    {stats.activeBanner.title || "Banner Tanpa Judul"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="border border-dashed border-neutral-300 py-6 text-center text-xs text-neutral-500">
                Belum ada banner aktif di beranda.
              </p>
            )}

            <Link
              href="/admin/banners"
              className="block w-full border border-neutral-200 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-800 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
            >
              Kelola &amp; Ganti Banner →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
