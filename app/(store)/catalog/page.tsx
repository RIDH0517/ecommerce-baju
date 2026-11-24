import CatalogClient from "./CatalogClient";
import { getActiveBanners, getStorefrontProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [banners, products] = await Promise.all([
    getActiveBanners(),
    getStorefrontProducts(),
  ]);

  return <CatalogClient initialBanners={banners} initialProducts={products} />;
}
