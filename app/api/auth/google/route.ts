import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { createSessionToken, hashPassword, setSecureCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectTo = `${origin}/auth/callback`;

  const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  authorizeUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authorizeUrl.toString());
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  if (!accessToken) {
    return NextResponse.json({ error: "Token akses Google tidak ditemukan." }, { status: 400 });
  }

  try {
    const {
      data: { user: supaUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !supaUser || !supaUser.email) {
      return NextResponse.json(
        { error: "Sesi Google tidak valid atau sudah kedaluwarsa." },
        { status: 401 }
      );
    }

    const email = supaUser.email.trim();
    const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>;
    const rawName =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      email.split("@")[0] ||
      "Pelanggan";
    const displayName = rawName.trim().slice(0, 60) || "Pelanggan";

    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) {
      const randomPasswordHash = await hashPassword(crypto.randomUUID());
      user = await prisma.user.create({
        data: {
          name: displayName,
          email: email.toLowerCase(),
          passwordHash: randomPasswordHash,
          role: "CUSTOMER",
        },
      });
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setSecureCookie(token);

    return NextResponse.json({
      message: "Login dengan Google berhasil!",
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/google]", error);
    return NextResponse.json({ error: "Gagal memproses login Google." }, { status: 500 });
  }
}
