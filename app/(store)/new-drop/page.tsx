import NewDropClient from "./NewDropClient";
import { getNewDropProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function NewDropPage() {
  const products = await getNewDropProducts();
  return <NewDropClient initialProducts={products} />;
}
