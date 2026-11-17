import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("[GET /api/admin/banners]", error);
    return NextResponse.json({ error: "Gagal mengambil daftar banner" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { imageUrl, title, description, tag } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl wajib diisi" }, { status: 400 });
    }

    const banner = await prisma.$transaction(async (tx) => {
      await tx.banner.updateMany({ data: { isActive: false } });
      return tx.banner.create({
        data: {
          imageUrl,
          isActive: true,
          title: typeof title === "string" ? title.trim() || null : null,
          description: typeof description === "string" ? description.trim() || null : null,
          tag: typeof tag === "string" ? tag.trim() || null : null,
        },
      });
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/banners]", error);
    return NextResponse.json({ error: "Gagal menyimpan banner" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "ID banner diperlukan" }, { status: 400 });
    }

    const banner = await prisma.$transaction(async (tx) => {
      const target = await tx.banner.findUnique({ where: { id } });
      if (!target) return null;
      await tx.banner.updateMany({ data: { isActive: false } });
      return tx.banner.update({ where: { id }, data: { isActive: true } });
    });

    if (!banner) {
      return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error("[PATCH /api/admin/banners]", error);
    return NextResponse.json({ error: "Gagal mengaktifkan banner" }, { status: 500 });
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

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const target = await tx.banner.findUnique({ where: { id } });
      if (!target) return null;

      await tx.banner.delete({ where: { id } });

      if (target.isActive) {
        const nextBanner = await tx.banner.findFirst({ orderBy: { createdAt: "desc" } });
        if (nextBanner) {
          await tx.banner.update({ where: { id: nextBanner.id }, data: { isActive: true } });
        }
      }

      return target;
    });

    if (!deleted) {
      return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Banner dihapus" });
  } catch (error) {
    console.error("[DELETE /api/admin/banners]", error);
    return NextResponse.json({ error: "Gagal menghapus banner" }, { status: 500 });
  }
}
