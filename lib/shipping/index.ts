import type { ShippingProvider } from "./types";
import { BiteshipShippingProvider } from "./biteshipProvider";

// Menggunakan Biteship Rates API dengan auto-fallback ke tarif zona (FlatRateShippingProvider).
export const shippingProvider: ShippingProvider = new BiteshipShippingProvider();

export * from "./types";
export * from "./config";
