import { db } from "@/db";
import { payments, orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logError } from "@/lib/utils/error-log";

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  orderNumber?: string;
  error?: string;
}

/**
 * Idempotently record a verified payment and confirm its order.
 *
 * Called by both the Paystack webhook and the payment-verification route,
 * which can race each other for the same transaction. The transition from
 * `pending` → `paid` is guarded inside a transaction so that only one caller
 * performs the update; the other observes `alreadyProcessed`.
 */
export async function processSuccessfulPayment(
  paymentReference: string,
  providerReference?: string
): Promise<ProcessPaymentResult> {
  try {
    return await db.transaction(async (tx) => {
      const [existingPayment] = await tx
        .select({
          id: payments.id,
          orderId: payments.orderId,
          status: payments.status,
        })
        .from(payments)
        .where(eq(payments.reference, paymentReference))
        .limit(1);

      if (!existingPayment) {
        return {
          success: false,
          error: "Payment record not found",
        };
      }

      const loadOrderNumber = async () => {
        const [order] = await tx
          .select({ orderNumber: orders.orderNumber })
          .from(orders)
          .where(eq(orders.id, existingPayment.orderId))
          .limit(1);
        return order?.orderNumber;
      };

      if (existingPayment.status === "paid") {
        return {
          success: true,
          alreadyProcessed: true,
          orderNumber: await loadOrderNumber(),
        };
      }

      const now = new Date();

      // Only a pending payment may transition to paid: if a concurrent
      // delivery of the same event won the race, this update matches no rows
      // and we report the payment as already processed.
      const updated = await tx
        .update(payments)
        .set({
          status: "paid",
          providerReference: providerReference ?? null,
          paidAt: now,
          updatedAt: now,
        })
        .where(
          and(eq(payments.id, existingPayment.id), eq(payments.status, "pending"))
        )
        .returning({ id: payments.id });

      if (updated.length === 0) {
        return {
          success: true,
          alreadyProcessed: true,
          orderNumber: await loadOrderNumber(),
        };
      }

      const [order] = await tx
        .update(orders)
        .set({
          status: "confirmed",
          updatedAt: now,
        })
        .where(eq(orders.id, existingPayment.orderId))
        .returning({ orderNumber: orders.orderNumber });

      return {
        success: true,
        alreadyProcessed: false,
        orderNumber: order?.orderNumber,
      };
    });
  } catch (error) {
    logError("payments/processSuccessfulPayment", error);
    return {
      success: false,
      error: "Payment processing failed",
    };
  }
}
