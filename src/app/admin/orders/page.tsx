import { getAllAdminOrders } from "@/services/orders";
import { formatNaira } from "@/lib/utils/money";
import { AdminOrderStatusDropdown } from "./status-dropdown";

export const metadata = {
  title: "Order Management - Admin",
};

export default async function AdminOrdersPage() {
  const allOrders = await getAllAdminOrders();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Order Management
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage customer orders, track payments, and update fulfillment status.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
        {allOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Fulfillment Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/50">
                    <td className="py-3.5 font-mono font-bold">#{ord.orderNumber}</td>
                    <td className="py-3.5">
                      <p className="font-semibold text-foreground">{ord.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{ord.customerEmail}</p>
                    </td>
                    <td className="py-3.5 font-mono">{ord.customerPhone}</td>
                    <td className="py-3.5 font-bold text-sm text-primary">
                      {formatNaira(ord.total)}
                    </td>
                    <td className="py-3.5">
                      <AdminOrderStatusDropdown orderId={ord.id} currentStatus={ord.status} />
                    </td>
                    <td className="py-3.5 text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleDateString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">
            No orders found in the system.
          </p>
        )}
      </div>
    </div>
  );
}
