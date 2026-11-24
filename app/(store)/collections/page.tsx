import CollectionsClient from "./CollectionsClient";
import { getStorefrontProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const products = await getStorefrontProducts();
  return <CollectionsClient initialProducts={products} />;
}
