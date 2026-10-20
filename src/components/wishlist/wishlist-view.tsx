"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function WishlistView() {
  const { items, isReady, remove } = useWishlist();

  if (!isReady) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading your wishlist...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" aria-hidden="true" />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        action={
          <Link
            href="/products"
            className={cn(buttonVariants())}
          >
            Browse products
          </Link>
        }
      />
    );
  }

  const products: ProductCardData[] = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    basePrice: item.basePrice,
    primaryImage: item.imageUrl
      ? { url: item.imageUrl, altText: item.imageAlt ?? item.name }
      : null,
    category: item.categoryName ? { name: item.categoryName } : null,
  }));

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6">
        {items.length} saved {items.length === 1 ? "item" : "items"}
      </p>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <li key={product.id} className="flex flex-col gap-2">
            <ProductCard product={product} />
            <button
              type="button"
              onClick={() => remove(product.id)}
              aria-label={`Remove ${product.name} from wishlist`}
              className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
