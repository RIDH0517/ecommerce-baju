import { NextResponse } from "next/server";
import { clearSecureCookie } from "@/lib/auth";

export async function POST() {
  await clearSecureCookie();
  return NextResponse.json({ message: "Logout berhasil" });
}
