"use client";

import { useState } from "react";
import { ADDRESS_LABELS, type AddressLabel, type UserAddress } from "@/lib/addresses";
import { PROVINCES } from "@/lib/shipping/config";

interface AddressFormModalProps {
  initialAddress?: UserAddress | null;
  forcePrimary?: boolean;
  defaultRecipientName?: string;
  defaultPhone?: string;
  onClose: () => void;
  onSaved: (address: UserAddress) => void;
}

const labelClass = "block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-600";
const inputClass =
  "mt-1.5 block w-full border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors";

export default function AddressFormModal({
  initialAddress,
  forcePrimary = false,
  defaultRecipientName = "",
  defaultPhone = "",
  onClose,
  onSaved,
}: AddressFormModalProps) {
  const isEdit = Boolean(initialAddress);
  const lockedPrimary = forcePrimary || Boolean(initialAddress?.isPrimary);

  const [label, setLabel] = useState<AddressLabel>(
    (ADDRESS_LABELS.includes(initialAddress?.label as AddressLabel)
      ? initialAddress?.label
      : "Rumah") as AddressLabel
  );
  const [recipientName, setRecipientName] = useState(
    initialAddress?.recipientName ?? defaultRecipientName
  );
  const [phone, setPhone] = useState(initialAddress?.phone ?? defaultPhone);
  const [province, setProvince] = useState(initialAddress?.province ?? "");
  const [city, setCity] = useState(initialAddress?.city ?? "");
  const [district, setDistrict] = useState(initialAddress?.district ?? "");
  const [postalCode, setPostalCode] = useState(initialAddress?.postalCode ?? "");
  const [fullAddress, setFullAddress] = useState(initialAddress?.fullAddress ?? "");
  const [notes, setNotes] = useState(initialAddress?.notes ?? "");
  const [isPrimary, setIsPrimary] = useState(
    lockedPrimary ? true : Boolean(initialAddress?.isPrimary)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = isEdit
        ? `/api/account/addresses/${encodeURIComponent(initialAddress!.id)}`
        : "/api/account/addresses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          recipientName,
          phone,
          province,
          city,
          district,
          postalCode,
          fullAddress,
          notes,
          isPrimary: lockedPrimary ? true : isPrimary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan alamat.");
      if (data.address) {
        onSaved(data.address as UserAddress);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan alamat.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Ubah Alamat" : "Tambah Alamat Baru"}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto border border-neutral-950 bg-white p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h2 className="text-base font-black uppercase tracking-tight text-neutral-950 font-[Montserrat,sans-serif]">
            {isEdit ? "Ubah Alamat" : "Tambah Alamat Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup modal"
            className="border border-neutral-200 px-2.5 py-1 font-mono text-xs text-neutral-500 hover:border-neutral-950 hover:text-neutral-950 cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label Pilihan */}
          <div>
            <span className={labelClass}>Label Alamat</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADDRESS_LABELS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLabel(item)}
                  className={`border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    label === item
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="addr-recipient" className={labelClass}>
                Nama Penerima<span className="text-red-500">*</span>
              </label>
              <input
                id="addr-recipient"
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className={inputClass}
                placeholder="Nama lengkap penerima"
              />
            </div>

            <div>
              <label htmlFor="addr-phone" className={labelClass}>
                No. HP / WhatsApp<span className="text-red-500">*</span>
              </label>
              <input
                id="addr-phone"
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="0812xxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="addr-province" className={labelClass}>
                Provinsi<span className="text-red-500">*</span>
              </label>
              <select
                id="addr-province"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih provinsi</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="addr-city" className={labelClass}>
                Kota / Kabupaten<span className="text-red-500">*</span>
              </label>
              <input
                id="addr-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                placeholder="Contoh: Kota Bandung"
              />
            </div>

            <div>
              <label htmlFor="addr-district" className={labelClass}>
                Kecamatan<span className="text-red-500">*</span>
              </label>
              <input
                id="addr-district"
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={inputClass}
                placeholder="Contoh: Coblong"
              />
            </div>

            <div>
              <label htmlFor="addr-postal" className={labelClass}>
                Kode Pos<span className="text-red-500">*</span>
              </label>
              <input
                id="addr-postal"
                type="text"
                inputMode="numeric"
                required
                maxLength={5}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                className={inputClass}
                placeholder="40132"
              />
            </div>
          </div>

          <div>
            <label htmlFor="addr-full" className={labelClass}>
              Alamat Lengkap<span className="text-red-500">*</span>
            </label>
            <textarea
              id="addr-full"
              rows={3}
              required
              minLength={10}
              maxLength={300}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className={inputClass}
              placeholder="Nama jalan, nomor rumah, gedung, RT/RW, patokan"
            />
          </div>

          <div>
            <label htmlFor="addr-notes" className={labelClass}>
              Catatan untuk Kurir <span className="normal-case font-normal text-neutral-400">(opsional)</span>
            </label>
            <input
              id="addr-notes"
              type="text"
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Contoh: titip di pos satpam"
            />
          </div>

          <label
            className={`flex items-center gap-2.5 text-xs select-none ${
              lockedPrimary ? "text-neutral-500 cursor-not-allowed" : "text-neutral-800 cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={lockedPrimary ? true : isPrimary}
              disabled={lockedPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 accent-neutral-950"
            />
            <span className="font-medium">
              {lockedPrimary
                ? "Digunakan sebagai Alamat Utama"
                : "Atur sebagai Alamat Utama"}
            </span>
          </label>

          {error && (
            <div aria-live="polite" className="border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-neutral-200 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-700 hover:border-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-neutral-950 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 font-[Montserrat,sans-serif] cursor-pointer"
            >
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Alamat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
