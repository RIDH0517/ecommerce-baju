import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shippingProvider, PROVINCES, DEFAULT_ITEM_WEIGHT_GRAM } from "@/lib/shipping";

// POST /api/checkout/quote
// Menghitung ulang ringkasan checkout di server: harga dari DB, cek stok per ukuran, ongkir.
// Tidak membuat order dan tidak mengubah stok. Pembuatan order + Midtrans menyusul.

const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 99;

interface QuoteItemInput {
  productId: string;
  size: string;
  quantity: number;
}

function parseItems(raw: unknown): QuoteItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null;
  const items: QuoteItemInput[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") return null;
    const { productId, size, quantity } = it as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0 || productId.length > 64) return null;
    if (typeof size !== "string" || size.length === 0 || size.length > 10) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM) {
      return null;
    }
    items.push({ productId, size: size.trim().toUpperCase(), quantity });
  }
  return items;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const items = parseItems(body.items);
  if (!items) {
    return NextResponse.json({ error: "Data keranjang tidak valid." }, { status: 400 });
  }

  const province = typeof body.province === "string" ? body.province.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 100) : "";
  const rawPostalCode = typeof body.postalCode === "string" ? body.postalCode : "";
  const postalCode = rawPostalCode.replace(/\D/g, "").slice(0, 5);
  const hasProvince = (PROVINCES as readonly string[]).includes(province);

  try {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stock: true,
        sizes: { select: { size: true, stock: true } },
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Gabungkan item duplikat (produk + ukuran sama) agar cek stok akurat.
    const merged = new Map<string, QuoteItemInput>();
    for (const it of items) {
      const key = `${it.productId}::${it.size}`;
      const prev = merged.get(key);
      merged.set(key, prev ? { ...prev, quantity: prev.quantity + it.quantity } : { ...it });
    }

    const issues: string[] = [];
    const lines = [...merged.values()].map((it) => {
      const p = byId.get(it.productId);
      if (!p) {
        issues.push("Ada produk di keranjang yang sudah tidak tersedia.");
        return {
          productId: it.productId,
          size: it.size,
          quantity: it.quantity,
          name: null,
          imageUrl: null,
          unitPrice: 0,
          lineTotal: 0,
          availableStock: 0,
          available: false,
        };
      }
      const sizeRow = p.sizes.find((s) => s.size.toUpperCase() === it.size);
      const availableStock = p.sizes.length > 0 ? sizeRow?.stock ?? 0 : p.stock;
      const available = availableStock >= it.quantity;
      if (!available) {
        issues.push(
          availableStock === 0
            ? `${p.name} (ukuran ${it.size}) sedang habis.`
            : `${p.name} (ukuran ${it.size}) hanya tersisa ${availableStock} pcs.`
        );
      }
      const unitPrice = Number(p.price);
      return {
        productId: p.id,
        size: it.size,
        quantity: it.quantity,
        name: p.name,
        imageUrl: p.imageUrl,
        unitPrice,
        lineTotal: unitPrice * it.quantity,
        availableStock,
        available,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0);

    const shippingRates = hasProvince
      ? await shippingProvider.getRates({
          destination: {
            province,
            city: city || undefined,
            postalCode: postalCode || undefined,
          },
          weightGram: totalQty * DEFAULT_ITEM_WEIGHT_GRAM,
          subtotal,
        })
      : [];

    const courierCode = typeof body.courierCode === "string" ? body.courierCode : "";
    const service = typeof body.service === "string" ? body.service : "";
    const selectedShipping =
      shippingRates.find((r) => r.courierCode === courierCode && r.service === service) ?? null;

    const shippingCost = selectedShipping?.cost ?? 0;

    return NextResponse.json({
      lines,
      subtotal,
      totalQty,
      shippingRates,
      selectedShipping,
      shippingCost,
      total: subtotal + shippingCost,
      issues,
      isValid: issues.length === 0 && lines.length > 0,
    });
  } catch (error) {
    console.error("[POST /api/checkout/quote]", error);
    return NextResponse.json({ error: "Gagal menghitung ringkasan checkout." }, { status: 500 });
  }
}
