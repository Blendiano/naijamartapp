"use client";

import Link from "next/link";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const ITEM_CLASS =
  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-secondary transition-colors hover:bg-surface-container-highest! hover:text-primary! hover:**:text-primary! focus-visible:bg-surface-container-highest! focus-visible:text-primary! focus-visible:**:text-primary! data-highlighted:bg-surface-container-highest! data-highlighted:text-primary! data-highlighted:**:text-primary!";

const ICON_WRAP_CLASS = "text-secondary [&_svg]:h-4 [&_svg]:w-4";

interface DropdownNavItemProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function DropdownNavItem({ href, icon, children }: DropdownNavItemProps) {
  return (
    <DropdownMenuItem
      render={
        <Link href={href} className={ITEM_CLASS}>
          {icon && <span className={ICON_WRAP_CLASS}>{icon}</span>}
          {children}
        </Link>
      }
    />
  );
}
