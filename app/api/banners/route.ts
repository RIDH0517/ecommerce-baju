import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint: ambil semua banner aktif urut terbaru untuk carousel storefront
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(banners, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/banners]", error);
    return NextResponse.json([], { status: 500 });
  }
}
