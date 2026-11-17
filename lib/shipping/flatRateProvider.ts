import type { ShippingProvider, ShippingRate, ShippingRateRequest } from "./types";
import { FREE_SHIPPING_THRESHOLD } from "./config";

// Zona tujuan relatif terhadap gudang (asumsi gudang di Pulau Jawa).
type Zone = "JABODETABEK" | "JAWA" | "SUMATERA_BALI" | "KALIMANTAN_SULAWESI" | "INDONESIA_TIMUR";

const ZONE_BY_PROVINCE: Record<string, Zone> = {
  "DKI Jakarta": "JABODETABEK",
  Banten: "JABODETABEK",
  "Jawa Barat": "JAWA",
  "Jawa Tengah": "JAWA",
  "DI Yogyakarta": "JAWA",
  "Jawa Timur": "JAWA",
  Aceh: "SUMATERA_BALI",
  "Sumatera Utara": "SUMATERA_BALI",
  "Sumatera Barat": "SUMATERA_BALI",
  Riau: "SUMATERA_BALI",
  "Kepulauan Riau": "SUMATERA_BALI",
  Jambi: "SUMATERA_BALI",
  "Sumatera Selatan": "SUMATERA_BALI",
  "Kepulauan Bangka Belitung": "SUMATERA_BALI",
  Bengkulu: "SUMATERA_BALI",
  Lampung: "SUMATERA_BALI",
  Bali: "SUMATERA_BALI",
  "Nusa Tenggara Barat": "KALIMANTAN_SULAWESI",
  "Kalimantan Barat": "KALIMANTAN_SULAWESI",
  "Kalimantan Tengah": "KALIMANTAN_SULAWESI",
  "Kalimantan Selatan": "KALIMANTAN_SULAWESI",
  "Kalimantan Timur": "KALIMANTAN_SULAWESI",
  "Kalimantan Utara": "KALIMANTAN_SULAWESI",
  "Sulawesi Utara": "KALIMANTAN_SULAWESI",
  Gorontalo: "KALIMANTAN_SULAWESI",
  "Sulawesi Tengah": "KALIMANTAN_SULAWESI",
  "Sulawesi Barat": "KALIMANTAN_SULAWESI",
  "Sulawesi Selatan": "KALIMANTAN_SULAWESI",
  "Sulawesi Tenggara": "KALIMANTAN_SULAWESI",
  "Nusa Tenggara Timur": "INDONESIA_TIMUR",
  Maluku: "INDONESIA_TIMUR",
  "Maluku Utara": "INDONESIA_TIMUR",
  Papua: "INDONESIA_TIMUR",
  "Papua Barat": "INDONESIA_TIMUR",
  "Papua Barat Daya": "INDONESIA_TIMUR",
  "Papua Tengah": "INDONESIA_TIMUR",
  "Papua Pegunungan": "INDONESIA_TIMUR",
  "Papua Selatan": "INDONESIA_TIMUR",
};

interface ServiceDef {
  courierCode: string;
  courierName: string;
  service: string;
  serviceName: string;
  isRegular: boolean; // layanan reguler mendapat gratis ongkir
  ratePerKg: Record<Zone, number>;
  etd: Record<Zone, string>;
}

// Tarif estimasi per kg (Rp). Ubah sesuai kebutuhan toko.
const SERVICES: ServiceDef[] = [
  {
    courierCode: "JNE",
    courierName: "JNE",
    service: "REG",
    serviceName: "Reguler",
    isRegular: true,
    ratePerKg: { JABODETABEK: 10000, JAWA: 15000, SUMATERA_BALI: 25000, KALIMANTAN_SULAWESI: 35000, INDONESIA_TIMUR: 60000 },
    etd: { JABODETABEK: "1-2 hari", JAWA: "2-3 hari", SUMATERA_BALI: "3-5 hari", KALIMANTAN_SULAWESI: "4-6 hari", INDONESIA_TIMUR: "5-9 hari" },
  },
  {
    courierCode: "JNE",
    courierName: "JNE",
    service: "YES",
    serviceName: "Yakin Esok Sampai",
    isRegular: false,
    ratePerKg: { JABODETABEK: 18000, JAWA: 26000, SUMATERA_BALI: 42000, KALIMANTAN_SULAWESI: 58000, INDONESIA_TIMUR: 95000 },
    etd: { JABODETABEK: "1 hari", JAWA: "1 hari", SUMATERA_BALI: "1-2 hari", KALIMANTAN_SULAWESI: "1-2 hari", INDONESIA_TIMUR: "2-3 hari" },
  },
  {
    courierCode: "JNT",
    courierName: "J&T Express",
    service: "EZ",
    serviceName: "Reguler",
    isRegular: true,
    ratePerKg: { JABODETABEK: 10000, JAWA: 14000, SUMATERA_BALI: 24000, KALIMANTAN_SULAWESI: 34000, INDONESIA_TIMUR: 58000 },
    etd: { JABODETABEK: "1-2 hari", JAWA: "2-3 hari", SUMATERA_BALI: "3-5 hari", KALIMANTAN_SULAWESI: "4-6 hari", INDONESIA_TIMUR: "5-9 hari" },
  },
  {
    courierCode: "SICEPAT",
    courierName: "SiCepat",
    service: "REG",
    serviceName: "Reguler",
    isRegular: true,
    ratePerKg: { JABODETABEK: 9000, JAWA: 14000, SUMATERA_BALI: 23000, KALIMANTAN_SULAWESI: 33000, INDONESIA_TIMUR: 57000 },
    etd: { JABODETABEK: "1-2 hari", JAWA: "2-3 hari", SUMATERA_BALI: "3-5 hari", KALIMANTAN_SULAWESI: "4-7 hari", INDONESIA_TIMUR: "5-10 hari" },
  },
];

export class FlatRateShippingProvider implements ShippingProvider {
  async getRates({ destination, weightGram, subtotal }: ShippingRateRequest): Promise<ShippingRate[]> {
    const zone = ZONE_BY_PROVINCE[destination.province];
    if (!zone) return [];

    // Pembulatan ke atas per kg, minimal 1 kg (standar kurir).
    const kg = Math.max(1, Math.ceil(weightGram / 1000));
    const qualifiesFree = subtotal >= FREE_SHIPPING_THRESHOLD;

    return SERVICES.map((s) => {
      const originalCost = s.ratePerKg[zone] * kg;
      const isFreeShipping = qualifiesFree && s.isRegular;
      return {
        courierCode: s.courierCode,
        courierName: s.courierName,
        service: s.service,
        serviceName: s.serviceName,
        etd: s.etd[zone],
        originalCost,
        cost: isFreeShipping ? 0 : originalCost,
        isFreeShipping,
      };
    });
  }
}
