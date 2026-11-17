// Daftar metode pembayaran yang ditampilkan di checkout.
// Saat Midtrans Snap diintegrasikan, `snapChannels` dipakai sebagai `enabled_payments`.

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
    name: "QRIS",
    description: "Scan dari aplikasi bank atau e-wallet apa pun.",
    providers: ["Semua bank", "GoPay", "OVO", "DANA", "ShopeePay"],
    snapChannels: ["other_qris"],
  },
  {
    id: "VA",
    name: "Virtual Account",
    description: "Transfer lewat ATM, m-banking, atau internet banking.",
    providers: ["BCA", "Mandiri", "BNI", "BRI", "Permata"],
    snapChannels: ["bca_va", "echannel", "bni_va", "bri_va", "permata_va"],
  },
  {
    id: "EWALLET",
    name: "E-Wallet",
    description: "Bayar langsung dari aplikasi dompet digital.",
    providers: ["GoPay", "ShopeePay"],
    snapChannels: ["gopay", "shopeepay"],
  },
  {
    id: "CARD",
    name: "Kartu Kredit / Debit",
    description: "Visa, Mastercard, JCB dengan verifikasi 3D Secure.",
    providers: ["Visa", "Mastercard", "JCB"],
    snapChannels: ["credit_card"],
  },
];

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((m) => m.id);

// Belum ada payment gateway yang aktif. Ubah ke true setelah Midtrans terpasang.
export const PAYMENT_GATEWAY_ENABLED = false;
