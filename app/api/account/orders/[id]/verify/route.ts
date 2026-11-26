import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMidtransConfig,
  getMidtransTransactionStatus,
  syncPaymentStatusByExternalRef,
} from "@/lib/payment/midtrans";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID pesanan diperlukan." }, { status: 400 });
  }

  try {
    const existing = await prisma.order.findFirst({
      where: { id, userId: session.userId },
      include: { payment: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (existing.payment?.status === "PENDING" && existing.payment.externalRefId) {
      const midtransStatus = await getMidtransTransactionStatus(existing.payment.externalRefId);
      await syncPaymentStatusByExternalRef(
        existing.payment.externalRefId,
        midtransStatus.transactionStatus,
        midtransStatus.fraudStatus
      );
    }

    const updatedOrder = await prisma.order.findFirst({
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

    const cfg = getMidtransConfig();
    return NextResponse.json({
      order: updatedOrder,
      snapClientKey: cfg.clientKey,
      snapScriptUrl: cfg.snapScriptUrl,
    });
  } catch (error) {
    console.error("[POST /api/account/orders/[id]/verify]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memeriksa status pembayaran ke Midtrans.",
      },
      { status: 500 }
    );
  }
}
