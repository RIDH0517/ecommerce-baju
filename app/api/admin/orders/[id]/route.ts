import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_SHIPPING_STATUSES = [
  "DIPROSES",
  "DIKIRIM",
  "DALAM_PERJALANAN",
  "SELESAI",
] as const;

type ShippingStatusValue = (typeof ALLOWED_SHIPPING_STATUSES)[number];
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID pesanan diperlukan" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid" }, { status: 400 });
  }

  const { shippingStatus, trackingNumber } = body;

  if (
    typeof shippingStatus !== "string" ||
    !ALLOWED_SHIPPING_STATUSES.includes(shippingStatus as ShippingStatusValue)
  ) {
    return NextResponse.json({ error: "Status pengiriman tidak valid" }, { status: 400 });
  }

  let normalizedTracking: string | null = null;
  if (trackingNumber !== undefined && trackingNumber !== null) {
    if (typeof trackingNumber !== "string") {
      return NextResponse.json({ error: "Format nomor resi tidak valid" }, { status: 400 });
    }
    const trimmed = trackingNumber.trim();
    if (trimmed.length > 64) {
      return NextResponse.json({ error: "Nomor resi maksimal 64 karakter" }, { status: 400 });
    }
    normalizedTracking = trimmed.length > 0 ? trimmed : null;
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        shippingStatus: shippingStatus as ShippingStatusValue,
        trackingNumber: normalizedTracking,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true, category: true } },
          },
        },
        payment: true,
      },
    });

    return NextResponse.json({ order });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Nomor resi tersebut sudah digunakan pada pesanan lain" },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/admin/orders/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui pesanan" }, { status: 500 });
  }
}
