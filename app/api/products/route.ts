import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ambil semua produk aktif untuk halaman customer (publik, tanpa autentikasi)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  try {
    const products = await prisma.product.findMany({
      where: {
        stock: { gt: 0 },
        ...(category && category !== "All" ? { category } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ isNewDrop: "desc" }, { createdAt: "desc" }],
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Gagal mengambil produk" }, { status: 500 });
  }
}
