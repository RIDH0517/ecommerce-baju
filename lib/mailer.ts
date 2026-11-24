interface SendOtpEmailParams {
  to: string;
  name: string;
  code: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Mengirim kode OTP verifikasi pendaftaran akun melalui Resend REST API.
 */
export async function sendOtpEmail({ to, name, code }: SendOtpEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi di environment variables.");
  }

  const from =
    process.env.EMAIL_FROM?.trim() || "urban.kamen <noreply@urbankamen.com>";
  const safeName = escapeHtml(name || "Pelanggan");
  const safeCode = escapeHtml(code);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kode Verifikasi urban.kamen</title>
</head>
<body style="margin:0;padding:24px;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e5e5;">
    <tr>
      <td style="padding:28px 28px 20px 28px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:20px;font-weight:900;letter-spacing:-0.04em;color:#0a0a0a;">
          urban<span style="color:#059669;">.</span>kamen
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <p style="margin:0 0 12px 0;font-size:14px;color:#171717;">
          Halo <strong>${safeName}</strong>,
        </p>
        <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#525252;">
          Terima kasih telah mendaftar di <strong>urban.kamen</strong>. Masukkan kode verifikasi 6 digit berikut untuk mengaktifkan akun Anda:
        </p>
        <div style="margin:0 0 20px 0;padding:18px;background-color:#fafafa;border:1px solid #e5e5e5;text-align:center;">
          <span style="font-family:'JetBrains Mono',Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:#0a0a0a;">
            ${safeCode}
          </span>
        </div>
        <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#525252;">
          Kode ini berlaku selama <strong>5 menit</strong> dan hanya dapat digunakan satu kali.
        </p>
        <p style="margin:0;padding:12px;background-color:#fef2f2;border:1px solid #fecaca;font-size:11px;line-height:1.5;color:#991b1b;">
          <strong>Penting:</strong> Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai tim urban.kamen. Jika Anda tidak merasa mendaftar, abaikan email ini.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px;border-top:1px solid #f0f0f0;font-size:11px;color:#a3a3a3;">
        urban.kamen — Modern Streetwear Essentials
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Halo ${name || "Pelanggan"},`,
    "",
    `Kode verifikasi pendaftaran akun urban.kamen Anda adalah: ${code}`,
    "Kode berlaku selama 5 menit dan hanya dapat digunakan satu kali.",
    "",
    "Penting: Jangan bagikan kode ini kepada siapa pun.",
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${code} — Kode Verifikasi Akun urban.kamen`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend error (${res.status}): ${errText || "Gagal mengirim email."}`);
  }
}
