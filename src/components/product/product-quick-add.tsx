import Link from "next/link";
import { Settings2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

interface ProductQuickAddProps {
  /** Product details page, where variant options are selected. */
  href: string;
  productName: string;
}

// Sits over the bottom of the product image. Hidden until hover/focus on
// desktop; always visible on touch/small screens where hover is unavailable.
const overlayClassName =
  "pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center";
const revealClassName =
  "pointer-events-auto w-full transition-all duration-200 sm:pointer-events-none sm:translate-y-1 sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 motion-reduce:transition-none";

export function ProductQuickAdd({ href, productName }: ProductQuickAddProps) {
  return (
    <div className={overlayClassName}>
      <Link
        href={href}
        aria-label={`Choose options for ${productName}`}
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          revealClassName,
          "gap-1.5 shadow-sm"
        )}
      >
        <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
        Choose Options
      </Link>
    </div>
  );
}
