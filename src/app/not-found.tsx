import Link from "next/link";
import { PackageSearch, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

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
            className={cn(buttonVariants({ className: "flex-1 gap-2" }))}
          >
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "outline", className: "flex-1" }))}
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}