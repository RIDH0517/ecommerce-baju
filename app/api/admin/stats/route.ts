import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const [orders, products, activeBanner, totalBanners] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true } },
          payment: { select: { status: true } },
        },
      }),
      prisma.product.findMany({
        orderBy: { stock: "asc" },
        include: {
          sizes: { orderBy: { size: "asc" } },
        },
      }),
      prisma.banner.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.banner.count(),
    ]);

    let paidRevenue = 0;
    let pendingRevenue = 0;
    const ordersByStatus = {
      DIPROSES: 0,
      DIKIRIM: 0,
      DALAM_PERJALANAN: 0,
      SELESAI: 0,
    };

    for (const o of orders) {
      ordersByStatus[o.shippingStatus] += 1;
      const amount = Number(o.totalAmount);
      const isPaid = o.payment?.status === "SUCCESS" || (!o.payment && o.shippingStatus === "SELESAI");
      const isPending = o.payment?.status === "PENDING" || (!o.payment && o.shippingStatus !== "SELESAI");

      if (isPaid) {
        paidRevenue += amount;
      } else if (isPending) {
        pendingRevenue += amount;
      }
    }

    let totalUnitsInStock = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    for (const p of products) {
      totalUnitsInStock += p.stock;
      if (p.stock <= 0) outOfStockCount += 1;
      if (p.stock <= LOW_STOCK_THRESHOLD) lowStockCount += 1;
    }

    const lowStockProducts = products
      .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        stock: p.stock,
        imageUrl: p.imageUrl,
        sizes: p.sizes.map((s) => ({ size: s.size, stock: s.stock })),
      }));

    const recentOrders = orders.slice(0, 8).map((o) => ({
      id: o.id,
      customerName: o.user.name,
      customerEmail: o.user.email,
      itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: Number(o.totalAmount),
      shippingStatus: o.shippingStatus,
      paymentStatus: o.payment?.status ?? "PENDING",
      trackingNumber: o.trackingNumber,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      paidRevenue,
      pendingRevenue,
      totalOrders: orders.length,
      ordersByStatus,
      totalProducts: products.length,
      totalUnitsInStock,
      outOfStockCount,
      lowStockCount,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockProducts,
      recentOrders,
      activeBanner,
      totalBanners,
    });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json({ error: "Gagal memuat statistik admin" }, { status: 500 });
  }
}
