"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { TRENDING_SEARCHES } from "@/lib/trending-searches";

export function LandingSearch() {
  const [focused, setFocused] = useState(false);

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
    }
  }

  return (
    <div
      className="relative order-3 md:order-2 w-full md:flex-1 md:ml-30 md:self-center"
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setFocused(false);
        }
      }}
    >
      <form action="/search" method="GET" role="search" aria-label="Search products">
        <label htmlFor="landing-search" className="sr-only">
          Search products, brands and categories
        </label>
        <div className="flex items-center gap-2 h-10 w-full pl-4 pr-1.5 rounded-full bg-muted/70 border border-transparent focus-within:border-ring transition-colors">
          <Search className="h-4 w-4 shrink-0 text-primary self-center" aria-hidden="true" />
          <input
            id="landing-search"
            type="search"
            name="q"
            placeholder="Search products, brands & categories"
            className="h-full w-full min-w-0 self-center appearance-none bg-transparent py-0 text-sm leading-none text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center h-8 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Search
          </button>
        </div>
      </form>

      {focused && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-popover p-3 shadow-md">
          <p className="px-1 pb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Trending searches
          </p>
          <ul className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/search?q=${encodeURIComponent(item.query)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-container-lowest px-3 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-highest focus-visible:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
