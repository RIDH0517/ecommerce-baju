import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimiter } from "@/lib/rateLimit";
import { sendOtpEmail } from "@/lib/mailer";

export const OTP_PURPOSE_REGISTER = "REGISTER";
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SEC = 60;
export const OTP_HOURLY_LIMIT = 5;

function getOtpPepper(): string {
  const secret =
    process.env.OTP_PEPPER ||
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev-fallback-otp-pepper-ubah-di-production"
      : undefined);

  if (!secret) {
    throw new Error("OTP_PEPPER atau JWT_SECRET wajib dikonfigurasi.");
  }

  return secret;
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  return crypto.createHmac("sha256", getOtpPepper()).update(code).digest("hex");
}

export function verifyOtpHash(code: string, expectedHash: string): boolean {
  const actualBuf = Buffer.from(hashOtpCode(code), "hex");
  const expectedBuf = Buffer.from(expectedHash, "hex");
  if (actualBuf.length === 0 || actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export type IssueOtpResult =
  | { ok: true; cooldownSec: number }
  | { ok: false; status: 429 | 502; error: string; retryAfterSec?: number };

export async function issueRegisterOtp(params: {
  userId: string;
  email: string;
  name: string;
}): Promise<IssueOtpResult> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const cooldown = await rateLimiter.limit(
    `otp:cooldown:${normalizedEmail}`,
    1,
    OTP_RESEND_COOLDOWN_SEC
  );
  if (!cooldown.success) {
    return {
      ok: false,
      status: 429,
      retryAfterSec: cooldown.retryAfterSec,
      error: `Tunggu ${cooldown.retryAfterSec} detik sebelum meminta kode OTP baru.`,
    };
  }

  const hourly = await rateLimiter.limit(
    `otp:hourly:${normalizedEmail}`,
    OTP_HOURLY_LIMIT,
    3600
  );
  if (!hourly.success) {
    return {
      ok: false,
      status: 429,
      retryAfterSec: hourly.retryAfterSec,
      error: "Batas pengiriman OTP per jam telah tercapai. Coba lagi nanti.",
    };
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const tokenRecord = await prisma.$transaction(async (tx) => {
    await tx.otpToken.updateMany({
      where: {
        userId: params.userId,
        purpose: OTP_PURPOSE_REGISTER,
        consumedAt: null,
      },
      data: { consumedAt: now },
    });

    return tx.otpToken.create({
      data: {
        userId: params.userId,
        codeHash,
        purpose: OTP_PURPOSE_REGISTER,
        expiresAt,
      },
    });
  });

  try {
    await sendOtpEmail({
      to: normalizedEmail,
      name: params.name,
      code,
    });
    console.info("[OTP_SENT]", { userId: params.userId });
    return { ok: true, cooldownSec: OTP_RESEND_COOLDOWN_SEC };
  } catch (err) {
    console.error("[OTP_SEND_FAILED]", err instanceof Error ? err.message : err);
    await prisma.otpToken
      .update({
        where: { id: tokenRecord.id },
        data: { consumedAt: new Date() },
      })
      .catch(() => {});

    return {
      ok: false,
      status: 502,
      error: "Gagal mengirim email kode verifikasi. Periksa konfigurasi Resend dan coba lagi.",
    };
  }
}
