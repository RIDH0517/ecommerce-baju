import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[GET /api/account/orders]", error);
    return NextResponse.json({ error: "Gagal mengambil daftar pesanan." }, { status: 500 });
  }
}
