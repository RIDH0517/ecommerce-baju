import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) return NextResponse.json({ error: "File wajib diunggah" }, { status: 400 });

    // Validasi tipe file (hanya gambar)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya file gambar yang diizinkan" }, { status: 400 });
    }

    // Validasi ukuran file (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 10 MB" }, { status: 400 });
    }

    // Whitelist folder yang diizinkan
    const allowedFolders = ["banners", "products"];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ error: "Folder tidak diizinkan" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return NextResponse.json({ error: "Ekstensi file tidak diizinkan" }, { status: 400 });
    }

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("urban.kamen-media")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("urban.kamen-media")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengunggah gambar" }, { status: 500 });
  }
}
