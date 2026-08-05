import type { ProductResponse } from "@/lib/commerce/commerce.types";

export function primaryImage(product: ProductResponse) {
  return product.images.find((image) => image.primary) ?? product.images[0] ?? null;
}

export function publicProductImageUrl(imageId: string) {
  return `/api/public/commerce/product-images/${imageId}/file`;
}
