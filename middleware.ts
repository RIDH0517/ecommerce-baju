import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Decode payload JWT (hanya decode, tidak verify signature — signature
      // diverifikasi penuh di setiap API route dengan verifySessionToken())
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Token tidak valid");

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );

      // Periksa expiry
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("session_token");
        return res;
      }

      // Periksa role
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("session_token");
      return res;
    }
  }

  // ── 3. Security Headers pada semua response ──
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
