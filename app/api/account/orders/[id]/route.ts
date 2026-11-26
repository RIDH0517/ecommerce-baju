import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getMidtransConfig } from "@/lib/payment/midtrans";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID pesanan diperlukan." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, category: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    const cfg = getMidtransConfig();
    return NextResponse.json({
      order,
      snapClientKey: cfg.clientKey,
      snapScriptUrl: cfg.snapScriptUrl,
    });
  } catch (error) {
    console.error("[GET /api/account/orders/[id]]", error);
    return NextResponse.json({ error: "Gagal mengambil detail pesanan." }, { status: 500 });
  }
}
