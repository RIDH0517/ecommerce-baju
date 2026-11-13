import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(banners);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { imageUrl, title, description, tag } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl wajib diisi" }, { status: 400 });
    }

    // Nonaktifkan semua banner lama, lalu buat yang baru sebagai aktif
    await prisma.banner.updateMany({
      data: { isActive: false },
    });

    const banner = await prisma.banner.create({
      data: { imageUrl, isActive: true, title, description, tag },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error: any) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ message: "Banner dihapus" });
}
