import Link from "next/link";
import { getProducts, getCategories } from "@/services/products";
import { ProductGrid } from "@/components/product/product-card";
import { ArrowRight, Gem, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store — NaijaMart Nigerian Fashion",
  description:
    "Discover premium Nigerian fashion for men and women. Shop the finest styles, delivered with care.",
};

const pillars = [
  {
    icon: Gem,
    title: "Curated Quality",
    description:
      "Every piece is selected for craftsmanship, fit, and durability.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description:
      "Pay safely with Paystack. Card details are never stored on our servers.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Reliable delivery across Nigeria, with order tracking from checkout to doorstep.",
  },
];

export default async function StoreHomePage() {
  const [featuredProducts, categoriesList] = await Promise.all([
    getProducts({ limit: 8 }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col pb-16">
      {/* ── Brand Introduction Banner ─────────────────────────────── */}
      <section
        className="relative bg-muted/60 border-b border-border/80 px-6 sm:px-8 pt-16 pb-8 sm:pb-10 text-center overflow-hidden"
        aria-label="Brand introduction"
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Elevated Nigerian Fashion
          </h1>

          <p className="-mt-2 text-base sm:text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
            Discover quality Nigerian fashion for every occasion.
          </p>

          <Link
            href="/products"
            className={cn(
              "group",
              buttonVariants({ size: "lg", className: "gap-2 mt-4" })
            )}
          >
            Shop Collection
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* ── Featured Pieces ─────────────────────────────────── */}
      <section
        className="px-6 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8 pt-16"
        aria-label="Featured products"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Pieces
            </h2>
            <p className="text-sm text-muted-foreground">
              Hand-picked styles our customers love right now.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View all products
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} />
      </section>

      {/* ── Shop by Category ─────────────────────────────────── */}
      <section
        className="px-6 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8 sm:gap-10 pt-16"
        aria-label="Shop by category"
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-secondary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Shop by Category
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
              Explore Collections
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
              Browse our curated departments to find your next favourite piece.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {categoriesList.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex h-full flex-col gap-1 rounded-2xl border border-border bg-card p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {cat.description}
                </p>
              )}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary">
                Shop now
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── The NaijaMart Promise ─────────────────────────────── */}
      <section
        className="px-6 sm:px-8 max-w-5xl mx-auto w-full flex flex-col items-center gap-10 pt-16"
        aria-label="Brand pillars"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              The NaijaMart Promise
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
            A Better Way to Shop Fashion
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 w-full">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-7"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/products"
          className={cn(
            "group",
            buttonVariants({ size: "lg", className: "gap-2" })
          )}
        >
          Shop All Products
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </section>
    </div>
  );
}
