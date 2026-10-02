import Link from "next/link";
import { formatNaira } from "@/lib/utils/money";
import { ProductImage } from "@/components/product/product-image";

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

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      aria-label={`${product.name} — ${formatNaira(product.basePrice)}`}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
        <ProductImage
          src={product.primaryImage?.url}
          alt={product.primaryImage?.altText ?? product.name}
          className="group-hover:scale-105"
        />
        {isUnavailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/40">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        {product.category && (
          <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:underline underline-offset-2">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-primary">
          {formatNaira(product.basePrice)}
        </p>
      </div>
    </Link>
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