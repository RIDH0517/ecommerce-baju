"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  stock: number;
}

interface OrderItem {
  id: string;
  customer: string;
  total: number;
  status: "DIPROSES" | "DIKIRIM" | "SELESAI";
}

interface BannerItem {
  id: string;
  title: string;
  tag: string;
  imageUrl: string;
}

interface DashboardData {
  totalRevenue: number;
  totalProducts: number;
  totalOrders: number;
  pendingShippingCount: number;
  completedShippingCount: number;
  lowStockProducts: ProductItem[];
  recentOrders: OrderItem[];
  banners: BannerItem[];
}

// -- Animated counter hook --
function useCounter(end: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(start + (end - start) * eased));

      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };

    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [end, duration]);

  return value;
}

// -- Tiny sparkline component --
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-40">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// -- Status pill --
function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    DIPROSES: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Menunggu" },
    DIKIRIM: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", label: "Dikirim" },
    SELESAI: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Selesai" },
  };
  const c = config[status] || config.DIPROSES;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${status === "DIPROSES" ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
}

// ────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────

export default function AdminDashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"semua" | "pending" | "selesai">("semua");

  // Banner modal state
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerTag, setBannerTag] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDesc, setBannerDesc] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(false);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const bannerDropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchCurrentBanner();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchCurrentBanner = async () => {
    try {
      const res = await fetch("/api/banners");
      if (res.ok) {
        const banner = await res.json();
        if (banner?.imageUrl) setCurrentBannerUrl(banner.imageUrl);
      }
    } catch (_) {}
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData({
          totalRevenue: 48750000,
          totalProducts: 24,
          totalOrders: 64,
          pendingShippingCount: 7,
          completedShippingCount: 57,
          lowStockProducts: [
            { id: "1", name: "Signature Heavyweight Hoodie", stock: 2, category: "Outerwear" },
            { id: "2", name: "Tokyo Minimalist Oversized Tee", stock: 1, category: "T-Shirts" },
            { id: "3", name: "Kyoto Raw Selvedge Denim", stock: 3, category: "Denim" },
          ],
          recentOrders: [
            { id: "ORD-9021", customer: "Rian Pratama", total: 650000, status: "DIPROSES" },
            { id: "ORD-9020", customer: "Siti Aminah", total: 349000, status: "DIPROSES" },
            { id: "ORD-9019", customer: "Budi Santoso", total: 1250000, status: "SELESAI" },
            { id: "ORD-9018", customer: "Dewi Lestari", total: 420000, status: "DIKIRIM" },
          ],
          banners: [
            {
              id: "b1",
              title: "Spring / Summer 2026 Drop",
              tag: "NEW COLLECTION",
              imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800",
            },
          ],
        });
      }
    } catch (error) {
      console.error("Gagal memuat statistik", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatIDR = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  // Kompresi otomatis ke WebP sebelum kirim ke Supabase
  const compressImageToWebP = (file: File, maxWidth = 1600, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Gagal kompresi"));
              const cleanName = file.name.replace(/\.[^/.]+$/, "");
              resolve(new File([blob], `${cleanName}.webp`, { type: "image/webp", lastModified: Date.now() }));
            },
            "image/webp",
            quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerFile) return alert("Pilih gambar banner terlebih dahulu!");

    setIsSubmittingBanner(true);
    setBannerSuccess(false);
    try {
      const optimized = await compressImageToWebP(bannerFile, 1600, 0.85);
      const formData = new FormData();
      formData.append("file", optimized);
      formData.append("folder", "banners");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload gambar");

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          title: bannerTitle || undefined,
          description: bannerDesc || undefined,
          tag: bannerTag || undefined,
        }),
      });

      if (res.ok) {
        setBannerSuccess(true);
        setCurrentBannerUrl(uploadData.url);
        // Auto-close after success animation
        setTimeout(() => {
          setIsBannerModalOpen(false);
          setBannerFile(null);
          setBannerPreview("");
          setBannerTitle("");
          setBannerDesc("");
          setBannerTag("");
          setBannerSuccess(false);
        }, 1500);
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  // Animated counters
  const animatedRevenue = useCounter(data?.totalRevenue || 0, 1400);
  const animatedOrders = useCounter(data?.totalOrders || 0, 900);
  const animatedProducts = useCounter(data?.totalProducts || 0, 700);
  const animatedPending = useCounter(data?.pendingShippingCount || 0, 600);

  // Fake sparkline data for visual flair
  const revenueSparkline = [12, 18, 14, 22, 19, 27, 32, 29, 35, 42, 38, 48];
  const orderSparkline = [3, 5, 4, 8, 6, 9, 7, 11, 10, 12, 9, 14];

  const filteredOrders = data?.recentOrders.filter((o) => {
    if (activeTab === "pending") return o.status === "DIPROSES";
    if (activeTab === "selesai") return o.status === "SELESAI";
    return true;
  });

  const greeting = (() => {
    if (!now) return "Selamat Datang";
    const h = now.getHours();
    if (h < 12) return "Selamat Pagi";
    if (h < 17) return "Selamat Siang";
    return "Selamat Malam";
  })();

  // ─── Loading ─────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-6 w-6 rounded-full border-2 border-stone-300 border-t-stone-900"
        />
        <p className="mt-4 text-xs text-stone-400 tracking-widest uppercase">
          Memuat data…
        </p>
      </div>
    );
  }

  // ─── Main render ─────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-[Inter,system-ui,sans-serif] selection:bg-stone-900 selection:text-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 sm:px-8 h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[15px] font-black tracking-[-0.04em] text-stone-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
              urban<span className="text-emerald-600">.</span>kamen
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-stone-200" />
            <span className="hidden sm:inline-block text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400">
              Control Panel
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-stone-100 px-3.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Edit Banner
            </button>
            <Link
              href="/"
              className="flex items-center gap-1 rounded-full bg-stone-900 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              Lihat Toko
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1360px] px-5 sm:px-8 py-8 space-y-10">

        {/* ── GREETING ROW ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-stone-400 mb-1">
              {now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Memuat tanggal..."}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-stone-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {greeting}, Admin
            </h1>
          </div>
          <p className="text-xs font-mono text-stone-400 tabular-nums">
            {now ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
          </p>
        </motion.section>

        {/* ── REVENUE HERO ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-2xl bg-stone-900 text-white p-6 sm:p-8 overflow-hidden"
        >
          {/* Decorative gradient blob */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-stone-600/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-stone-400">
                Total Pendapatan
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.03em] tabular-nums" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {formatIDR(animatedRevenue)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Dari {data?.totalOrders || 0} transaksi terkonfirmasi</p>
            </div>
            <MiniSparkline data={revenueSparkline} color="#34d399" />
          </div>
        </motion.section>

        {/* ── METRICS ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Pesanan Masuk",
              value: animatedOrders,
              suffix: "",
              sparkline: orderSparkline,
              color: "#0ea5e9",
              accent: "text-sky-600",
            },
            {
              label: "Harus Dikirim",
              value: animatedPending,
              suffix: "antrian",
              sparkline: [2, 4, 3, 6, 5, 8, 7, 9, 6, 7],
              color: "#f59e0b",
              accent: "text-amber-600",
              alert: (data?.pendingShippingCount || 0) > 5,
            },
            {
              label: "Produk Aktif",
              value: animatedProducts,
              suffix: "SKU",
              sparkline: [18, 19, 20, 20, 21, 22, 22, 23, 24, 24],
              color: "#8b5cf6",
              accent: "text-violet-600",
            },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              className={`relative rounded-2xl border bg-white p-5 overflow-hidden ${
                metric.alert ? "border-amber-200 ring-1 ring-amber-100" : "border-stone-200/60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-stone-400">{metric.label}</p>
                  <p className={`text-2xl font-black tracking-[-0.02em] tabular-nums ${metric.accent}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {metric.value}
                    {metric.suffix && (
                      <span className="ml-1.5 text-xs font-normal text-stone-400">{metric.suffix}</span>
                    )}
                  </p>
                </div>
                <MiniSparkline data={metric.sparkline} color={metric.color} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT: Orders (3 cols) */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-3 rounded-2xl border border-stone-200/60 bg-white overflow-hidden"
          >
            {/* Tab header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
              <div className="flex items-center gap-1 rounded-full bg-stone-100 p-0.5">
                {(["semua", "pending", "selesai"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                      activeTab === tab
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {tab === "semua" ? "Semua" : tab === "pending" ? "Pending" : "Selesai"}
                  </button>
                ))}
              </div>
              <Link href="/admin/orders" className="text-[11px] font-semibold text-stone-400 hover:text-stone-900 transition-colors">
                Semua pesanan →
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-semibold tracking-[0.12em] uppercase text-stone-400">
                    <th className="py-3 pl-5 font-semibold">ID</th>
                    <th className="py-3 font-semibold">Pelanggan</th>
                    <th className="py-3 font-semibold">Total</th>
                    <th className="py-3 pr-5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredOrders?.map((ord) => (
                      <motion.tr
                        key={ord.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-stone-50 hover:bg-stone-50/80 transition-colors"
                      >
                        <td className="py-3.5 pl-5 font-mono text-xs font-bold text-stone-500">{ord.id}</td>
                        <td className="py-3.5 font-medium text-stone-700">{ord.customer}</td>
                        <td className="py-3.5 font-semibold text-stone-900 tabular-nums">{formatIDR(ord.total)}</td>
                        <td className="py-3.5 pr-5">
                          <StatusPill status={ord.status} />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredOrders?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-stone-300">
                        Tidak ada pesanan di filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* RIGHT: Stock alerts (2 cols) */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="lg:col-span-2 rounded-2xl border border-stone-200/60 bg-white p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-stone-400">Stok Menipis</h2>
              <span className="rounded-full bg-red-50 text-red-600 px-2.5 py-0.5 text-[10px] font-bold">
                {data?.lowStockProducts.length || 0} item
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {data?.lowStockProducts.map((prod, i) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center justify-between rounded-xl border border-stone-100 p-3.5 hover:border-stone-200 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold text-stone-800 truncate group-hover:text-stone-900 transition-colors">
                      {prod.name}
                    </h3>
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-stone-400">{prod.category}</span>
                  </div>
                  {/* Stock bar */}
                  <div className="flex flex-col items-end gap-1 ml-3">
                    <span className="text-[11px] font-bold text-red-500 tabular-nums">
                      {prod.stock} pcs
                    </span>
                    <div className="h-1 w-10 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-400"
                        style={{ width: `${Math.min((prod.stock / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link
              href="/admin/products"
              className="mt-4 block w-full text-center rounded-xl border border-stone-200 py-2.5 text-[11px] font-semibold text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
            >
              Kelola Stok Barang
            </Link>
          </motion.section>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: "Produk Baru", href: "/admin/products/new", icon: "M12 4v16m8-8H4" },
            { label: "Pesanan", href: "/admin/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "Edit Banner", href: "#", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", onClick: () => setIsBannerModalOpen(true) },
            { label: "Toko Depan", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          ].map((action) =>
            action.onClick ? (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-2.5 rounded-xl border border-stone-200/60 bg-white px-4 py-3 text-[12px] font-semibold text-stone-600 hover:border-stone-300 hover:text-stone-900 hover:shadow-sm transition-all"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
                {action.label}
              </button>
            ) : (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2.5 rounded-xl border border-stone-200/60 bg-white px-4 py-3 text-[12px] font-semibold text-stone-600 hover:border-stone-300 hover:text-stone-900 hover:shadow-sm transition-all"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
                {action.label}
              </Link>
            )
          )}
        </motion.section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-200/60 mt-4">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 py-4 flex items-center justify-between">
          <p className="text-[10px] tracking-[0.15em] uppercase text-stone-300">
            urban.kamen control panel
          </p>
          <p className="text-[10px] text-stone-300 tabular-nums font-mono">
            v2.0
          </p>
        </div>
      </footer>

      {/* ── BANNER MODAL ── */}
      <AnimatePresence>
        {isBannerModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsBannerModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 400 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl shadow-stone-900/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Ganti Banner Beranda</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">Upload gambar baru, langsung tampil di halaman toko.</p>
                </div>
                <button
                  onClick={() => setIsBannerModalOpen(false)}
                  className="rounded-full bg-stone-100 p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Success state */}
              <AnimatePresence>
                {bannerSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
                    >
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                    <p className="text-sm font-semibold text-stone-900">Banner berhasil diperbarui!</p>
                    <p className="text-[11px] text-stone-400 mt-1">Perubahan langsung tampil di halaman toko.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload form */}
              {!bannerSuccess && (
                <form onSubmit={handleSaveBanner} className="space-y-3.5">
                  {/* Current banner preview */}
                  {currentBannerUrl && !bannerPreview && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-stone-400">Banner Saat Ini</p>
                      <div className="relative h-32 w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentBannerUrl} alt="Banner saat ini" className="h-full w-full object-cover" />
                      </div>
                    </div>
                  )}

                  {/* Drop zone */}
                  <div>
                    <p className="text-[11px] font-semibold text-stone-500 mb-1.5">Gambar Banner</p>
                    <div
                      ref={bannerDropRef}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0] || null;
                        if (file && file.type.startsWith("image/")) {
                          setBannerFile(file);
                          setBannerPreview(URL.createObjectURL(file));
                        }
                      }}
                      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                        isDragging
                          ? "border-emerald-400 bg-emerald-50/50"
                          : bannerPreview
                          ? "border-stone-200 bg-stone-50"
                          : "border-stone-200 bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {bannerPreview ? (
                        <div className="relative">
                          <div className="relative h-36 w-full rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={bannerPreview} alt="Preview banner baru" className="h-full w-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => { setBannerFile(null); setBannerPreview(""); }}
                            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-semibold text-stone-700 truncate">{bannerFile?.name}</p>
                            <p className="text-[10px] text-stone-400">
                              {bannerFile ? `${(bannerFile.size / 1024).toFixed(0)} KB — akan dikompresi ke WebP` : ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                          <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center mb-2.5">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                            </svg>
                          </div>
                          <p className="text-xs font-semibold text-stone-600">Klik atau seret gambar ke sini</p>
                          <p className="text-[10px] text-stone-400 mt-1">PNG, JPG, WebP — otomatis dikompresi</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setBannerFile(file);
                              if (file) setBannerPreview(URL.createObjectURL(file));
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Tag */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Tag Label <span className="text-stone-300 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={bannerTag}
                      onChange={(e) => setBannerTag(e.target.value)}
                      placeholder="NEW DROP / SUMMER COLLECTION"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:ring-0 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Judul Utama <span className="text-stone-300 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder="Essentials Crafted For Modern Lifestyle."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:ring-0 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                      Deskripsi <span className="text-stone-300 font-normal">(opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={bannerDesc}
                      onChange={(e) => setBannerDesc(e.target.value)}
                      placeholder="Koleksi eksklusif material premium…"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-300 focus:border-stone-400 focus:ring-0 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setIsBannerModalOpen(false); setBannerFile(null); setBannerPreview(""); setBannerTitle(""); setBannerDesc(""); setBannerTag(""); }}
                      className="flex-1 rounded-xl border border-stone-200 py-2.5 text-[11px] font-semibold text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBanner || !bannerFile}
                      className="flex-1 rounded-xl bg-stone-900 py-2.5 text-[11px] font-semibold text-white hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmittingBanner ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block h-3 w-3 rounded-full border-[1.5px] border-white/30 border-t-white"
                          />
                          Mengupload…
                        </span>
                      ) : "Upload & Terapkan"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

