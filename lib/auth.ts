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

export type SessionPayload = { userId: string; email: string; role: string };

// 3. Pembuatan Token Sesi JWT
export function createSessionToken(payload: SessionPayload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET tidak dikonfigurasi di environment variables!");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// 4. Verifikasi Token JWT (dipakai di API routes untuk auth server-side)
export function verifySessionToken(token: string): SessionPayload | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
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

// 6. Menghapus Cookie Sesi dengan atribut konsisten
export async function clearSecureCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

// 7. Helper mengambil user terautentikasi dari cookie sesi
export async function requireUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// 8. Helper mengambil admin terautentikasi
export async function requireAdmin(): Promise<SessionPayload | null> {
  const payload = await requireUser();
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}