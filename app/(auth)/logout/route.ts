import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set({
    name: "session_token",
    value: "",
    httpOnly: true,
    expires: new Date(0), // Kedaluwarsa langsung
    path: "/",
  });
  return response;
}