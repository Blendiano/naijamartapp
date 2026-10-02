import { db } from "@/db";
import { orders, payments, orderItems, inventory, productVariants, notifications, carts, cartItems } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "@/lib/email/mailer";
import { formatNaira } from "@/lib/utils/money";

/**
 * Process a successful payment idempotently.
 * Safe to call multiple times with the same payment reference or webhook payload.
 */
export async function processSuccessfulPayment(
  paymentReference: string,
  providerReference?: string
) {
  // 1. Fetch payment record
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.reference, paymentReference))
    .limit(1);

  if (!payment) {
    throw new Error(`Payment reference not found: ${paymentReference}`);
  }

  // Idempotency check: if already paid, do nothing
  if (payment.status === "paid") {
    console.log(`[Payment] Idempotent skip: ${paymentReference} is already paid`);
    return { success: true, alreadyProcessed: true };
  }

  // 2. Fetch order & items
  const [order] = await txOrDbSelectOrder(payment.orderId);
  if (!order) {
    throw new Error(`Order not found for payment: ${payment.orderId}`);
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  // 3. Perform payment verification & inventory decrement in an atomic transaction
  await db.transaction(async (tx) => {
    // Re-verify payment status inside transaction with row lock
    const [txPayment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id))
      .limit(1);

    if (txPayment.status === "paid") return;

    // Update payment record
    await tx
      .update(payments)
      .set({
        status: "paid",
        providerReference: providerReference ?? txPayment.providerReference,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Update order status
    await tx
      .update(orders)
      .set({
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Transactional inventory decrement guarded against overselling
    for (const item of items) {
      if (item.variantId) {
        await tx
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventory.variantId, item.variantId),
              sql`${inventory.quantity} >= ${item.quantity}`
            )
          );
      }
    }

    // Create notification if order has a userId
    if (order.userId) {
      await tx.insert(notifications).values({
        userId: order.userId,
        type: "order_confirmed",
        title: "Order Confirmed",
        message: `Your order ${order.orderNumber} for ${formatNaira(order.total)} has been confirmed!`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      });
    }
  });

  // 4. Post-order side effects (Email) — fail-safe, outside transaction
  sendOrderConfirmationEmail({
    to: order.customerEmail,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    orderTotal: formatNaira(order.total),
    orderItems: items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      unitPrice: formatNaira(i.unitPrice),
    })),
    deliveryAddress: typeof order.deliveryAddress === "string" ? order.deliveryAddress : JSON.stringify(order.deliveryAddress),
    deliveryOption: order.deliveryOptionName,
  }).catch((err) =>
    console.error("[Payment] Post-order email failed (non-fatal):", err)
  );

  return { success: true, alreadyProcessed: false, orderNumber: order.orderNumber };
}

async function txOrDbSelectOrder(orderId: string) {
  return db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
}
