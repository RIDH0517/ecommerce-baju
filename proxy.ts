import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): { exp?: number; role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // ── 1. CSRF Protection: blokir mutasi dari origin asing ──
  if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: "Akses ditolak: verifikasi CSRF gagal." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
      }
    }
  }

  // ── 2. Proteksi halaman /admin ──
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("session_token")?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    const payload = decodeJwtPayload(token);
    if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
      const res = NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
      res.cookies.delete("session_token");
      return res;
    }

    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ── 3. Proteksi halaman /account ──
  if (pathname.startsWith("/account")) {
    const token = request.cookies.get("session_token")?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    const payload = decodeJwtPayload(token);
    if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
      const res = NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
      res.cookies.delete("session_token");
      return res;
    }
  }

  // ── 4. Security Headers pada semua response ──
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/api/:path*"],
};
