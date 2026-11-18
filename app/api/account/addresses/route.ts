import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MAX_ADDRESSES_PER_USER, validateAddressPayload } from "@/lib/addresses";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("[GET /api/account/addresses]", error);
    return NextResponse.json({ error: "Gagal mengambil daftar alamat." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const parsed = validateAddressPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: session.userId } });
      if (count >= MAX_ADDRESSES_PER_USER) {
        return { limitReached: true as const };
      }

      const shouldBePrimary = count === 0 || parsed.data.isPrimary;
      if (shouldBePrimary) {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isPrimary: false },
        });
      }

      const address = await tx.address.create({
        data: {
          userId: session.userId,
          label: parsed.data.label,
          recipientName: parsed.data.recipientName,
          phone: parsed.data.phone,
          province: parsed.data.province,
          city: parsed.data.city,
          district: parsed.data.district,
          postalCode: parsed.data.postalCode,
          fullAddress: parsed.data.fullAddress,
          notes: parsed.data.notes,
          isPrimary: shouldBePrimary,
        },
      });

      return { limitReached: false as const, address };
    });

    if (result.limitReached) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_ADDRESSES_PER_USER} alamat pengiriman per akun.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Alamat berhasil disimpan.", address: result.address },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/account/addresses]", error);
    return NextResponse.json({ error: "Gagal menyimpan alamat." }, { status: 500 });
  }
}
