import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerOrders } from "@/services/orders";
import { formatNaira } from "@/lib/utils/money";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowRight, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View your past orders and tracking updates.",
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/orders");
  }

  const userOrders = await getCustomerOrders(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Track recent orders and view purchase history.
        </p>
      </div>

      {userOrders.length > 0 ? (
        <div className="flex flex-col gap-4 max-w-4xl">
          {userOrders.map((ord) => (
            <Link
              key={ord.id}
              href={`/orders/${ord.id}`}
              className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-primary"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">
                      #{ord.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        ord.status === "confirmed" || ord.status === "delivered"
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placed on {new Date(ord.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                <span className="text-base font-extrabold text-primary">
                  {formatNaira(ord.total)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6" aria-hidden="true" />}
          title="No orders yet"
          description="When you place orders, they will appear here."
          action={
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Explore Products
            </Link>
          }
        />
      )}
    </div>
  );
}
