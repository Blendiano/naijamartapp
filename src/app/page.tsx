import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getProducts, getCategories } from "@/services/products";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/utils/money";
import { ArrowRight, Sparkles } from "lucide-react";
import { NavbarActions } from "@/components/layout/navbar-actions";
import { LandingSearch } from "@/components/layout/landing-search";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

export const metadata: Metadata = {
  title: "NaijaMart — Modern African Fashion",
  description:
    "Discover modern Nigerian fashion for men and women. Clean, editorial, and curated apparel delivered with care.",
};

const categoryImages: Record<string, string> = {
  men: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80",
  women: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  shoes: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
  accessories: "https://images.unsplash.com/photo-1611591475285-a36ad5e14393?auto=format&fit=crop&w=800&q=80",
};

export default async function LandingPage() {
  const [newArrivals, categoriesList, session] = await Promise.all([
    getProducts({ limit: 4 }),
    getCategories(),
    auth(),
  ]);

  const collectionHref = session?.user ? "/store" : "/auth/signup";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* ── Refined Landing Navbar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/90 border-b border-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:h-16 md:py-0 flex flex-wrap items-center justify-between gap-3 md:gap-2">
          {/* Left: Brand Logo */}
          <Link
            href="/"
            aria-label="NaijaMart home"
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary transition-opacity hover:opacity-90"
          >
            NaijaMart
          </Link>

          {/* Right Actions */}
          <NavbarActions />

          {/* Center: Product Search */}
          <LandingSearch />
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-24 pb-20">
        {/* ── Editorial Asymmetric Hero Section ────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-6 md:pt-10 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Typography Column (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col items-start gap-4 lg:mt-4">
              {/* Understated Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold uppercase tracking-widest">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>MODERN AFRICAN FASHION</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.06] text-balance -mt-2">
                Style that <br />
                <span className="text-primary italic font-serif font-normal">speaks</span> to you.
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-muted-foreground font-normal max-w-md -mt-1 leading-relaxed">
                Discover fashion from Nigeria.
              </p>

              {/* CTA Group */}
              <div className="flex flex-wrap items-center gap-3 pt-8 w-full sm:w-auto">
                <Link
                  href={collectionHref}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-all shadow-xs"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted hover:border-primary/40 transition-all"
                >
                  Explore
                </Link>
              </div>
            </div>

            {/* Right Fashion Photography Column (6 Cols) */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[450px] lg:mt-8 w-full lg:max-w-[600px] lg:ml-auto rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-xs group">
                <Image
                  src="/hero-image.png"
                  alt="Modern African fashion editorial"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Category Section: Shop by Category ──────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Shop by Category
            </h2>
            <p className="text-sm text-muted-foreground">
              Find pieces made for your everyday style.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {["Men", "Women", "Shoes", "Accessories"].map((catName) => {
              const slug = catName.toLowerCase();
              const catObj = categoriesList.find((c) => c.slug === slug || c.name.toLowerCase() === slug);
              const linkHref = catObj ? `/categories/${catObj.slug}` : `/products`;
              const imgUrl = categoryImages[slug] ?? categoryImages.men;

              return (
                <Link
                  key={catName}
                  href={linkHref}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted border border-border/80 flex flex-col justify-end p-5 text-white transition-all hover:shadow-md"
                >
                  <Image
                    src={imgUrl}
                    alt={catName}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="font-semibold text-lg sm:text-xl tracking-tight drop-shadow-xs">
                      {catName}
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── New Arrivals Section ────────────────────────────────────────── */}
        <section id="new-arrivals" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                New Arrivals
              </h2>
              <p className="text-sm mt-1 text-muted-foreground">
                Fresh styles worth discovering.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <div key={product.id} className="group flex flex-col gap-3">
                <div className="relative">
                  <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-muted border border-border/60">
                    <ProductImage
                      src={product.primaryImage?.url}
                      alt={product.primaryImage?.altText ?? product.name}
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <WishlistButton
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

                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize">
                    {product.category?.name ?? "Fashion"}
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {formatNaira(product.basePrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Refined Footer ─────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-border/80 bg-background text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-primary text-sm">NaijaMart</span>
          <p>© {new Date().getFullYear()} NaijaMart. All rights reserved.</p>
          <p>Payments secured by <span className="font-semibold text-foreground">Paystack</span></p>
        </div>
      </footer>
    </div>
  );
}
