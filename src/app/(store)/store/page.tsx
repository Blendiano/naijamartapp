import Link from "next/link";
import { getProducts, getCategories } from "@/services/products";
import { ProductGrid } from "@/components/product/product-card";
import { ArrowRight, Gem, ShieldCheck, Truck, Sparkles, Store } from "lucide-react";
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
      "Every piece in our catalogue is selected for craftsmanship, fit, and durability.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description:
      "Pay safely with Paystack. Your financial data is always protected.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Reliable delivery across Nigeria with real-time order tracking.",
  },
];

export default async function StoreHomePage() {
  const [featuredProducts, categoriesList] = await Promise.all([
    getProducts({ limit: 8 }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* ── Brand Introduction Banner ─────────────────────────────── */}
      <section
        className="relative bg-muted/60 border-b border-border/80 px-6 sm:px-8 py-14 text-center overflow-hidden"
        aria-label="Brand introduction"
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 relative z-10">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-4 py-1 rounded-full border border-border bg-card text-secondary">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            NaijaMart Store
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Elevated Nigerian Fashion
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
            Explore our curated collections of authentic apparel, designed for quality, comfort, and distinction.
          </p>
        </div>
      </section>

      {/* ── Featured Pieces ─────────────────────────────────── */}
      <section
        className="px-6 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8"
        aria-label="Featured products"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Pieces
            </h2>
            <p className="text-sm mt-1 text-muted-foreground">
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
        className="px-6 sm:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8"
        aria-label="Shop by category"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-secondary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Shop by Category
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Explore Collections
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesList.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group p-6 rounded-2xl border border-border bg-card flex flex-col gap-3 transition-all hover:border-primary hover:shadow-xs"
            >
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-auto pt-2">
                Shop now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── The NaijaMart Promise ─────────────────────────────── */}
      <section
        className="px-6 sm:px-8 max-w-5xl mx-auto w-full flex flex-col items-center gap-12 pt-6"
        aria-label="Brand pillars"
      >
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            The NaijaMart Promise
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-2xl border border-border bg-card"
            >
              <span className="p-3 rounded-xl bg-primary/10 w-fit">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">
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
          className="group inline-flex items-center gap-2 rounded-full border border-primary px-8 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
        >
          Browse All Products
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </section>
    </div>
  );
}
