import { getAdminMetrics } from "@/services/orders";
import { formatNaira } from "@/lib/utils/money";
import Link from "next/link";
import { DollarSign, ShoppingBag, Package, ArrowUpRight } from "lucide-react";

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Overview of NaijaMart performance and recent orders.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Revenue
            </span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl font-extrabold text-primary">
            {formatNaira(metrics.totalRevenue)}
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Orders
            </span>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">
            {metrics.totalOrders}
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Products
            </span>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl font-extrabold text-foreground">
            {metrics.totalProducts}
          </span>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold flex items-center gap-1 hover:underline text-primary"
          >
            View all orders
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {metrics.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/50">
                    <td className="py-3 font-mono font-bold">#{ord.orderNumber}</td>
                    <td className="py-3 font-medium">{ord.customerName}</td>
                    <td className="py-3 font-bold text-primary">
                      {formatNaira(ord.total)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.status === "confirmed" || ord.status === "delivered"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleDateString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No orders recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}