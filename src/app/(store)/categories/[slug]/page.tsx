import { getProducts, getCategories } from "@/services/products";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Shirt } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoriesList = await getCategories();
  const cat = categoriesList.find((c) => c.slug === slug);
  if (!cat) return { title: "Category Not Found" };

  return {
    title: `${cat.name} Collection`,
    description: cat.description ?? `Browse ${cat.name} fashion at NaijaMart.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoriesList = await getCategories();
  const currentCategory = categoriesList.find((c) => c.slug === slug);

  if (!currentCategory) {
    notFound();
  }

  const productsList = await getProducts({ categorySlug: slug });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {currentCategory.name}
        </h1>
        {currentCategory.description && (
          <p className="text-sm mt-1 max-w-xl text-muted-foreground">
            {currentCategory.description}
          </p>
        )}
      </div>

      {productsList.length > 0 ? (
        <ProductGrid products={productsList} />
      ) : (
        <EmptyState
          icon={<Shirt className="h-6 w-6" aria-hidden="true" />}
          title={`No products in ${currentCategory.name}`}
          description="We are adding new pieces to this collection shortly."
        />
      )}
    </div>
  );
}
