import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  role: true,
  createdAt: true,
} as const;

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: USER_SELECT,
    });
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/account/profile]", error);
    return NextResponse.json({ error: "Gagal mengambil profil." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

  const { name, phone, address } = body;

  if (typeof name !== "string") {
    return NextResponse.json({ error: "Nama lengkap harus 2–60 karakter." }, { status: 400 });
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 60) {
    return NextResponse.json({ error: "Nama lengkap harus 2–60 karakter." }, { status: 400 });
  }

  let normalizedPhone: string | null = null;
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string") {
      return NextResponse.json({ error: "Nomor HP tidak valid." }, { status: 400 });
    }
    const cleaned = phone.trim().replace(/[\s-]/g, "");
    if (cleaned.length > 0) {
      if (!/^(\+62|62|0)8\d{7,11}$/.test(cleaned)) {
        return NextResponse.json(
          { error: "Nomor HP tidak valid (contoh: 0812xxxxxxxx)." },
          { status: 400 }
        );
      }
      normalizedPhone = cleaned;
    }
  }

  let normalizedAddress: string | null = null;
  if (address !== undefined && address !== null) {
    if (typeof address !== "string") {
      return NextResponse.json({ error: "Format alamat tidak valid." }, { status: 400 });
    }
    const trimmedAddress = address.trim();
    if (trimmedAddress.length > 500) {
      return NextResponse.json({ error: "Alamat maksimal 500 karakter." }, { status: 400 });
    }
    if (trimmedAddress.length > 0) {
      normalizedAddress = trimmedAddress;
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: trimmedName,
        phone: normalizedPhone,
        address: normalizedAddress,
      },
      select: USER_SELECT,
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui.",
      user,
    });
  } catch (error) {
    console.error("[PATCH /api/account/profile]", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}
