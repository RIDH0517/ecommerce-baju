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

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, category, price, oldPrice, discount, imageUrl, isNewDrop } = body;

    if (!name || !price || !imageUrl) {
      return NextResponse.json({ error: "name, price, dan imageUrl wajib diisi" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        discount: discount || null,
        imageUrl,
        isNewDrop: Boolean(isNewDrop),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Gagal menyimpan produk" }, { status: 500 });
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

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: "Produk dihapus" });
}
