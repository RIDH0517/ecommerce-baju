import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Ambil semua produk (admin only)
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

// POST — Buat produk baru (admin only)
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      oldPrice,
      discount,
      category,
      collection,
      specs,
      imageUrl,
      isNewDrop,
      images,  // [{ url: string, order: number }]
      sizes,   // [{ size: string, stock: number }]
    } = body;

    // --- Validasi input wajib ---
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "Harga produk tidak valid" }, { status: 400 });
    }
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Foto produk wajib diisi" }, { status: 400 });
    }

    // Hitung total stok dari semua ukuran
    const totalStock = Array.isArray(sizes)
      ? sizes.reduce((sum: number, s: { stock: number }) => sum + (Number(s.stock) || 0), 0)
      : 0;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        discount: discount?.trim() || null,
        category: category?.trim() || null,
        collection: collection?.trim() || null,
        specs: Array.isArray(specs) ? specs.filter((s: string) => s.trim()) : [],
        imageUrl,
        isNewDrop: Boolean(isNewDrop),
        stock: totalStock,
        images: {
          create: Array.isArray(images)
            ? images.map((img: { url: string; order: number }) => ({
                url: img.url,
                order: Number(img.order) || 0,
              }))
            : [],
        },
        sizes: {
          create: Array.isArray(sizes)
            ? sizes
                .filter((s: { size: string; stock: number }) => s.size)
                .map((s: { size: string; stock: number }) => ({
                  size: s.size.trim().toUpperCase(),
                  stock: Math.max(0, Number(s.stock) || 0),
                }))
            : [],
        },
      },
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ error: "Gagal membuat produk" }, { status: 500 });
  }
}
