import { db } from "@/db";
import { payments, orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logError } from "@/lib/utils/error-log";
import { sendOrderConfirmationEmail } from "@/lib/email/mailer";
import { formatNaira } from "@/lib/utils/money";
import { buildAppUrl, getConfiguredAppUrl } from "@/lib/utils/app-url";

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  orderNumber?: string;
  error?: string;
}

export interface ProcessPaymentOptions {
  /**
   * Public origin used for the link inside the order-confirmation email.
   * Routes pass the origin resolved from their request.
   */
  appUrl?: string;
}

/** The order fields the confirmation email is built from. */
interface ConfirmedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
}

interface PaymentOutcome {
  success: boolean;
  alreadyProcessed?: boolean;
  orderNumber?: string;
  error?: string;
  /** Present only for the caller that performed the pending → paid change. */
  order?: ConfirmedOrder;
}

/**
 * Idempotently record a verified payment and confirm its order.
 *
 * Called by both the Paystack webhook and the payment-verification route,
 * which can race each other for the same transaction. The transition from
 * `pending` → `paid` is guarded inside a transaction so that only one caller
 * performs the update; the other observes `alreadyProcessed`.
 *
 * The order-confirmation email is sent *after* the transaction has committed,
 * and only by the caller that performed the transition. A mail failure is
 * logged and never rolls back a payment that Paystack has already confirmed
 * (AGENTS.md §17).
 */
export async function processSuccessfulPayment(
  paymentReference: string,
  providerReference?: string,
  options: ProcessPaymentOptions = {}
): Promise<ProcessPaymentResult> {
  try {
    const result = await db.transaction(async (tx): Promise<PaymentOutcome> => {
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
        .returning({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          total: orders.total,
        });

      return {
        success: true,
        alreadyProcessed: false,
        orderNumber: order?.orderNumber,
        order: order ?? null,
      };
    });

    if (
      result.success &&
      !result.alreadyProcessed &&
      result.order
    ) {
      await sendOrderConfirmation(result.order, options.appUrl);
    }

    return result;
  } catch (error) {
    logError("payments/processSuccessfulPayment", error);
    return {
      success: false,
      error: "Payment processing failed",
    };
  }
}

/**
 * Sends the order-confirmation email.
 *
 * Runs after the order has been committed. A failure is logged and swallowed:
 * the payment and the order are already correct, and the customer can always
 * open the order from their account.
 */
async function sendOrderConfirmation(
  order: ConfirmedOrder,
  appUrl?: string
): Promise<void> {
  const baseUrl = appUrl ?? getConfiguredAppUrl();
  const orderLink = buildAppUrl(baseUrl, `/orders/${order.id}`);

  const delivery = await sendOrderConfirmationEmail({
    to: order.customerEmail,
    name: order.customerName,
    orderNumber: order.orderNumber,
    amount: formatNaira(order.total),
    orderLink,
  });

  if (!delivery.delivered) {
    logError(
      "payments/orderConfirmationEmail",
      `The order confirmation email for order ${order.orderNumber} could not be delivered.`
    );
  }
}
