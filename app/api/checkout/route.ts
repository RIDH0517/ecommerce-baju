import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shippingProvider, DEFAULT_ITEM_WEIGHT_GRAM } from "@/lib/shipping";
import { createQrisSnapTransaction, getMidtransConfig } from "@/lib/payment/midtrans";

const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 99;

interface CheckoutItemInput {
  productId: string;
  size: string;
  quantity: number;
}

class CheckoutValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function parseItems(raw: unknown): CheckoutItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null;
  const items: CheckoutItemInput[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") return null;
    const { productId, size, quantity } = it as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0 || productId.length > 64) {
      return null;
    }
    if (typeof size !== "string" || size.length === 0 || size.length > 10) return null;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QTY_PER_ITEM
    ) {
      return null;
    }
    items.push({ productId, size: size.trim().toUpperCase(), quantity });
  }
  return items;
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const midtransCfg = getMidtransConfig();
  if (!midtransCfg.serverKey || !midtransCfg.clientKey) {
    return NextResponse.json(
      {
        error:
          "Konfigurasi Midtrans belum lengkap. Pastikan MIDTRANS_SERVER_KEY dan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY sudah diisi di .env lalu jalankan ulang server.",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const addressId = typeof body.addressId === "string" ? body.addressId.trim() : "";
  const courierCode = typeof body.courierCode === "string" ? body.courierCode.trim() : "";
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const paymentMethod =
    typeof body.paymentMethod === "string" ? body.paymentMethod.trim().toUpperCase() : "QRIS";

  if (!addressId) {
    return NextResponse.json({ error: "Alamat pengiriman wajib dipilih." }, { status: 400 });
  }
  if (!courierCode || !service) {
    return NextResponse.json({ error: "Jasa pengiriman wajib dipilih." }, { status: 400 });
  }
  if (paymentMethod !== "QRIS") {
    return NextResponse.json(
      { error: "Saat ini metode pembayaran yang aktif adalah QRIS." },
      { status: 400 }
    );
  }

  const rawItems = parseItems(body.items);
  if (!rawItems) {
    return NextResponse.json({ error: "Data keranjang belanja tidak valid." }, { status: 400 });
  }

  // Gabungkan item yang memiliki produk & ukuran yang sama
  const mergedMap = new Map<string, CheckoutItemInput>();
  for (const it of rawItems) {
    const key = `${it.productId}::${it.size}`;
    const prev = mergedMap.get(key);
    mergedMap.set(key, prev ? { ...prev, quantity: prev.quantity + it.quantity } : { ...it });
  }
  const items = [...mergedMap.values()];

  try {
    const [user, address, products] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true, email: true, phone: true },
      }),
      prisma.address.findFirst({
        where: { id: addressId, userId: session.userId },
      }),
      prisma.product.findMany({
        where: { id: { in: [...new Set(items.map((i) => i.productId))] } },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          sizes: { select: { id: true, size: true, stock: true } },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Akun pengguna tidak ditemukan." }, { status: 404 });
    }
    if (!address) {
      return NextResponse.json({ error: "Alamat pengiriman tidak ditemukan." }, { status: 404 });
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const orderLines: {
      productId: string;
      name: string;
      size: string;
      sizeId: string | null;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const it of items) {
      const p = productById.get(it.productId);
      if (!p) {
        return NextResponse.json(
          { error: "Salah satu produk di keranjang sudah tidak tersedia." },
          { status: 400 }
        );
      }

      const sizeRow = p.sizes.find((s) => s.size.toUpperCase() === it.size) ?? null;
      const availableStock = p.sizes.length > 0 ? sizeRow?.stock ?? 0 : p.stock;

      if (p.sizes.length > 0 && !sizeRow) {
        return NextResponse.json(
          { error: `Ukuran ${it.size} untuk ${p.name} tidak tersedia.` },
          { status: 400 }
        );
      }

      if (availableStock < it.quantity) {
        return NextResponse.json(
          {
            error:
              availableStock === 0
                ? `Stok ${p.name} (ukuran ${it.size}) baru saja habis.`
                : `Stok ${p.name} (ukuran ${it.size}) hanya tersisa ${availableStock} pcs.`,
          },
          { status: 409 }
        );
      }

      orderLines.push({
        productId: p.id,
        name: p.name,
        size: it.size,
        sizeId: sizeRow?.id ?? null,
        quantity: it.quantity,
        unitPrice: Math.round(Number(p.price)),
      });
    }

    const subtotal = orderLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const totalQty = orderLines.reduce((sum, l) => sum + l.quantity, 0);

    // Hitung ulang ongkir secara server-side (anti manipulasi ongkir dari client)
    const shippingRates = await shippingProvider.getRates({
      destination: {
        province: address.province,
        city: address.city,
        postalCode: address.postalCode,
      },
      weightGram: totalQty * DEFAULT_ITEM_WEIGHT_GRAM,
      subtotal,
    });

    const selectedShipping = shippingRates.find(
      (r) => r.courierCode === courierCode && r.service === service
    );
    if (!selectedShipping) {
      return NextResponse.json(
        { error: "Layanan kurir tidak lagi tersedia untuk alamat ini. Silakan pilih ulang." },
        { status: 400 }
      );
    }

    const shippingCost = Math.round(selectedShipping.cost);
    const totalAmount = subtotal + shippingCost;
    const courierLabel = `${selectedShipping.courierName} ${selectedShipping.service}`;
    const formattedAddress = [
      `${address.recipientName} (${address.phone}) — [${address.label}]`,
      address.fullAddress,
      `Kec. ${address.district}, ${address.city}, ${address.province} ${address.postalCode}`,
      address.notes ? `Catatan: ${address.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const externalRefId = `UK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // Fase 1: Reservasi stok atomik & buat Order + Payment di DB
    const createdOrder = await prisma.$transaction(async (tx) => {
      for (const line of orderLines) {
        if (line.sizeId) {
          const decSize = await tx.productSize.updateMany({
            where: { id: line.sizeId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (decSize.count === 0) {
            throw new CheckoutValidationError(
              `Stok ${line.name} (ukuran ${line.size}) tidak mencukupi.`,
              409
            );
          }

          await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
        } else {
          const decProduct = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (decProduct.count === 0) {
            throw new CheckoutValidationError(`Stok ${line.name} tidak mencukupi.`, 409);
          }
        }
      }

      return tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          shippingAddress: formattedAddress,
          courier: courierLabel,
          shippingCost,
          items: {
            create: orderLines.map((line) => ({
              productId: line.productId,
              size: line.size,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
          payment: {
            create: {
              provider: "MIDTRANS_QRIS",
              transactionToken: `pending:${externalRefId}`,
              externalRefId,
              amount: totalAmount,
              status: "PENDING",
            },
          },
        },
        select: { id: true },
      });
    });

    // Fase 2: Minta Snap Token QRIS ke Midtrans di luar transaksi DB
    try {
      const snap = await createQrisSnapTransaction({
        externalRefId,
        items: orderLines.map((l) => ({
          id: l.productId,
          name: l.name,
          size: l.size,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        })),
        shippingCost,
        courierLabel,
        customer: {
          name: user.name,
          email: user.email,
          phone: address.phone || user.phone || "",
        },
        shippingAddress: {
          recipientName: address.recipientName,
          phone: address.phone,
          fullAddress: address.fullAddress,
          city: address.city,
          postalCode: address.postalCode,
        },
      });

      await prisma.$transaction([
        prisma.payment.update({
          where: { orderId: createdOrder.id },
          data: { transactionToken: snap.token },
        }),
        prisma.cartItem.deleteMany({
          where: { userId: user.id },
        }),
      ]);

      return NextResponse.json(
        {
          orderId: createdOrder.id,
          externalRefId,
          snapToken: snap.token,
          redirectUrl: snap.redirectUrl,
          snapClientKey: midtransCfg.clientKey,
          snapScriptUrl: midtransCfg.snapScriptUrl,
        },
        { status: 201 }
      );
    } catch (midtransErr) {
      // Rollback stok & hapus order sementara agar keranjang pengguna tetap utuh jika Midtrans gagal
      await prisma
        .$transaction(async (tx) => {
          for (const line of orderLines) {
            if (line.sizeId) {
              await tx.productSize.updateMany({
                where: { id: line.sizeId },
                data: { stock: { increment: line.quantity } },
              });
            }
            await tx.product.updateMany({
              where: { id: line.productId },
              data: { stock: { increment: line.quantity } },
            });
          }
          await tx.order.delete({ where: { id: createdOrder.id } });
        })
        .catch((rbErr) => {
          console.error("[POST /api/checkout rollback]", rbErr);
        });

      console.error("[POST /api/checkout Midtrans]", midtransErr);
      return NextResponse.json(
        {
          error:
            midtransErr instanceof Error
              ? midtransErr.message
              : "Gagal menghubungkan ke layanan pembayaran Midtrans.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/checkout]", error);
    return NextResponse.json({ error: "Gagal memproses checkout pesanan." }, { status: 500 });
  }
}
