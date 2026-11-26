import { NextResponse } from "next/server";
import {
  syncPaymentStatusByExternalRef,
  verifyMidtransSignature,
} from "@/lib/payment/midtrans";

// Endpoint pengecekan ketersediaan URL
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "midtrans-webhook" });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const orderId = typeof body.order_id === "string" ? body.order_id : "";
  const statusCode = typeof body.status_code === "string" ? body.status_code : "";
  const grossAmount = typeof body.gross_amount === "string" ? body.gross_amount : "";
  const signatureKey = typeof body.signature_key === "string" ? body.signature_key : "";
  const transactionStatus =
    typeof body.transaction_status === "string" ? body.transaction_status : "";
  const fraudStatus = typeof body.fraud_status === "string" ? body.fraud_status : null;

  if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionStatus) {
    return NextResponse.json({ error: "Field notifikasi tidak lengkap." }, { status: 400 });
  }

  const isSignatureValid = verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
  });

  if (!isSignatureValid) {
    console.warn("[Midtrans Webhook] Signature tidak valid untuk order_id:", orderId);
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 401 });
  }

  // Dukungan tombol "Test notification URL" dari Dashboard Midtrans
  if (orderId.startsWith("payment_notif_test_")) {
    return NextResponse.json({ ok: true, testNotification: true });
  }

  try {
    const result = await syncPaymentStatusByExternalRef(
      orderId,
      transactionStatus,
      fraudStatus
    );

    return NextResponse.json({
      ok: true,
      found: result.found,
      updated: result.updated,
      status: result.status,
    });
  } catch (error) {
    console.error("[POST /api/payments/midtrans/webhook]", error);
    return NextResponse.json({ error: "Gagal memproses webhook pembayaran." }, { status: 500 });
  }
}
