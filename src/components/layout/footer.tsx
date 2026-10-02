import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="mt-auto border-t border-border bg-background"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold tracking-tight text-primary">
              NaijaMart
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nigerian Fashion, Elevated. Discover premium styles for men and
              women, delivered with care.
            </p>
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground">
              Shop
            </h3>
            <nav className="flex flex-col gap-2" aria-label="Shop navigation">
              {[
                { href: "/products", label: "All Products" },
                { href: "/categories/men", label: "Men" },
                { href: "/categories/women", label: "Women" },
                { href: "/search", label: "Search" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground">
              Account
            </h3>
            <nav className="flex flex-col gap-2" aria-label="Account navigation">
              {[
                { href: "/account", label: "My Account" },
                { href: "/orders", label: "My Orders" },
                { href: "/cart", label: "Cart" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground">
              Info
            </h3>
            <nav className="flex flex-col gap-2" aria-label="Info navigation">
              {[
                { href: "/about", label: "About NaijaMart" },
                { href: "/contact", label: "Contact Us" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NaijaMart. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Payments secured by{" "}
            <span className="font-medium text-secondary">Paystack</span>
          </p>
        </div>
      </div>
    </footer>
  );
}