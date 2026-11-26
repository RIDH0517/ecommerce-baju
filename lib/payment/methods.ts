// Daftar metode pembayaran aktif di halaman checkout.
// Dikunci ke channel QRIS resmi Midtrans Snap (`other_qris`).

export type PaymentMethodId = "QRIS" | "VA" | "EWALLET" | "CARD";

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  providers: string[];
  snapChannels: string[];
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "QRIS",
    name: "QRIS (Semua Bank & E-Wallet)",
    description: "Scan kode QRIS instan dari aplikasi m-banking atau dompet digital apa pun.",
    providers: ["BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "DANA", "ShopeePay"],
    snapChannels: ["other_qris"],
  },
];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "QRIS";
export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((m) => m.id);

export const PAYMENT_GATEWAY_ENABLED = true;
