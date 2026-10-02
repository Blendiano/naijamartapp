import { auth } from "@/lib/auth";
import { getOrderById } from "@/services/orders";
import { notFound, redirect } from "next/navigation";
import { formatNaira } from "@/lib/utils/money";
import { Package, MapPin } from "lucide-react";
import type { Metadata } from "next";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return { title: "Order Not Found" };
  return { title: `Order #${order.orderNumber}` };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/orders/${id}`);
  }

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  // Object-level authorization check: customer can only view their own order (unless admin)
  if (session.user.role !== "admin" && order.userId !== session.user.id) {
    redirect("/orders");
  }

  const addr =
    typeof order.deliveryAddress === "string"
      ? JSON.parse(order.deliveryAddress)
      : order.deliveryAddress;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Order Reference
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            #{order.orderNumber}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleString("en-NG")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              order.status === "confirmed" || order.status === "delivered"
                ? "bg-success text-success-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            Order: {order.status}
          </span>
          {order.payment && (
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                order.payment.status === "paid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              Payment: {order.payment.status}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Order Items */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Items Ordered ({order.items.length})
            </h2>

            <div className="flex flex-col gap-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-b-0">
                  <div>
                    <p className="font-semibold text-foreground">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × {formatNaira(item.unitPrice)}
                      {(item.variantInfo as { size?: string } | null)?.size
                        ? ` | Size: ${(item.variantInfo as { size?: string }).size}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-bold text-primary">
                    {formatNaira(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-3 text-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery Address
            </h2>
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">{order.customerName}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>{addr.city}, {addr.state}, {addr.country}</p>
              <p className="mt-1 font-mono">{order.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="md:col-span-4">
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4 sticky top-24">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Summary
            </h2>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery ({order.deliveryOptionName})</span>
                <span className="font-medium text-foreground">{formatNaira(order.deliveryFee)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-extrabold text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatNaira(order.total)}</span>
              </div>
            </div>

            {order.payment?.reference && (
              <div className="mt-2 pt-4 border-t border-border text-[11px] font-mono text-muted-foreground flex flex-col gap-1">
                <span>Payment Ref: {order.payment.reference}</span>
                {order.payment.paidAt && (
                  <span>Paid: {new Date(order.payment.paidAt).toLocaleTimeString()}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
