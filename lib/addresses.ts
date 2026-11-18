import { PROVINCES } from "@/lib/shipping/config";

export const MAX_ADDRESSES_PER_USER = 5;

export const ADDRESS_LABELS = [
  "Rumah",
  "Kantor",
  "Kos / Apartemen",
  "Lainnya",
] as const;

export type AddressLabel = (typeof ADDRESS_LABELS)[number];

export interface UserAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  fullAddress: string;
  notes: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidatedAddressData {
  label: AddressLabel;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  fullAddress: string;
  notes: string | null;
  isPrimary: boolean;
}

export function validateAddressPayload(
  body: Record<string, unknown>
): { ok: true; data: ValidatedAddressData } | { ok: false; error: string } {
  const {
    label,
    recipientName,
    phone,
    province,
    city,
    district,
    postalCode,
    fullAddress,
    notes,
    isPrimary,
  } = body;

  const trimmedLabel = typeof label === "string" ? label.trim() : "Rumah";
  if (!ADDRESS_LABELS.includes(trimmedLabel as AddressLabel)) {
    return { ok: false, error: "Label alamat tidak valid." };
  }

  if (typeof recipientName !== "string") {
    return { ok: false, error: "Nama penerima 2–60 karakter." };
  }
  const trimmedName = recipientName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 60) {
    return { ok: false, error: "Nama penerima 2–60 karakter." };
  }

  if (typeof phone !== "string") {
    return { ok: false, error: "Nomor HP tidak valid (contoh: 0812xxxxxxxx)." };
  }
  const cleanedPhone = phone.trim().replace(/[\s-]/g, "");
  if (!/^(\+62|62|0)8\d{7,11}$/.test(cleanedPhone)) {
    return { ok: false, error: "Nomor HP tidak valid (contoh: 0812xxxxxxxx)." };
  }

  if (
    typeof province !== "string" ||
    !(PROVINCES as readonly string[]).includes(province)
  ) {
    return { ok: false, error: "Provinsi tidak valid." };
  }

  if (typeof city !== "string") {
    return { ok: false, error: "Kota / kabupaten wajib diisi (2–80 karakter)." };
  }
  const trimmedCity = city.trim();
  if (trimmedCity.length < 2 || trimmedCity.length > 80) {
    return { ok: false, error: "Kota / kabupaten wajib diisi (2–80 karakter)." };
  }

  if (typeof district !== "string") {
    return { ok: false, error: "Kecamatan wajib diisi (2–80 karakter)." };
  }
  const trimmedDistrict = district.trim();
  if (trimmedDistrict.length < 2 || trimmedDistrict.length > 80) {
    return { ok: false, error: "Kecamatan wajib diisi (2–80 karakter)." };
  }

  if (typeof postalCode !== "string" || !/^\d{5}$/.test(postalCode.trim())) {
    return { ok: false, error: "Kode pos harus 5 digit angka." };
  }

  if (typeof fullAddress !== "string") {
    return { ok: false, error: "Alamat lengkap 10–300 karakter." };
  }
  const trimmedAddress = fullAddress.trim();
  if (trimmedAddress.length < 10 || trimmedAddress.length > 300) {
    return { ok: false, error: "Alamat lengkap 10–300 karakter." };
  }

  let normalizedNotes: string | null = null;
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== "string") {
      return { ok: false, error: "Catatan tidak valid." };
    }
    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 200) {
      return { ok: false, error: "Catatan maksimal 200 karakter." };
    }
    if (trimmedNotes.length > 0) normalizedNotes = trimmedNotes;
  }

  return {
    ok: true,
    data: {
      label: trimmedLabel as AddressLabel,
      recipientName: trimmedName,
      phone: cleanedPhone,
      province,
      city: trimmedCity,
      district: trimmedDistrict,
      postalCode: postalCode.trim(),
      fullAddress: trimmedAddress,
      notes: normalizedNotes,
      isPrimary: Boolean(isPrimary),
    },
  };
}
