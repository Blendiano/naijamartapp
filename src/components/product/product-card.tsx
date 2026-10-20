import Link from "next/link";
import { formatNaira } from "@/lib/utils/money";
import { ProductImage } from "@/components/product/product-image";
import { ProductQuickAdd } from "@/components/product/product-quick-add";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  basePrice: number; // kobo
  primaryImage?: { url: string; altText: string | null } | null;
  category?: { name: string } | null;
  isAvailable?: boolean;
}

interface ProductCardProps {
  product: ProductCardData;
}

export function ProductCard({ product }: ProductCardProps) {
  const isUnavailable = product.isAvailable === false;
  const href = `/products/${product.slug}`;

  return (
    <div className="group flex h-full flex-col gap-3">
      {/* Image + Favourite */}
      <div className="relative">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ProductImage
            src={product.primaryImage?.url}
            alt={product.primaryImage?.altText ?? product.name}
            aspectRatio="aspect-[4/5]"
            className="group-hover:scale-105"
          />
        </Link>
        {isUnavailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/40">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              Out of Stock
            </span>
          </div>
        )}
        {!isUnavailable && (
          <ProductQuickAdd href={href} productName={product.name} />
        )}
        <WishlistButton
          className="z-30"
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            basePrice: product.basePrice,
            imageUrl: product.primaryImage?.url ?? null,
            imageAlt: product.primaryImage?.altText ?? null,
            categoryName: product.category?.name ?? null,
          }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 px-0.5">
        {product.category && (
          <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <Link
          href={href}
          className="text-sm font-semibold leading-snug line-clamp-2 text-foreground transition-colors group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {product.name}
        </Link>
        <p className="mt-auto pt-0.5 text-sm font-semibold text-primary tabular-nums">
          {formatNaira(product.basePrice)}
        </p>
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
