import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV !== "production"
    ? "dev-fallback-secret-ubah-di-production-pakai-env"
    : undefined
);

// 1. Enkripsi Password menggunakan standar Argon2id
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

// 2. Verifikasi Password saat Login
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// 3. Pembuatan Token Sesi JWT
export function createSessionToken(payload: { userId: string; email: string; role: string }) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET tidak dikonfigurasi di environment variables!");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// 4. Verifikasi Token JWT (dipakai di API routes untuk auth server-side)
export function verifySessionToken(token: string): { userId: string; email: string; role: string } | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// 5. Menyimpan Sesi ke httpOnly Cookie yang Aman (Anti-XSS & Anti-CSRF)
export async function setSecureCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 Hari
    path: "/",
  });
}