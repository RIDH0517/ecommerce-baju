import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSecureCookie } from "@/lib/auth";
import { issueRegisterOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    if (!normalizedEmail || typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi!" }, { status: 400 });
    }

    // Cari pengguna berdasarkan email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json({ error: "Email atau password salah!" }, { status: 401 });
    }

    // Verifikasi password dengan hash Argon2id di database
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Email atau password salah!" }, { status: 401 });
    }

    // Tolak akun baru yang belum menyelesaikan verifikasi OTP
    if (!user.emailVerified) {
      await issueRegisterOtp({
        userId: user.id,
        email: user.email,
        name: user.name,
      }).catch(() => {});

      return NextResponse.json(
        {
          error: "Email Anda belum diverifikasi. Silakan masukkan kode OTP dari email Anda.",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Buat token sesi & simpan ke httpOnly cookie
    const token = createSessionToken({ userId: user.id, email: user.email, role: user.role });
    await setSecureCookie(token);

    return NextResponse.json({
      message: "Login berhasil!",
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
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}