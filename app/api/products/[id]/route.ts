import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET — Detail satu produk (publik, tanpa autentikasi)
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[GET /api/products/[id]]", error);
    return NextResponse.json({ error: "Gagal mengambil detail produk" }, { status: 500 });
  }
}
