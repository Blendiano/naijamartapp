import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { User, Package, ShieldCheck, Mail, Store } from "lucide-react";
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
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
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <User className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
            <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider text-foreground">
              {user.role}
            </span>
          </div>
        </div>

        <SignOutButton />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/orders"
          className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 transition-all hover:border-primary"
        >
          <div className="p-3 rounded-xl bg-muted">
            <Package className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-foreground">My Orders</p>
            <p className="text-xs text-muted-foreground">
              Track orders and view purchase history.
            </p>
          </div>
        </Link>

        {user.role === "admin" && (
          <Link
            href="/admin"
            className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 transition-all hover:border-primary"
          >
            <div className="p-3 rounded-xl bg-muted">
              <ShieldCheck
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="font-semibold text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">
                Manage products, orders, and inventory.
              </p>
            </div>
          </Link>
        )}

        <Link
          href="/products"
          className="p-5 rounded-2xl border border-border bg-card flex items-center gap-4 transition-all hover:border-primary"
        >
          <div className="p-3 rounded-xl bg-muted">
            <Store className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Keep Shopping</p>
            <p className="text-xs text-muted-foreground">
              Browse the latest collections.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}