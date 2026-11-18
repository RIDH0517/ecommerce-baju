import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { validateAddressPayload } from "@/lib/addresses";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID alamat diperlukan." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  try {
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
    }

    if (body.setPrimaryOnly === true) {
      const address = await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isPrimary: false },
        });
        return tx.address.update({
          where: { id: existing.id },
          data: { isPrimary: true },
        });
      });

      return NextResponse.json({
        message: "Alamat utama berhasil diubah.",
        address,
      });
    }

    const parsed = validateAddressPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Jika alamat sudah Utama, status Utama tetap dipertahankan sampai user memindahkannya ke alamat lain.
    const nextPrimary = existing.isPrimary || parsed.data.isPrimary;

    const address = await prisma.$transaction(async (tx) => {
      if (nextPrimary && !existing.isPrimary) {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isPrimary: false },
        });
      }
      return tx.address.update({
        where: { id: existing.id },
        data: {
          label: parsed.data.label,
          recipientName: parsed.data.recipientName,
          phone: parsed.data.phone,
          province: parsed.data.province,
          city: parsed.data.city,
          district: parsed.data.district,
          postalCode: parsed.data.postalCode,
          fullAddress: parsed.data.fullAddress,
          notes: parsed.data.notes,
          isPrimary: nextPrimary,
        },
      });
    });

    return NextResponse.json({
      message: "Alamat berhasil diperbarui.",
      address,
    });
  } catch (error) {
    console.error("[PATCH /api/account/addresses/[id]]", error);
    return NextResponse.json({ error: "Gagal memperbarui alamat." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID alamat diperlukan." }, { status: 400 });
  }

  try {
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
    }

    if (existing.isPrimary) {
      return NextResponse.json(
        { error: "Alamat utama tidak dapat dihapus. Atur alamat lain sebagai utama terlebih dahulu." },
        { status: 400 }
      );
    }

    await prisma.address.delete({ where: { id: existing.id } });
    return NextResponse.json({ message: "Alamat berhasil dihapus." });
  } catch (error) {
    console.error("[DELETE /api/account/addresses/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus alamat." }, { status: 500 });
  }
}
