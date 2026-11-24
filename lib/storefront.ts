import { prisma } from "@/lib/prisma";

export interface StorefrontBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  tag: string | null;
}

export interface StorefrontProductSize {
  id: string;
  size: string;
  stock: number;
}

export interface StorefrontProductImage {
  id: string;
  url: string;
  order: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  category: string | null;
  collection: string | null;
  description: string | null;
  price: number;
  oldPrice: number | null;
  discount: string | null;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  images: StorefrontProductImage[];
  sizes: StorefrontProductSize[];
}

export interface StorefrontProductDetail extends StorefrontProduct {
  specs: string[];
}

function serializeProduct(p: {
  id: string;
  name: string;
  category: string | null;
  collection: string | null;
  description: string | null;
  price: unknown;
  oldPrice: unknown | null;
  discount: string | null;
  stock: number;
  imageUrl: string;
  isNewDrop: boolean;
  images: Array<{ id: string; url: string; order: number }>;
  sizes: Array<{ id: string; size: string; stock: number }>;
}): StorefrontProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    collection: p.collection,
    description: p.description,
    price: Number(p.price),
    oldPrice: p.oldPrice !== null && p.oldPrice !== undefined ? Number(p.oldPrice) : null,
    discount: p.discount,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isNewDrop: p.isNewDrop,
    images: p.images.map((img) => ({ id: img.id, url: img.url, order: img.order })),
    sizes: p.sizes.map((sz) => ({ id: sz.id, size: sz.size, stock: sz.stock })),
  };
}

export async function getActiveBanners(): Promise<StorefrontBanner[]> {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return banners.map((b) => ({
      id: b.id,
      imageUrl: b.imageUrl,
      title: b.title,
      description: b.description,
      tag: b.tag,
    }));
  } catch (error) {
    console.error("[getActiveBanners]", error);
    return [];
  }
}

export async function getStorefrontProducts(): Promise<StorefrontProduct[]> {
  try {
    const products = await prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: [{ isNewDrop: "desc" }, { createdAt: "desc" }],
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });
    return products.map(serializeProduct);
  } catch (error) {
    console.error("[getStorefrontProducts]", error);
    return [];
  }
}

export async function getNewDropProducts(): Promise<StorefrontProduct[]> {
  try {
    const products = await prisma.product.findMany({
      where: { stock: { gt: 0 }, isNewDrop: true },
      orderBy: [{ createdAt: "desc" }],
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });
    return products.map(serializeProduct);
  } catch (error) {
    console.error("[getNewDropProducts]", error);
    return [];
  }
}

export async function getStorefrontProductById(
  id: string
): Promise<StorefrontProductDetail | null> {
  if (!id) return null;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    });
    if (!product) return null;
    return {
      ...serializeProduct(product),
      specs: Array.isArray(product.specs) ? product.specs : [],
    };
  } catch (error) {
    console.error("[getStorefrontProductById]", error);
    return null;
  }
}
