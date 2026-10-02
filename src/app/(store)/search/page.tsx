import { getProducts } from "@/services/products";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search the NaijaMart catalogue for styles, categories, and products.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";

  const results = query ? await getProducts({ searchQuery: query }) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search Header */}
      <div className="max-w-xl mx-auto mb-10 text-center flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Search Catalogue
        </h1>
        <form action="/search" method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search for dresses, shirts, trousers..."
            className="w-full h-12 pl-12 pr-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
        </form>
      </div>

      {/* Results */}
      {query ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-6 text-muted-foreground">
            Search results for &ldquo;{query}&rdquo; ({results.length})
          </p>
          {results.length > 0 ? (
            <ProductGrid products={results} />
          ) : (
            <EmptyState
              icon={<Search className="h-6 w-6" aria-hidden="true" />}
              title="No products match your search"
              description={`We couldn't find anything matching "${query}". Try searching with different keywords.`}
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
          title="Start searching"
          description="Type a product name or category above to find what you're looking for."
        />
      )}
    </div>
  );
}
