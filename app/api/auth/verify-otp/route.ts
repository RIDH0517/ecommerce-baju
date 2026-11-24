import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSecureCookie } from "@/lib/auth";
import { isValidEmail, normalizeEmail } from "@/lib/authValidation";
import { OTP_MAX_ATTEMPTS, OTP_PURPOSE_REGISTER, verifyOtpHash } from "@/lib/otp";
import { getClientIp, rateLimiter } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = await rateLimiter.limit(`verify:ip:${ip}`, 30, 900);
  if (!ipLimit.success) {
    return NextResponse.json(
      {
        error: "Terlalu banyak percobaan verifikasi. Coba lagi beberapa menit lagi.",
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
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Alamat email dan 6 digit kode OTP wajib diisi dengan benar." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid atau sudah kedaluwarsa." },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Akun ini sudah terverifikasi. Silakan langsung login." },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.otpToken.findFirst({
        where: {
          userId: user.id,
          purpose: OTP_PURPOSE_REGISTER,
          consumedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!tokenRecord) {
        return { outcome: "MISSING" as const };
      }

      if (tokenRecord.attempts >= OTP_MAX_ATTEMPTS) {
        return { outcome: "LOCKED" as const };
      }

      if (tokenRecord.expiresAt <= now) {
        return { outcome: "EXPIRED" as const };
      }

      if (!verifyOtpHash(code, tokenRecord.codeHash)) {
        const updatedToken = await tx.otpToken.update({
          where: { id: tokenRecord.id },
          data: { attempts: { increment: 1 } },
        });

        if (updatedToken.attempts >= OTP_MAX_ATTEMPTS) {
          await tx.otpToken.update({
            where: { id: tokenRecord.id },
            data: { consumedAt: now },
          });
          return { outcome: "LOCKED" as const };
        }

        return {
          outcome: "INVALID" as const,
          remainingAttempts: OTP_MAX_ATTEMPTS - updatedToken.attempts,
        };
      }

      const consumed = await tx.otpToken.updateMany({
        where: {
          id: tokenRecord.id,
          consumedAt: null,
          attempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { consumedAt: now },
      });

      if (consumed.count !== 1) {
        return { outcome: "MISSING" as const };
      }

      const verifiedUser = await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: now },
      });

      return { outcome: "OK" as const, user: verifiedUser };
    });

    if (result.outcome === "MISSING") {
      return NextResponse.json(
        { error: "Kode OTP tidak ditemukan atau sudah dipakai. Silakan kirim ulang kode." },
        { status: 400 }
      );
    }

    if (result.outcome === "EXPIRED") {
      return NextResponse.json(
        { error: "Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru." },
        { status: 410 }
      );
    }

    if (result.outcome === "LOCKED") {
      console.warn("[OTP_LOCKED]", { userId: user.id });
      return NextResponse.json(
        { error: "Terlalu banyak percobaan salah. OTP dikunci, silakan minta kode baru." },
        { status: 423 }
      );
    }

    if (result.outcome === "INVALID") {
      console.warn("[OTP_FAILED]", { userId: user.id, remainingAttempts: result.remainingAttempts });
      return NextResponse.json(
        {
          error: `Kode OTP salah. Sisa percobaan: ${result.remainingAttempts} kali.`,
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    const sessionToken = createSessionToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });
    await setSecureCookie(sessionToken);

    return NextResponse.json({
      message: "Verifikasi email berhasil!",
      role: result.user.role,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        address: result.user.address,
        role: result.user.role,
        createdAt: result.user.createdAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/verify-otp]", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
