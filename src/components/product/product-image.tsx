"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps extends Omit<ImageProps, "alt" | "src"> {
  src?: string | null;
  alt: string;
  fallbackClassName?: string;
  aspectRatio?: string;
}

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName,
  aspectRatio = "aspect-[3/4]",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  fill = true,
  ...props
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const showFallback = !src || imageError;

  if (showFallback) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-gradient-to-b from-muted to-muted/80 flex flex-col items-center justify-center p-4 text-center select-none rounded-xl",
          aspectRatio,
          fallbackClassName
        )}
        role="img"
        aria-label={`Product image placeholder for ${alt}`}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
          <div className="p-3 rounded-full bg-background/60 backdrop-blur-xs border border-border/60 shadow-2xs">
            <Shirt className="h-7 w-7 text-primary/70 stroke-[1.5]" aria-hidden="true" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            NaijaMart
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-muted", aspectRatio)}>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/80 animate-pulse z-10" aria-hidden="true" />
      )}

      <Image
        src={src}
        alt={alt || "NaijaMart product image"}
        fill={fill}
        sizes={sizes}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "object-cover transition-all duration-500",
          !isLoaded ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      />
    </div>
  );
}
