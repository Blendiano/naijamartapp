"use client";

import Link from "next/link";
import { ChevronDown, Heart, Package, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownNavItem } from "@/components/layout/dropdown-nav-item";

export function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Open account menu"
            className="group inline-flex items-center gap-2 h-9 px-2 sm:px-3.5 rounded-md text-sm font-medium text-secondary transition-colors hover:bg-surface-container-highest hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-surface-container-highest data-[popup-open]:text-primary"
          >
            <User className="h-4 w-4 transition-colors" aria-hidden="true" />
            <span>Account</span>
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-200 group-data-[popup-open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        }
      />

      <DropdownMenuContent align="end" sideOffset={8} className="w-52 p-0">
        <div className="p-3">
          <DropdownMenuItem
            render={
              <Link
                href="/auth/login"
                className="h-9 w-full justify-center rounded-lg border border-primary bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90! hover:text-primary-foreground! hover:**:text-primary-foreground! focus:bg-primary/90! focus:text-primary-foreground! focus:**:text-primary-foreground! data-highlighted:bg-primary/90! data-highlighted:text-primary-foreground! data-highlighted:**:text-primary-foreground!"
              >
                <span>Sign In</span>
              </Link>
            }
          />
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        <div className="p-1.5 flex flex-col gap-0.5">
          <DropdownNavItem href="/account" icon={<User className="h-4 w-4" aria-hidden="true" />}>
            My Account
          </DropdownNavItem>
          <DropdownNavItem href="/orders" icon={<Package className="h-4 w-4" aria-hidden="true" />}>
            Orders
          </DropdownNavItem>
          <DropdownNavItem href="/wishlist" icon={<Heart className="h-4 w-4" aria-hidden="true" />}>
            Wishlist
          </DropdownNavItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
