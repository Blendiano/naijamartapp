"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function RootErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Log to console for diagnostics; never expose to the user
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
        <div className="p-4 rounded-2xl bg-muted">
          <AlertTriangle
            className="h-10 w-10 text-destructive"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Something went wrong
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            We ran into an unexpected issue
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please try again. If the problem persists, our team has been
            notified and is looking into it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button type="button" onClick={retry} className="flex-1 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", className: "flex-1" }))}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}