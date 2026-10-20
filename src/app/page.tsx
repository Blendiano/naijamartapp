import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getProducts, getCategories } from "@/services/products";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/utils/money";
import { ArrowRight } from "lucide-react";
import { NavbarActions } from "@/components/layout/navbar-actions";
import { LandingSearch } from "@/components/layout/landing-search";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "NaijaMart — Modern African Fashion",
  description:
    "Discover modern Nigerian fashion for men and women. Clean, editorial, and curated apparel delivered with care.",
};

// Category tile imagery, keyed by the category slug stored in the database.
const CATEGORY_IMAGES: Record<string, string> = {
  "mens-fashion": "/images/mens-fashion.avif",
  "womens-fashion": "/images/african-print-midi-dress.avif",
  accessories: "/images/accessory-1.avif",
};

const CATEGORY_IMAGE_FALLBACK = "/images/royal-agbada-set.avif";

export default async function LandingPage() {
  const [womenFeatured, menFeatured, categoriesList, session] =
    await Promise.all([
      getProducts({ categorySlug: "womens-fashion", limit: 2 }),
      getProducts({ categorySlug: "mens-fashion", limit: 2 }),
      getCategories(),
      auth(),
    ]);

  // Homepage "Featured Pieces": 2 women's + 2 men's products.
  const featuredProducts = [
    ...womenFeatured.slice(0, 2),
    ...menFeatured.slice(0, 2),
  ];

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

      <main className="flex-1 flex flex-col gap-16 pb-12">
        {/* ── Editorial Asymmetric Hero Section ────────────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-4 md:pt-8 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Typography Column (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col items-start gap-4 lg:mt-4">
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.06] text-balance">
                Style that <br />
                <span className="text-primary italic font-serif font-normal">speaks</span> to you.
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-muted-foreground font-normal max-w-md -mt-1 leading-relaxed">
                Discover fashion from Nigeria.
              </p>

              {/* CTA Group */}
              <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
                <Link
                  href={collectionHref}
                  className={cn(buttonVariants({ size: "lg", className: "gap-2" }))}
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  href="/products"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Shop Now
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
          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Shop by Category
            </h2>
            <p className="text-sm text-muted-foreground">
              Find pieces made for your everyday style.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categoriesList.map((category) => {
              const imgUrl =
                CATEGORY_IMAGES[category.slug] ?? CATEGORY_IMAGE_FALLBACK;

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted border border-border/80 flex flex-col justify-end p-5 text-white transition-all hover:shadow-md"
                >
                  <Image
                    src={imgUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="font-semibold text-lg sm:text-xl tracking-tight drop-shadow-xs">
                      {category.name}
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

        {/* ── Featured Pieces Section ─────────────────────────────────────── */}
        <section id="featured" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
          <div className="flex flex-col gap-0">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Pieces
            </h2>
            <p className="text-sm text-muted-foreground">
              Curated styles for every occasion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group flex flex-col gap-3">
                <div className="relative">
                  <Link href={`/products/${product.slug}`} className="block relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-muted border border-border/60">
                    <ProductImage
                      src={product.primaryImage?.url}
                      alt={product.primaryImage?.altText ?? product.name}
                      aspectRatio="aspect-[4/5]"
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
                    className="font-medium text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground capitalize">
                    {product.category?.name ?? "Fashion"}
                  </p>
                  <p className="text-base font-semibold text-foreground mt-1">
                    {formatNaira(product.basePrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            >
              View Collection
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
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
