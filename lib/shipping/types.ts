// Kontrak umum penyedia ongkir. Implementasi saat ini: tarif zona (flatRate).
// Nanti bisa ditambah BiteshipProvider / RajaOngkirProvider tanpa mengubah halaman checkout.

export interface ShippingDestination {
  province: string;
  city?: string;
  postalCode?: string;
}

export interface ShippingRateRequest {
  destination: ShippingDestination;
  weightGram: number;
  subtotal: number;
}

export interface ShippingRate {
  courierCode: string; // "JNE", "JNT", "SICEPAT"
  courierName: string; // "JNE"
  service: string; // "REG", "YES"
  serviceName: string; // "Reguler"
  etd: string; // "2-3 hari"
  cost: number; // ongkir setelah promo (Rp)
  originalCost: number; // ongkir sebelum promo (Rp)
  isFreeShipping: boolean;
}

export interface ShippingProvider {
  getRates(req: ShippingRateRequest): Promise<ShippingRate[]>;
}
