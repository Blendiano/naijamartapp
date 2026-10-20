"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import type { WishlistItem } from "@/lib/wishlist";
import { cn } from "cn";

interface WishlistButtonProps {
  product: WishlistItem;
  className?: string;
}

export function WishlistButton({ product, className }: WishlistButtonProps) {
  const { isWishlisted, toggle } = useWishlist();
  const active = isWishlisted(product.id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
      className={cn(
        "absolute top-3 right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-xs text-foreground/70 hover:text-destructive hover:bg-background/95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-destructive",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
