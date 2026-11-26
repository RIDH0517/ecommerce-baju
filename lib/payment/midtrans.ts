import crypto from "crypto";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface MidtransConfig {
  isProduction: boolean;
  serverKey: string;
  signatureSecretKey: string;
  clientKey: string;
  snapApiUrl: string;
  coreApiBaseUrl: string;
  snapScriptUrl: string;
}

// Dibaca secara lazy di dalam fungsi agar `next build` tidak gagal saat env belum diset.
export function getMidtransConfig(): MidtransConfig {
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

  const serverKey = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();
  const signatureSecretKey = (process.env.MIDTRANS_SIGNATURE_SECRET_KEY ?? "").trim();
  const clientKey = (
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ??
    process.env.MIDTRANS_CLIENT_KEY ??
    ""
  ).trim();

  return {
    isProduction,
    serverKey,
    signatureSecretKey,
    clientKey,
    snapApiUrl: isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions",
    coreApiBaseUrl: isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2",
    snapScriptUrl: isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js",
  };
}

function buildBasicAuthHeader(serverKey: string): string {
  const encoded = Buffer.from(`${serverKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export interface CreateQrisSnapInput {
  externalRefId: string;
  items: {
    id: string;
    name: string;
    size: string;
    unitPrice: number;
    quantity: number;
  }[];
  shippingCost: number;
  courierLabel: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    recipientName: string;
    phone: string;
    fullAddress: string;
    city: string;
    postalCode: string;
  };
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

export async function createQrisSnapTransaction(
  input: CreateQrisSnapInput
): Promise<SnapTransactionResult> {
  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[] = input.items.map((item) => ({
    id: `${item.id}-${item.size}`.slice(0, 50),
    price: Math.round(item.unitPrice),
    quantity: item.quantity,
    name: `${item.name} (${item.size})`.slice(0, 50),
  }));

  if (input.shippingCost > 0) {
    itemDetails.push({
      id: "SHIPPING",
      price: Math.round(input.shippingCost),
      quantity: 1,
      name: `Ongkir ${input.courierLabel}`.slice(0, 50),
    });
  }

  // Midtrans mewajibkan gross_amount sama persis dengan jumlah seluruh item_details.
  const grossAmount = itemDetails.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const payload = {
    transaction_details: {
      order_id: input.externalRefId,
      gross_amount: grossAmount,
    },
    enabled_payments: ["other_qris"],
    item_details: itemDetails,
    customer_details: {
      first_name: input.customer.name.slice(0, 50),
      email: input.customer.email.slice(0, 100),
      phone: input.customer.phone.slice(0, 20),
      shipping_address: {
        first_name: input.shippingAddress.recipientName.slice(0, 50),
        phone: input.shippingAddress.phone.slice(0, 20),
        address: input.shippingAddress.fullAddress.slice(0, 200),
        city: input.shippingAddress.city.slice(0, 50),
        postal_code: input.shippingAddress.postalCode.slice(0, 10),
        country_code: "IDN",
      },
    },
  };

  const res = await fetch(cfg.snapApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: buildBasicAuthHeader(cfg.serverKey),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };

  if (!res.ok || !data.token) {
    const detail = Array.isArray(data.error_messages)
      ? data.error_messages.join(", ")
      : `HTTP ${res.status}`;
    throw new Error(`Gagal membuat transaksi QRIS Midtrans: ${detail}`);
  }

  return {
    token: data.token,
    redirectUrl: data.redirect_url ?? "",
  };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (normA.length !== 128 || normB.length !== 128) return false;
  const bufA = Buffer.from(normA, "utf8");
  const bufB = Buffer.from(normB, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Mendukung Signature Secret Key terbaru Midtrans maupun fallback Server Key.
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const cfg = getMidtransConfig();
  const candidateSecrets = [cfg.signatureSecretKey, cfg.serverKey].filter(
    (k) => k.length > 0
  );
  if (candidateSecrets.length === 0) return false;

  for (const secret of candidateSecrets) {
    const raw = `${params.orderId}${params.statusCode}${params.grossAmount}${secret}`;
    const expected = crypto.createHash("sha512").update(raw).digest("hex");
    if (timingSafeEqualHex(expected, params.signatureKey)) {
      return true;
    }
  }

  return false;
}

export function mapMidtransToPaymentStatus(
  transactionStatus: string,
  fraudStatus?: string | null
): PaymentStatus {
  const tx = transactionStatus.toLowerCase();
  const fraud = (fraudStatus ?? "").toLowerCase();

  if (tx === "capture") {
    if (!fraud || fraud === "accept") return "SUCCESS";
    if (fraud === "challenge") return "PENDING";
    return "FAILED";
  }

  if (tx === "settlement") {
    return "SUCCESS";
  }

  if (tx === "deny" || tx === "cancel" || tx === "expire" || tx === "failure") {
    return "FAILED";
  }

  return "PENDING";
}

export interface MidtransStatusResponse {
  status_code?: string;
  transaction_status?: string;
  fraud_status?: string;
  order_id?: string;
}

export async function getMidtransTransactionStatus(
  externalRefId: string
): Promise<{ transactionStatus: string; fraudStatus: string | null }> {
  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  }

  const res = await fetch(
    `${cfg.coreApiBaseUrl}/${encodeURIComponent(externalRefId)}/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: buildBasicAuthHeader(cfg.serverKey),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    }
  );

  const data = (await res.json().catch(() => ({}))) as MidtransStatusResponse;

  // Pada Midtrans Snap, status_code "404" berarti pelanggan belum men-generate/membayar QR di popup.
  if (data.status_code === "404" || res.status === 404) {
    return { transactionStatus: "pending", fraudStatus: null };
  }

  if (!res.ok && !data.transaction_status) {
    throw new Error(`Gagal mengecek status pembayaran ke Midtrans (HTTP ${res.status}).`);
  }

  return {
    transactionStatus: data.transaction_status ?? "pending",
    fraudStatus: data.fraud_status ?? null,
  };
}

export async function syncPaymentStatusByExternalRef(
  externalRefId: string,
  transactionStatus: string,
  fraudStatus?: string | null
): Promise<{
  found: boolean;
  updated: boolean;
  status: PaymentStatus | null;
  orderId: string | null;
}> {
  const nextStatus = mapMidtransToPaymentStatus(transactionStatus, fraudStatus);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { externalRefId },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!payment) {
      return { found: false, updated: false, status: null, orderId: null };
    }

    // Idempoten: jangan pernah menurunkan status SUCCESS atau mengembalikan stok 2 kali pada FAILED.
    if (payment.status === "SUCCESS" || payment.status === "FAILED") {
      return {
        found: true,
        updated: false,
        status: payment.status,
        orderId: payment.orderId,
      };
    }

    if (nextStatus === "PENDING") {
      return {
        found: true,
        updated: false,
        status: "PENDING",
        orderId: payment.orderId,
      };
    }

    if (nextStatus === "SUCCESS") {
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "SUCCESS", paidAt: new Date() },
      });

      return {
        found: true,
        updated: updated.count > 0,
        status: "SUCCESS",
        orderId: payment.orderId,
      };
    }

    // nextStatus === "FAILED": kembalikan stok ukuran & produk secara atomik hanya satu kali.
    const failedUpdate = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED" },
    });

    if (failedUpdate.count > 0) {
      for (const item of payment.order.items) {
        if (item.size) {
          await tx.productSize.updateMany({
            where: {
              productId: item.productId,
              size: { equals: item.size, mode: "insensitive" },
            },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return {
      found: true,
      updated: failedUpdate.count > 0,
      status: "FAILED",
      orderId: payment.orderId,
    };
  });
}
