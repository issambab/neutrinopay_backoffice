"use client";

import { useState } from "react";

import Image from "next/image";

import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ProductResponse } from "@/lib/commerce/commerce.types";

import { primaryImage, publicProductImageUrl } from "./shop-product-media";

type ProductGalleryProps = {
  product: ProductResponse;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  const fallbackImage = primaryImage(product);
  const [selectedImageId, setSelectedImageId] = useState(fallbackImage?.id ?? "");
  const selectedImage = product.images.find((image) => image.id === selectedImageId) ?? fallbackImage;

  return (
    <div className="grid gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted shadow-sm">
        {selectedImage ? (
          <Image
            alt={product.name}
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={publicProductImageUrl(selectedImage.id)}
            unoptimized
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <ImageIcon className="size-8" />
            Sans image
          </div>
        )}
        {selectedImage ? (
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur" variant="secondary">
            Image produit
          </Badge>
        ) : null}
      </div>
      {product.images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {product.images.map((image) => (
            <button
              className={`relative aspect-square overflow-hidden rounded-md border bg-muted transition ${
                selectedImage?.id === image.id
                  ? "ring-2 ring-[color:var(--shop-accent)] ring-offset-2"
                  : "hover:opacity-80"
              }`}
              key={image.id}
              onClick={() => setSelectedImageId(image.id)}
              type="button"
            >
              <Image
                alt={image.fileName}
                className="object-cover"
                fill
                sizes="96px"
                src={publicProductImageUrl(image.id)}
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
