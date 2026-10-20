import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "403 — Access Denied",
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-sm w-full flex flex-col items-center gap-6 text-center">
        <div className="p-4 rounded-2xl bg-muted">
          <ShieldAlert className="h-10 w-10 text-destructive" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            403 — Access Denied
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            This area is not for you
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are signed in, but your account does not have permission to
            access this page. If you believe this is a mistake, please contact
            our team.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className={cn("flex-1", buttonVariants({ className: "w-full gap-2" }))}
          >
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/orders"
            className={cn("flex-1", buttonVariants({ variant: "outline", className: "w-full" }))}
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}