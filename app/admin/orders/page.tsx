"use client";

import { useEffect, useMemo, useState } from "react";

type ShippingStatus = "DIPROSES" | "DIKIRIM" | "DALAM_PERJALANAN" | "SELESAI";
type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

interface AdminOrderItem {
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
}

interface AdminOrder {
  id: string;
  totalAmount: string | number;
  shippingAddress: string;
  courier?: string | null;
  shippingCost?: string | number;
  trackingNumber: string | null;
  shippingStatus: ShippingStatus;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  items: AdminOrderItem[];
  payment: {
    status: PaymentStatus;
    provider: string;
    amount: string | number;
    paidAt: string | null;
  } | null;
}

const SHIPPING_OPTIONS: { value: ShippingStatus; label: string }[] = [
  { value: "DIPROSES", label: "Diproses" },
  { value: "DIKIRIM", label: "Dikirim" },
  { value: "DALAM_PERJALANAN", label: "Dalam Perjalanan" },
  { value: "SELESAI", label: "Selesai" },
];

const SHIPPING_BADGE: Record<ShippingStatus, { label: string; cls: string }> = {
  DIPROSES: { label: "Diproses", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  DIKIRIM: { label: "Dikirim", cls: "border-sky-200 bg-sky-50 text-sky-800" },
  DALAM_PERJALANAN: { label: "Perjalanan", cls: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  SELESAI: { label: "Selesai", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
};

const PAYMENT_BADGE: Record<PaymentStatus, { label: string; cls: string }> = {
  SUCCESS: { label: "Lunas", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Pending", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  FAILED: { label: "Gagal", cls: "border-red-200 bg-red-50 text-red-700" },
};

const formatIDR = (val: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val));

function OrderDetailEditor({
  order,
  onUpdated,
}: {
  order: AdminOrder;
  onUpdated: (updated: AdminOrder) => void;
}) {
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(order.shippingStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingStatus, trackingNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pembaruan.");
      if (data.order) onUpdated(data.order as AdminOrder);
      setMsg({ type: "ok", text: "Status pengiriman dan nomor resi diperbarui." });
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal menyimpan pembaruan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const payStatus = order.payment?.status ?? "PENDING";

  return (
    <div className="border border-neutral-950 bg-white p-5 space-y-5 lg:sticky lg:top-24">
      <div className="border-b border-neutral-200 pb-3 flex items-baseline justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            [ORDER DETAIL]
          </span>
          <h2 className="mt-1 font-mono text-sm font-bold text-neutral-950">#{order.id}</h2>
        </div>
        <span
          className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${PAYMENT_BADGE[payStatus].cls}`}
        >
          {PAYMENT_BADGE[payStatus].label}
        </span>
      </div>

      {/* Customer & Address */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block">
            Pelanggan
          </span>
          <p className="font-semibold text-neutral-950">{order.user.name}</p>
          <p className="font-mono text-[11px] text-neutral-500">
            {order.user.email}
            {order.user.phone ? ` · ${order.user.phone}` : ""}
          </p>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block">
            Alamat Pengiriman{order.courier ? ` · Kurir: ${order.courier}` : ""}
          </span>
          <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
            {order.shippingAddress}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-neutral-200 pt-4 space-y-2.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
          Item Dibeli ({order.items.length})
        </span>
        <ul className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
          {order.items.map((item) => (
            <li key={item.id} className="py-2 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 truncate">
                  {item.product?.name ?? "Produk"}
                </p>
                <p className="font-mono text-[10px] text-neutral-500">
                  {item.size ? `SIZE ${item.size} · ` : ""}{item.quantity} × {formatIDR(item.unitPrice)}
                </p>
              </div>
              <span className="font-mono font-semibold text-neutral-950 flex-shrink-0">
                {formatIDR(Number(item.unitPrice) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-neutral-200 pt-2.5 flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Total ({order.payment?.provider ?? "MIDTRANS"})
          </span>
          <span className="font-mono text-base font-bold text-neutral-950">
            {formatIDR(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Fulfillment Form */}
      <form onSubmit={handleSave} className="border-t border-neutral-200 pt-4 space-y-4">
        <div>
          <label
            htmlFor="order-ship-status"
            className="block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600"
          >
            Status Pengiriman
          </label>
          <select
            id="order-ship-status"
            value={shippingStatus}
            onChange={(e) => setShippingStatus(e.target.value as ShippingStatus)}
            className="mt-1.5 block w-full border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-950 focus:border-neutral-950 focus:outline-none"
          >
            {SHIPPING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="order-tracking"
            className="block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600"
          >
            Nomor Resi (Tracking Number)
          </label>
          <input
            id="order-tracking"
            type="text"
            maxLength={64}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Contoh: JNE-882910291"
            className="mt-1.5 block w-full border border-neutral-200 bg-white px-3 py-2.5 font-mono text-xs text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
          />
        </div>

        {msg && (
          <div
            aria-live="polite"
            className={`border p-3 text-xs ${
              msg.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-neutral-950 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 font-[Montserrat,sans-serif] cursor-pointer"
        >
          {saving ? "Menyimpan..." : "Simpan Status & Resi"}
        </button>
      </form>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ShippingStatus>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/orders", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat pesanan.");
        return (data.orders ?? []) as AdminOrder[];
      })
      .then((list) => {
        if (active) {
          setOrders(list);
          if (list.length > 0) setSelectedId(list[0].id);
        }
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
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.shippingStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q) ||
        (o.trackingNumber || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  const handleOrderUpdated = (updated: AdminOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="border-b border-neutral-200 pb-6">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          [03 / ORDER FULFILLMENT]
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
          Manajemen Pesanan
        </h1>
        <p className="mt-1 font-mono text-[11px] text-neutral-500">
          {orders.length} total pesanan · perbarui status pengiriman dan nomor resi
        </p>
      </div>

      {/* ── FILTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 border border-neutral-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-neutral-950 text-white"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            Semua ({orders.length})
          </button>
          {SHIPPING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                statusFilter === opt.value
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {opt.label} ({orders.filter((o) => o.shippingStatus === opt.value).length})
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ID, nama, email, atau resi..."
          className="w-full sm:w-80 border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
        />
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}</div>
      )}

      {/* ── CONTENT GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 border border-neutral-200 bg-white animate-pulse" />
          <div className="lg:col-span-5 h-80 border border-neutral-200 bg-white animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-600">
            {orders.length === 0
              ? "Belum Ada Pesanan dari Pelanggan"
              : "Tidak Ada Pesanan yang Cocok"}
          </p>
          <p className="mt-1.5 text-xs text-neutral-400">
            Pesanan yang selesai melalui checkout akan tampil di sini untuk diproses dan diberi nomor resi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Orders Table */}
          <div className="lg:col-span-7 border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                    <th className="py-3.5 pl-5 font-semibold">Order</th>
                    <th className="py-3.5 font-semibold">Pelanggan</th>
                    <th className="py-3.5 font-semibold">Total</th>
                    <th className="py-3.5 pr-5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((ord) => {
                    const active = selectedOrder?.id === ord.id;
                    const ship = SHIPPING_BADGE[ord.shippingStatus];
                    const dateStr = new Date(ord.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedId(ord.id)}
                        className={`cursor-pointer transition-colors ${
                          active ? "bg-neutral-100" : "hover:bg-neutral-50"
                        }`}
                      >
                        <td className="py-3.5 pl-5">
                          <p className="font-mono text-[11px] font-bold text-neutral-950">
                            #{ord.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400">{dateStr}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-neutral-900 truncate max-w-[160px]">
                            {ord.user.name}
                          </p>
                          <p className="font-mono text-[10px] text-neutral-400 truncate max-w-[160px]">
                            {ord.trackingNumber ? `Resi: ${ord.trackingNumber}` : "Belum ada resi"}
                          </p>
                        </td>
                        <td className="py-3.5 font-mono font-semibold text-neutral-950 tabular-nums">
                          {formatIDR(ord.totalAmount)}
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
          </div>

          {/* RIGHT: Order Inspector */}
          <div className="lg:col-span-5">
            {selectedOrder && (
              <OrderDetailEditor
                key={selectedOrder.id}
                order={selectedOrder}
                onUpdated={handleOrderUpdated}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
