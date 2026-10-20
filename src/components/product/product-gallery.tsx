import { useState } from "react";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "cn";

interface ProductGalleryImage {
  id: string;
  url: string;
  altText: string | null;
}

interface ProductGalleryProps {
  images: ProductGalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0] ?? null;
  const hasMultiple = images.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <ProductImage
        src={activeImage?.url}
        alt={activeImage?.altText ?? productName}
        aspectRatio="aspect-[4/5]"
        containerClassName="rounded-2xl border border-border"
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 55vw"
        priority
      />

      {hasMultiple && (
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          role="group"
          aria-label="Product image thumbnails"
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "border-primary ring-1 ring-primary"
                    : "border-border opacity-70 hover:border-primary/50 hover:opacity-100"
                )}
              >
                <ProductImage
                  src={image.url}
                  alt={image.altText ?? `${productName} — image ${index + 1}`}
                  aspectRatio="aspect-[4/5]"
                  containerClassName="w-16 sm:w-20"
                  className="object-cover object-center"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
