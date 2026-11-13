import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint: siapa saja bisa GET banner aktif
export async function GET() {
  const banner = await prisma.banner.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(banner);
}

