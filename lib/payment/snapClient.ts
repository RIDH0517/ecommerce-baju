// Helper client-side untuk memuat script Midtrans Snap secara dinamis dan membuka popup QRIS.

export interface SnapPayCallbacks {
  onSuccess?: (result: Record<string, unknown>) => void;
  onPending?: (result: Record<string, unknown>) => void;
  onError?: (result: Record<string, unknown>) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: SnapPayCallbacks) => void;
    };
  }
}

let loadingPromise: Promise<void> | null = null;
let loadedKey = "";

export function loadMidtransSnap(scriptUrl: string, clientKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!clientKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum diisi pada konfigurasi environment.")
    );
  }
  if (window.snap && loadedKey === clientKey) return Promise.resolve();
  if (loadingPromise && loadedKey === clientKey) return loadingPromise;

  loadedKey = clientKey;
  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("midtrans-snap-script") as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute("data-client-key") === clientKey && window.snap) {
        resolve();
        return;
      }
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Gagal memuat script popup Midtrans Snap. Periksa koneksi internet atau adblocker."));
    };
    document.body.appendChild(script);
  });

  return loadingPromise;
}
