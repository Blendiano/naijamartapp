"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/categories/mens-fashion", label: "Men" },
  { href: "/categories/womens-fashion", label: "Women" },
];

interface NavbarProps {
  cartCount?: number;
  userSurname?: string;
}

export function Navbar({ cartCount = 0, userSurname }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-sm bg-background/92 border-border"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="NaijaMart home"
          >
            NaijaMart
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1" role="list">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="listitem"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link href="/search" aria-label="Search products">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-auto gap-2 px-3 text-sm font-medium"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </Link>

            <Link
              href="/account"
              aria-label={
                userSurname ? `My account — ${userSurname}` : "My account"
              }
            >
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-auto gap-2 px-3 text-sm font-medium hover:border-primary/40 hover:bg-surface-container-highest hover:text-primary"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline max-w-[7rem] truncate">
                  {userSurname ?? "Account"}
                </span>
              </Button>
            </Link>

            <Link
              href="/cart"
              aria-label={`Cart — ${cartCount} items`}
              className="relative"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-auto gap-2 px-3 text-sm font-medium"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cart</span>
              </Button>
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground"
                  aria-hidden="true"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Theme toggle hidden while dark mode is dormant.
                Re-enable alongside the [data-theme="dark"] selector in globals.css.
                <ThemeToggle /> */}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 md:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" aria-hidden="true" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <span className="text-base font-bold text-primary">NaijaMart</span>
                  </div>
                  <nav className="flex flex-col px-4 py-6 gap-1" aria-label="Mobile navigation">
                    {navLinks.map((link) => {
                      const isActive = pathname.startsWith(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? "text-primary bg-primary/10"
                              : "text-foreground hover:bg-muted"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                    <div className="mt-4 pt-4 border-t border-border flex flex-col gap-1">
                      <Link
                        href="/orders"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted"
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Account
                      </Link>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}