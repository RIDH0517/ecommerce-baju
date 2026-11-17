import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// GET — Detail satu produk (admin only)
export async function GET(_req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

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
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("[GET /api/admin/products/[id]]", error);
    return NextResponse.json({ error: "Gagal mengambil produk" }, { status: 500 });
  }
}

// PUT — Edit produk (admin only)
export async function PUT(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

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
      images,
      sizes,
    } = body;

    // Validasi
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "Harga produk tidak valid" }, { status: 400 });
    }
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Foto produk wajib diisi" }, { status: 400 });
    }

    const totalStock = Array.isArray(sizes)
      ? sizes.reduce((sum: number, s: { stock: number }) => sum + (Number(s.stock) || 0), 0)
      : 0;

    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productSize.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
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
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PUT /api/admin/products/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

// DELETE — Hapus produk (admin only)
export async function DELETE(_req: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/admin/products/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
