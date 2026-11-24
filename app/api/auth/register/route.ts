import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { validateRegisterInput } from "@/lib/authValidation";
import { issueRegisterOtp } from "@/lib/otp";
import { getClientIp, rateLimiter } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = await rateLimiter.limit(`register:ip:${ip}`, 10, 3600);
  if (!ipLimit.success) {
    return NextResponse.json(
      {
        error: "Terlalu banyak percobaan pendaftaran. Silakan coba lagi nanti.",
        retryAfterSec: ipLimit.retryAfterSec,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const parsed = validateRegisterInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json({ error: "Email sudah terdaftar!" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            email,
            passwordHash,
            role: "CUSTOMER",
          },
        })
      : await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "CUSTOMER",
            emailVerified: null,
          },
        });

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
      message: "Kode OTP verifikasi telah dikirim ke email Anda.",
      email: user.email,
      cooldownSec: otpResult.cooldownSec,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
