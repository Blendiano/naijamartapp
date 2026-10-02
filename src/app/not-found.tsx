import Link from "next/link";
import { PackageSearch, ArrowRight } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
        <div className="p-4 rounded-2xl bg-muted">
          <PackageSearch className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            404 — Page Not Found
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            This page has moved or never existed
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The link you followed may be broken, or the page may have been
            removed from the store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}