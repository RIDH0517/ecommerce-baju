import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function parseJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

async function getUserCartItems(userId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          category: true,
          images: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.product.id,
    name: row.product.name,
    price: Number(row.product.price),
    image: row.product.images[0]?.url || row.product.imageUrl,
    size: row.size,
    quantity: row.quantity,
    category: row.product.category || "",
  }));
}

// GET — Ambil keranjang & daftar ID produk yang pernah dibeli oleh akun aktif
export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const [items, purchasedRows] = await Promise.all([
      getUserCartItems(session.userId),
      prisma.orderItem.findMany({
        where: {
          order: {
            userId: session.userId,
            OR: [{ payment: null }, { payment: { status: "SUCCESS" } }],
          },
        },
        select: { productId: true },
        distinct: ["productId"],
      }),
    ]);

    return NextResponse.json({
      items,
      purchasedIds: purchasedRows.map((row) => row.productId),
    });
  } catch (error) {
    console.error("[GET /api/cart]", error);
    return NextResponse.json({ error: "Gagal mengambil keranjang belanja." }, { status: 500 });
  }
}

// POST — Tambah produk ke keranjang akun aktif (upsert quantity)
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const productId = cleanString(body.productId);
  const size = cleanString(body.size);
  const quantity = body.quantity === undefined ? 1 : Number(body.quantity);

  if (!productId || !size) {
    return NextResponse.json({ error: "Produk dan ukuran wajib diisi." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: "Jumlah barang harus antara 1 hingga 99." }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    await prisma.cartItem.upsert({
      where: {
        userId_productId_size: {
          userId: session.userId,
          productId,
          size,
        },
      },
      create: {
        userId: session.userId,
        productId,
        size,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
    });

    const items = await getUserCartItems(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[POST /api/cart]", error);
    return NextResponse.json({ error: "Gagal menambahkan barang ke keranjang." }, { status: 500 });
  }
}

// PATCH — Ubah jumlah item keranjang milik akun aktif
export async function PATCH(req: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const productId = cleanString(body.productId);
  const size = cleanString(body.size);
  const quantity = Number(body.quantity);

  if (!productId || !size || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: "Data perubahan keranjang tidak valid." }, { status: 400 });
  }

  try {
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.userId, productId, size },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: { userId: session.userId, productId, size },
        data: { quantity: Math.min(99, quantity) },
      });
    }

    const items = await getUserCartItems(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[PATCH /api/cart]", error);
    return NextResponse.json({ error: "Gagal memperbarui jumlah barang." }, { status: 500 });
  }
}

// DELETE — Hapus satu item spesifik atau kosongkan seluruh keranjang akun aktif
export async function DELETE(req: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const body = (await parseJsonBody(req)) ?? {};
  const productId = cleanString(body.productId);
  const size = cleanString(body.size);
  const clearAll = body.clearAll === true;

  try {
    if (!clearAll && productId && size) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.userId, productId, size },
      });
    } else {
      await prisma.cartItem.deleteMany({
        where: { userId: session.userId },
      });
    }

    const items = await getUserCartItems(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[DELETE /api/cart]", error);
    return NextResponse.json({ error: "Gagal menghapus barang dari keranjang." }, { status: 500 });
  }
}
