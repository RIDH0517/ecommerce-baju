import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/authValidation";
import { OTP_RESEND_COOLDOWN_SEC, issueRegisterOtp } from "@/lib/otp";
import { getClientIp, rateLimiter } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = await rateLimiter.limit(`resend:ip:${ip}`, 15, 3600);
  if (!ipLimit.success) {
    return NextResponse.json(
      {
        error: "Terlalu banyak permintaan kirim ulang OTP. Coba lagi nanti.",
        retryAfterSec: ipLimit.retryAfterSec,
      },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Format alamat email tidak valid." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json({
        message: "Jika email terdaftar dan belum terverifikasi, kode OTP baru telah dikirim.",
        cooldownSec: OTP_RESEND_COOLDOWN_SEC,
      });
    }

    const otpResult = await issueRegisterOtp({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    if (!otpResult.ok) {
      return NextResponse.json(
        {
          error: otpResult.error,
          retryAfterSec: otpResult.retryAfterSec,
        },
        { status: otpResult.status }
      );
    }

    return NextResponse.json({
      message: "Kode OTP baru telah dikirim ke email Anda.",
      cooldownSec: otpResult.cooldownSec,
    });
  } catch (error) {
    console.error("[POST /api/auth/resend-otp]", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
