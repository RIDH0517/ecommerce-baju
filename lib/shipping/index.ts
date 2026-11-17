import type { ShippingProvider } from "./types";
import { FlatRateShippingProvider } from "./flatRateProvider";

// Ganti di sini untuk beralih ke API ongkir real-time (mis. Biteship / RajaOngkir).
export const shippingProvider: ShippingProvider = new FlatRateShippingProvider();

export * from "./types";
export * from "./config";
