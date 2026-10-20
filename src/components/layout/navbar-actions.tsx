"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { AccountMenu } from "@/components/layout/account-menu";
import { HelpMenu } from "@/components/layout/help-menu";

const CART_LINK_CLASS =
  "group inline-flex items-center gap-2 h-9 px-2 rounded-full text-sm font-medium text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:text-primary";

const ICON_CLASS = "h-5 w-5 transition-colors group-hover:text-primary";

export function NavbarActions() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 order-2 md:order-3">
      <AccountMenu />

      <HelpMenu />

      <Link
        href="/cart"
        aria-current={pathname === "/cart" ? "page" : undefined}
        className={CART_LINK_CLASS}
      >
        <ShoppingCart className={ICON_CLASS} aria-hidden="true" />
        <span className="hidden lg:inline">Cart</span>
      </Link>
    </div>
  );
}
