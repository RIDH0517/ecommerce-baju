/**
 * Kompres gambar ke format WebP sebelum dikirim ke Supabase.
 * Digunakan di halaman admin untuk mengoptimalkan ukuran file.
 */
export function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal mengompres gambar"));
            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            resolve(
              new File([blob], `${cleanName}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              })
            );
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
