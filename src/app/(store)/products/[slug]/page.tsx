import { getProductBySlug } from "@/services/products";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description ?? `Buy ${product.name} on NaijaMart.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 lg:mb-8">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link
              href="/products"
              className="transition-colors hover:text-foreground"
            >
              Products
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true" className="text-muted-foreground/50">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                {product.category.slug ? (
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {product.category.name}
                  </Link>
                ) : (
                  <span>{product.category.name}</span>
                )}
              </li>
            </>
          )}
          <li aria-hidden="true" className="text-muted-foreground/50">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li
            aria-current="page"
            className="max-w-[14rem] truncate font-medium text-foreground sm:max-w-none"
          >
            {product.name}
          </li>
        </ol>
      </nav>

      <ProductDetailClient product={product} />
    </div>
  );
}
