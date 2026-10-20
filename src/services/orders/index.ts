import { db } from "@/db";
import { orders, orderItems, payments, shipments, products } from "@/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import type { OrderStatus } from "@/lib/order-status";

/**
 * Get all orders for a specific customer
 */
export async function getCustomerOrders(userId: string) {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return userOrders;
}

/**
 * Get detailed order by ID (with items, payment, and shipment status)
 */
export async function getOrderById(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1);

  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.orderId, order.id))
    .limit(1);

  return {
    ...order,
    items,
    payment: payment ?? null,
    shipment: shipment ?? null,
  };
}

/**
 * Admin: Get dashboard metrics (total revenue, order counts, product counts)
 */
export async function getAdminMetrics() {
  const [revenueResult] = await db
    .select({ totalRevenue: sum(orders.total) })
    .from(orders)
    .where(eq(orders.status, "confirmed"));

  const [ordersCountResult] = await db.select({ count: count() }).from(orders);
  const [productsCountResult] = await db.select({ count: count() }).from(products);

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return {
    totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
    totalOrders: Number(ordersCountResult?.count ?? 0),
    totalProducts: Number(productsCountResult?.count ?? 0),
    recentOrders,
  };
}

/**
 * Admin: Get all orders for management
 */
export async function getAllAdminOrders() {
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

/**
 * Admin: Update order status.
 * Callers must validate against ORDER_STATUSES (see the shared zod enum in
 * the admin orders route) — the type system enforces it here.
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  return db
    .update(orders)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}
