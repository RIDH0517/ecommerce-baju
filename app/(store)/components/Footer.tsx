import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 text-neutral-950 font-[Inter,sans-serif] mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link
              href="/catalog"
              className="inline-block text-lg font-black tracking-tighter font-[Montserrat,sans-serif] text-neutral-950"
            >
              urban<span className="text-emerald-600">.</span>kamen
            </Link>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
              Pakaian harian dengan desain sederhana, potongan rapi, dan bahan berkualitas untuk dipakai setiap hari.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-950">
              Belanja
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <Link href="/catalog" className="hover:text-neutral-950 transition-colors">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/new-drop" className="hover:text-neutral-950 transition-colors">
                  New Drop
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-neutral-950 transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-neutral-950 transition-colors">
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-950">
              Akun Saya
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <Link href="/account/profile" className="hover:text-neutral-950 transition-colors">
                  Profil Saya
                </Link>
              </li>
              <li>
                <Link href="/account/addresses" className="hover:text-neutral-950 transition-colors">
                  Alamat Saya
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-neutral-950 transition-colors">
                  Pesanan Saya
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-neutral-950 transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-950">
              Layanan Pelanggan
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Gratis ongkir layanan reguler untuk pembelian minimal Rp 500.000 ke seluruh Indonesia.
            </p>
            <p className="font-mono text-[11px] text-neutral-500">
              JNE · J&amp;T · SiCepat · QRIS · VA
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-neutral-400">
          <p>© 2026 urban.kamen. Seluruh hak cipta dilindungi.</p>
          <p className="font-mono">Modern Streetwear Essentials</p>
        </div>
      </div>
    </footer>
  );
}
