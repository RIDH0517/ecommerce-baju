import ProductDetailClient from "./ProductDetailClient";
import { getStorefrontProductById } from "@/lib/storefront";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getStorefrontProductById(id);

  return <ProductDetailClient product={product} />;
}
