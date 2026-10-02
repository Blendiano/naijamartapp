import { getProducts, getCategories } from "@/services/products";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Shirt } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse the complete collection of Nigerian fashion for men and women.",
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;

  const [productsList, categoriesList] = await Promise.all([
    getProducts({ categorySlug }),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {categorySlug ? `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)} Fashion` : "All Products"}
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Showing {productsList.length} items
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !categorySlug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            All
          </Link>
          {categoriesList.map((cat) => {
            const isActive = categorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid or Empty */}
      {productsList.length > 0 ? (
        <ProductGrid products={productsList} />
      ) : (
        <EmptyState
          icon={<Shirt className="h-6 w-6" aria-hidden="true" />}
          title="No products found"
          description="Check back soon! New Nigerian fashion pieces are added regularly."
          action={
            categorySlug ? (
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View all products
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
