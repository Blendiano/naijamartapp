import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { User, Package, ShieldCheck, Mail, Store, ArrowRight } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your NaijaMart account.",
};

export default async function AccountPage() {
  const session = await auth();

  const user = session?.user;

  if (!user) {
    redirect("/auth/login?callbackUrl=/account");
  }

  const username = user.name || user.email?.split("@")[0] || "Shopper";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Account
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Welcome back, {username}.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 p-3 rounded-xl bg-primary/10 text-primary">
            <User className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{username}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 min-w-0">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>

        <SignOutButton />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary account action */}
        <Link
          href="/orders"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-primary/30 bg-primary/5 transition-all duration-200 hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="shrink-0 p-3 rounded-xl bg-primary text-primary-foreground">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">My Orders</p>
            <p className="text-sm text-muted-foreground">
              View your order history
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        {user.role === "admin" && (
          <Link
            href="/admin"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="shrink-0 p-3 rounded-xl bg-muted text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Admin Dashboard</p>
              <p className="text-sm text-muted-foreground">
                Manage products, orders, and inventory.
              </p>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        )}

        {/* Secondary account action */}
        <Link
          href="/products"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="shrink-0 p-3 rounded-xl bg-muted text-primary">
            <Store className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Keep Shopping</p>
            <p className="text-sm text-muted-foreground">
              Browse the latest collections.
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}
