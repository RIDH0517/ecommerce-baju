export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegisterInput(body: unknown):
  | { ok: true; data: { name: string; email: string; password: string } }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Format permintaan tidak valid." };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = normalizeEmail(raw.email);
  const password = typeof raw.password === "string" ? raw.password : "";

  if (!name || name.length < 2 || name.length > 60) {
    return { ok: false, error: "Nama lengkap harus antara 2 hingga 60 karakter." };
  }

  if (!isValidEmail(email)) {
    return { ok: false, error: "Format alamat email tidak valid." };
  }

  if (password.length < 6 || password.length > 128) {
    return { ok: false, error: "Kata sandi minimal 6 karakter." };
  }

  return { ok: true, data: { name, email, password } };
}
