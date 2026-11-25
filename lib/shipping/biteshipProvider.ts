import type { ShippingProvider, ShippingRate, ShippingRateRequest } from "./types";
import { FREE_SHIPPING_THRESHOLD } from "./config";
import { FlatRateShippingProvider } from "./flatRateProvider";

interface BiteshipPricingItem {
  courier_code?: string;
  courier_name?: string;
  courier_service_code?: string;
  courier_service_name?: string;
  duration?: string;
  shipment_duration_range?: string;
  shipment_duration_unit?: string;
  price?: number;
}

interface BiteshipRatesResponse {
  success?: boolean;
  pricing?: BiteshipPricingItem[];
  error?: string;
}

interface CachedBaseRate {
  courierCode: string;
  courierName: string;
  service: string;
  serviceName: string;
  etd: string;
  baseCost: number;
  isRegular: boolean;
}

interface CacheEntry {
  rates: CachedBaseRate[];
  expiresAt: number;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam
const MAX_CACHE_ENTRIES = 500;
const REQUEST_TIMEOUT_MS = 5000;

const REGULAR_SERVICE_CODES = new Set([
  "REG",
  "REGULER",
  "EZ",
  "SIUNT",
  "CTC",
  "OKE",
  "STANDARD",
  "STANDAR",
  "BEST",
  "REG23",
]);

function normalizePostalCode(raw?: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  return /^\d{5}$/.test(digits) ? digits : "";
}

function formatDuration(item: BiteshipPricingItem): string {
  const raw =
    item.duration?.trim() ||
    (item.shipment_duration_range
      ? `${item.shipment_duration_range} ${item.shipment_duration_unit || ""}`.trim()
      : "");

  if (!raw) return "2-4 hari";

  return raw
    .replace(/\bdays?\b/gi, "hari")
    .replace(/\bhours?\b/gi, "jam")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function isRegularService(serviceCode: string, serviceName: string): boolean {
  if (REGULAR_SERVICE_CODES.has(serviceCode)) return true;
  if (/yes|ons|next\s*day|same\s*day|instant|express|kilat|kargo|cargo|truck/i.test(serviceName)) {
    return false;
  }
  return /reguler|regular|standar/i.test(serviceName);
}

/**
 * Provider ongkir real-time berbasis Biteship Rates API (/v1/rates/couriers)
 * dengan caching 12 jam hemat request dan auto-fallback ke FlatRateShippingProvider.
 */
export class BiteshipShippingProvider implements ShippingProvider {
  private readonly fallback = new FlatRateShippingProvider();
  private readonly cache = new Map<string, CacheEntry>();

  private getCached(key: string): CachedBaseRate[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.rates;
  }

  private setCached(key: string, rates: CachedBaseRate[]) {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      rates,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  private applyPromo(baseRates: CachedBaseRate[], subtotal: number): ShippingRate[] {
    const eligibleFree = subtotal >= FREE_SHIPPING_THRESHOLD;
    return baseRates.map((r) => {
      const isFreeShipping = eligibleFree && r.isRegular;
      return {
        courierCode: r.courierCode,
        courierName: r.courierName,
        service: r.service,
        serviceName: r.serviceName,
        etd: r.etd,
        cost: isFreeShipping ? 0 : r.baseCost,
        originalCost: r.baseCost,
        isFreeShipping,
      };
    });
  }

  async getRates(req: ShippingRateRequest): Promise<ShippingRate[]> {
    const apiKey = process.env.BITESHIP_API_KEY?.trim();
    const originPostal = normalizePostalCode(
      process.env.BITESHIP_ORIGIN_POSTAL_CODE || "50132"
    );
    const destPostal = normalizePostalCode(req.destination.postalCode);
    const couriers = (process.env.BITESHIP_COURIERS || "jne,jnt,sicepat")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
      .join(",");

    if (!apiKey || !originPostal || !destPostal || !couriers) {
      return this.fallback.getRates(req);
    }

    const weightBucketKg = Math.max(1, Math.ceil(req.weightGram / 1000));
    const cacheKey = `${originPostal}:${destPostal}:${weightBucketKg}:${couriers}`;

    const cached = this.getCached(cacheKey);
    if (cached) {
      return this.applyPromo(cached, req.subtotal);
    }

    try {
      const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin_postal_code: Number(originPostal),
          destination_postal_code: Number(destPostal),
          couriers,
          items: [
            {
              name: "UrbanKamen Apparel",
              description: "Order pakaian UrbanKamen",
              value: Math.max(1000, Math.round(req.subtotal)),
              weight: Math.max(400, Math.round(req.weightGram)),
              quantity: 1,
            },
          ],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        console.warn(`[Biteship] HTTP ${res.status}, fallback ke tarif zona.`);
        return this.fallback.getRates(req);
      }

      const data = (await res.json()) as BiteshipRatesResponse;
      if (!Array.isArray(data.pricing) || data.pricing.length === 0) {
        console.warn("[Biteship] Daftar pricing kosong, fallback ke tarif zona.");
        return this.fallback.getRates(req);
      }

      const deduped = new Map<string, CachedBaseRate>();
      for (const item of data.pricing) {
        const courierCode = (item.courier_code || "").trim().toUpperCase();
        const service = (item.courier_service_code || "").trim().toUpperCase();
        const baseCost = Math.round(Number(item.price));
        if (!courierCode || !service || !Number.isFinite(baseCost) || baseCost <= 0) {
          continue;
        }

        const serviceName = item.courier_service_name?.trim() || service;
        const entry: CachedBaseRate = {
          courierCode,
          courierName: item.courier_name?.trim() || courierCode,
          service,
          serviceName,
          etd: formatDuration(item),
          baseCost,
          isRegular: isRegularService(service, serviceName),
        };

        const mapKey = `${courierCode}:${service}`;
        const existing = deduped.get(mapKey);
        if (!existing || entry.baseCost < existing.baseCost) {
          deduped.set(mapKey, entry);
        }
      }

      const mapped = [...deduped.values()].sort((a, b) => a.baseCost - b.baseCost);
      if (mapped.length === 0) {
        return this.fallback.getRates(req);
      }

      this.setCached(cacheKey, mapped);
      return this.applyPromo(mapped, req.subtotal);
    } catch (err) {
      console.warn(
        "[Biteship] Gagal mengambil tarif, fallback ke tarif zona:",
        err instanceof Error ? err.message : err
      );
      return this.fallback.getRates(req);
    }
  }
}
